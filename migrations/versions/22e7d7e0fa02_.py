"""empty message

Revision ID: 22e7d7e0fa02
Revises: b25f088d40c2
Create Date: 2018-08-06 15:31:03.973448

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "22e7d7e0fa02"
down_revision = "b25f088d40c2"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    categories_table = op.create_table(
        "mapping_issue_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "task_mapping_issues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("mapping_issue_category_id", sa.Integer(), nullable=False),
        sa.Column("task_history_id", sa.Integer(), nullable=False),
        sa.Column("issue", sa.String(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["task_history_id"], ["task_history.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_task_mapping_issues_task_history_id"),
        "task_mapping_issues",
        ["task_history_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_issue_category",
        "task_mapping_issues",
        "mapping_issue_categories",
        ["mapping_issue_category_id"],
        ["id"],
    )

    # Setup some initial issue categories
    initial_categories = [
        {"id": 1, "name": "Missed Feature(s)"},
        {"id": 2, "name": "Feature Geometry"},
    ]

    for category in initial_categories:
        op.execute(categories_table.insert().values(name=category["name"]))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint("fk_issue_category", "task_mapping_issues", type_="foreignkey")
    op.drop_index(
        op.f("ix_task_mapping_issues_task_history_id"), table_name="task_mapping_issues"
    )
    op.drop_table("task_mapping_issues")
    op.drop_table("mapping_issue_categories")
    # ### end Alembic commands ###
