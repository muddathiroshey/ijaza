-- ============================================================
-- Supabase Database Setup for إجازة App
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  template_html TEXT DEFAULT '',
  form_fields JSONB DEFAULT '[]'::jsonb,
  is_open BOOLEAN DEFAULT true,
  csv_data TEXT,
  auto_close_at TIMESTAMPTZ DEFAULT NULL,
  is_master BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Assets table (signatures & stamps)
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signature', 'stamp')),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_certificate_id ON submissions(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_is_open ON certificates(is_open);
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_is_master_true ON certificates (is_master) WHERE (is_master = true);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- 5. RLS (Row Level Security) - disable for now since we use service role key
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Storage Setup
-- ============================================================
-- In Supabase Dashboard > Storage, create a bucket named "assets"
-- Make it PUBLIC (allows public URL access)
-- ============================================================
