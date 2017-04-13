"""empty message

Revision ID: ebf96967ccb9
Revises: a572dc09c774
Create Date: 2017-04-13 14:39:51.937617

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ebf96967ccb9'
down_revision = 'a572dc09c774'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('projects', sa.Column('mapping_types', sa.ARRAY(sa.Integer()), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('projects', 'mapping_types')
    # ### end Alembic commands ###
