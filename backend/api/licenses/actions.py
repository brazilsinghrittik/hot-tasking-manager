from flask_restful import Resource, current_app

from backend.services.users.authentication_service import token_auth
from backend.services.users.user_service import UserService, NotFound


class LicensesActionsAcceptAPI(Resource):
    @token_auth.login_required
    def post(self, license_id):
        """
        Capture user acceptance of license terms
        ---
        tags:
          - licenses
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: license_id
              in: path
              description: License ID terms have been accepted for
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Terms accepted
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User or license not found
            500:
                description: Internal Server Error
        """
        try:
            UserService.accept_license_terms(token_auth.current_user(), license_id)
            return {"Success": "Terms Accepted"}, 200
        except NotFound:
            return {"Error": "User or mapping not found"}, 404
        except Exception as e:
            error_msg = f"User GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to update license terms"}, 500
