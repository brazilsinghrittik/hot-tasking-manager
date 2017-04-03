from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError
from server.models.dtos.project_dto import DraftProjectDTO, ProjectDTO
from server.services.authentication_service import token_auth, tm
from server.services.project_admin_service import ProjectAdminService, InvalidGeoJson, InvalidData, ProjectAdminServiceError


class ProjectAdminAPI(Resource):

    @tm.pm_only()
    @token_auth.login_required
    def put(self):
        """
        Creates a tasking-manager project
        ---
        tags:
            - project-admin
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
              description: JSON object for creating draft project
              schema:
                  properties:
                      projectName:
                          type: string
                          default: HOT Project
                      areaOfInterest:
                          schema:
                              $ref: "#/definitions/GeoJsonMultiPolygon"
                      tasks:
                          schema:
                              properties:
                                  type:
                                      type: string
                                      default: FeatureCollection
                                  features:
                                      type: array
                                      items:
                                          schema:
                                              $ref: "#/definitions/GeoJsonFeature"
        responses:
            201:
                description: Draft project created successfully
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            500:
                description: Internal Server Error
        """
        try:
            draft_project_dto = DraftProjectDTO(request.get_json())
            draft_project_dto.user_id = tm.authenticated_user_id
            draft_project_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            project_service = ProjectAdminService()
            draft_project_id = project_service.create_draft_project(draft_project_dto)
            return {"projectId": draft_project_id}, 201
        except (InvalidGeoJson, InvalidData) as e:
            return {"error": f'{str(e)}'}, 400
        except Exception as e:
            error_msg = f'Project PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def get(self, project_id):
        """
        Retrieves a Tasking-Manager project
        ---
        tags:
            - project-admin
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project found
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_service = ProjectAdminService()
            project_dto = project_service.get_project_dto_for_admin(project_id)

            if project_dto is None:
                return {"Error": "Project Not Found"}, 404

            return project_dto.to_primitive(), 200
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    @tm.pm_only()
    @token_auth.login_required
    def post(self, project_id):
        """
        Updates a Tasking-Manager project
        ---
        tags:
            - project-admin
        produces:
            - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating draft project
              schema:
                  properties:
                      projectStatus:
                          type: string
                          default: DRAFT
                      projectPriority:
                          type: string
                          default: MEDIUM
                      defaultLocale:
                          type: string
                          default: en
                      mapperLevel:
                          type: string
                          default: BEGINNER
                      enforceMapperLevel:
                          type: boolean
                          default: false
                      enforceValidatorRole:
                          type: boolean
                          default: false
                      private:
                          type: boolean
                          default: false
                      projectInfoLocales:
                          type: array
                          items:
                              schema:
                                  $ref: "#/definitions/ProjectInfo"
        responses:
            200:
                description: Project updated
            400:
                description: Client Error - Invalid Request
            401:
                description: Unauthorized - Invalid credentials
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_dto = ProjectDTO(request.get_json())
            project_dto.project_id = project_id
            project_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            project_service = ProjectAdminService()
            project = project_service.update_project(project_dto)

            if project is None:
                return {"Error": "Project Not Found"}, 404

            return {"Status": "Updated"}, 200
        except ProjectAdminServiceError as e:
            return {"error": str(e)}, 400
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
