from server import db
from server.models.dtos.message_dto import MessageDTO
from server.models.postgis.user import User
from server.models.postgis.utils import timestamp


class Message(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String)
    subject = db.Column(db.String)
    from_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'))
    to_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), index=True)
    date = db.Column(db.DateTime, default=timestamp)
    read = db.Column(db.Boolean, default=False)

    # Relationships
    from_user = db.relationship(User, foreign_keys=[from_user_id])
    to_user = db.relationship(User, foreign_keys=[to_user_id], backref='messages')

    @classmethod
    def from_dto(cls, to_user_id: int, dto: MessageDTO):
        message = cls()
        message.subject = dto.subject
        message.message = dto.message
        message.from_user_id = dto.from_user
        message.to_user_id = to_user_id

        return message

    @staticmethod
    def send_message_to_all_contributors(project_id: int, message_dto: MessageDTO):
        """ Sends a message to all contributors """
        query = '''SELECT mapped_by as contributors from tasks where project_id = {0} and  mapped_by is not null
                   UNION
                   SELECT validated_by from tasks where tasks.project_id = {0} and validated_by is not null'''.format(project_id)

        contributors = db.engine.execute(query)

        for contributor in contributors:
            message = Message.from_dto(contributor[0], message_dto)
            db.session.add(message)

        db.session.commit()
