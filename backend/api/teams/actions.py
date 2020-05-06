from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from backend.services.team_service import TeamService, NotFound, TeamJoinNotAllowed
from backend.services.users.authentication_service import token_auth, tm
from backend.models.postgis.user import User


class TeamsActionsJoinAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, team_id):
        """
        Request to join a team
        ---
        tags:
          - teams
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: team_id
              in: path
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object to join team
              schema:
                properties:
                    username:
                        type: string
                        required: true
                    role:
                        type: string
                        required: false
        responses:
            200:
                description: Member added
            403:
                description: Forbidden
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            post_data = request.get_json(force=True)
            username = post_data["username"]
            role = post_data.get("role", None)
        except (DataError, KeyError) as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            TeamService.join_team(team_id, tm.authenticated_user_id, username, role)
            if TeamService.user_is_manager(team_id, tm.authenticated_user_id):
                return {"Success": "User added to the team"}, 200
            else:
                return {"Success": "Request to join the team sent successfully."}, 200
        except TeamJoinNotAllowed as e:
            return {"Error": str(e)}, 403
        except Exception as e:
            error_msg = f"User POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @tm.pm_only(False)
    @token_auth.login_required
    def patch(self, team_id):
        """
        Take action on a team invite
        ---
        tags:
          - teams
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: team_id
              in: path
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object to accept or reject a request to join team
              schema:
                properties:
                    username:
                        type: string
                        required: true
                    type:
                        type: string
                        default: join-response
                        required: true
                    role:
                        type: string
                        default: member
                        required: false
                    action:
                        type: string
                        default: accept
                        required: true
        responses:
            200:
                description: Member added
            403:
                description: Forbidden
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            json_data = request.get_json(force=True)
            username = json_data["username"]
            request_type = json_data.get("type", "join-response")
            action = json_data["action"]
            role = json_data.get("role", "member")
        except DataError as e:
            current_app.logger.error(f"error validating request: {str(e)}")
            return str(e), 400

        try:
            if request_type == "join-response":
                if TeamService.user_is_manager(team_id, tm.authenticated_user_id):
                    TeamService.accept_reject_join_request(
                        team_id, tm.authenticated_user_id, username, role, action
                    )
                    return {"Success": "True"}, 200
                else:
                    return (
                        {
                            "Error": "You don't have permissions to approve this join team request"
                        },
                        403,
                    )
            elif request_type == "invite-response":
                TeamService.accept_reject_invitation_request(
                    team_id, tm.authenticated_user_id, username, role, action
                )
                return {"Success": "True"}, 200
        except Exception as e:
            raise
            error_msg = f"Team Join PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class TeamsActionsLeaveAPI(Resource):
    @tm.pm_only(False)
    @token_auth.login_required
    def post(self, team_id):
        """
        Removes a user from a team
        ---
        tags:
          - teams
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: team_id
              in: path
              description: Unique team ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object to remove user from team
              schema:
                properties:
                    username:
                        type: string
                        default: 1
                        required: true
        responses:
            200:
                description: Member deleted
            403:
                description: Forbidden, if user attempting to ready other messages
            404:
                description: Not found
            500:
                description: Internal Server Error
        """
        try:
            username = request.get_json(force=True)["username"]
            request_user = User.get_by_id(tm.authenticated_user_id)
            if (
                TeamService.user_is_manager(team_id, tm.authenticated_user_id)
                or request_user.username == username
            ):
                TeamService.leave_team(team_id, username)
                return {"Success": "User removed from the team"}, 200
            else:
                return (
                    {
                        "Error": "You don't have permissions to remove {} from this team.".format(
                            username
                        )
                    },
                    403,
                )
        except NotFound:
            return {"Error": "No team member found"}, 404
        except Exception as e:
            error_msg = f"TeamMembers DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
