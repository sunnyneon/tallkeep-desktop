#!/bin/sh
# Tallkeep in Docker: get the books folder ready, pick up a newer Tallkeep if there is one, then
# start Tallkeep (database, web server and app) as the "postgres" user.
set -e
DATA="${TALLKEEP_DATA:-/data}"
BACKUPS="${TALLKEEP_BACKUPS:-/backups}"
mkdir -p "$DATA" "$BACKUPS"
# The database must belong to the postgres user (a folder made on the host belongs to root).
for d in "$DATA" "$BACKUPS"; do
  [ "$(stat -c %U "$d")" = postgres ] || chown -R postgres:postgres "$d"
done
chmod 700 "$DATA"

SERVER=/opt/tallkeep/server
HAVE="$(cat "$SERVER/version.txt")"
if [ "${TALLKEEP_AUTO_UPDATE:-1}" = "1" ]; then
  NEW="$(gosu postgres node /opt/tallkeep/get-server.mjs "$DATA/.server" --have "$HAVE" || true)"
  if [ -n "$NEW" ] && [ -f "$NEW/server.bundle.mjs" ]; then SERVER="$NEW"; fi
fi

export TALLKEEP_DATA="$DATA" TALLKEEP_BACKUPS="$BACKUPS" TALLKEEP_APP="$SERVER/app"
export TALLKEEP_VERSION="$(cat "$SERVER/version.txt")" TALLKEEP_EDITION=docker
echo "Starting Tallkeep $TALLKEEP_VERSION"
cd "$SERVER"
exec gosu postgres node server.bundle.mjs
