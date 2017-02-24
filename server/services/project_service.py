from flask import current_app
from server.models.project import AreaOfInterest, Project


class ProjectService:

    def create_draft_project(self, data):

        current_app.logger.debug('Create draft project')

        area_of_interest = AreaOfInterest(data['area_of_interest'])
        project = Project(data, area_of_interest=area_of_interest)
        project.save()
