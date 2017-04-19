from server.models.postgis.statuses import TaskStatus
from server.models.postgis.utils import timestamp
from server.services.project_service import ProjectService
from server.services.user_service import UserService


class StatsService:

    @staticmethod
    def update_stats_after_task_state_change(project_id: int, user_id: int, task_status: TaskStatus):
        """ Update stats when a task has had a state change """
        if task_status in [TaskStatus.BADIMAGERY, TaskStatus.READY, TaskStatus.LOCKED_FOR_VALIDATION,
                           TaskStatus.LOCKED_FOR_MAPPING]:
            return  # No stats to record for these states

        project = ProjectService.get_project_by_id(project_id)
        user = UserService.get_user_by_id(user_id)

        if task_status == TaskStatus.MAPPED:
            project.tasks_mapped += 1
            user.tasks_mapped += 1
        elif task_status == TaskStatus.INVALIDATED:
            user.tasks_invalidated += 1
        elif task_status == TaskStatus.VALIDATED:
            project.tasks_validated += 1
            user.tasks_validated += 1

        project.last_updated = timestamp()
        project.save()  # Will also save user changes, as using same session

        return project, user
