#!/usr/bin/env bash
# Verifies every file in supabase/migrations/ against a real local
# Postgres: applies them unmodified, in order, then runs it as two
# simulated users (via a real, non-superuser role with a faithful
# auth.uid() shim) to prove row-level security actually isolates their
# data, that check/FK constraints hold, and that the odometer upsert
# behaves correctly.
#
# Requires a local Postgres server you can connect to as a superuser
# (e.g. `sudo -u postgres psql`, or just `psql` if you're already a
# superuser locally). Uses a throwaway "mileage_rls_test" database and
# drops it when done, so it's safe to re-run anytime.
set -euo pipefail

cd "$(dirname "$0")"
DB=mileage_rls_test
PSQL=${PSQL_SUPERUSER_CMD:-"psql"}

echo "==> Creating throwaway database $DB"
dropdb --if-exists "$DB" 2>/dev/null || true
createdb "$DB"

echo "==> Applying auth/storage shim (mimics Supabase's built-in schemas)"
$PSQL -d "$DB" -v ON_ERROR_STOP=1 -f 00_auth_storage_shim.sql >/dev/null

echo "==> Applying the real, unmodified production migrations"
for f in ../migrations/*.sql; do
  echo "    - $(basename "$f")"
  $PSQL -d "$DB" -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done

echo "==> Seeding two test users and a non-superuser 'authenticated' role"
$PSQL -d "$DB" -v ON_ERROR_STOP=1 -f 01_seed_test_users.sql >/dev/null

echo "==> Running RLS + constraint assertions"
$PSQL -d "$DB" -f 02_rls_assertions.sql 2>&1 | tee /tmp/mileage_rls_test.log

echo "==> Cleaning up"
dropdb "$DB"

# Each assertion either prints "NOTICE:  PASS: ..." or, on failure, raises
# a real SQL exception whose message starts with "FAIL:" (surfaced by
# psql as "ERROR:  FAIL: ..."). Either an ERROR line or a missing PASS
# count means something didn't hold.
pass_count=$(grep -c 'NOTICE:  PASS:' /tmp/mileage_rls_test.log || true)
if grep -q '^ERROR' /tmp/mileage_rls_test.log; then
  echo
  echo "FAILED: unexpected SQL errors were printed above."
  exit 1
fi
if [ "$pass_count" -lt 15 ]; then
  echo
  echo "FAILED: expected at least 15 PASS assertions, got $pass_count."
  exit 1
fi

echo
echo "All $pass_count RLS and constraint assertions passed."
