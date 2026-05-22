import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client } from 'pg';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.startsWith('your_') || key.startsWith('your_')) {
    // No cachear el null — puede que las vars lleguen después
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return _client;
  } catch {
    return null;
  }
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase no configurado. Ve a /setup-database para configurar la base de datos.');
  }
  return client;
}

export async function executeSql(query: string): Promise<void> {
  const connString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL;

  if (!connString || connString.startsWith('your_') || connString === 'your_postgres_connection_string') {
    throw new Error('DATABASE_URL no configurado. Configura las variables de entorno de Supabase.');
  }

  // Quitar parámetros SSL del string para evitar conflictos con la opción ssl del cliente
  const cleanConn = connString
    .replace(/[?&]sslmode=[^&]*/g, '')
    .replace(/[?&]pgbouncer=[^&]*/g, '')
    .replace(/[?&]supa=[^&]*/g, '')
    .replace(/\?$/, '');

  const client = new Client({
    connectionString: cleanConn,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(query);
  } finally {
    await client.end();
  }
}

// Backward-compatible proxy exports used throughout dataService.ts
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = requireSupabaseClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
});

export const supabasePublic = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.startsWith('your_')) throw new Error('Supabase público no configurado');
    const client = createClient(url, key);
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
});
