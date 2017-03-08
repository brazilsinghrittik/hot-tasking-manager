import json
from flask_restful import Resource, request, current_app
from server.services.project_service import ProjectService, InvalidGeoJson, InvalidData


class ProjectsAPI(Resource):
    """
    /api/projects
    """

    def put(self):
        """
        Inserts a project into database
        ---
        tags:
            - projects
        produces:
            - application/json
        parameters:
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
            500:
                description: Internal Server Error
        """
        try:
            # TODO this a little clunky but avoids DTO object, however DTOs may be cleaner - will decide later
            data = request.get_json()
            project_name = data['projectName']
            aoi_geometry_geojson = json.dumps(data['areaOfInterest'])
            tasks_geojson = json.dumps(data['tasks'])
        except KeyError as e:
            error_msg = f'Key {str(e)} not found in JSON, note parser is case sensitive'
            current_app.logger.error(error_msg)
            return {"error": error_msg}, 400

        # Check that none of the required fields are empty
        if '' in [project_name, aoi_geometry_geojson, tasks_geojson]:
            error_msg = 'Empty required field detected'
            current_app.logger.error(error_msg)
            return {"error": error_msg}, 400

        try:
            project_service = ProjectService()
            draft_project_id = project_service.create_draft_project(project_name, aoi_geometry_geojson, tasks_geojson)
            return {"projectId": draft_project_id}, 201
        except (InvalidGeoJson, InvalidData) as e:
            return {"error": f'{str(e)}'}, 400
        except Exception as e:
            error_msg = f'Project PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500

    def get(self, project_id):
        """
        Retrieves the specified Tasking-Manager project
        ---
        tags:
            - projects
        produces:
            - application/json
        parameters:
            - name: project_id
              in: path
              description: The unique project ID
              required: true
              type: integer
              default: 1
        responses:
            200:
                description: Project found
            404:
                description: Project not found
            500:
                description: Internal Server Error
        """
        try:
            project_service = ProjectService()
            project = project_service.get_project_by_id(project_id)

            if project is None:
                return {"Error": "Project Not Found"}, 404

            return project, 200
        except Exception as e:
            error_msg = f'Project GET - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
