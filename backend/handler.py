"""AWS Lambda entrypoint — API Gateway HTTP API + Mangum."""

from mangum import Mangum

from services.config import bootstrap

bootstrap()

from server import app  # noqa: E402

handler = Mangum(app, lifespan="off")