import Link from 'next/link';
import type { PublicRankingItem, Period } from '@/lib/types';

interface RankingData {
  ranking: PublicRankingItem[];
  period: Period | null;
  mode: 'seed' | 'live';
}

async function getData(): Promise<RankingData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/ranking`, { cache: 'no-store' });
    if (!res.ok) return { ranking: [], period: null, mode: 'live' };
    return res.json();
  } catch {
    return { ranking: [], period: null, mode: 'live' };
  }
}

function StarRating({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(Math.floor(rounded))}
      {rounded % 1 !== 0 ? '½' : ''}
      {'☆'.repeat(5 - Math.ceil(rounded))}
    </span>
  );
}

export default async function RankingPage() {
  const data = await getData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-blue-900">
            EvalDoc
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ranking de Profesores</h1>
          {data.period && (
            <p className="text-sm text-gray-500 mt-1">
              Período: <span className="font-medium text-gray-700">{data.period.name}</span>
            </p>
          )}
        </div>

        {data.mode === 'seed' || !data.period ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              {data.mode === 'seed'
                ? 'El sistema está en modo de configuración inicial.'
                : 'No hay un período de evaluación activo en este momento.'}
            </p>
          </div>
        ) : data.ranking.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              Aún no hay suficientes evaluaciones para mostrar el ranking.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.ranking.map((item, index) => (
              <Link
                key={item.professor_id}
                href={`/professors/${item.professor_id}`}
                className="block bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.professor_name}
                    </p>
                    <p className="text-xs text-gray-500">{item.subject}</p>
                    {item.department && (
                      <p className="text-xs text-gray-400">{item.department}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-blue-700">
                      {item.avg_overall.toFixed(1)}
                      <span className="text-xs text-gray-400 font-normal">/5</span>
                    </p>
                    <StarRating value={item.avg_overall} />
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.total_evaluations} eval.
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
