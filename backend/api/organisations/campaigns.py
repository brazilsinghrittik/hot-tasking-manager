from flask_restful import Resource, current_app

from backend.services.campaign_service import CampaignService
from backend.services.organisation_service import OrganisationService
from backend.models.postgis.utils import NotFound
from backend.services.users.authentication_service import token_auth


class OrganisationsCampaignsAPI(Resource):
    @token_auth.login_required
    def post(self, organisation_id, campaign_id):
        """
        Assigns a campaign to an organisation
        ---
        tags:
            - campaigns
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: organisation_id
              in: path
              description: Unique organisation ID
              required: true
              type: integer
              default: 1
            - name: campaign_id
              in: path
              description: Unique campaign ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Organisation and campaign assigned successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden - users have submitted mapping
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            if OrganisationService.can_user_manage_organisation(
                organisation_id, token_auth.current_user()
            ):
                if CampaignService.campaign_organisation_exists(
                    campaign_id, organisation_id
                ):
                    message = (
                        "Campaign {} is already assigned to organisation {}.".format(
                            campaign_id, organisation_id
                        )
                    )
                    return {"Error": message}, 400

                CampaignService.create_campaign_organisation(
                    organisation_id, campaign_id
                )
                message = (
                    "campaign with id {} assigned for organisation with id {}".format(
                        campaign_id, organisation_id
                    )
                )
                return {"Success": message}, 200
            else:
                return {"Error": "User is not a manager of the organisation"}, 403
        except Exception as e:
            error_msg = f"Campaign Organisation POST - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    def get(self, organisation_id):
        """
        Returns all campaigns related to an organisation
        ---
        tags:
            - campaigns
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: false
              type: string
              default: Token sessionTokenHere==
            - name: organisation_id
              in: path
              description: Unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Success
            404:
                description: Organisation not found
            500:
                description: Internal Server Error
        """
        try:
            campaigns = CampaignService.get_organisation_campaigns_as_dto(
                organisation_id
            )
            return campaigns.to_primitive(), 200
        except NotFound:
            return {"Error": "No campaign found"}, 404
        except Exception as e:
            error_msg = f"Organisation Campaigns GET - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500

    @token_auth.login_required
    def delete(self, organisation_id, campaign_id):
        """
        Unassigns an organization from an campaign
        ---
        tags:
            - campaigns
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: organisation_id
              in: path
              description: Unique organisation ID
              required: true
              type: integer
              default: 1
            - name: campaign_id
              in: path
              description: Unique campaign ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Organisation and campaign unassociated successfully
            401:
                description: Unauthorized - Invalid credentials
            403:
                description: Forbidden - users have submitted mapping
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            if OrganisationService.can_user_manage_organisation(
                organisation_id, token_auth.current_user()
            ):
                CampaignService.delete_organisation_campaign(
                    organisation_id, campaign_id
                )
                return (
                    {"Success": "Organisation and campaign unassociated successfully"},
                    200,
                )
            else:
                return {"Error": "User is not a manager of the organisation"}, 403
        except NotFound:
            return {"Error": "Organisation Campaign Not Found"}, 404
        except Exception as e:
            error_msg = f"Organisation Campaigns DELETE - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": error_msg}, 500
