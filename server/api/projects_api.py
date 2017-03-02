import json
from flask_restful import Resource, request
from server.services.project_service import ProjectService, InvalidGeoJson


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
                      name:
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
                                              $ref: "#/definitions/GeoJsonMultiPolygonWithProperties"
        responses:
            201:
                description: Draft project created
            400:
                description: Client Error - Invalid Request
        """
        try:
            # TODO this a little clunky but avoids DTO object, however DTOs may be cleaner - will decide later
            data = request.get_json()
            aoi_geometry_geojson = json.dumps(data['areaOfInterest'])
            tasks_geojson = json.dumps(data['tasks'])
        except KeyError as e:
            return {"error": f'Key {str(e)} not found in JSON, note parser is case sensitive'}, 400

        try:
            project_service = ProjectService()
            project_service.create_draft_project(data, aoi_geometry_geojson, tasks_geojson)
            return {"status": "success"}, 201
        except InvalidGeoJson as e:
            return {"error": f'{str(e)}'}, 400
