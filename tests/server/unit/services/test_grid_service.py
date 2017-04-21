import unittest
from server.services.grid_service import GridService
from shapely.geometry import shape


class TestGridService(unittest.TestCase):

    def test_geometries_intersect(self):
        # arrange
        task = {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.61456036067679
                                    ],
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.61456036067679
                                    ],
                                    [
                                        11.453247068260938,
                                        24.61456036067679
                                    ]
                                ]
                            ]
                        ]
                    }
        task_polygon = shape(task)
        aoi = {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [
                        [
                            11.454777166054331,
                            24.621395460265262
                        ],
                        [
                            11.460956975624642,
                            24.621317433227347
                        ],
                        [
                            11.461901113197886,
                            24.617181930534727
                        ],
                        [
                            11.453661367104136,
                            24.617025871151228
                        ],
                        [
                            11.454777166054331,
                            24.621395460265262
                        ]
                    ]
                ]
            ]
        }
        aoi_polygon = shape(aoi)

        # act
        intersects = GridService.geometries_intersect(task_polygon, aoi_polygon)

        # assert
        self.assertEquals(intersects, True)

    def test_find_intersecting_tasks(self):
        # arrange
        aoi = {
            "type": "MultiPolygon",
            "coordinates": [
                [
                    [
                        [
                            11.454777166054331,
                            24.621395460265262
                        ],
                        [
                            11.460956975624642,
                            24.621317433227347
                        ],
                        [
                            11.461901113197886,
                            24.617181930534727
                        ],
                        [
                            11.453661367104136,
                            24.617025871151228
                        ],
                        [
                            11.454777166054331,
                            24.621395460265262
                        ]
                    ]
                ]
            ]
        }
        tasks = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.61456036067679
                                    ],
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.61456036067679
                                    ],
                                    [
                                        11.453247068260938,
                                        24.61456036067679
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69706,
                        "y": 74787,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ],
                                    [
                                        11.453247068260938,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69706,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.619554262806403
                                    ],
                                    [
                                        11.453247068260938,
                                        24.622051139078053
                                    ],
                                    [
                                        11.455993650291683,
                                        24.622051139078053
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.453247068260938,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69706,
                        "y": 74789,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.455993650291683,
                                        24.61456036067679
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ],
                                    [
                                        11.45874023232243,
                                        24.61456036067679
                                    ],
                                    [
                                        11.455993650291683,
                                        24.61456036067679
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69707,
                        "y": 74787,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69707,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.622051139078053
                                    ],
                                    [
                                        11.45874023232243,
                                        24.622051139078053
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69707,
                        "y": 74789,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.45874023232243,
                                        24.61456036067679
                                    ],
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ],
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ],
                                    [
                                        11.461486814353208,
                                        24.61456036067679
                                    ],
                                    [
                                        11.45874023232243,
                                        24.61456036067679
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69708,
                        "y": 74787,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ],
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69708,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.622051139078053
                                    ],
                                    [
                                        11.461486814353208,
                                        24.622051139078053
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69708,
                        "y": 74789,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.461486814353208,
                                        24.61456036067679
                                    ],
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ],
                                    [
                                        11.464233396383955,
                                        24.617057336671365
                                    ],
                                    [
                                        11.464233396383955,
                                        24.61456036067679
                                    ],
                                    [
                                        11.461486814353208,
                                        24.61456036067679
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69709,
                        "y": 74787,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.464233396383955,
                                        24.619554262806403
                                    ],
                                    [
                                        11.464233396383955,
                                        24.617057336671365
                                    ],
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69709,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.461486814353208,
                                        24.622051139078053
                                    ],
                                    [
                                        11.464233396383955,
                                        24.622051139078053
                                    ],
                                    [
                                        11.464233396383955,
                                        24.619554262806403
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69709,
                        "y": 74789,
                        "zoom": 17
                    }
                }
            ]
        }
        expected = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.61456036067679
                                    ],
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.61456036067679
                                    ],
                                    [
                                        11.453247068260938,
                                        24.61456036067679
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69706,
                        "y": 74787,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ],
                                    [
                                        11.453247068260938,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.453247068260938,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69706,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.453247068260938,
                                        24.619554262806403
                                    ],
                                    [
                                        11.453247068260938,
                                        24.622051139078053
                                    ],
                                    [
                                        11.455993650291683,
                                        24.622051139078053
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.453247068260938,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69706,
                        "y": 74789,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ],
                                    [
                                        11.455993650291683,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69707,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.622051139078053
                                    ],
                                    [
                                        11.45874023232243,
                                        24.622051139078053
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.455993650291683,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69707,
                        "y": 74789,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ],
                                    [
                                        11.45874023232243,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69708,
                        "y": 74788,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.622051139078053
                                    ],
                                    [
                                        11.461486814353208,
                                        24.622051139078053
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.45874023232243,
                                        24.619554262806403
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69708,
                        "y": 74789,
                        "zoom": 17
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ],
                                    [
                                        11.461486814353208,
                                        24.619554262806403
                                    ],
                                    [
                                        11.464233396383955,
                                        24.619554262806403
                                    ],
                                    [
                                        11.464233396383955,
                                        24.617057336671365
                                    ],
                                    [
                                        11.461486814353208,
                                        24.617057336671365
                                    ]
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "x": 69709,
                        "y": 74788,
                        "zoom": 17
                    }
                }
            ]
        }

        # act
        intersecting_tasks = GridService.find_intersecting_tiles_in_grid(tasks, aoi)

        # assert
        self.assertEquals(intersecting_tasks, expected)


