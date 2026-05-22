-- ATENCION! Esta tabla NO tiene student_id. El anonimato es por diseno del esquema.
CREATE TABLE IF NOT EXISTS evaluations (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id         UUID         NOT NULL REFERENCES professors(id),
  period_id            UUID         NOT NULL REFERENCES periods(id),
  score_clarity        SMALLINT     NOT NULL CHECK (score_clarity BETWEEN 1 AND 5),
  score_methodology    SMALLINT     NOT NULL CHECK (score_methodology BETWEEN 1 AND 5),
  score_punctuality    SMALLINT     NOT NULL CHECK (score_punctuality BETWEEN 1 AND 5),
  score_treatment      SMALLINT     NOT NULL CHECK (score_treatment BETWEEN 1 AND 5),
  score_knowledge      SMALLINT     NOT NULL CHECK (score_knowledge BETWEEN 1 AND 5),
  avg_general          DECIMAL(3,2) NOT NULL,
  comment              TEXT,
  comment_is_visible   BOOLEAN      DEFAULT true,
  created_at           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_tokens (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash   VARCHAR(64)  UNIQUE NOT NULL,
  professor_id UUID         NOT NULL REFERENCES professors(id),
  period_id    UUID         NOT NULL REFERENCES periods(id),
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_professor_period
  ON evaluations(professor_id, period_id);
CREATE INDEX IF NOT EXISTS idx_eval_tokens_hash
  ON evaluation_tokens(token_hash);

CREATE OR REPLACE VIEW professor_period_stats AS
SELECT
  professor_id,
  period_id,
  COUNT(*)                          AS total_evaluations,
  ROUND(AVG(score_clarity), 2)      AS avg_clarity,
  ROUND(AVG(score_methodology), 2)  AS avg_methodology,
  ROUND(AVG(score_punctuality), 2)  AS avg_punctuality,
  ROUND(AVG(score_treatment), 2)    AS avg_treatment,
  ROUND(AVG(score_knowledge), 2)    AS avg_knowledge,
  ROUND(AVG(avg_general), 2)        AS avg_overall
FROM evaluations
GROUP BY professor_id, period_id;
