'use client';

import { useState } from 'react';

interface DiagnoseResult {
  connected: boolean;
  error?: string;
  tables: Record<string, number>;
  hasDbUrl?: boolean;
  supabaseUrl?: string;
}

interface SetupResult {
  success: boolean;
  steps: { step: string; ok: boolean; error?: string }[];
}

export default function SetupDatabasePage() {
  const [diagnose, setDiagnose] = useState<DiagnoseResult | null>(null);
  const [setup, setSetup] = useState<SetupResult | null>(null);
  const [loadingDiagnose, setLoadingDiagnose] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);

  async function runDiagnose() {
    setLoadingDiagnose(true);
    setDiagnose(null);
    try {
      const res = await fetch('/api/setup-database');
      setDiagnose(await res.json());
    } catch (err) {
      setDiagnose({ connected: false, error: String(err), tables: {} });
    } finally {
      setLoadingDiagnose(false);
    }
  }

  async function runSetup() {
    setLoadingSetup(true);
    setSetup(null);
    try {
      const res = await fetch('/api/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-all' }),
      });
      setSetup(await res.json());
    } catch (err) {
      setSetup({ success: false, steps: [{ step: 'Conexión', ok: false, error: String(err) }] });
    } finally {
      setLoadingSetup(false);
    }
  }

  const EXPECTED_TABLES = [
    '_migrations', 'users', 'activation_tokens', 'password_reset_tokens',
    'system_config', 'professors', 'periods', 'evaluations', 'evaluation_tokens',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-1.5 bg-blue-600" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Configuración de Base de Datos</h1>
                <p className="text-xs text-gray-500">EvalDoc — Setup inicial de Supabase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Diagnose */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">1. Probar Conexión</h2>
              <p className="text-sm text-gray-500">Verifica que Supabase está configurado y las tablas existen</p>
            </div>
            <button
              onClick={runDiagnose}
              disabled={loadingDiagnose}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {loadingDiagnose && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Probar conexión
            </button>
          </div>

          {diagnose && (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
                diagnose.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <span>{diagnose.connected ? '✅' : '❌'}</span>
                <span>{diagnose.connected ? `Conectado a Supabase (${diagnose.supabaseUrl})` : 'Sin conexión a Supabase'}</span>
              </div>

              {diagnose.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-mono break-all">
                  {diagnose.error}
                </div>
              )}

              {diagnose.connected && (
                <>
                  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    diagnose.hasDbUrl ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <span>{diagnose.hasDbUrl ? '✅' : '⚠️'}</span>
                    <span>{diagnose.hasDbUrl ? 'DATABASE_URL configurado (para DDL)' : 'DATABASE_URL no configurado — no podrás crear tablas'}</span>
                  </div>

                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border-b border-gray-100">
                      Estado de las tablas
                    </div>
                    <div className="divide-y divide-gray-50">
                      {EXPECTED_TABLES.map(table => {
                        const count = diagnose.tables[table];
                        const exists = count !== undefined && count >= 0;
                        return (
                          <div key={table} className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm font-mono text-gray-700">{table}</span>
                            {exists ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                ✓ {count} filas
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                ✗ No existe
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Create tables */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">2. Crear Todas las Tablas</h2>
              <p className="text-sm text-gray-500">Crea las 9 tablas con RLS, índices y semilla inicial</p>
            </div>
            <button
              onClick={runSetup}
              disabled={loadingSetup}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {loadingSetup && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Crear tablas
            </button>
          </div>

          {setup && (
            <div className="space-y-2">
              {setup.steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                    step.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <span className="mt-0.5">{step.ok ? '✅' : '❌'}</span>
                  <div>
                    <span>{step.step}</span>
                    {step.error && (
                      <div className="text-xs font-mono mt-1 text-red-700 break-all">{step.error}</div>
                    )}
                  </div>
                </div>
              ))}

              {setup.success && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">✅ Base de datos lista</p>
                  <p>Credenciales del admin por defecto:</p>
                  <p className="font-mono text-xs mt-1">Email: admin@evaldoc.edu.co</p>
                  <p className="font-mono text-xs">Contraseña: admin123</p>
                  <p className="mt-2 text-xs text-blue-600">
                    Cambia el dominio institucional en{' '}
                    <a href="/admin/config" className="underline">/admin/config</a> después de hacer login.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="text-center text-sm text-gray-500 pb-4 space-x-4">
          <a href="/login" className="text-blue-600 hover:underline">Ir al login</a>
          <span>·</span>
          <a href="/" className="text-blue-600 hover:underline">Inicio</a>
          <span>·</span>
          <a href="/admin/db-setup" className="text-blue-600 hover:underline">Panel admin</a>
        </div>
      </div>
    </div>
  );
}
