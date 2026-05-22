CREATE TABLE IF NOT EXISTS professors (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  subject     VARCHAR(150) NOT NULL,
  department  VARCHAR(150),
  is_active   BOOLEAN      DEFAULT true,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_professors_active ON professors(is_active);
