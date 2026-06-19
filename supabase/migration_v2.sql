-- ============================================================
-- Migration v2: Add auto_close_at and is_master to certificates table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add columns if they do not exist
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS auto_close_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false;

-- 2. Create index to enforce only one master template
-- Using partial unique index ensures only one row can have is_master = true
DROP INDEX IF EXISTS idx_certificates_is_master_true;
CREATE UNIQUE INDEX idx_certificates_is_master_true ON certificates (is_master) WHERE (is_master = true);
