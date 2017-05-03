from server import db
from server.models.dtos.message_dto import MessageDTO, MessagesDTO
from server.models.postgis.user import User
from server.models.postgis.utils import timestamp
from server.models.postgis.utils import NotFound


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
        """ Creates new message from DTO """
        message = cls()
        message.subject = dto.subject
        message.message = dto.message
        message.from_user_id = dto.from_user_id
        message.to_user_id = to_user_id

        return message

    def as_dto(self) -> MessageDTO:
        """ Casts message object to DTO """
        dto = MessageDTO()
        dto.message_id = self.id
        dto.message = self.message
        dto.from_username = self.from_user.username
        dto.sent_date = self.date
        dto.read = self.read
        dto.subject = self.subject

        return dto

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

    @staticmethod
    def get_unread_message_count(user_id: int):
        """ Get count of unread messages for user """
        return Message.query.filter(Message.to_user_id == user_id, Message.read == False).count()

    @staticmethod
    def get_all_messages(user_id: int) -> MessagesDTO:
        """ Gets all messages to the user """
        user_messages = Message.query.filter(Message.to_user_id == user_id).all()

        if len(user_messages) == 0:
            raise NotFound()

        messages_dto = MessagesDTO()
        for message in user_messages:
            dto = MessageDTO()
            dto.message_id = message.id
            dto.subject = message.subject
            dto.sent_date = message.date
            dto.read = message.read
            dto.from_username = message.from_user.username

            messages_dto.user_messages.append(dto)

        return messages_dto

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()
