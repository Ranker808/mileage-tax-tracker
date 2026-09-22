-- Adds an optional free-text notes field to trips, for parity with
-- expenses.notes -- context that doesn't fit "business purpose" (e.g. "hit
-- traffic on I-80, took the long way") without cluttering that field.
alter table trips add column if not exists notes text;
