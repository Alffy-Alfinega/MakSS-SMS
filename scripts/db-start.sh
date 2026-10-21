#!/usr/bin/env bash
# Starts the local development PostgreSQL cluster.
#
# The cluster lives in ~/.local/pgdata (outside the repo, so a fresh clone
# does not lose it). Creates the role and database on first run.
#
# The system PostgreSQL service cannot be started without root, so this runs
# a user-owned cluster instead. Same PostgreSQL 18, same wire protocol.

set -euo pipefail

PGBIN="/usr/lib/postgresql/18/bin"
PGDATA="${PGDATA:-$HOME/.local/pgdata}"
PGPORT="${PGPORT:-5432}"
PGHOST="${PGHOST:-127.0.0.1}"
DB_USER="${DB_USER:-makss}"
DB_PASS="${DB_PASS:-makss_local_dev}"
DB_NAME="${DB_NAME:-makss_sms}"

if [ ! -d "$PGDATA" ]; then
  echo "→ Initialising a new cluster at $PGDATA"
  mkdir -p "$PGDATA"
  "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust >/dev/null
fi

if ! "$PGBIN/pg_isready" -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; then
  echo "→ Starting PostgreSQL on port $PGPORT"
  "$PGBIN/pg_ctl" -D "$PGDATA" -l "$PGDATA/server.log" \
    -o "-p $PGPORT -k /tmp" start
  sleep 2
fi

# Create the role and database if they are missing.
if ! "$PGBIN/psql" -h "$PGHOST" -p "$PGPORT" -U postgres -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  echo "→ Creating role $DB_USER"
  "$PGBIN/psql" -h "$PGHOST" -p "$PGPORT" -U postgres -c \
    "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' CREATEDB;" >/dev/null
fi

if ! "$PGBIN/psql" -h "$PGHOST" -p "$PGPORT" -U postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  echo "→ Creating database $DB_NAME"
  "$PGBIN/psql" -h "$PGHOST" -p "$PGPORT" -U postgres -c \
    "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null
fi

echo "✔ PostgreSQL ready: postgresql://$DB_USER@$PGHOST:$PGPORT/$DB_NAME"
