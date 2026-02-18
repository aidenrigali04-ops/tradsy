"""Initial schema: users, gurus, strategies, user_profiles

Revision ID: 001
Revises:
Create Date: 2025-01-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    risk_tolerance_enum = sa.Enum("LOW", "MEDIUM", "HIGH", name="risktolerance")
    experience_level_enum = sa.Enum("BEGINNER", "INTERMEDIATE", "ADVANCED", name="experiencelevel")
    risk_tolerance_enum.create(op.get_bind(), checkfirst=True)
    experience_level_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("phone_verified", sa.Boolean(), default=False),
        sa.Column("email_verified", sa.Boolean(), default=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("tradingview_id", sa.String(255), nullable=True),
        sa.Column("apple_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)
    op.create_index("ix_users_tradingview_id", "users", ["tradingview_id"], unique=True)
    op.create_index("ix_users_apple_id", "users", ["apple_id"], unique=True)

    op.create_table(
        "gurus",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gurus_slug", "gurus", ["slug"], unique=True)

    op.create_table(
        "strategies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("guru_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("strategy_type", sa.String(100), nullable=True),
        sa.Column("code_or_config", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["guru_id"], ["gurus.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("risk_tolerance", risk_tolerance_enum, nullable=True),
        sa.Column("experience_level", experience_level_enum, nullable=True),
        sa.Column("onboarding_completed", sa.Boolean(), default=False),
        sa.Column("custom_strategy_description", sa.Text(), nullable=True),
        sa.Column("selected_guru_id", sa.Integer(), nullable=True),
        sa.Column("selected_strategy_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["selected_guru_id"], ["gurus.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["selected_strategy_id"], ["strategies.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_profiles_user_id", "user_profiles")
    op.drop_table("user_profiles")
    op.drop_table("strategies")
    op.drop_index("ix_gurus_slug", "gurus")
    op.drop_table("gurus")
    op.drop_index("ix_users_email", "users")
    op.drop_index("ix_users_google_id", "users")
    op.drop_index("ix_users_tradingview_id", "users")
    op.drop_index("ix_users_apple_id", "users")
    op.drop_table("users")
    sa.Enum(name="experiencelevel").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="risktolerance").drop(op.get_bind(), checkfirst=True)
