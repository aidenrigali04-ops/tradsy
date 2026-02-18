"""Seed gurus and strategies from UI spec

Revision ID: 002
Revises: 001
Create Date: 2025-01-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

GURUS = [
    ("Steven Dux", "steven-dux", "Day Trader, Gap-Up Shorting"),
    ("TJR Trades", "tjr-trades", "Day Trader, Momentum Scalping"),
    ("Tim Sykes", "tim-sykes", "Day Trader, Morning Panic Shorts"),
    ("Ross Cameron", "ross-cameron", "Day Trader, Momentum Longs"),
    ("Tim Grittani", "tim-grittani", "Swing / Day Trader, Parabolic Shorts"),
    ("Mike Bellafiore", "mike-bellafiore", "Professional Day Trader, Playbooks"),
    ("Kris Verma", "kris-verma", "Options / Day Trader, News Volatility"),
    ("Lance Breitstein", "lance-breitstein", "Day Trader, VWAP Reversion"),
]


def upgrade() -> None:
    conn = op.get_bind()
    gurus = table(
        "gurus",
        column("name", sa.String),
        column("slug", sa.String),
        column("description", sa.String),
    )
    for name, slug, desc in GURUS:
        conn.execute(gurus.insert().values(name=name, slug=slug, description=desc))
    strat = table(
        "strategies",
        column("guru_id", sa.Integer),
        column("name", sa.String),
        column("strategy_type", sa.String),
    )
    for i, (name, _, desc) in enumerate(GURUS, start=1):
        conn.execute(strat.insert().values(guru_id=i, name=name, strategy_type=desc))


def downgrade() -> None:
    op.execute("DELETE FROM strategies")
    op.execute("DELETE FROM gurus")
