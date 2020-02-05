import datetime
from cachetools import TTLCache, cached
from flask import current_app
from server.models.dtos.mapping_dto import TaskDTOs
from server.models.dtos.project_dto import (
    ProjectDTO,
    ProjectSummary,
    ProjectStatsDTO,
    ProjectUserStatsDTO,
    ProjectContribsDTO,
    ProjectContribDTO,
    ProjectSearchResultsDTO,
)

from server.models.postgis.organisation import Organisation
from server.models.postgis.project import Project, ProjectStatus, MappingLevel
from server.models.postgis.statuses import (
    MappingNotAllowed,
    ValidatingNotAllowed,
    MappingPermission,
    ValidationPermission,
    TeamRoles,
)
from server.models.postgis.task import Task, TaskHistory, TaskAction
from server.models.postgis.utils import NotFound
from server.services.users.user_service import UserService
from server.services.project_search_service import ProjectSearchService
from server.services.team_service import TeamService
from sqlalchemy import func, or_
from sqlalchemy.sql.expression import true

summary_cache = TTLCache(maxsize=1024, ttl=600)


class ProjectServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ProjectService:
    @staticmethod
    def get_project_by_id(project_id: int) -> Project:
        project = Project.get(project_id)
        if project is None:
            raise NotFound()

        return project

    @staticmethod
    def get_project_by_name(project_id: int) -> Project:
        project = Project.get(project_id)
        if project is None:
            raise NotFound()

        return project

    @staticmethod
    def auto_unlock_tasks(project_id: int):
        Task.auto_unlock_tasks(project_id)

    @staticmethod
    def get_contribs_by_day(project_id: int) -> ProjectContribsDTO:
        # Validate that project exists.
        project = ProjectService.get_project_by_id(project_id)

        stats = (
            TaskHistory.query.with_entities(
                TaskHistory.action.label("action"),
                func.DATE(TaskHistory.action_date).label("day"),
                func.count(TaskHistory.action_date).label("cnt"),
            )
            .filter(TaskHistory.project_id == project_id)
            .filter(
                or_(
                    TaskHistory.action == TaskAction.LOCKED_FOR_MAPPING.name,
                    TaskHistory.action == TaskAction.LOCKED_FOR_VALIDATION.name,
                )
            )
            .filter(
                func.DATE(TaskHistory.action_date)
                > datetime.date.today() - datetime.timedelta(days=365)
            )
            .group_by("action", "day")
            .order_by("day")
        )

        # Filter tasks by user_id only.

        contribs_dto = ProjectContribsDTO()
        dates = list(set(r[1] for r in stats))
        dates.sort(reverse=False)  # Why was this reversed?
        dates_list = []
        cumulative_mapped = 0
        cumulative_validated = 0
        for date in dates:
            dto = ProjectContribDTO(
                {
                    "date": str(date),
                    "mapped": 0,
                    "validated": 0,
                    "total_tasks": project.total_tasks,
                }
            )
            values = [(s[0], s[2]) for s in stats if date == s[1]]
            for val in values:
                if val[0] == TaskAction.LOCKED_FOR_MAPPING.name:
                    dto.mapped = val[1]
                    cumulative_mapped += val[1]
                elif val[0] == TaskAction.LOCKED_FOR_VALIDATION.name:
                    dto.validated = val[1]
                    cumulative_validated += int(val[1])

                dto.cumulative_mapped = cumulative_mapped
                dto.cumulative_validated = cumulative_validated
            dates_list.append(dto)

        contribs_dto.stats = dates_list

        return contribs_dto

    @staticmethod
    def get_project_dto_for_mapper(project_id, locale="en", abbrev=False) -> ProjectDTO:
        """
        Get the project DTO for mappers
        :param project_id: ID of the Project mapper has requested
        :param locale: Locale the mapper has requested
        :raises ProjectServiceError, NotFound
        """
        project = ProjectService.get_project_by_id(project_id)
        return project.as_dto_for_mapping(locale, abbrev)

    @staticmethod
    def get_project_tasks(
        project_id,
        task_ids_str: str,
        order_by: str = None,
        order_by_type: str = "ASC",
        status: int = None,
    ):
        project = ProjectService.get_project_by_id(project_id)
        return project.tasks_as_geojson(task_ids_str, order_by, order_by_type, status)

    @staticmethod
    def get_project_aoi(project_id):
        project = ProjectService.get_project_by_id(project_id)
        return project.get_aoi_geometry_as_geojson()

    @staticmethod
    def get_project_priority_areas(project_id):
        project = ProjectService.get_project_by_id(project_id)
        geojson_areas = []
        for priority_area in project.priority_areas:
            geojson_areas.append(priority_area.get_as_geojson())
        return geojson_areas

    @staticmethod
    def get_task_for_logged_in_user(user_id: int):
        """ if the user is working on a task in the project return it """
        tasks = Task.get_locked_tasks_for_user(user_id)

        tasks_dto = tasks
        return tasks_dto

    @staticmethod
    def get_task_details_for_logged_in_user(user_id: int, preferred_locale: str):
        """ if the user is working on a task in the project return it """
        tasks = Task.get_locked_tasks_details_for_user(user_id)

        if len(tasks) == 0:
            raise NotFound()

        # TODO put the task details in to a DTO
        dtos = []
        for task in tasks:
            dtos.append(task.as_dto_with_instructions(preferred_locale))

        task_dtos = TaskDTOs()
        task_dtos.tasks = dtos

        return task_dtos

    @staticmethod
    def evaluate_mapping_permission(
        project_id: int,
        user_id: int,
        mapping_permission: int,
        project_mapper_level: int,
    ):
        # mapping_permission = 1(level),2(teams),3(teamsAndLevel)
        if mapping_permission == MappingPermission.TEAMS.value:
            teams_dto = TeamService.get_project_teams_as_dto(project_id)

            if len(teams_dto.teams):
                for team_dto in teams_dto.teams:
                    team_id = team_dto.team_id
                    team_role = team_dto.role
                    if not (
                        team_role
                        in [
                            TeamRoles.MAPPER.value,
                            TeamRoles.VALIDATOR.value,
                            TeamRoles.PROJECT_MANAGER.value,
                        ]
                    ):
                        return False, MappingNotAllowed.NOT_A_MAPPING_TEAM
                    if not (TeamService.is_user_member_of_team(team_id, user_id)):
                        return False, MappingNotAllowed.USER_NOT_TEAM_MEMBER
            else:
                return False, MappingNotAllowed.PROJECT_HAS_NO_TEAM

        elif mapping_permission == MappingPermission.LEVEL.value:
            if not (
                ProjectService._is_user_mapping_level_at_or_above_level_requests(
                    MappingLevel(project_mapper_level), user_id
                )
            ):
                return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL

        elif mapping_permission == MappingPermission.TEAMS_LEVEL.value:
            teams_dto = TeamService.get_project_teams_as_dto(project_id)
            if len(teams_dto.teams):
                for team_dto in teams_dto.teams:
                    team_id = team_dto.team_id
                    team_role = team_dto.role
                    if team_role not in [
                        TeamRoles.MAPPER.value,
                        TeamRoles.VALIDATOR.value,
                        TeamRoles.PROJECT_MANAGER.value,
                    ]:
                        return False, MappingNotAllowed.NOT_A_MAPPING_TEAM

                    if not (TeamService.is_user_member_of_team(team_id, user_id)):
                        return False, MappingNotAllowed.USER_NOT_TEAM_MEMBER

                    if not (
                        ProjectService._is_user_mapping_level_at_or_above_level_requests(
                            MappingLevel(project_mapper_level), user_id
                        )
                    ):
                        return False, MappingNotAllowed.USER_NOT_CORRECT_MAPPING_LEVEL
            else:
                return False, MappingNotAllowed.PROJECT_HAS_NO_TEAM

    @staticmethod
    def is_user_permitted_to_map(project_id: int, user_id: int):
        """ Check if the user is allowed to map the on the project in scope """
        if UserService.is_user_blocked(user_id):
            return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = ProjectService.get_project_by_id(project_id)
        mapping_permission = project.mapping_permission
        project_mapper_level = project.mapper_level

        if ProjectStatus(
            project.status
        ) != ProjectStatus.PUBLISHED and not UserService.is_user_a_project_manager(
            user_id
        ):
            return False, MappingNotAllowed.PROJECT_NOT_PUBLISHED
        tasks = Task.get_locked_tasks_for_user(user_id)
        if len(tasks.locked_tasks) > 0:
            return False, MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED
        if project.private:
            # Check user is in allowed users
            try:
                next(user for user in project.allowed_users if user.id == user_id)
            except StopIteration:
                return False, MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST
            is_restriction = ProjectService.evaluate_mapping_permission(
                project_id, user_id, mapping_permission, project_mapper_level
            )
            if is_restriction:
                return is_restriction

        if project.mapping_permission:
            is_restriction = ProjectService.evaluate_mapping_permission(
                project_id, user_id, mapping_permission, project_mapper_level
            )
            if is_restriction:
                return is_restriction

        if project.license_id:
            if not UserService.has_user_accepted_license(user_id, project.license_id):
                return False, MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        return True, "User allowed to map"

    @staticmethod
    def _is_user_mapping_level_at_or_above_level_requests(requested_level, user_id):
        """ Helper method to determine if user level at or above requested level """
        user_mapping_level = UserService.get_mapping_level(user_id)
        if requested_level == MappingLevel.INTERMEDIATE:
            if user_mapping_level not in [
                MappingLevel.INTERMEDIATE,
                MappingLevel.ADVANCED,
            ]:
                return False
        elif requested_level == MappingLevel.ADVANCED:
            if user_mapping_level != MappingLevel.ADVANCED:
                return False

        return True

    @staticmethod
    def evaluate_validation_permission(
        project_id: int,
        user_id: int,
        validation_permission: int,
        user_mapper_level: int,
    ):
        # validation_permission = 1(level),2(teams),3(teamsAndLevel)
        if validation_permission == ValidationPermission.TEAMS.value:
            teams_dto = TeamService.get_project_teams_as_dto(project_id)

            if len(teams_dto.teams):
                for team_dto in teams_dto.teams:
                    team_id = team_dto.team_id
                    team_role = team_dto.role
                    if team_role not in [
                        TeamRoles.VALIDATOR.value,
                        TeamRoles.PROJECT_MANAGER.value,
                    ]:
                        return False, ValidatingNotAllowed.NOT_A_VALIDATION_TEAM
                    if not (TeamService.is_user_member_of_team(team_id, user_id)):
                        return False, ValidatingNotAllowed.USER_NOT_TEAM_MEMBER
            else:
                # Fallback to handle initial rollout
                if not UserService.is_user_validator(user_id):
                    return False, ValidatingNotAllowed.USER_NOT_VALIDATOR

        elif validation_permission == ValidationPermission.LEVEL.value:
            if user_mapper_level not in (
                MappingLevel.INTERMEDIATE.value,
                MappingLevel.ADVANCED.value,
            ):
                return False, ValidatingNotAllowed.USER_IS_BEGINNER

        elif validation_permission == ValidationPermission.TEAMS_LEVEL.value:
            teams_dto = TeamService.get_project_teams_as_dto(project_id)

            if len(teams_dto.teams):
                for team_dto in teams_dto.teams:
                    team_id = team_dto.team_id
                    team_role = team_dto.role
                    if team_role not in [
                        TeamRoles.VALIDATOR.value,
                        TeamRoles.PROJECT_MANAGER.value,
                    ]:
                        return False, ValidatingNotAllowed.NOT_A_VALIDATION_TEAM
                    if not (TeamService.is_user_member_of_team(team_id, user_id)):
                        return False, ValidatingNotAllowed.USER_NOT_TEAM_MEMBER
            else:
                # Fallback
                if not UserService.is_user_validator(user_id):
                    return False, ValidatingNotAllowed.USER_NOT_VALIDATOR
            if user_mapper_level not in (
                MappingLevel.INTERMEDIATE.value,
                MappingLevel.ADVANCED.value,
            ):
                return False, ValidatingNotAllowed.USER_IS_BEGINNER

    @staticmethod
    def is_user_permitted_to_validate(project_id, user_id):
        """ Check if the user is allowed to validate on the project in scope """
        if UserService.is_user_blocked(user_id):
            return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

        project = ProjectService.get_project_by_id(project_id)
        validation_permission = project.validation_permission
        user = UserService.get_user_by_id(user_id)
        user_mapper_level = user.mapper_level

        if ProjectStatus(
            project.status
        ) != ProjectStatus.PUBLISHED and not UserService.is_user_a_project_manager(
            user_id
        ):
            return False, ValidatingNotAllowed.PROJECT_NOT_PUBLISHED

        tasks = Task.get_locked_tasks_for_user(user_id)

        if len(tasks.locked_tasks) > 0:
            return False, ValidatingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED

        if project.private:
            # Check user is in allowed users
            try:
                next(user for user in project.allowed_users if user.id == user_id)
            except StopIteration:
                return False, ValidatingNotAllowed.USER_NOT_ON_ALLOWED_LIST

            is_restriction = ProjectService.evaluate_validation_permission(
                project_id, user_id, validation_permission, user_mapper_level
            )
            if is_restriction:
                return is_restriction

        if project.validation_permission:
            is_restriction = ProjectService.evaluate_validation_permission(
                project_id, user_id, validation_permission, user_mapper_level
            )
            if is_restriction:
                return is_restriction

        if project.license_id:
            if not UserService.has_user_accepted_license(user_id, project.license_id):
                return False, ValidatingNotAllowed.USER_NOT_ACCEPTED_LICENSE

        return True, "User allowed to validate"

    @staticmethod
    @cached(summary_cache)
    def get_project_summary(
        project_id: int, preferred_locale: str = "en"
    ) -> ProjectSummary:
        """ Gets the project summary DTO """
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_summary(preferred_locale)

    @staticmethod
    def set_project_as_featured(project_id: int):
        """ Sets project as featured """
        project = ProjectService.get_project_by_id(project_id)
        project.set_as_featured()

    @staticmethod
    def unset_project_as_featured(project_id: int):
        """ Sets project as featured """
        project = ProjectService.get_project_by_id(project_id)
        project.unset_as_featured()

    @staticmethod
    def get_featured_projects(preferred_locale):
        """ Sets project as featured """
        query = ProjectSearchService.create_search_query()
        projects = query.filter(Project.featured == true()).group_by(Project.id).all()

        # Get total contributors.
        contrib_counts = ProjectSearchService.get_total_contributions(projects)
        zip_items = zip(projects, contrib_counts)

        dto = ProjectSearchResultsDTO()
        dto.results = [
            ProjectSearchService.create_result_dto(p, preferred_locale, t)
            for p, t in zip_items
        ]

        return dto

    @staticmethod
    def is_favorited(project_id: int, user_id: int) -> bool:
        project = ProjectService.get_project_by_id(project_id)

        return project.is_favorited(user_id)

    @staticmethod
    def favorite(project_id: int, user_id: int):
        project = ProjectService.get_project_by_id(project_id)
        project.favorite(user_id)

    @staticmethod
    def unfavorite(project_id: int, user_id: int):
        project = ProjectService.get_project_by_id(project_id)
        project.unfavorite(user_id)

    @staticmethod
    def get_project_title(project_id: int, preferred_locale: str = "en") -> str:
        """ Gets the project title DTO """
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_title(preferred_locale)

    @staticmethod
    def get_project_stats(project_id: int) -> ProjectStatsDTO:
        """ Gets the project stats DTO """
        project = ProjectService.get_project_by_id(project_id)
        return project.get_project_stats()

    @staticmethod
    def get_project_user_stats(project_id: int, username: str) -> ProjectUserStatsDTO:
        """ Gets the user stats for a specific project """
        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_username(username)
        return project.get_project_user_stats(user.id)

    def get_project_teams(project_id: int):
        project = ProjectService.get_project_by_id(project_id)

        if project is None:
            raise NotFound()

        return project.teams

    @staticmethod
    def get_project_organisation(project_id: int) -> Organisation:
        project = ProjectService.get_project_by_id(project_id)

        if project is None:
            raise NotFound()

        return project.organisation
