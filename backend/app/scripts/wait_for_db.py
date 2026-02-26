import asyncio
import logging

from sqlalchemy import text

from app.db.session import engine

logger = logging.getLogger("octopis.wait_for_db")


async def wait_for_db(retries: int = 30, delay_seconds: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
            logger.info("Database is ready on attempt %s.", attempt)
            return
        except Exception as exc:
            logger.warning("Database not ready (attempt %s/%s): %s", attempt, retries, exc)
            await asyncio.sleep(delay_seconds)
    raise RuntimeError("Database is not reachable after multiple attempts.")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    asyncio.run(wait_for_db())


if __name__ == "__main__":
    main()
