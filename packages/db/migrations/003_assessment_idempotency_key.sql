-- Add idempotency key to assessments table.
-- Each submission attempt generates a client-side UUID.
-- The unique constraint prevents duplicate inserts from
-- React StrictMode, double-clicks, or network retries.
-- Multiple legitimate assessments per session are allowed
-- (e.g. merchant opens a new tab with the same session cookie).

ALTER TABLE assessments ADD COLUMN idempotency_key uuid;
CREATE UNIQUE INDEX assessments_idempotency_key_idx ON assessments(idempotency_key);
