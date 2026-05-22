'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import type { Period, Professor, StudentProgress } from '@/lib/types';

interface DashboardData {
  mode: 'seed' | 'live';
  period: Period | null;
  professors: Professor[];
  progress: StudentProgress[];
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'estudiante' | 'admin';
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>
          {value} de {total} profesores evaluados
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadDashboard(), loadUser()]);
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadUser() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        setUserInfo(json.user);
      }
    } catch {
      // ignore
    }
  }

  const evaluatedCount = data?.progress.filter((p) => p.evaluated).length ?? 0;
  const totalCount = data?.progress.length ?? 0;

  return (
    <AppLayout
      role={userInfo?.role ?? 'estudiante'}
      userName={userInfo?.name}
      userEmail={userInfo?.email}
      seedMode={data?.mode === 'seed'}
      institutionName="EvalDoc"
    >
      <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-20 lg:pb-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">
            Hola{userInfo?.name ? `, ${userInfo.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Evalúa a tus profesores de forma anónima</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : data?.mode === 'seed' ? (
          <Card className="p-6">
            <EmptyState
              title="Base de datos no configurada"
              description="El sistema está en modo semilla. Un administrador debe ejecutar el bootstrap para activar la plataforma."
            />
          </Card>
        ) : !data?.period ? (
          <Card className="p-6">
            <EmptyState
              title="No hay período activo"
              description="No hay un período de evaluación activo en este momento. Vuelve más tarde."
            />
          </Card>
        ) : (
          <>
            {/* Period banner */}
            <Card className="p-4 mb-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Período activo</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.period.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Cierra el</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(data.period.end_date + 'T00:00:00').toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Progress tracker */}
            <Card className="p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Tu progreso</h2>
              <ProgressBar value={evaluatedCount} total={totalCount} />
              {evaluatedCount === totalCount && totalCount > 0 && (
                <p className="mt-2 text-xs text-green-700 font-medium">
                  ¡Completaste todas las evaluaciones del período!
                </p>
              )}
            </Card>

            {/* Professor list */}
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Profesores</h2>
              {data.progress.length === 0 ? (
                <Card className="p-6">
                  <EmptyState
                    title="No hay profesores activos"
                    description="No hay profesores activos para evaluar en este período."
                  />
                </Card>
              ) : (
                <div className="space-y-2">
                  {data.progress.map(({ professor, evaluated }) => (
                    <Card key={professor.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {professor.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{professor.subject}</p>
                          {professor.department && (
                            <p className="text-xs text-gray-400">{professor.department}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={evaluated ? 'success' : 'warning'}>
                            {evaluated ? 'Evaluado' : 'Pendiente'}
                          </Badge>
                          {!evaluated && data.period && (
                            <Link
                              href={`/evaluate/${professor.id}?period=${data.period.id}`}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              Evaluar
                            </Link>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
