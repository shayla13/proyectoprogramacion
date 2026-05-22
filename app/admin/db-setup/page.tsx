'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface DiagnosticData {
  database: {
    connected: boolean;
    tables: string[];
    migrations: string[];
    error?: string;
  };
  blob: { ok: boolean; error: string };
  resend: { ok: boolean; error: string };
  supabase: { url: boolean };
}

interface BootstrapResult {
  success: boolean;
  applied: string[];
  skipped: string[];
  errors: string[];
  error?: string;
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
  ) : (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-700 text-xs font-bold">✗</span>
  );
}

export default function DbSetupPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(true);
  const [bootstrapResult, setBootstrapResult] = useState<BootstrapResult | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    loadDiagnostic();
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.user);
      }
    } catch {
      // ignore
    }
  }

  async function loadDiagnostic() {
    setLoadingDiag(true);
    try {
      const res = await fetch('/api/system/diagnose');
      const data = await res.json();
      setDiagnostic(data);
    } catch {
      setDiagnostic(null);
    } finally {
      setLoadingDiag(false);
    }
  }

  async function runBootstrap() {
    setBootstrapping(true);
    setBootstrapResult(null);
    try {
      const res = await fetch('/api/system/bootstrap', {
        method: 'POST',
        headers: {
          'x-bootstrap-secret': bootstrapSecret,
        },
      });
      const data = await res.json();
      setBootstrapResult(data);
      // Reload diagnostic after bootstrap
      await loadDiagnostic();
    } catch (err) {
      setBootstrapResult({ success: false, applied: [], skipped: [], errors: [String(err)] });
    } finally {
      setBootstrapping(false);
    }
  }

  return (
    <AppLayout
      role="admin"
      userName={userInfo?.name}
      userEmail={userInfo?.email}
      institutionName="EvalDoc"
    >
      <div className="p-6 max-w-3xl mx-auto pb-20 lg:pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Configuración del Sistema</h1>
          <p className="text-sm text-gray-500 mt-1">
            Diagnóstico y configuración de la base de datos y servicios externos.
          </p>
        </div>

        {/* Diagnostic Card */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Diagnóstico de Servicios</h2>
            <Button variant="secondary" size="sm" onClick={loadDiagnostic} loading={loadingDiag}>
              Actualizar
            </Button>
          </div>

          {loadingDiag ? (
            <div className="py-6 text-center text-sm text-gray-400">Verificando servicios...</div>
          ) : diagnostic ? (
            <div className="space-y-4">
              {/* Database */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <StatusIcon ok={diagnostic.database.connected} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Base de datos (PostgreSQL)</p>
                  {diagnostic.database.connected ? (
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      <p>Tablas: {diagnostic.database.tables.join(', ') || 'ninguna'}</p>
                      <p>Migraciones aplicadas: {diagnostic.database.migrations.join(', ') || 'ninguna'}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-red-600">{diagnostic.database.error}</p>
                  )}
                </div>
              </div>

              {/* Supabase */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <StatusIcon ok={diagnostic.supabase.url} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Supabase</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {diagnostic.supabase.url ? 'URL configurada' : 'NEXT_PUBLIC_SUPABASE_URL no configurado'}
                  </p>
                </div>
              </div>

              {/* Blob */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <StatusIcon ok={diagnostic.blob.ok} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Vercel Blob (Auditoría)</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {diagnostic.blob.ok ? 'Token configurado' : diagnostic.blob.error}
                  </p>
                </div>
              </div>

              {/* Resend */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <StatusIcon ok={diagnostic.resend.ok} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Resend (Correo)</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {diagnostic.resend.ok ? 'API key configurada' : diagnostic.resend.error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-red-500">No se pudo cargar el diagnóstico.</div>
          )}
        </Card>

        {/* Bootstrap Card */}
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Bootstrap / Migraciones</h2>
          <p className="text-sm text-gray-500 mb-4">
            Ejecuta las migraciones pendientes y siembra los datos iniciales. Se requiere el secreto de bootstrap.
          </p>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secreto de Bootstrap
            </label>
            <input
              type="password"
              value={bootstrapSecret}
              onChange={(e) => setBootstrapSecret(e.target.value)}
              placeholder="ADMIN_BOOTSTRAP_SECRET"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            onClick={runBootstrap}
            loading={bootstrapping}
            disabled={!bootstrapSecret.trim()}
          >
            Ejecutar Bootstrap
          </Button>

          {bootstrapResult && (
            <div
              className={`mt-4 p-3 rounded-lg border text-sm ${
                bootstrapResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {bootstrapResult.success ? (
                <>
                  <p className="font-medium">Bootstrap exitoso</p>
                  {bootstrapResult.applied.length > 0 && (
                    <p className="mt-1">Aplicadas: {bootstrapResult.applied.join(', ')}</p>
                  )}
                  {bootstrapResult.skipped.length > 0 && (
                    <p className="mt-1 text-green-600">Omitidas (ya aplicadas): {bootstrapResult.skipped.join(', ')}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">Error en bootstrap</p>
                  {bootstrapResult.error && <p className="mt-1">{bootstrapResult.error}</p>}
                  {bootstrapResult.errors.map((e, i) => (
                    <p key={i} className="mt-1">
                      {e}
                    </p>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
