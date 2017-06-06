from flask_restful import Resource, request, current_app
from schematics.exceptions import DataError

from server.models.dtos.message_dto import ChatMessageDTO
from server.services.messaging.chat_service import ChatService
from server.services.users.authentication_service import token_auth, tm


class ProjectChatAPI(Resource):

    @tm.pm_only(False)
    @token_auth.login_required
    def put(self, project_id):
        """
        Add a message to project chat
        ---
        tags:
          - messages
        produces:
          - application/json
        parameters:
            - in: header
              name: Authorization
              description: Base64 encoded session token
              required: true
              type: string
              default: Token sessionTokenHere==
            - name: project_id
              in: path
              description: The ID of the project to attach the chat message to
              required: true
              type: integer
              default: 1
            - in: body
              name: body
              required: true
              description: JSON object for creating a new mapping license
              schema:
                  properties:
                      message:
                          type: string
                          default: This is an awesome project
        responses:
            201:
                description: Message posted successfully
            400:
                description: Invalid Request
            500:
                description: Internal Server Error
        """
        try:
            chat_dto = ChatMessageDTO(request.get_json())
            chat_dto.user_id = tm.authenticated_user_id
            chat_dto.project_id = project_id
            chat_dto.validate()
        except DataError as e:
            current_app.logger.error(f'Error validating request: {str(e)}')
            return str(e), 400

        try:
            ChatService.post_message(chat_dto)
            return {"Status": "Message posted successfully"}, 201
        except Exception as e:
            error_msg = f'Chat PUT - unhandled error: {str(e)}'
            current_app.logger.critical(error_msg)
            return {"error": error_msg}, 500
