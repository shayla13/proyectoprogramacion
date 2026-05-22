import Link from 'next/link';
import type { PublicProfessorProfile, Period } from '@/lib/types';

interface PageData {
  profile: PublicProfessorProfile;
  period: Period;
}

async function getData(id: string): Promise<PageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/professors/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value.toFixed(1)}/5</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function ProfessorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-blue-900">
            EvalDoc
          </Link>
          <Link href="/ranking" className="text-sm text-blue-600 hover:underline">
            Ver ranking
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!data ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">Profesor no encontrado o no hay período activo.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-blue-700">
                    {data.profile.professor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {data.profile.professor.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">{data.profile.professor.subject}</p>
                  {data.profile.professor.department && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {data.profile.professor.department}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Período: <span className="font-medium text-gray-700">{data.period.name}</span>
                </p>
              </div>
            </div>

            {/* Stats */}
            {!data.profile.stats ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500">
                  Este profesor aún no tiene suficientes evaluaciones para mostrar resultados públicos.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-800">Calificaciones</h2>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">
                        {data.profile.stats.avg_overall.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-400">promedio general</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <ScoreBar label="Claridad" value={data.profile.stats.avg_clarity} />
                    <ScoreBar label="Metodología" value={data.profile.stats.avg_methodology} />
                    <ScoreBar label="Puntualidad" value={data.profile.stats.avg_punctuality} />
                    <ScoreBar label="Trato" value={data.profile.stats.avg_treatment} />
                    <ScoreBar label="Conocimiento" value={data.profile.stats.avg_knowledge} />
                  </div>
                  <p className="mt-3 text-xs text-gray-400 text-right">
                    Basado en {data.profile.stats.total_evaluations} evaluaciones
                  </p>
                </div>

                {/* Comments */}
                {data.profile.comments.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3">
                      Comentarios ({data.profile.comments.length})
                    </h2>
                    <div className="space-y-3">
                      {data.profile.comments.map((comment, i) => (
                        <blockquote
                          key={i}
                          className="text-sm text-gray-600 border-l-2 border-blue-200 pl-3 italic"
                        >
                          {comment}
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
