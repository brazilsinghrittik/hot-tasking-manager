import json
import geojson
from flask import current_app
from server.models.dtos.project_dto import DraftProjectDTO, ProjectDTO
from server.models.postgis.project import AreaOfInterest, Project, InvalidGeoJson, Task, InvalidData, ProjectStatus


class ProjectAdminServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when validating a Project """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectStoreError(Exception):
    """ Custom Exception to notify callers an error occurred with database CRUD operations """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectAdminService:

    def create_draft_project(self, draft_project_dto: DraftProjectDTO) -> int:
        """
        Validates and then persists draft projects in the DB
        :param draft_project_dto: Draft Project DTO with data from API
        :raises InvalidGeoJson
        :returns ID of new draft project
        """
        try:
            area_of_interest = AreaOfInterest(draft_project_dto.area_of_interest)
        except InvalidGeoJson as e:
            raise e

        try:
            draft_project = Project()
            draft_project.create_draft_project(draft_project_dto, area_of_interest)
        except InvalidData as e:
            raise e

        self._attach_tasks_to_project(draft_project, draft_project_dto.tasks)

        draft_project.create()
        return draft_project.id

    def get_project_dto_for_admin(self, project_id: int) -> ProjectDTO:
        """ Get the project as DTO for project managers """
        project = Project()
        return project.as_dto_for_admin(project_id)

    def update_project(self, project_dto: ProjectDTO):
        project = Project.get(project_dto.project_id)

        if project is None:
            return None

        if project_dto.project_status == ProjectStatus.PUBLISHED.name:
            self._validate_default_locale(project_dto.default_locale, project_dto.project_info_locales)

        project.update(project_dto)
        return project

    def _attach_tasks_to_project(self, draft_project, tasks_geojson):
        """
        Validates then iterates over the array of tasks and attach them to the draft project
        :param draft_project: Draft project in scope
        :param tasks_geojson: GeoJSON feature collection of mapping tasks
        :raises InvalidGeoJson, InvalidData
        """
        tasks = geojson.loads(json.dumps(tasks_geojson))

        if type(tasks) is not geojson.FeatureCollection:
            raise InvalidGeoJson('Tasks: Invalid GeoJson must be FeatureCollection')

        is_valid_geojson = geojson.is_valid(tasks)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Tasks: Invalid FeatureCollection - {is_valid_geojson['message']}")

        task_id = 1
        for feature in tasks['features']:
            try:
                task = Task.from_geojson_feature(task_id, feature)
            except (InvalidData, InvalidGeoJson) as e:
                raise e

            draft_project.tasks.append(task)
            task_id += 1

    def _validate_default_locale(self, default_locale, project_info_locales):
        """
        Validates that all fields for the default project info locale have been completed
        :param default_locale: Admin supplied default locale
        :param project_info_locales: All locales supplied by admin
        :raises ProjectAdminServiceError
        :return: True if valid
        """
        default_info = None
        for info in project_info_locales:
            if info.locale.lower() == default_locale.lower():
                default_info = info
                break

        if default_info is None:
            raise ProjectAdminServiceError('Project Info for Default Locale not provided')

        for attr, value in default_info.items():
            if not value:
                raise(ProjectAdminServiceError(f'{attr} not provided for Default Locale'))

        return True  # Indicates valid default locale for unit testing
