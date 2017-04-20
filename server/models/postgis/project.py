import json
import geojson
from flask import current_app
from typing import Optional, List
from geoalchemy2 import Geometry
from server import db
from server.models.dtos.project_dto import ProjectDTO, ProjectInfoDTO, DraftProjectDTO, ProjectSearchResultDTO, \
    ProjectSearchResultsDTO, PMProject, PMDashboardDTO
from server.models.postgis.statuses import ProjectStatus, ProjectPriority, MappingLevel, TaskStatus, MappingTypes
from server.models.postgis.tags import Tags
from server.models.postgis.task import Task
from server.models.postgis.user import User
from server.models.postgis.utils import InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON, timestamp, ST_Centroid, NotFound


class AreaOfInterest(db.Model):
    """
    Describes the Area of Interest (AOI) that the project manager defined when creating a project
    """
    __tablename__ = 'areas_of_interest'

    id = db.Column(db.Integer, primary_key=True)
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    centroid = db.Column(Geometry('POINT', srid=4326))

    def __init__(self, aoi_geometry_geojson):
        """
        AOI Constructor
        :param aoi_geometry_geojson: AOI GeoJson
        :raises InvalidGeoJson
        """
        aoi_geometry = geojson.loads(json.dumps(aoi_geometry_geojson))

        if type(aoi_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Area Of Interest: geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(aoi_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Area of Interest: Invalid MultiPolygon - {is_valid_geojson['message']}")

        valid_geojson = geojson.dumps(aoi_geometry)
        self.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        self.centroid = ST_Centroid(self.geometry)


class ProjectInfo(db.Model):
    """ Contains all project info localized into supported languages """
    __tablename__ = 'project_info'

    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), primary_key=True)
    locale = db.Column(db.String(10), primary_key=True)
    name = db.Column(db.String(512))
    short_description = db.Column(db.String)
    description = db.Column(db.String)
    instructions = db.Column(db.String)

    __table_args__ = (db.Index('idx_project_info composite', 'locale', 'project_id'), {})

    @classmethod
    def create_from_name(cls, name: str):
        """ Creates a new ProjectInfo class from name, used when creating draft projects """
        new_info = cls()
        new_info.locale = 'en'  # Draft project default to english, PMs can change this prior to publication
        new_info.name = name
        return new_info

    @classmethod
    def create_from_dto(cls, dto: ProjectInfoDTO):
        """ Creates a new ProjectInfo class from dto, used from project edit """
        new_info = cls()
        new_info.update_from_dto(dto)
        return new_info

    def update_from_dto(self, dto: ProjectInfoDTO):
        """ Updates existing ProjectInfo from supplied DTO """
        self.locale = dto.locale
        self.name = dto.name

        # TODO bleach input
        self.short_description = dto.short_description
        self.description = dto.description
        self.instructions = dto.instructions

    @staticmethod
    def get_dto_for_locale(project_id, locale, default_locale='en') -> ProjectInfoDTO:
        """
        Gets the projectInfoDTO for the project for the requested locale. If not found, then the default locale is used
        :param project_id: ProjectID in scope
        :param locale: locale requested by user
        :param default_locale: default locale of project
        :raises: ValueError if no info found for Default Locale
        """
        project_info = ProjectInfo.query.filter_by(project_id=project_id, locale=locale).one_or_none()

        if project_info is None:
            # If project is none, get default locale and don't worry about empty translations
            project_info = ProjectInfo.query.filter_by(project_id=project_id, locale=default_locale).one_or_none()
            return project_info.get_dto()

        if locale == default_locale:
            # If locale == default_locale don't need to worry about empty translations
            return project_info.get_dto()

        default_locale = ProjectInfo.query.filter_by(project_id=project_id, locale=default_locale).one_or_none()

        if default_locale is None:
            error_message = \
                f'BAD DATA - no info found for project {project_id}, locale: {locale}, default {default_locale}'
            current_app.logger.critical(error_message)
            raise ValueError(error_message)

        # Pass thru default_locale in case of partial translation
        return project_info.get_dto(default_locale)

    def get_dto(self, default_locale=ProjectInfoDTO()) -> ProjectInfoDTO:
        """
        Get DTO for current ProjectInfo
        :param default_locale: The default locale string for any empty fields
        """
        project_info_dto = ProjectInfoDTO()
        project_info_dto.locale = self.locale
        project_info_dto.name = self.name if self.name else default_locale.name
        project_info_dto.description = self.description if self.description else default_locale.description
        project_info_dto.short_description = self.short_description if self.short_description else default_locale.short_description
        project_info_dto.instructions = self.instructions if self.description else default_locale.instructions

        return project_info_dto

    @staticmethod
    def get_dto_for_all_locales(project_id) -> List[ProjectInfoDTO]:
        locales = ProjectInfo.query.filter_by(project_id=project_id).all()

        project_info_dtos = []
        for locale in locales:
            project_info_dto = locale.get_dto()
            project_info_dtos.append(project_info_dto)

        return project_info_dtos


class Project(db.Model):
    """ Describes a HOT Mapping Project """
    __tablename__ = 'projects'

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer, default=ProjectStatus.DRAFT.value, nullable=False)
    aoi_id = db.Column(db.Integer, db.ForeignKey('areas_of_interest.id'))
    created = db.Column(db.DateTime, default=timestamp, nullable=False)
    priority = db.Column(db.Integer, default=ProjectPriority.MEDIUM.value)
    default_locale = db.Column(db.String(10),
                               default='en')  # The locale that is returned if requested locale not available
    author_id = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users'), nullable=False)
    mapper_level = db.Column(db.Integer, default=1, nullable=False, index=True)  # Mapper level project is suitable for
    enforce_mapper_level = db.Column(db.Boolean, default=False)
    enforce_validator_role = db.Column(db.Boolean, default=False)  # Means only users with validator role can validate
    private = db.Column(db.Boolean, default=False)  # Only allowed users can validate
    entities_to_map = db.Column(db.String)
    changeset_comment = db.Column(db.String)
    due_date = db.Column(db.DateTime)
    imagery = db.Column(db.String)
    josm_preset = db.Column(db.String)
    last_updated = db.Column(db.DateTime, default=timestamp)

    # Tags
    mapping_types = db.Column(db.ARRAY(db.Integer), index=True)
    organisation_tag = db.Column(db.String, index=True)
    campaign_tag = db.Column(db.String, index=True)

    # Stats
    total_tasks = db.Column(db.Integer)
    tasks_mapped = db.Column(db.Integer, default=0)
    tasks_validated = db.Column(db.Integer, default=0)

    # Mapped Objects
    tasks = db.relationship(Task, backref='projects', cascade="all, delete, delete-orphan", lazy='dynamic')
    area_of_interest = db.relationship(AreaOfInterest, cascade="all")  # TODO AOI just in project??
    project_info = db.relationship(ProjectInfo, lazy='dynamic', cascade='all')
    author = db.relationship(User)

    def create_draft_project(self, draft_project_dto: DraftProjectDTO, aoi: AreaOfInterest):
        """
        Creates a draft project
        :param draft_project_dto: DTO containing draft project details
        :param aoi: Area of Interest for the project (eg boundary of project)
        """
        self.project_info.append(ProjectInfo.create_from_name(draft_project_dto.project_name))
        self.area_of_interest = aoi
        self.status = ProjectStatus.DRAFT.value
        self.author_id = draft_project_dto.user_id
        self.last_updated = timestamp()

    def create(self):
        """ Creates and saves the current model to the DB """
        # TODO going to need some validation and logic re Draft, Published etc
        db.session.add(self)
        db.session.commit()

    def save(self):
        """ Save changes to db"""
        db.session.commit()

    @staticmethod
    def get(project_id: int):
        """
        Gets specified project
        :param project_id: project ID in scope
        :return: Project if found otherwise None
        """
        return Project.query.get(project_id)

    def update(self, project_dto: ProjectDTO):
        """ Updates project from DTO """
        self.status = ProjectStatus[project_dto.project_status].value
        self.priority = ProjectPriority[project_dto.project_priority].value
        self.default_locale = project_dto.default_locale
        self.enforce_mapper_level = project_dto.enforce_mapper_level
        self.enforce_validator_role = project_dto.enforce_validator_role
        self.private = project_dto.private
        self.mapper_level = MappingLevel[project_dto.mapper_level.upper()].value
        self.entities_to_map = project_dto.entities_to_map
        self.changeset_comment = project_dto.changeset_comment
        self.due_date = project_dto.due_date
        self.imagery = project_dto.imagery
        self.josm_preset = project_dto.josm_preset
        self.last_updated = timestamp()

        if project_dto.organisation_tag:
            org_tag = Tags.upsert_organistion_tag(project_dto.organisation_tag)
            self.organisation_tag = org_tag
        else:
            self.organisation_tag = None  # Set to none, for cases where a tag could have been removed

        if project_dto.campaign_tag:
            camp_tag = Tags.upsert_campaign_tag(project_dto.campaign_tag)
            self.campaign_tag = camp_tag
        else:
            self.campaign_tag = None  # Set to none, for cases where a tag could have been removed

        # Cast MappingType strings to int array
        type_array = []
        for mapping_type in project_dto.mapping_types:
            type_array.append(MappingTypes[mapping_type].value)
        self.mapping_types = type_array

        # Set Project Info for all returned locales
        for dto in project_dto.project_info_locales:

            project_info = self.project_info.filter_by(locale=dto.locale).one_or_none()

            if project_info is None:
                new_info = ProjectInfo.create_from_dto(dto)  # Can't find info so must be new locale
                self.project_info.append(new_info)
            else:
                project_info.update_from_dto(dto)

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def can_be_deleted(self) -> bool:
        """ Projects can be deleted if they have no mapped work """
        task_count = self.tasks.filter(Task.task_status != TaskStatus.READY.value).count()
        if task_count == 0:
            return True
        else:
            return False

    def get_locked_tasks_for_user(self, user_id: int):
        """ Gets tasks on project owned by specifed user id"""
        tasks = self.tasks.filter_by(locked_by=user_id)

        locked_tasks = []
        for task in tasks:
            locked_tasks.append(task.id)

        return locked_tasks

    @staticmethod
    def get_projects_for_admin(admin_id: int, preferred_locale: str) -> PMDashboardDTO:
        """ Get projects for admin """
        admins_projects = db.session.query(Project.id,
                                           Project.status,
                                           Project.campaign_tag,
                                           Project.total_tasks,
                                           Project.tasks_mapped,
                                           Project.tasks_validated,
                                           Project.created,
                                           Project.last_updated,
                                           Project.default_locale,
                                           AreaOfInterest.centroid.ST_AsGeoJSON().label('geojson'))\
            .join(AreaOfInterest).filter(Project.author_id == admin_id).all()

        if admins_projects is None:
            raise NotFound('No projects found for admin')

        admin_projects_dto = PMDashboardDTO()
        for project in admins_projects:
            pm_project = Project.get_pm_project(project, preferred_locale)
            project_status = ProjectStatus(project.status)

            if project_status == ProjectStatus.DRAFT:
                admin_projects_dto.draft_projects.append(pm_project)
            elif project_status == ProjectStatus.PUBLISHED:
                admin_projects_dto.active_projects.append(pm_project)
            elif project_status == ProjectStatus.ARCHIVED:
                admin_projects_dto.archived_projects.append(pm_project)
            else:
                current_app.logger.error(f'Unexpected state project {project.id}')

        return admin_projects_dto

    @staticmethod
    def get_pm_project(project, preferred_locale) -> PMProject:
        """ Create PMProject object from query results """
        pm_project = PMProject()
        pm_project.project_id = project.id
        pm_project.campaign_tag = project.campaign_tag
        pm_project.created = project.created
        pm_project.last_updated = project.last_updated
        pm_project.aoi_centroid = geojson.loads(project.geojson)

        pm_project.percent_mapped = round((project.tasks_mapped / project.total_tasks) * 100, 0)
        pm_project.percent_validated = round((project.tasks_validated / project.total_tasks) * 100, 0)

        project_info = ProjectInfo.get_dto_for_locale(project.id, preferred_locale, project.default_locale)
        pm_project.name = project_info.name

        return pm_project

    def _get_project_and_base_dto(self, project_id):
        """ Populates a project DTO with properties common to all roles """

        # Query ignores tasks so we can more optimally generate the task feature collection if needed
        project = db.session.query(Project.id,
                                   Project.priority,
                                   Project.status,
                                   Project.default_locale,
                                   Project.mapper_level,
                                   Project.enforce_validator_role,
                                   Project.enforce_mapper_level,
                                   Project.private,
                                   Project.changeset_comment,
                                   Project.entities_to_map,
                                   Project.imagery,
                                   Project.due_date,
                                   Project.josm_preset,
                                   Project.mapping_types,
                                   Project.campaign_tag,
                                   Project.organisation_tag,
                                   AreaOfInterest.geometry.ST_AsGeoJSON().label('geojson')) \
            .join(AreaOfInterest).filter(Project.id == project_id).one_or_none()

        if project is None:
            return None, None

        base_dto = ProjectDTO()
        base_dto.project_id = project_id
        base_dto.project_status = ProjectStatus(project.status).name
        base_dto.default_locale = project.default_locale
        base_dto.project_priority = ProjectPriority(project.priority).name
        base_dto.area_of_interest = geojson.loads(project.geojson)
        base_dto.enforce_mapper_level = project.enforce_mapper_level
        base_dto.enforce_validator_role = project.enforce_validator_role
        base_dto.private = project.private
        base_dto.mapper_level = MappingLevel(project.mapper_level).name
        base_dto.entities_to_map = project.entities_to_map
        base_dto.changeset_comment = project.changeset_comment
        base_dto.due_date = project.due_date
        base_dto.imagery = project.imagery
        base_dto.josm_preset = project.josm_preset
        base_dto.campaign_tag = project.campaign_tag
        base_dto.organisation_tag = project.organisation_tag

        if project.mapping_types:
            mapping_types = []
            for mapping_type in project.mapping_types:
                mapping_types.append(MappingTypes(mapping_type).name)

            base_dto.mapping_types = mapping_types

        return project, base_dto

    def as_dto_for_mapping(self, locale: str) -> Optional[ProjectDTO]:
        """ Creates a Project DTO suitable for transmitting to mapper users """
        project, project_dto = self._get_project_and_base_dto(self.id)

        project_dto.tasks = Task.get_tasks_as_geojson_feature_collection(self.id)
        project_dto.project_info = ProjectInfo.get_dto_for_locale(self.id, locale, project.default_locale)

        return project_dto

    def as_dto_for_admin(self, project_id):
        """ Creates a Project DTO suitable for transmitting to project admins """
        project, project_dto = self._get_project_and_base_dto(project_id)

        if project is None:
            return None

        project_dto.project_info_locales = ProjectInfo.get_dto_for_all_locales(project_id)

        return project_dto

    @staticmethod
    def get_projects_by_seach_criteria(sql: str, preferred_locale: str) -> ProjectSearchResultsDTO:
        """ Find all projects that match the search criteria """
        results = db.engine.execute(sql)

        if results.rowcount == 0:
            raise NotFound()

        results_list = []
        for row in results:
            # TODO would be nice to get this for an array rather than individually would be more efficient
            project_info_dto = ProjectInfo.get_dto_for_locale(row[0], preferred_locale, row[3])

            result_dto = ProjectSearchResultDTO()
            result_dto.project_id = row[0]
            result_dto.locale = project_info_dto.locale
            result_dto.name = project_info_dto.name
            result_dto.priority = ProjectPriority(row[2]).name
            result_dto.mapper_level = MappingLevel(row[1]).name
            result_dto.short_description = project_info_dto.short_description
            result_dto.aoi_centroid = geojson.loads(row[4])
            result_dto.organisation_tag = row[5]
            result_dto.campaign_tag = row[6]

            results_list.append(result_dto)

        results_dto = ProjectSearchResultsDTO()
        results_dto.results = results_list

        return results_dto
