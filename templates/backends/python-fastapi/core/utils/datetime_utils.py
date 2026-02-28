from datetime import datetime, timezone


def utc_now() -> datetime:
    """Get current UTC time with timezone info."""
    return datetime.now(timezone.utc)


def utc_now_naive() -> datetime:
    """Get current UTC time as naive datetime (for DB columns without tz)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
