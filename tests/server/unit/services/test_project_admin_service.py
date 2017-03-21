import json
import unittest
from unittest.mock import MagicMock, patch
from server.services.project_admin_service import ProjectAdminService, InvalidGeoJson, Project, ProjectDTO


class TestProjectAdminService(unittest.TestCase):

    def test_cant_add_tasks_if_geojson_not_feature_collection(self):
        # Arrange
        invalid_feature = '{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],' \
            '[-4.0237, 56.0904]]]], "type": "MultiPolygon"}'
        test_project_service = ProjectAdminService()

        # Act
        with self.assertRaises(InvalidGeoJson):
            test_project_service._attach_tasks_to_project(MagicMock(), invalid_feature)

    def test_valid_geo_json_attaches_task_to_project(self):
        # Arrange
        valid_feature_collection = json.loads('{"features": [{"geometry": {"coordinates": [[[[-4.0237, 56.0904],'
                                              '[-3.9111, 56.1715], [-3.8122, 56.098], [-4.0237, 56.0904]]]], "type":'
                                              '"MultiPolygon"}, "properties": {"x": 2402, "y": 1736, "zoom": 12}, "type":'
                                              '"Feature"}], "type": "FeatureCollection"}')

        test_project_service = ProjectAdminService()
        test_project = Project()
        test_project.create_draft_project('Test', MagicMock())

        # Act
        test_project_service._attach_tasks_to_project(test_project, valid_feature_collection)

        # Assert
        self.assertEqual(1, len(test_project.tasks), 'One task should have been attached to project')

    @patch.object(Project, 'get')
    def test_get_project_for_update_returns_none_if_project_not_found(self, mock_project):
        # Arrange
        mock_project.return_value = None

        # Act
        test_project = ProjectAdminService().update_project(MagicMock())

        # Assert
        self.assertIsNone(test_project)
