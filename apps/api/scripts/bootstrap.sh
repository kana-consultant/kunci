#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Use a simple loop to wait for postgres
until nc -z postgres 7432; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is up! Running migrations..."
cd apps/api
pnpm db:migrate

echo "🌱 Running seed (it will skip if admin already exists)..."
pnpm db:seed

echo "🚀 Starting application..."
node dist/main.js
