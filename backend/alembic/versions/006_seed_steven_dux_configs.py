"""Seed Steven Dux strategy configs (Dux_Parabolic_Exhaustion, Dux_MultiDay_Parabolic_Unwind)

Revision ID: 006
Revises: 005
Create Date: 2025-02-17

"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import text

from app.strategies.steven_dux_configs import DUX_PARABOLIC_EXHAUSTION, DUX_MULTIDAY_PARABOLIC

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Update strategy 1 (Steven Dux) with first config
    conn.execute(
        text("UPDATE strategies SET name = :name, strategy_type = :stype, code_or_config = :config WHERE id = 1"),
        {"name": "Dux Parabolic Exhaustion Intraday", "stype": "confirmed_parabolic_exhaustion_short", "config": DUX_PARABOLIC_EXHAUSTION}
    )
    # Insert second Steven Dux strategy (guru_id=1)
    conn.execute(
        text("""
            INSERT INTO strategies (guru_id, name, strategy_type, code_or_config, created_at, updated_at)
            VALUES (1, 'Dux MultiDay Parabolic Unwind', 'daily_lower_high_short', :config, NOW(), NOW())
        """),
        {"config": DUX_MULTIDAY_PARABOLIC}
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("DELETE FROM strategies WHERE guru_id = 1 AND name = 'Dux MultiDay Parabolic Unwind'"))
    conn.execute(
        text("UPDATE strategies SET name = 'Steven Dux', strategy_type = 'Day Trader, Gap-Up Shorting', code_or_config = NULL WHERE id = 1")
    )
