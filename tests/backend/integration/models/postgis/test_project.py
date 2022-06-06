import geojson
from backend.models.dtos.project_dto import DraftProjectDTO

from tests.backend.base import BaseTestCase
from backend.models.postgis.project import (
    Task,
    ProjectDTO,
    ProjectStatus,
    ProjectPriority,
    Project,
)
from backend.models.postgis.project_info import ProjectInfoDTO
from tests.backend.helpers.test_helpers import (
    create_canned_project,
    return_canned_draft_project_json,
    update_project_with_info,
)


class TestProject(BaseTestCase):
    def test_project_can_be_persisted_to_db(self):
        self.test_project, self.test_user = create_canned_project()
        # Checks that code we ran in setUp actually created a project in the DB
        self.assertIsNotNone(
            self.test_project.id, "ID should be set if project successfully persisted"
        )

    def test_task_can_generate_valid_feature_collection(self):
        self.test_project, self.test_user = create_canned_project()
        # Act
        feature_collection = Task.get_tasks_as_geojson_feature_collection(
            self.test_project.id, "1"
        )
        self.assertIsInstance(feature_collection, geojson.FeatureCollection)
        self.assertEqual(1, len(feature_collection.features))

        feature_collection = Task.get_tasks_as_geojson_feature_collection(
            self.test_project.id, None
        )
        self.assertIsInstance(feature_collection, geojson.FeatureCollection)
        self.assertEqual(3, len(feature_collection.features))

    def test_project_can_be_generated_as_dto(self):
        self.test_project, self.test_user = create_canned_project()
        # Arrange
        self.test_project = update_project_with_info(self.test_project)

        # Act
        project_dto = self.test_project.as_dto_for_mapping()

        # Assert
        self.assertIsInstance(project_dto.area_of_interest, geojson.MultiPolygon)
        self.assertIsInstance(project_dto.tasks, geojson.FeatureCollection)
        # TODO test for project info
        # self.assertEqual(project_dto.project_name, 'Test')
        self.assertEqual(project_dto.project_id, self.test_project.id)

    def test_update_project_adds_project_info(self):
        self.test_project, self.test_user = create_canned_project()
        # Act
        self.test_project = update_project_with_info(self.test_project)

        # Assert
        self.assertEqual(self.test_project.status, ProjectStatus.PUBLISHED.value)
        self.assertEqual(self.test_project.priority, ProjectPriority.MEDIUM.value)
        self.assertEqual(self.test_project.default_locale, "en")
        self.assertEqual(self.test_project.project_info[0].name, "Thinkwhere Test")

    def test_partial_translation_uses_default_trans_for_empty_fields(self):
        self.test_project, self.test_user = create_canned_project()
        # Arrange
        self.test_project = update_project_with_info(self.test_project)

        locales = []
        test_info = ProjectInfoDTO()
        test_info.locale = "it"
        locales.append(test_info)

        test_dto = ProjectDTO()
        test_dto.project_status = ProjectStatus.PUBLISHED.name
        test_dto.project_priority = ProjectPriority.MEDIUM.name
        test_dto.default_locale = "en"
        test_dto.project_info_locales = locales
        test_dto.mapper_level = "BEGINNER"
        test_dto.mapping_types = ["ROADS"]
        test_dto.mapping_editors = ["JOSM", "ID"]
        test_dto.validation_editors = ["JOSM"]

        # Act - Create empty italian translation
        self.test_project.update(test_dto)
        dto = self.test_project.as_dto_for_mapping(locale="it")

        # Assert
        self.assertEqual(
            dto.project_info["name"],
            "Thinkwhere Test",
            "English translation should be returned as Italian name was not provided",
        )

    def test_set_project_aoi(self):
        #  Arrange
        draft_project_dto = DraftProjectDTO(return_canned_draft_project_json())
        draft_project = Project()
        # Act
        draft_project.set_project_aoi(draft_project_dto)
        # Assert
        self.assertIsNotNone(draft_project.geometry)
        self.assertIsNotNone(draft_project.centroid)
