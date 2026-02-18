"""
Steven Dux strategy configs (JSON) for seeding.
"""
DUX_PARABOLIC_EXHAUSTION = """{
  "name": "Dux_Parabolic_Exhaustion_Intraday_v3",
  "personality_profile": {
    "risk_tolerance": "controlled_aggressive",
    "decision_speed": "fast_after_structure_confirmation",
    "holding_period": "intraday_primary",
    "psychological_edge": "statistical_pattern_recognition_over_narrative",
    "common_failure_mode": "anticipatory_short_before_lower_high"
  },
  "market_focus": {
    "asset_type": "small_cap_equities",
    "market_cap_preference": "30M_to_400M",
    "volatility_profile": "news_driven_low_float_expansion"
  },
  "strategy_type": "confirmed_parabolic_exhaustion_short",
  "entries": [
    {"indicator": "percent_gain_from_prior_close", "parameters": {"min_threshold_pct": 70}},
    {"indicator": "float_size_max", "parameters": {"max_float_millions": 40}},
    {"indicator": "volume_vs_float_ratio", "parameters": {"min_rotation_multiple": 1.5}},
    {"indicator": "percent_above_vwap", "parameters": {"min_pct": 20}},
    {"indicator": "atr_multiple_extension", "parameters": {"min_multiple": 3.0, "lookback_period": 14}}
  ],
  "confirmation_rules": [
    {"rule": "failed_breakout_within_n_bars", "parameters": {"bars": 3, "timeframe": "5min"}},
    {"rule": "first_lower_high_5min", "parameters": {}},
    {"rule": "upper_wick_ratio_threshold", "parameters": {"min_wick_to_body_ratio": 2.0}},
    {"rule": "volume_climax_bar", "parameters": {"min_multiple_vs_5bar_avg": 2.5}},
    {"rule": "declining_volume_on_bounce", "parameters": {"comparison_bars": 3}}
  ],
  "position_sizing": {
    "model": "edge_weighted_scaling",
    "base_risk_per_trade_pct": 1.0,
    "max_risk_per_trade_pct": 2.5,
    "volatility_adjustment": true,
    "liquidity_adjustment": true
  },
  "exits": [
    {
      "type": "partial_cover_pct",
      "parameters": {"cover_pct": 30, "trigger_rule": "fixed_pct_profit_target", "target_pct": 7}
    },
    {"type": "vwap_touch_exit", "parameters": {}},
    {"type": "structure_based_trailing", "parameters": {"reference_rule": "trail_above_last_lower_high", "timeframe": "5min"}}
  ],
  "risk_management": {
    "hard_stop_rule": "stop_above_parabolic_high",
    "max_adverse_excursion_pct": 15,
    "max_daily_loss_pct": 3,
    "max_trades_per_day": 3,
    "cooldown_after_loss_minutes": 30
  },
  "behavioral_modifiers": [
    {"rule": "no_entry_first_green_bar"},
    {"rule": "no_add_if_higher_highs_continue"},
    {"rule": "no_trade_if_spread_above_threshold", "parameters": {"max_spread_pct": 2}},
    {"rule": "no_trade_if_borrow_unavailable"}
  ],
  "backtest_assumptions": {
    "primary_timeframe": "5min",
    "intraday_execution_context": "L2_sensitive",
    "historical_conditions": "retail_speculative_cycles_2017_2021"
  }
}"""

DUX_MULTIDAY_PARABOLIC = """{
  "name": "Dux_MultiDay_Parabolic_Unwind_v3",
  "personality_profile": {
    "risk_tolerance": "moderate_high_conviction",
    "decision_speed": "patient_entry_aggressive_after_break",
    "holding_period": "1_to_3_days",
    "psychological_edge": "comfort_with_volatility_if_structure_valid",
    "common_failure_mode": "holding_during_gamma_squeeze"
  },
  "market_focus": {
    "asset_type": "microcap_low_float_equities",
    "market_cap_preference": "sub_300M",
    "volatility_profile": "multi_day_parabolic_extension"
  },
  "strategy_type": "daily_lower_high_short",
  "entries": [
    {"indicator": "two_day_percent_gain", "parameters": {"min_threshold_pct": 120}},
    {"indicator": "gap_up_pct", "parameters": {"min_gap_pct": 25}},
    {"indicator": "volume_vs_float_ratio", "parameters": {"min_rotation_multiple": 2.0}}
  ],
  "confirmation_rules": [
    {"rule": "daily_lower_high", "parameters": {}},
    {"rule": "break_of_morning_support", "parameters": {"time_window_minutes": 90}},
    {"rule": "close_below_previous_day_midpoint", "parameters": {}}
  ],
  "position_sizing": {
    "model": "progressive_scale_after_structure_break",
    "base_risk_per_trade_pct": 1.5,
    "max_risk_per_trade_pct": 3.0,
    "volatility_adjustment": true
  },
  "exits": [
    {"type": "retrace_of_total_move_pct", "parameters": {"target_pct": 50}},
    {"type": "cover_near_prior_breakout_base", "parameters": {}}
  ],
  "risk_management": {
    "hard_stop_rule": "stop_at_new_intraday_high",
    "max_adverse_excursion_pct": 20,
    "max_daily_loss_pct": 3,
    "max_trades_per_day": 2
  },
  "behavioral_modifiers": [
    {"rule": "hold_core_if_daily_structure_intact"},
    {"rule": "reduce_position_if_news_changes_fundamental_bias"}
  ],
  "backtest_assumptions": {
    "primary_timeframe": "daily_plus_5min_execution",
    "historical_conditions": "high_retail_participation_cycles"
  }
}"""
