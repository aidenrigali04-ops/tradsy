"""Add risk_disclaimer_accepted_at to user_profiles

Revision ID: 003
Revises: 002
Create Date: 2025-02-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("risk_disclaimer_accepted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_profiles", "risk_disclaimer_accepted_at")
