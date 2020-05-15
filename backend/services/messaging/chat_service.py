from flask import current_app
from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO
from backend.models.postgis.project_chat import ProjectChat
from backend.services.messaging.message_service import MessageService
from backend.services.project_service import ProjectService
from backend.services.project_admin_service import ProjectAdminService
from backend.services.team_service import TeamService
from backend.services.users.user_service import UserService
from backend.models.postgis.statuses import TeamRoles
from backend import db


class ChatService:
    @staticmethod
    def post_message(
        chat_dto: ChatMessageDTO, project_id: int, authenticated_user_id: int
    ) -> ProjectChatDTO:
        """ Save message to DB and return latest chat"""
        current_app.logger.debug("Posting Chat Message")

        if UserService.is_user_blocked(authenticated_user_id):
            return ValueError("User is on read only mode")

        project = ProjectService.get_project_by_id(project_id)
        is_allowed_user = True

        if project.private:
            is_allowed_user = False
            is_manager_permission = ProjectAdminService.is_user_action_permitted_on_project(
                authenticated_user_id, project_id
            )
            if not is_manager_permission:
                allowed_roles = [
                    TeamRoles.PROJECT_MANAGER.value,
                    TeamRoles.VALIDATOR.value,
                    TeamRoles.MAPPER.value,
                ]
                is_team_member = TeamService.check_team_membership(
                    project_id, allowed_roles, authenticated_user_id
                )
                if not is_team_member:
                    is_allowed_user = (
                        len(
                            [
                                user
                                for user in project.allowed_users
                                if user.id == authenticated_user_id
                            ]
                        )
                        > 0
                    )

        if is_manager_permission or is_team_member or is_allowed_user:
            chat_message = ProjectChat.create_from_dto(chat_dto)
            MessageService.send_message_after_chat(
                chat_dto.user_id, chat_message.message, chat_dto.project_id
            )
            db.session.commit()
            # Ensure we return latest messages after post
            return ProjectChat.get_messages(chat_dto.project_id, 1)
        else:
            raise ValueError("User not permitted to post Comment")

    @staticmethod
    def get_messages(project_id: int, page: int, per_page: int) -> ProjectChatDTO:
        """ Get all messages attached to a project """
        return ProjectChat.get_messages(project_id, page, per_page)
