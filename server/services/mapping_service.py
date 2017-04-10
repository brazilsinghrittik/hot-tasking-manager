import xml.etree.ElementTree as ET
from flask import current_app
from geoalchemy2 import shape
from server.models.dtos.mapping_dto import TaskDTO, MappedTaskDTO, LockTaskDTO
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.utils import NotFound
from server.services.project_service import ProjectService


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

        user_can_map, error_message = ProjectService.is_user_permitted_to_map(lock_task_dto.project_id,
                                                                              lock_task_dto.user_id)
        if not user_can_map:
            raise MappingServiceError(error_message)

        task.lock_task_for_mapping(lock_task_dto.user_id)
        return task.as_dto()

    @staticmethod
    def unlock_task_after_mapping(mapped_task: MappedTaskDTO) -> TaskDTO:
        """ Unlocks the task and sets the task history appropriately """
        task = MappingService.get_task(mapped_task.task_id, mapped_task.project_id)

        if TaskStatus(task.task_status) != TaskStatus.LOCKED_FOR_MAPPING:
            raise MappingServiceError('Status must be LOCKED_FOR_MAPPING to unlock')

        if task.locked_by != mapped_task.user_id:
            raise MappingServiceError('Attempting to unlock a task owned by another user')

        new_state = TaskStatus[mapped_task.status.upper()]

        if new_state not in [TaskStatus.MAPPED, TaskStatus.BADIMAGERY, TaskStatus.READY]:
            raise MappingServiceError('Can only set status to MAPPED, BADIMAGERY, READY after mapping')

        task.unlock_task(mapped_task.user_id, new_state, mapped_task.comment)
        return task.as_dto()

    @staticmethod
    def generate_gpx(project_id, task_ids):

        # TODO handle multiple tasks
        task_id = task_ids.split(',', 1)[0]

        task = MappingService.get_task(task_id, project_id)
        task_geom = shape.to_shape(task.geometry)

        root = ET.Element('gpx', attrib=dict(xmlns='http://topografix.com/GPX/1/1', version='1.1',
                                             creator='HOT Tasking Manager'))

        # Create GPX Metadata element
        metadata = ET.Element('metadata')
        link = ET.SubElement(metadata, 'link', attrib=dict(href='https://github.com/hotosm/tasking-manager'))
        ET.SubElement(link, 'text').text = 'HOT Tasking Manager'
        root.append(metadata)

        # Create trk element
        trk = ET.Element('trk')
        root.append(trk)

        ET.SubElement(trk, 'name').text = f'Task for project {task.project_id}. Do not edit outside of this box!'
        trkseg = ET.SubElement(trk, 'trkseg')

        for poly in task_geom:
            for point in poly.exterior.coords:
                ET.SubElement(trkseg, 'trkpt', attrib=dict(lon=str(point[0]), lat=str(point[1])))

                # Append wpt elements to end of doc
                wpt = ET.Element('wpt', attrib=dict(lon=str(point[0]), lat=str(point[1])))
                ET.SubElement(wpt, 'name').text = 'Do not edit outside of this box!'
                root.append(wpt)

        xml_gpx = ET.tostring(root, encoding='utf8', method='xml')
        return xml_gpx
