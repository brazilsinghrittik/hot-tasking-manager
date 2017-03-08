import os
import unittest
import geojson
from server import create_app
from server.services.project_service import Project, AreaOfInterest, Task


class TestProject(unittest.TestCase):
    skip_tests = False
    test_project = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv('SHIPPABLE', 'false')

        # Firewall rules mean we can't hit Postgres from Shippable so we have to skip them in the CI build
        if env == 'true':
            cls.skip_tests = True

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        if self.skip_tests:
            return

        self.create_test_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.ctx.pop()

    def test_project_can_be_persisted_to_db(self):
        # Checks that code we ran in setUp actually created a project in the DB
        self.assertIsNotNone(self.test_project.id, 'ID should be set if project successfully persisted')

    def test_task_can_generate_valid_feature_collection(self):
        # Act
        feature_collection = Task.get_tasks_as_geojson_feature_collection(self.test_project.id)

        # Assert
        self.assertIsInstance(feature_collection, geojson.FeatureCollection)
        self.assertEqual(1, len(feature_collection.features))

    def test_project_can_be_generated_as_dto(self):
        # Act
        project_dto = Project.as_dto(self.test_project.id)

        # Assert
        self.assertIsInstance(project_dto['areaOfInterest'], geojson.MultiPolygon)
        self.assertIsInstance(project_dto['tasks'], geojson.FeatureCollection)
        self.assertEqual(project_dto['projectName'], 'Test')
        self.assertEqual(project_dto['projectId'], self.test_project.id)

    def create_test_project(self):
        """
        Helper function that creates a valid test project in the db
        """
        multipoly_geojson = '{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],' \
            '[-4.0237, 56.0904]]]], "properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "MultiPolygon"}'

        task_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
                                     '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
                                     '"properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

        test_aoi = AreaOfInterest(multipoly_geojson)
        self.test_project = Project('Test', test_aoi)
        self.test_project.tasks.append(Task(1, task_feature))
        self.test_project.create()
