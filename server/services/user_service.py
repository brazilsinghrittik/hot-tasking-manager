import requests
import xml.etree.ElementTree as ET
from flask import current_app
from typing import Optional
from server.models.postgis.user import User, UserRole, MappingLevel
from server.models.dtos.user_dto import UserDTO, UserOSMDTO

INTERMEDIATE_MAPPER_LEVEL = 250
ADVANCED_MAPPER_LEVEL = 500


class UserServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when in the User Service """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class UserService:

    user = None

    @classmethod
    def from_user_id(cls, user_id):
        cls.user = User().get_by_id(user_id)
        return cls()

    @classmethod
    def from_user_name(cls, username):
        cls.user = User().get_by_username(username)
        return cls()

    def register_user(self, osm_id, username, changeset_count):
        """
        Creates user in DB if they are a new user
        :param osm_id: Unique OSM user id
        :param username: OSM Username
        :param changeset_count: OSM changeset count
        """
        if self.user is not None:
            return  # User exists so no further processing needed

        new_user = User()
        new_user.id = osm_id
        new_user.username = username

        if changeset_count > ADVANCED_MAPPER_LEVEL:
            new_user.mapping_level = MappingLevel.ADVANCED.value
        elif INTERMEDIATE_MAPPER_LEVEL < changeset_count < ADVANCED_MAPPER_LEVEL:
            new_user.mapping_level = MappingLevel.INTERMEDIATE.value
        else:
            new_user.mapping_level = MappingLevel.BEGINNER.value

        new_user.create()
        return new_user

    @staticmethod
    def get_user_by_username(username: str) -> Optional[UserDTO]:
        """Gets user DTO for supplied username """
        user = User().get_by_username(username)

        if user is None:
            return None

        return user.as_dto()

    @staticmethod
    def is_user_a_project_manager(user_id: int) -> bool:
        """ Is the user a project manager """
        user = User().get_by_id(user_id)

        if user is None:
            return False

        return user.is_project_manager()

    @staticmethod
    def is_user_validator(user_id: int):
        """ Determines if user is a validator """
        user = User().get_by_id(user_id)
        user_role = UserRole(user.role)

        if user_role in [UserRole.VALIDATOR, UserRole.ADMIN, UserRole.PROJECT_MANAGER]:
            return True

        return False

    @staticmethod
    def get_osm_details_for_user(username: str) -> Optional[UserOSMDTO]:
        """
        Gets OSM details for the user from OSM API
        :param username: username in scope
        :raises UserServiceError
        """
        user = User().get_by_username(username)
        if user is None:
            return None

        osm_user_details_url = f'http://www.openstreetmap.org/api/0.6/user/{user.id}'
        response = requests.get(osm_user_details_url)

        if response.status_code != 200:
            raise UserServiceError('Bad response from OSM')

        return UserService._parse_osm_user_details_response(response.text)

    @staticmethod
    def _parse_osm_user_details_response(osm_response: str, user_element='user') -> UserOSMDTO:
        """ Parses the OSM user details response and extracts user info """
        root = ET.fromstring(osm_response)

        osm_user = root.find(user_element)
        if osm_user is None:
            raise UserServiceError('User element not found in OSM response')

        account_created = osm_user.attrib['account_created']
        changesets = osm_user.find('changesets')
        changeset_count = int(changesets.attrib['count'])

        osm_dto = UserOSMDTO()
        osm_dto.account_created = account_created
        osm_dto.changeset_count = changeset_count
        return osm_dto
