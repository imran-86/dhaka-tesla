#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx prisma7 migrate deploy

echo "[entrypoint] Starting API..."
exec "$@"