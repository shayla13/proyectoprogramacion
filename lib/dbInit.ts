import { executeSql, getSupabaseClient } from './supabase';

const ALL_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON _migrations FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'estudiante' CHECK (role IN ('estudiante', 'admin')),
  is_active BOOLEAN DEFAULT false,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS activation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activation_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON activation_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON password_reset_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  institution_name VARCHAR(150) NOT NULL DEFAULT 'Institución Universitaria',
  allowed_domain VARCHAR(100) NOT NULL DEFAULT 'evaldoc.edu.co',
  min_evaluations_to_publish INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON system_config FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS professors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  department VARCHAR(150),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON professors FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_professors_active ON professors(is_active);

CREATE TABLE IF NOT EXISTS periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'programado' CHECK (status IN ('programado', 'activo', 'cerrado')),
  is_manually_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (start_date < end_date)
);
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON periods FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_periods_status ON periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_dates ON periods(start_date, end_date);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID NOT NULL REFERENCES professors(id),
  period_id UUID NOT NULL REFERENCES periods(id),
  score_clarity SMALLINT NOT NULL CHECK (score_clarity BETWEEN 1 AND 5),
  score_methodology SMALLINT NOT NULL CHECK (score_methodology BETWEEN 1 AND 5),
  score_punctuality SMALLINT NOT NULL CHECK (score_punctuality BETWEEN 1 AND 5),
  score_treatment SMALLINT NOT NULL CHECK (score_treatment BETWEEN 1 AND 5),
  score_knowledge SMALLINT NOT NULL CHECK (score_knowledge BETWEEN 1 AND 5),
  avg_general DECIMAL(3,2) NOT NULL,
  comment TEXT,
  comment_is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON evaluations FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_evaluations_professor_period ON evaluations(professor_id, period_id);

CREATE TABLE IF NOT EXISTS evaluation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  professor_id UUID NOT NULL REFERENCES professors(id),
  period_id UUID NOT NULL REFERENCES periods(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE evaluation_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_role_all ON evaluation_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_eval_tokens_hash ON evaluation_tokens(token_hash);

CREATE OR REPLACE VIEW professor_period_stats AS
SELECT
  professor_id, period_id,
  COUNT(*) AS total_evaluations,
  ROUND(AVG(score_clarity), 2) AS avg_clarity,
  ROUND(AVG(score_methodology), 2) AS avg_methodology,
  ROUND(AVG(score_punctuality), 2) AS avg_punctuality,
  ROUND(AVG(score_treatment), 2) AS avg_treatment,
  ROUND(AVG(score_knowledge), 2) AS avg_knowledge,
  ROUND(AVG(avg_general), 2) AS avg_overall
FROM evaluations
GROUP BY professor_id, period_id;

NOTIFY pgrst, 'reload schema';
`;

const SEED_SQL = `
INSERT INTO system_config (institution_name, allowed_domain, min_evaluations_to_publish)
SELECT 'Institución Universitaria', 'evaldoc.edu.co', 3
WHERE NOT EXISTS (SELECT 1 FROM system_config);

INSERT INTO users (name, email, password_hash, role, is_active)
SELECT 'Administrador', 'admin@evaldoc.edu.co',
  '$2b$10$E5Y1DEDNIYWfOQykYCEs2estVv78kdkKdl2Gnfh0q9j9EZDXnhcYW',
  'admin', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@evaldoc.edu.co');

UPDATE users
SET password_hash = '$2b$10$E5Y1DEDNIYWfOQykYCEs2estVv78kdkKdl2Gnfh0q9j9EZDXnhcYW', is_active = true
WHERE email = 'admin@evaldoc.edu.co';
`;

let initialized = false;

export async function autoInitDatabase(): Promise<void> {
  if (initialized) return;

  const sb = getSupabaseClient();
  if (!sb) {
    console.log('[EvalDoc] Supabase no configurado — omitiendo auto-init');
    return;
  }

  try {
    // Verificar si ya existe la tabla users
    const { error } = await sb.from('users').select('id').limit(1);
    if (!error) {
      console.log('[EvalDoc] Base de datos ya inicializada ✓');
      initialized = true;
      return;
    }

    console.log('[EvalDoc] Inicializando base de datos automáticamente...');
    await executeSql(ALL_TABLES_SQL);
    await executeSql(SEED_SQL);
    initialized = true;
    console.log('[EvalDoc] Base de datos inicializada correctamente ✓');
  } catch (err) {
    console.error('[EvalDoc] Error al auto-inicializar:', err);
  }
}
