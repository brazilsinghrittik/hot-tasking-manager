import unittest
from server.services.validator_service import ValidatorService, Task, TaskNotFound, LockForValidationDTO, TaskStatus, \
    ValidatatorServiceError
from unittest.mock import patch
from server import create_app


class TestValidatorService(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    @patch.object(Task, 'get')
    def test_lock_tasks_for_validation_raises_error_if_task_not_found(self, mock_task):
        # Arrange
        mock_task.return_value = None

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(TaskNotFound):
            ValidatorService().lock_tasks_for_validation(lock_dto)

    @patch.object(Task, 'get')
    def test_lock_tasks_for_validation_raises_error_if_task_not_done(self, mock_task):
        # Arrange
        task_stub = Task()
        task_stub.task_status = TaskStatus.READY.value
        mock_task.return_value = task_stub

        lock_dto = LockForValidationDTO()
        lock_dto.project_id = 1
        lock_dto.task_ids = [1, 2]

        # Act / Assert
        with self.assertRaises(ValidatatorServiceError):
            ValidatorService().lock_tasks_for_validation(lock_dto)
