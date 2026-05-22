CREATE TABLE IF NOT EXISTS periods (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  start_date        DATE         NOT NULL,
  end_date          DATE         NOT NULL,
  status            VARCHAR(15)  NOT NULL DEFAULT 'programado'
                    CHECK (status IN ('programado', 'activo', 'cerrado')),
  is_manually_closed BOOLEAN     DEFAULT false,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW(),
  CHECK (start_date < end_date)
);
CREATE INDEX IF NOT EXISTS idx_periods_status ON periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_dates  ON periods(start_date, end_date);
