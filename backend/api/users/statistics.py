from json import JSONEncoder
from datetime import date, timedelta
from flask_restful import Resource, request

from backend.services.users.user_service import UserService, NotFound
from backend.services.stats_service import StatsService
from backend.services.interests_service import InterestService
from backend.services.users.authentication_service import token_auth
from backend.api.utils import validate_date_input


class UsersStatisticsAPI(Resource, JSONEncoder):
    @token_auth.login_required
    def get(self, username):
        """
        Get detailed stats about a user by OpenStreetMap username
        ---
        tags:
          - users
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: username
              in: path
              description: Mapper's OpenStreetMap username
              required: true
              type: string
              default: Thinkwhere
        responses:
            200:
                description: User found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: User not found
            500:
                description: Internal Server Error
        """
        try:
            stats_dto = UserService.get_detailed_stats(username)
            return stats_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "User not found", "SubCode": "NotFound"}, 404


class UsersStatisticsInterestsAPI(Resource):
    @token_auth.login_required
    def get(self, user_id):
        """
        Get rate of contributions from a user given their interests
        ---
        tags:
            - interests
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: user_id
              in: path
              description: User ID
              required: true
              type: integer
        responses:
            200:
                description: Interest found
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            rate = InterestService.compute_contributions_rate(user_id)
            return rate.to_primitive(), 200
        except NotFound:
            return {"Error": "User not Found", "SubCode": "NotFound"}, 404


class UsersStatisticsAllAPI(Resource):
    @token_auth.login_required
    def get(self):
        """
        Get stats about users registered within a period of time
        ---
        tags:
            - users
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              type: string
              required: true
              default: Token sessionTokenHere==
            - in: query
              name: startDate
              description: Initial date
              required: true
              type: string
            - in: query
              name: endDate
              description: Final date.
              type: string
        responses:
            200:
                description: User statistics
            400:
                description: Bad Request
            401:
                description: Request is not authenticated
            500:
                description: Internal Server Error
        """
        try:
            if request.args.get("startDate"):
                start_date = validate_date_input(request.args.get("startDate"))
            else:
                return {
                    "Error": "Start date is required",
                    "SubCode": "MissingDate",
                }, 400
            end_date = validate_date_input(request.args.get("endDate", date.today()))
            if end_date < start_date:
                raise ValueError(
                    "InvalidDateRange- Start date must be earlier than end date"
                )
            if (end_date - start_date) > timedelta(days=366 * 3):
                raise ValueError(
                    "InvalidDateRange- Date range can not be bigger than 1 year"
                )

            stats = StatsService.get_all_users_statistics(start_date, end_date)
            return stats.to_primitive(), 200
        except (KeyError, ValueError) as e:
            return {"Error": str(e).split("-")[1], "SubCode": str(e).split("-")[0]}, 400
