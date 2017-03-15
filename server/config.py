import logging
import os
from server.models.utils import DateTimeEncoder


class EnvironmentConfig:
    """
    Base class for config that is shared between environments
    """
    LOG_LEVEL = logging.ERROR
    RESTFUL_JSON = {'cls': DateTimeEncoder}
    SQLALCHEMY_DATABASE_URI = os.getenv('TASKING_MANAGER_DB', None)


class StagingConfig(EnvironmentConfig):
    API_DOCS_URL = 'http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/api-docs/swagger-ui/index.html?' + \
        'url=http://tasking-manager-staging.eu-west-1.elasticbeanstalk.com/api/docs'
    LOG_DIR = '/var/log/tasking-manager-logs'
    LOG_LEVEL = logging.DEBUG


class DevConfig(EnvironmentConfig):
    API_DOCS_URL = 'http://localhost:5000/api-docs/swagger-ui/index.html?url=http://localhost:5000/api/docs'
    LOG_DIR = 'logs'
    LOG_LEVEL = logging.DEBUG
