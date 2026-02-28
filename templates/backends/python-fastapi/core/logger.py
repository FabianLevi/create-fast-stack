import sys
import time
from contextlib import contextmanager

from loguru import logger


def setup_logger(log_level: str = "INFO"):
    """Configure loguru with console handler."""
    logger.remove()

    logger.add(
        sys.stderr,
        level=log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}:{function}:{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    return logger


@contextmanager
def log_time(task_name: str, level: str = "INFO"):
    """Context manager to log execution time of a code block."""
    start_time = time.time()
    logger.log(level, f"Starting {task_name}...")
    try:
        yield
    finally:
        elapsed = time.time() - start_time
        logger.log(level, f"Completed {task_name} in {elapsed:.2f} seconds")


logger = setup_logger()  # noqa: F811
