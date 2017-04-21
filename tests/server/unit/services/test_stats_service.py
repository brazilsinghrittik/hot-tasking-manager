import unittest
from unittest.mock import patch
from server.services.stats_service import StatsService, ProjectService, UserService, TaskStatus
from server.models.postgis.project import Project
from server.models.postgis.user import User


class TestStatsService(unittest.TestCase):

    def test_update_after_mapping_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_mapped = 0

        test_user = User()
        test_user.tasks_mapped = 0

        # Act
        StatsService._set_counters_after_mapping(test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_mapped, 1)
        self.assertEqual(test_user.tasks_mapped, 1)

    def test_update_after_validating_increments_counter(self):
        # Arrange
        test_project = Project()
        test_project.tasks_validated = 0

        test_user = User()
        test_user.tasks_validated = 0

        # Act
        StatsService._set_counters_after_validated(test_project, test_user)

        # Assert
        self.assertEqual(test_project.tasks_validated, 1)
        self.assertEqual(test_user.tasks_validated, 1)

    @patch.object(UserService, 'upsert_mapped_projects')
    @patch.object(Project, 'save')
    @patch.object(UserService, 'get_user_by_id')
    @patch.object(ProjectService, 'get_project_by_id')
    def test_update_after_invalidating_mapped_task_sets_counter_correctly(self, mock_project, mock_user, mock_save, mock_upsert):
        # Arrange
        test_user = User()
        test_user.tasks_invalidated = 0
        mock_user.return_value = test_user

        # Act
        project, user = StatsService.update_stats_after_task_state_change(1, 1, TaskStatus.INVALIDATED,
                                                                          TaskStatus.MAPPED)

        # Assert
        self.assertEqual(user.tasks_invalidated, 1)