from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError

from server.models.dtos.interests_dto import InterestDTO
from server.models.postgis.utils import NotFound
from server.services.interests_service import InterestService
from server.services.organisation_service import OrganisationService
from server.services.users.authentication_service import token_auth, tm

from sqlalchemy.exc import IntegrityError


class InterestsAllAPI(Resource):
    @token_auth.login_required
    def post(self):
        """
        Creates a new interest
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
            - in: body
              name: body
              required: true
              description: JSON object for creating a new interest
              schema:
                  properties:
                      name:
                          type: string
                          default: Public Domain
        responses:
            200:
                description: New interest created
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
                tm.authenticated_user_id
            )
            if len(orgs_dto.organisation) < 0:
                raise ValueError("User not a Org Manager")
        except ValueError as e:
            error_msg = f"InterestsAllAPI POST: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            interest_dto = InterestDTO(request.get_json())
            interest_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return str(e), 400

        try:
            new_interest = InterestService.create(interest_dto.name)
            return new_interest.to_primitive(), 200
        except IntegrityError:
            return (
                {"error": "Value '{0}' already exists".format(interest_dto.name)},
                400,
            )
        except Exception as e:
            error_msg = f"Interest POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    def get(self):
        """
        Get all interests
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
        responses:
            200:
                description: List of interests
            500:
                description: Internal Server Error
        """
        try:
            interests = InterestService.get_all_interests()
            return interests.to_primitive(), 200
        except Exception as e:
            error_msg = f"Interest GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500


class InterestsRestAPI(Resource):
    @token_auth.login_required
    def get(self, interest_id):
        """
        Get an existing interest
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
            - name: interest_id
              in: path
              description: Interest ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Interest
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
                tm.authenticated_user_id
            )
            if len(orgs_dto.organisation) < 0:
                raise ValueError("User not a Org Manager")
        except ValueError as e:
            error_msg = f"InterestsRestAPI GET: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            interest = InterestService.get(interest_id)
            return interest.to_primitive(), 200
        except Exception as e:
            error_msg = f"Interest GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def patch(self, interest_id):
        """
        Update an existing interest
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
            - name: interest_id
              in: path
              description: Interest ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating a new interest
              schema:
                  properties:
                      name:
                          type: string
                          default: Public Domain
        responses:
            200:
                description: Interest updated
            400:
                description: Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            500:
                description: Internal Server Error
        """
        try:
            orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
                tm.authenticated_user_id
            )
            if len(orgs_dto.organisation) < 0:
                raise ValueError("User not a Org Manager")
        except ValueError as e:
            error_msg = f"InterestsAllAPI PATCH: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            interest_dto = InterestDTO(request.get_json())
            interest_dto.validate()
        except DataError as e:
            current_app.logger.error(f"Error validating request: {str(e)}")
            return str(e), 400

        try:
            update_interest = InterestService.update(interest_id, interest_dto)
            return update_interest.to_primitive(), 200
        except Exception as e:
            error_msg = f"Interest PUT - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def delete(self, interest_id):
        """
        Delete a specified interest
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
            - name: interest_id
              in: path
              description: Unique interest ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Interest deleted
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden
            404:
                description: Interest not found
            500:
                description: Internal Server Error
        """
        try:
            orgs_dto = OrganisationService.get_organisations_managed_by_user_as_dto(
                tm.authenticated_user_id
            )
            if len(orgs_dto.organisation) < 0:
                raise ValueError("User not a Org Manager")
        except ValueError as e:
            error_msg = f"InterestsAllAPI DELETE: {str(e)}"
            return {"Error": error_msg}, 403

        try:
            InterestService.delete(interest_id)
            return {"Success": "Interest deleted"}, 200
        except NotFound:
            return {"Error": "Interest Not Found"}, 404
        except Exception as e:
            error_msg = f"License DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
