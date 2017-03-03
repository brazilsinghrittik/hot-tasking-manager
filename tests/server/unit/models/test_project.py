import geojson
import unittest
from server.models.project import AreaOfInterest, InvalidGeoJson, InvalidData, Project


class TestProject(unittest.TestCase):

    def test_cant_create_aoi_with_non_multipolygon_type(self):
        # Arrange
        bad_geom = geojson.Polygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38, 57.322)]])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            AreaOfInterest(geojson.dumps(bad_geom))

    def test_cant_create_aoi_with_invalid_multipolygon(self):
        bad_multipolygon = geojson.MultiPolygon([[(2.38, 57.322), (23.194, -20.28), (-120.43, 19.15), (2.38)]])

        # Act / Assert
        with self.assertRaises(InvalidGeoJson):
            # Only geometries of type MultiPolygon are valid
            AreaOfInterest(geojson.dumps(bad_multipolygon))

    def test_cant_create_project_with_empty_project_name(self):
        # Act / Assert
        with self.assertRaises(InvalidData):
            # Only geometries of type MultiPolygon are valid
            Project('', 'aoi')
