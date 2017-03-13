from flask import current_app
from server.models.task import Task, TaskStatus, TaskHistory


class TaskServiceError(Exception):
    """
    Custom Exception to notify callers an error occurred when handling Task
    """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class TaskService:
    @staticmethod
    def lock_task(task_id, project_id):
        """
        Sets the task_locked status to locked so no other user can work on it
        :param task_id: Task ID in scope
        :param project_id: Project ID in scope
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """
        task = Task.get(project_id, task_id)

        if task is None:
            return None

        if task.task_locked:
            raise TaskServiceError(f'Task: {task_id} Project {project_id} is already locked')

        # TODO user can only have 1 tasked locked at a time

        task_history = TaskHistory(task_id, project_id)
        task_history.set_task_locked_action()
        task.task_locked = True
        task.task_history.append(task_history)

        task.update()
        return task

    @staticmethod
    def unlock_task(task_id, project_id, state, comment=None):
        """
        Unlocks the task and sets the task history appropriately
        :param task_id: Selected Task
        :param project_id: Project ID associated with Task
        :param state: The current state of the task (this could be the same as the existing state)
        :param comment: Comment user has provided about the task
        """
        task = Task.get(project_id, task_id)

        if task is None:
            return None

        if not task.task_locked:
            return task  # Task is already unlocked, so return without any further processing

        try:
            new_state = TaskStatus[state.upper()]
        except KeyError:
            raise TaskServiceError(
                f'Unknown status: {state} Valid values are {TaskStatus.BADIMAGERY.name}, {TaskStatus.DONE.name}, '
                f'{TaskStatus.INVALIDATED.name}, {TaskStatus.VALIDATED.name}')

        if comment:
            # TODO need to clean comment to avoid injection attacks, maybe just raise error if html detected

            history = TaskHistory(task_id, project_id)
            history.set_comment_action(comment)
            task.task_history.append(history)

        if TaskStatus(task.task_status) != new_state:
            # Task state change
            history = TaskHistory(task_id, project_id)
            history.set_state_change_action(new_state)
            task.task_history.append(history)
            task.task_status = new_state.value

        TaskHistory.update_task_locked_with_duration(task_id, project_id)

        task.update()
        return task
