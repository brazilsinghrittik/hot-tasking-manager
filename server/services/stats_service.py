from cachetools import TTLCache, cached
from sqlalchemy import func
from geoalchemy2.shape import to_shape
from shapely.geometry import Polygon
from shapely.ops import transform
from functools import partial
import pyproj
import dateutil.parser
import datetime
import math
from flask import current_app

from server import db
from server.models.dtos.stats_dto import (
    ProjectContributionsDTO, UserContribution, Pagination, TaskHistoryDTO,
    ProjectActivityDTO, HomePageStatsDTO, OrganizationStatsDTO,
    CampaignStatsDTO
    )

from server.models.postgis.project import Project
from server.models.postgis.statuses import TaskStatus
from server.models.postgis.task import TaskHistory, User, Task
from server.models.postgis.utils import timestamp, NotFound
from server.services.project_service import ProjectService
from server.services.users.user_service import UserService


homepage_stats_cache = TTLCache(maxsize=4, ttl=30)


class StatsService:
    @staticmethod
    def update_stats_after_task_state_change(project_id: int, user_id: int, new_state: TaskStatus, task_id: int):
        """ Update stats when a task has had a state change """
        if new_state in [TaskStatus.READY, TaskStatus.LOCKED_FOR_VALIDATION, TaskStatus.LOCKED_FOR_MAPPING]:
            return  # No stats to record for these states

        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        if new_state == TaskStatus.MAPPED:
            StatsService._set_counters_after_mapping(project, user)
        elif new_state == TaskStatus.INVALIDATED:
            StatsService._set_counters_after_invalidated(task_id, project, user)
        elif new_state == TaskStatus.VALIDATED:
            StatsService._set_counters_after_validated(project, user)
        elif new_state == TaskStatus.BADIMAGERY:
            StatsService._set_counters_after_bad_imagery(project)

        UserService.upsert_mapped_projects(user_id, project_id)
        project.last_updated = timestamp()

        # Transaction will be saved when task is saved
        return project, user

    @staticmethod
    def _set_counters_after_mapping(project: Project, user: User):
        """ Set counters after user has mapped a task """
        project.tasks_mapped += 1
        user.tasks_mapped += 1

    @staticmethod
    def _set_counters_after_validated(project: Project, user: User):
        """ Set counters after user has validated a task """
        # TODO - There is a potential problem with the counters if people mark bad imagery tasks validated
        project.tasks_validated += 1
        user.tasks_validated += 1

    @staticmethod
    def _set_counters_after_bad_imagery(project: Project):
        """ Set counters after user has marked a task as Bad Imagery """
        project.tasks_bad_imagery += 1

    @staticmethod
    def set_counters_after_undo(project_id: int, user_id: int, current_state: TaskStatus, undo_state: TaskStatus):
        """ Resets counters after a user undoes their task"""
        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        # This is best endeavours to reset the stats and may have missed some edge cases, hopefully majority of
        # cases will be Mapped to Ready
        if current_state == TaskStatus.MAPPED and undo_state == TaskStatus.READY:
            project.tasks_mapped -= 1
            user.tasks_mapped -= 1
        if current_state == TaskStatus.MAPPED and undo_state == TaskStatus.INVALIDATED:
            user.tasks_mapped -= 1
            project.tasks_mapped -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.READY:
            project.tasks_bad_imagery -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.MAPPED:
            project.tasks_mapped += 1
            project.tasks_bad_imagery -= 1
        elif current_state == TaskStatus.BADIMAGERY and undo_state == TaskStatus.INVALIDATED:
            project.tasks_bad_imagery -= 1
        elif current_state == TaskStatus.INVALIDATED and undo_state == TaskStatus.MAPPED:
            user.tasks_invalidated -= 1
            project.tasks_mapped += 1
        elif current_state == TaskStatus.INVALIDATED and undo_state == TaskStatus.VALIDATED:
            user.tasks_invalidated -= 1
            project.tasks_validated += 1
        elif current_state == TaskStatus.VALIDATED and undo_state == TaskStatus.MAPPED:
            user.tasks_validated -= 1
            project.tasks_validated -= 1
        elif current_state == TaskStatus.VALIDATED and undo_state == TaskStatus.BADIMAGERY:
            user.tasks_validated -= 1
            project.tasks_validated -= 1

    @staticmethod
    def _set_counters_after_invalidated(task_id: int, project: Project, user: User):
        """ Set counters after user has validated a task """

        last_state = TaskHistory.get_last_status(project.id, task_id)

        if last_state == TaskStatus.BADIMAGERY:
            project.tasks_bad_imagery -= 1
        elif last_state == TaskStatus.MAPPED:
            project.tasks_mapped -= 1
        elif last_state == TaskStatus.VALIDATED:
            project.tasks_mapped -= 1
            project.tasks_validated -= 1

        user.tasks_invalidated += 1

    @staticmethod
    def get_latest_activity(project_id: int, page: int) -> ProjectActivityDTO:
        """ Gets all the activity on a project """

        results = db.session.query(
                TaskHistory.id, TaskHistory.task_id, TaskHistory.action, TaskHistory.action_date,
                TaskHistory.action_text, User.username
            ).join(User).filter(
                TaskHistory.project_id == project_id,
                TaskHistory.action != 'COMMENT'
            ).order_by(
                TaskHistory.action_date.desc()
            ).paginate(page, 10, True)

        if results.total == 0:
            raise NotFound()

        activity_dto = ProjectActivityDTO()
        for item in results.items:
            history = TaskHistoryDTO()
            history.history_id = item.id
            history.task_id = item.task_id
            history.action = item.action
            history.action_text = item.action_text
            history.action_date = item.action_date
            history.action_by = item.username
            activity_dto.activity.append(history)

        activity_dto.pagination = Pagination(results)
        return activity_dto

    @staticmethod
    def get_user_contributions(project_id: int) -> ProjectContributionsDTO:
        """ Get all user contributions on a project"""
        contrib_query = '''select m.mapped_by, m.username, m.mapped, v.validated_by, v.username, v.validated
                             from (select t.mapped_by, u.username, count(t.mapped_by) mapped
                                     from tasks t,
                                          users u
                                    where t.mapped_by = u.id
                                      and t.project_id = {0}
                                      and t.mapped_by is not null
                                    group by t.mapped_by, u.username) m FULL OUTER JOIN
                                  (select t.validated_by, u.username, count(t.validated_by) validated
                                     from tasks t,
                                          users u
                                    where t.validated_by = u.id
                                      and t.project_id = {0}
                                      and t.validated_by is not null
                                    group by t.validated_by, u.username) v
                                       ON m.mapped_by = v.validated_by
        '''.format(project_id)

        results = db.engine.execute(contrib_query)
        if results.rowcount == 0:
            raise NotFound()

        contrib_dto = ProjectContributionsDTO()
        for row in results:
            user_contrib = UserContribution()
            user_contrib.username = row[1] if row[1] else row[4]
            user_contrib.mapped = row[2] if row[2] else 0
            user_contrib.validated = row[5] if row[5] else 0
            users_durations = TaskHistory.query.filter(
                TaskHistory.user_id == row[0],
                TaskHistory.action_text != '',
                TaskHistory.project_id == project_id
            ).all()

            total_mapping_time = datetime.datetime.min
            total_validating_time = datetime.datetime.min
            total_time_spent = datetime.datetime.min

            for user_duration in users_durations:
                try:
                    duration = dateutil.parser.parse(user_duration.action_text)
                    total_time_spent += datetime.timedelta(
                        hours=duration.hour,
                        minutes=duration.minute,
                        seconds=duration.second,
                        microseconds=duration.microsecond
                        )
                    if user_duration.action == 'LOCKED_FOR_MAPPING':
                        total_mapping_time += datetime.timedelta(
                            hours=duration.hour,
                            minutes=duration.minute,
                            seconds=duration.second,
                            microseconds=duration.microsecond
                            )
                    elif user_duration.action == 'LOCKED_FOR_VALIDATION':
                        total_validating_time += datetime.timedelta(
                            hours=duration.hour,
                            minutes=duration.minute,
                            seconds=duration.second,
                            microseconds=duration.microsecond
                            )
                except ValueError:
                    current_app.logger.info('Invalid duration specified')

            user_contrib.time_spent_mapping = total_mapping_time.time().isoformat()
            user_contrib.time_spent_validating = total_validating_time.time().isoformat()
            user_contrib.total_time_spent = total_time_spent.time().isoformat()
            contrib_dto.user_contributions.append(user_contrib)

        return contrib_dto

    @staticmethod
    @cached(homepage_stats_cache)
    def get_homepage_stats() -> HomePageStatsDTO:
        """ Get overall TM stats to give community a feel for progress that's being made """
        dto = HomePageStatsDTO()

        dto.total_projects = Project.query.count()
        dto.mappers_online = Task.query.filter(
            Task.locked_by is not None
            ).distinct(Task.locked_by).count()
        dto.total_mappers = User.query.count()
        dto.total_validators = Task.query.filter(
            Task.task_status == TaskStatus.VALIDATED.value
            ).distinct(Task.validated_by).count()
        dto.tasks_mapped = Task.query.filter(
            Task.task_status.in_(
                (TaskStatus.MAPPED.value, TaskStatus.VALIDATED.value)
                )
            ).count()
        dto.tasks_validated = Task.query.filter(
            Task.task_status == TaskStatus.VALIDATED.value
            ).count()

        org_proj_count = db.session.query(
            Project.organisation_tag,
            func.count(Project.organisation_tag)
        ).group_by(Project.organisation_tag).all()

        untagged_count = 0

        # total_area = 0
     
       
       
       # dto.total_area = 0
        
        # total_area_sql = """select sum(ST_Area(geometry)) from public.projects as area"""

        # total_area_result = db.engine.execute(total_area_sql)
        # current_app.logger.debug(total_area_result)
        # for rowproxy in total_area_result:
            # rowproxy.items() returns an array like [(key0, value0), (key1, value1)]
            # for tup in rowproxy.items():
                # total_area += tup[1]
                # current_app.logger.debug(total_area)
        # dto.total_area = total_area

        tasks_mapped_area = 0
        tasks_mapped_sql = """select sum(ST_Area(geometry)) from public.tasks where task_status = 2"""
        tasks_mapped_result = db.engine.execute(tasks_mapped_sql)
        for rowproxy in tasks_mapped_result:
            for tup in rowproxy:
                tasks_mapped_area += tup
        dto.total_mapped_area = tasks_mapped_area

        tasks_validated_area = 0
        tasks_validated_sql = """select sum(ST_Area(geometry)) from public.tasks where task_status = 4"""
        tasks_validated_result = db.engine.execute(tasks_validated_sql)
        for rowproxy in tasks_validated_result:
            sum_proxy = [tup for tup in rowproxy if tup is not None]
            tasks_validated_area += sum(sum_proxy)
        dto.total_validated_area = tasks_validated_area
    
        campaign_count = db.session.query(Project.campaign_tag, func.count(Project.campaign_tag))\
            .group_by(Project.campaign_tag).all()
        no_campaign_count = 0
        unique_campaigns = 0

        for tup in campaign_count:
            campaign_stats = CampaignStatsDTO(tup)
            if campaign_stats.tag:
                dto.campaigns.append(campaign_stats)
                unique_campaigns += 1
            else:
                no_campaign_count += campaign_stats.projects_created
        
        if no_campaign_count:
            no_campaign_proj = CampaignStatsDTO(('Untagged', no_campaign_count))
            dto.campaigns.append(no_campaign_proj)
        dto.total_campaigns = unique_campaigns


        org_proj_count = db.session.query(Project.organisation_tag, func.count(Project.organisation_tag))\
            .group_by(Project.organisation_tag).all()
        no_org_count = 0
        unique_orgs = 0 

        for tup in org_proj_count:
            org_stats = OrganizationStatsDTO(tup)
            if org_stats.tag:
                dto.organizations.append(org_stats)
                unique_orgs += 1
            else:
                no_org_count += org_stats.projects_created

        if no_org_count:
            no_org_proj = OrganizationStatsDTO(('Untagged', no_org_count))
            dto.organizations.append(no_org_proj)
        dto.total_organizations = unique_orgs

        return dto
