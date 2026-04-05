-- Add country_code to consents table for multi-market support.
-- Defaults to 'AU' for Phase 1. Required for Phase 2+ international expansion.

ALTER TABLE consents ADD COLUMN country_code text NOT NULL DEFAULT 'AU';
