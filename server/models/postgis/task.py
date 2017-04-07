import datetime
import geojson
from enum import Enum
from geoalchemy2 import Geometry
from server import db
from server.models.dtos.mapping_dto import TaskDTO, TaskHistoryDTO
from server.models.postgis.statuses import TaskStatus
from server.models.postgis.user import User
from server.models.postgis.utils import InvalidData, InvalidGeoJson, ST_GeomFromGeoJSON, ST_SetSRID, timestamp


class TaskAction(Enum):
    """ Describes the possible actions that can happen to to a task, that we'll record history for """
    LOCKED_FOR_MAPPING = 1
    LOCKED_FOR_VALIDATION = 2
    STATE_CHANGE = 3
    COMMENT = 4


class TaskHistory(db.Model):
    """ Describes the history associated with a task """
    __tablename__ = "task_history"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True)
    task_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String, nullable=False)
    action_text = db.Column(db.String)
    action_date = db.Column(db.DateTime, nullable=False, default=timestamp)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users'), nullable=False)

    actioned_by = db.relationship(User)

    __table_args__ = (db.ForeignKeyConstraint([task_id, project_id], ['tasks.id', 'tasks.project_id'], name='fk_tasks'),
                      db.Index('idx_task_history_composite', 'task_id', 'project_id'), {})

    def __init__(self, task_id, project_id, user_id):
        self.task_id = task_id
        self.project_id = project_id
        self.user_id = user_id

    def set_task_locked_action(self, task_action: TaskAction):
        if task_action not in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            raise ValueError('Invalid Action')

        self.action = task_action.name

    def set_comment_action(self, comment):
        self.action = TaskAction.COMMENT.name
        self.action_text = comment

    def set_state_change_action(self, new_state):
        self.action = TaskAction.STATE_CHANGE.name
        self.action_text = new_state.name

    @staticmethod
    def update_task_locked_with_duration(task_id, project_id, lock_action):
        """
        Calculates the duration a task was locked for and sets it on the history record
        :param task_id: Task in scope
        :param project_id: Project ID in scope
        :param lock_action: The lock action, either Mapping or Validation
        :return:
        """
        last_locked = TaskHistory.query.filter_by(task_id=task_id, project_id=project_id, action=lock_action.name,
                                                  action_text=None).one()

        duration_task_locked = datetime.datetime.utcnow() - last_locked.action_date
        # Cast duration to isoformat for later transmission via api
        last_locked.action_text = (datetime.datetime.min + duration_task_locked).time().isoformat()
        db.session.commit()




class Task(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "tasks"

    # Table has composite PK on (id and project_id)
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, primary_key=True)
    x = db.Column(db.Integer, nullable=False)
    y = db.Column(db.Integer, nullable=False)
    zoom = db.Column(db.Integer, nullable=False)
    geometry = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    task_status = db.Column(db.Integer, default=TaskStatus.READY.value)
    locked_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_locked'))
    mapped_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_mapper'))
    validated_by = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users_validator'))

    # Mapped objects
    task_history = db.relationship(TaskHistory, cascade="all")
    lock_holder = db.relationship(User, foreign_keys=[locked_by])

    @classmethod
    def from_geojson_feature(cls, task_id, task_feature):
        """
        Constructs and validates a task from a GeoJson feature object
        :param task_id: Unique ID for the task
        :param task_feature: A geoJSON feature object
        :raises InvalidGeoJson, InvalidData
        """
        if type(task_feature) is not geojson.Feature:
            raise InvalidGeoJson('Task: Invalid GeoJson should be a feature')

        task_geometry = task_feature.geometry

        if type(task_geometry) is not geojson.MultiPolygon:
            raise InvalidGeoJson('Task: Geometry must be a MultiPolygon')

        is_valid_geojson = geojson.is_valid(task_geometry)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Task: Invalid MultiPolygon - {is_valid_geojson['message']}")

        task = cls()
        try:
            task.x = task_feature.properties['x']
            task.y = task_feature.properties['y']
            task.zoom = task_feature.properties['zoom']
        except KeyError as e:
            raise InvalidData(f'Task: Expected property not found: {str(e)}')

        task.id = task_id
        task_geojson = geojson.dumps(task_geometry)
        task.geometry = ST_SetSRID(ST_GeomFromGeoJSON(task_geojson), 4326)

        return task

    @staticmethod
    def get(task_id, project_id):
        """
        Gets specified task
        :param task_id: task ID in scope
        :param project_id: project ID in scope
        :return: Task if found otherwise None
        """
        return Task.query.filter_by(id=task_id, project_id=project_id).one_or_none()

    def is_mappable(self):
        """ Determines if task in scope is in suitable state for mapping """
        if TaskStatus(self.task_status) not in [TaskStatus.READY, TaskStatus.INVALIDATED, TaskStatus.BADIMAGERY]:
            return False

        return True

    def set_task_history(self, action, user_id, comment=None, new_state=None):
        """
        Sets the task history for the action that the user has just performed
        :param task: Task in scope
        :param user_id: ID of user performing the action
        :param action: Action the user has performed
        :param comment: Comment user has added
        :param new_state: New state of the task
        """
        history = TaskHistory(self.id, self.project_id, user_id)

        if action in [TaskAction.LOCKED_FOR_MAPPING, TaskAction.LOCKED_FOR_VALIDATION]:
            history.set_task_locked_action(action)
        elif action == TaskAction.COMMENT:
            history.set_comment_action(comment)
        elif action == TaskAction.STATE_CHANGE:
            history.set_state_change_action(new_state)

        self.task_history.append(history)

    def update(self):
        """ Updates the DB with the current state of the Task """
        db.session.commit()

    def lock_task_for_mapping(self, user_id: int):
        self.set_task_history(TaskAction.LOCKED_FOR_MAPPING, user_id)
        self.task_status = TaskStatus.LOCKED_FOR_MAPPING.value
        self.locked_by = user_id
        self.update()

    def lock_task_for_validating(self, user_id: int):
        self.set_task_history(TaskAction.LOCKED_FOR_VALIDATION, user_id)
        self.task_status = TaskStatus.LOCKED_FOR_VALIDATION.value
        self.locked_by = user_id
        self.update()

    def unlock_task(self, user_id, new_state=None, comment=None):
        """ Unlock task and ensure duration task locked is saved in History """
        if comment:
            # TODO need to clean comment to avoid injection attacks, maybe just raise error if html detected
            self.set_task_history(action=TaskAction.COMMENT, comment=comment, user_id=user_id)

        self.set_task_history(action=TaskAction.STATE_CHANGE, new_state=new_state, user_id=user_id)

        if new_state == TaskStatus.MAPPED and TaskStatus(self.task_status) != TaskStatus.LOCKED_FOR_VALIDATION:
            # Don't set mapped if state being set back to mapped after validation
            # TODO +1 user count
            self.mapped_by = user_id
        elif new_state == TaskStatus.VALIDATED:
            # TODO +1 user count
            self.validated_by = user_id
        elif new_state == TaskStatus.INVALIDATED:
            # TODO +1 user count
            pass

        # Using a slightly evil side effect of Actions and Statuses having the same name here :)
        TaskHistory.update_task_locked_with_duration(self.id, self.project_id, TaskStatus(self.task_status))

        self.task_status = new_state.value
        self.locked_by = None
        self.update()

    @staticmethod
    def get_tasks_as_geojson_feature_collection(project_id):
        """
        Creates a geoJson.FeatureCollection object for all tasks related to the supplied project ID
        :param project_id: Owning project ID
        :return: geojson.FeatureCollection
        """
        project_tasks = \
            db.session.query(Task.id, Task.x, Task.y, Task.zoom, Task.task_status,
                             Task.geometry.ST_AsGeoJSON().label('geojson')).filter(Task.project_id == project_id).all()

        tasks_features = []
        for task in project_tasks:
            task_geometry = geojson.loads(task.geojson)
            task_properties = dict(taskId=task.id, taskX=task.x, taskY=task.y, taskZoom=task.zoom,
                                   taskStatus=TaskStatus(task.task_status).name)
            feature = geojson.Feature(geometry=task_geometry, properties=task_properties)
            tasks_features.append(feature)

        return geojson.FeatureCollection(tasks_features)

    def as_dto(self):
        """
        Creates a Task DTO suitable for transmitting via the API
        :param task_id: Task ID in scope
        :param project_id: Project ID in scope
        :return: JSON serializable Task DTO
        """
        task_history = []
        for action in self.task_history:
            if action.action_text is None:
                continue  # Don't return any history without action text

            history = TaskHistoryDTO()
            history.action = action.action
            history.action_text = action.action_text
            history.action_date = action.action_date
            history.action_by = action.actioned_by.username if action.actioned_by else None

            task_history.append(history)

        task_dto = TaskDTO()
        task_dto.task_id = self.id
        task_dto.project_id = self.project_id
        task_dto.task_status = TaskStatus(self.task_status).name
        task_dto.lock_holder = self.lock_holder.username if self.lock_holder else None
        task_dto.task_history = task_history

        return task_dto
