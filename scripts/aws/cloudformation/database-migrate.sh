#!/usr/bin/env bash
set -e

BASE_DIR=/tasking-manager
POSTGRES_DB=${POSTGRES_DB:-tm}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-blahblah123}
POSTGRES_USER=${POSTGRES_USER:-taskingmanager}
POSTGRES_ENDPOINT=${POSTGRES_ENDPOINT:-localhost}

cd ${BASE_DIR}
${BASE_DIR:-/tasking-manager}/venv/bin/python3.6 manage.py db upgrade
