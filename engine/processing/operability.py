"""Sea-state operability: days per year a vessel type can sail a route."""

from engine.constants import DAYS_IN_MONTH, WAVE_THRESHOLDS_M
from engine.data.models import WaveMonth


def _pct_days_above(month: WaveMonth, hs_limit_m: float) -> float:
    """Percent of days in the month with Hs above the limit.

    Linear interpolation between the tabulated thresholds, clamped at both ends.
    """
    xs = WAVE_THRESHOLDS_M
    ys = (
        month.pct_days_hs_above_1_0,
        month.pct_days_hs_above_1_5,
        month.pct_days_hs_above_2_0,
    )
    if hs_limit_m <= xs[0]:
        return ys[0]
    if hs_limit_m >= xs[-1]:
        return ys[-1]
    for i in range(len(xs) - 1):
        if xs[i] <= hs_limit_m <= xs[i + 1]:
            t = (hs_limit_m - xs[i]) / (xs[i + 1] - xs[i])
            return ys[i] + t * (ys[i + 1] - ys[i])
    return ys[-1]


def operable_days(wave_months: list[WaveMonth], hs_max_m: float) -> float:
    """Days per year where route wave height is at or below the vessel limit."""
    days = 0.0
    for month in wave_months:
        share_above = _pct_days_above(month, hs_max_m) / 100.0
        days += DAYS_IN_MONTH[month.month - 1] * (1.0 - share_above)
    return days
