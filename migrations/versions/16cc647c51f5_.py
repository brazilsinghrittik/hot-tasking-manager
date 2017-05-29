"""empty message

Revision ID: 16cc647c51f5
Revises: ee5315dcf3e1
Create Date: 2017-05-29 09:34:00.301964

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '16cc647c51f5'
down_revision = 'ee5315dcf3e1'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('textsearch_idx', table_name='project_info')
    op.add_column('projects', sa.Column('centroid', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=True))
    op.add_column('projects', sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('projects', 'geometry')
    op.drop_column('projects', 'centroid')
    op.create_index('textsearch_idx', 'project_info', ['text_searchable'], unique=False)
    # ### end Alembic commands ###
