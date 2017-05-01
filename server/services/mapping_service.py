import datetime
import xml.etree.ElementTree as ET
from flask import current_app
from geoalchemy2 import shape
from server.models.dtos.mapping_dto import TaskDTO, MappedTaskDTO, LockTaskDTO
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.statuses import MappingNotAllowed
from server.models.postgis.utils import NotFound, UserLicenseError
from server.services.project_service import ProjectService
from server.services.stats_service import StatsService


class MappingServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling mapping """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class MappingService:

    @staticmethod
    def get_task(task_id: int, project_id: int) -> Task:
        """
        Get task from DB
        :raises: NotFound
        """
        task = Task.get(task_id, project_id)

        if task is None:
            raise NotFound()

        return task

    @staticmethod
    def get_task_as_dto(task_id: int, project_id: int) -> TaskDTO:
        """ Get task as DTO for transmission over API """
        task = MappingService.get_task(task_id, project_id)
        return task.as_dto()

    @staticmethod
    def lock_task_for_mapping(lock_task_dto: LockTaskDTO) -> TaskDTO:
        """
        Sets the task_locked status to locked so no other user can work on it
        :param lock_task_dto: DTO with data needed to lock the task
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """
        task = MappingService.get_task(lock_task_dto.task_id, lock_task_dto.project_id)

        if not task.is_mappable():
            raise MappingServiceError('Task in invalid state for mapping')

        user_can_map, error_reason = ProjectService.is_user_permitted_to_map(lock_task_dto.project_id,
                                                                              lock_task_dto.user_id)
        if not user_can_map:
            if error_reason == MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE:
                raise UserLicenseError('User must accept license to map this task')
            else:
                raise MappingServiceError(f'Mapping not allowed because: {error_reason.name}')

        task.lock_task_for_mapping(lock_task_dto.user_id)
        return task.as_dto()

    @staticmethod
    def unlock_task_after_mapping(mapped_task: MappedTaskDTO) -> TaskDTO:
        """ Unlocks the task and sets the task history appropriately """
        task = MappingService.get_task(mapped_task.task_id, mapped_task.project_id)
        current_state = TaskStatus(task.task_status)

        if current_state != TaskStatus.LOCKED_FOR_MAPPING:
            raise MappingServiceError('Status must be LOCKED_FOR_MAPPING to unlock')

        if task.locked_by != mapped_task.user_id:
            raise MappingServiceError('Attempting to unlock a task owned by another user')

        new_state = TaskStatus[mapped_task.status.upper()]

        if new_state not in [TaskStatus.MAPPED, TaskStatus.BADIMAGERY, TaskStatus.READY]:
            raise MappingServiceError('Can only set status to MAPPED, BADIMAGERY, READY after mapping')

        StatsService.update_stats_after_task_state_change(mapped_task.project_id, mapped_task.user_id, new_state,
                                                          mapped_task.task_id)
        task.unlock_task(mapped_task.user_id, new_state, mapped_task.comment)

        return task.as_dto()

    @staticmethod
    def generate_gpx(project_id: int, task_ids_str: str, timestamp=None):
        """ 
        Creates a GPX file for supplied tasks.  You can use the following URL to test locally:
        http://www.openstreetmap.org/edit?editor=id&#map=11/31.50362930069913/34.628906243797054&comment=CHANGSET_COMMENT&gpx=http://localhost:5000/api/v1/project/111/tasks_as_gpx%3Ftasks=2
        """
        if timestamp is None:
            timestamp = datetime.datetime.utcnow()

        root = ET.Element('gpx', attrib=dict(xmlns='http://topografix.com/GPX/1/1', version='1.1',
                                             creator='HOT Tasking Manager'))

        # Create GPX Metadata element
        metadata = ET.Element('metadata')
        link = ET.SubElement(metadata, 'link', attrib=dict(href='https://github.com/hotosm/tasking-manager'))
        ET.SubElement(link, 'text').text = 'HOT Tasking Manager'
        ET.SubElement(metadata, 'time').text = timestamp.isoformat()
        root.append(metadata)

        # Create trk element
        trk = ET.Element('trk')
        root.append(trk)
        ET.SubElement(trk, 'name').text = f'Task for project {project_id}. Do not edit outside of this box!'

        # Construct trkseg elements
        task_ids = map(int, task_ids_str.split(','))
        tasks = Task.get_tasks(project_id, task_ids)
        for task in tasks:
            task_geom = shape.to_shape(task.geometry)
            for poly in task_geom:
                trkseg = ET.SubElement(trk, 'trkseg')
                for point in poly.exterior.coords:
                    ET.SubElement(trkseg, 'trkpt', attrib=dict(lon=str(point[0]), lat=str(point[1])))

                    # Append wpt elements to end of doc
                    wpt = ET.Element('wpt', attrib=dict(lon=str(point[0]), lat=str(point[1])))
                    ET.SubElement(wpt, 'name').text = 'Do not edit outside of this box!'
                    root.append(wpt)

        xml_gpx = ET.tostring(root, encoding='utf8')
        return xml_gpx

    @staticmethod
    def generate_osm_xml():
        # TODO remove or productionise
        tree = ET.parse('osm_sample.xml')
        root = tree.getroot()
        return ET.tostring(root, encoding='utf8')
