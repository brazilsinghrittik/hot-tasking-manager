import geojson
import json
import os
from typing import Tuple
import xml.etree.ElementTree as ET
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectInfoDTO,
    ProjectStatus,
    ProjectPriority,
)
from backend.models.postgis.project import Project
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.task import Task
from backend.models.postgis.user import User
from backend.models.postgis.organisation import Organisation

TEST_USER_ID = 1234


def get_canned_osm_user_details():
    """ Helper method to find test file, dependent on where tests are being run from """

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details.xml"
    )

    try:
        with open(location, "r"):
            return ET.parse(location)
    except FileNotFoundError:
        raise FileNotFoundError("osm_user_details.xml not found")


def get_canned_osm_user_json_details():
    """ Helper method to find test file, dependent on where tests are being run from """

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details.json"
    )
    try:
        with open(location, "r") as x:
            return json.load(x)
    except FileNotFoundError:
        raise FileNotFoundError("osm_user_details.json not found")


def get_canned_osm_user_details_changed_name():
    """ Helper method to find test file, dependent on where tests are being run from """

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details_changed_name.xml"
    )

    try:
        with open(location, "r"):
            return ET.parse(location)
    except FileNotFoundError:
        raise FileNotFoundError("osm_user_details_changed_name.xml not found")


def get_canned_json(name_of_file):
    """ Read canned Grid request from file """

    location = os.path.join(os.path.dirname(__file__), "test_files", name_of_file)

    try:
        with open(location, "r") as grid_file:
            data = json.load(grid_file)

            return data
    except FileNotFoundError:
        raise FileNotFoundError("json file not found")


def get_canned_simplified_osm_user_details():
    """ Helper that reads file and returns it as a string """
    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details_simple.xml"
    )

    with open(location, "r") as osm_file:
        data = osm_file.read().replace("\n", "")

    return data


def return_canned_user() -> User:
    """Returns a canned user"""
    test_user = User()
    test_user.username = "Thinkwhere TEST"
    test_user.id = "777777"
    test_user.mapping_level = 1
    test_user.email_address = None

    return test_user


def create_canned_user() -> User:
    """ Generate a canned user in the DB """
    test_user = return_canned_user()
    test_user.create()

    return test_user


def get_canned_user(username: str) -> User:
    test_user = User().get_by_username(username)
    return test_user


def create_canned_project() -> Tuple[Project, User]:
    """ Generates a canned project in the DB to help with integration tests """
    test_aoi_geojson = geojson.loads(json.dumps(get_canned_json("test_aoi.json")))

    task_feature = geojson.loads(json.dumps(get_canned_json("splittable_task.json")))
    task_non_square_feature = geojson.loads(
        json.dumps(get_canned_json("non_square_task.json"))
    )
    task_arbitrary_feature = geojson.loads(
        json.dumps(get_canned_json("splittable_task.json"))
    )
    test_user = get_canned_user("Thinkwhere TEST")
    if test_user is None:
        test_user = create_canned_user()

    test_project_dto = DraftProjectDTO()
    test_project_dto.project_name = "Test"
    test_project_dto.user_id = test_user.id
    test_project_dto.area_of_interest = test_aoi_geojson
    test_project = Project()
    test_project.create_draft_project(test_project_dto)
    test_project.set_project_aoi(test_project_dto)
    test_project.total_tasks = 3

    # Setup test task
    test_task = Task.from_geojson_feature(1, task_feature)
    test_task.task_status = TaskStatus.MAPPED.value
    test_task.mapped_by = test_user.id
    test_task.is_square = True

    test_task2 = Task.from_geojson_feature(2, task_non_square_feature)
    test_task2.task_status = TaskStatus.READY.value
    test_task2.is_square = False

    test_task3 = Task.from_geojson_feature(3, task_arbitrary_feature)
    test_task3.task_status = TaskStatus.BADIMAGERY.value
    test_task3.mapped_by = test_user.id
    test_task3.is_square = True

    test_project.tasks.append(test_task)
    test_project.tasks.append(test_task2)
    test_project.tasks.append(test_task3)
    test_project.create()
    test_project.set_default_changeset_comment()

    return test_project, test_user


def return_canned_draft_project_json():
    """ Helper method to find test file, dependent on where tests are being run from """

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "canned_draft_project.json"
    )
    try:
        with open(location, "r") as x:
            return json.load(x)
    except FileNotFoundError:
        raise FileNotFoundError("canned_draft_project.json not found")


def return_canned_organisation():
    "Returns test organisation without writing to db"
    test_org = Organisation()
    test_org.id = 23
    test_org.name = "Kathmandu Living Labs"
    test_org.slug = "KLL"

    return test_org


def create_canned_organisation():
    "Generate a canned organisation in the DB"
    test_org = return_canned_organisation()
    test_org.create()

    return test_org


def update_project_with_info(test_project: Project) -> Project:
    locales = []
    test_info = ProjectInfoDTO()
    test_info.locale = "en"
    test_info.name = "Thinkwhere Test"
    test_info.description = "Test Description"
    test_info.short_description = "Short description"
    test_info.instructions = "Instructions"
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
    test_dto.changeset_comment = "hot-project"
    test_project.update(test_dto)

    return test_project
