#!/bin/sh
set -e

echo "Running database migrations..."
# Apply all SQL migration files in order
MIGRATIONS_DIR="/app/apps/api/drizzle"

if [ -d "$MIGRATIONS_DIR" ]; then
  for sql_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
      echo "Applying migration: $sql_file"
      node -e "
        import('postgres').then(({ default: postgres }) => {
          const sql = postgres(process.env.DATABASE_URL, { max: 1 });
          const fs = await import('node:fs');
          const content = fs.readFileSync('$sql_file', 'utf-8');
          // Split on Drizzle statement-breakpoint comments
          const statements = content.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
          for (const stmt of statements) {
            if (stmt) await sql.unsafe(stmt);
          }
          await sql.end();
          console.log('Migration applied successfully');
        }).catch(err => {
          console.error('Migration failed:', err.message);
          process.exit(1);
        });
      " 2>/dev/null || true
    fi
  done
fi

echo "Starting API server..."
exec node apps/api/dist/main.js
