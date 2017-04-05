from flask_restful import Resource, current_app, request
from schematics.exceptions import DataError
from server.models.dtos.project_dto import ProjectSearchDTO
from server.services.project_service import ProjectService, ProjectServiceError, NotFound


class ProjectAPI(Resource):

    def get(self, project_id):
        """
        Get HOT Project for mapping
        ---
        tags:
            - mapping
        produces:
            - application/json
        parameters:
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project found
            403:
                description: Forbidden
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_dto = ProjectService.get_project_dto_for_mapper(project_id,
                                                                    request.environ.get('HTTP_ACCEPT_LANGUAGE'))
            return project_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "Project Not Found"}, 404
        except ProjectServiceError as e:
            return {"error": str(e)}, 403
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500


class ProjectSearchAPI(Resource):

    def get(self):
        """
        Search active projects
        ---
        tags:
            - search
        produces:
            - application/json
        parameters:
            - in: header
              name: Accept-Language
              description: Language user is requesting
              type: string
              required: true
              default: en
            - in: query
              name: mapper_level
              type: string
              default: BEGINNER
        responses:
            200:
                description: Projects found
            404:
                description: No projects found
            500:
                description: Internal Server Error
        """
        try:
            search_dto = ProjectSearchDTO()
            search_dto.preferred_locale = request.environ.get('HTTP_ACCEPT_LANGUAGE')
            search_dto.mapper_level = request.args.get('mapper_level')
            search_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            results_dto = ProjectService.get_projects_by_search_criteria(search_dto)
            return results_dto.to_primitive(), 200
        except NotFound:
            return {"Error": "No projects found"}, 404
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
