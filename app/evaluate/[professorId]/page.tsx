'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { Professor, Period } from '@/lib/types';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'estudiante' | 'admin';
}

interface DimensionRatingProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  error: boolean;
}

function DimensionRating({ label, value, onChange, error }: DimensionRatingProps) {
  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-gray-800 mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{ minHeight: '44px', minWidth: '44px' }}
            className={`flex-1 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              value === n
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : error
                ? 'border-2 border-red-500 text-gray-700 hover:border-blue-400 bg-white'
                : 'border border-gray-300 text-gray-700 hover:border-blue-400 bg-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1">Debes seleccionar una puntuación</p>
      )}
    </div>
  );
}

const DIMENSIONS = [
  { key: 'clarity', label: 'Claridad en la explicación' },
  { key: 'methodology', label: 'Metodología de enseñanza' },
  { key: 'punctuality', label: 'Puntualidad y cumplimiento' },
  { key: 'treatment', label: 'Trato al estudiante' },
  { key: 'knowledge', label: 'Dominio del tema' },
] as const;

type DimensionKey = typeof DIMENSIONS[number]['key'];

export default function EvaluatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const professorId = params.professorId as string;
  const periodId = searchParams.get('period') || '';

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [scores, setScores] = useState<Record<DimensionKey, number | null>>({
    clarity: null,
    methodology: null,
    punctuality: null,
    treatment: null,
    knowledge: null,
  });
  const [comment, setComment] = useState('');
  const [scoreErrors, setScoreErrors] = useState<Record<DimensionKey, boolean>>({
    clarity: false,
    methodology: false,
    punctuality: false,
    treatment: false,
    knowledge: false,
  });

  const [confirmModal, setConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, profRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/professors/${professorId}`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserInfo(userData.user);
      } else {
        router.push('/login');
        return;
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        // /api/professors/[id] returns { profile, period } or { professor }
        const prof = profData.professor ?? profData.profile?.professor ?? null;
        if (prof) {
          setProfessor(prof);
        } else {
          setPageError('Profesor no encontrado.');
          setLoading(false);
          return;
        }
      } else {
        setPageError('Profesor no encontrado.');
        setLoading(false);
        return;
      }

      if (periodId) {
        const periodRes = await fetch('/api/periods/active');
        if (periodRes.ok) {
          const periodData = await periodRes.json();
          const activePeriod: Period | null = periodData.period;
          if (activePeriod && activePeriod.id === periodId) {
            setPeriod(activePeriod);
          } else if (activePeriod && activePeriod.id !== periodId) {
            setPageError('Este período de evaluación ya no está activo.');
          } else {
            setPageError('No hay un período de evaluación activo.');
          }
        }
      } else {
        setPageError('No se especificó un período de evaluación.');
      }
    } catch {
      setPageError('Error al cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [professorId, periodId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleScoreChange(dim: DimensionKey, value: number) {
    setScores((prev) => ({ ...prev, [dim]: value }));
    setScoreErrors((prev) => ({ ...prev, [dim]: false }));
  }

  function handleOpenConfirm() {
    const newErrors: Record<DimensionKey, boolean> = {
      clarity: scores.clarity === null,
      methodology: scores.methodology === null,
      punctuality: scores.punctuality === null,
      treatment: scores.treatment === null,
      knowledge: scores.knowledge === null,
    };
    setScoreErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    setSubmitError('');
    setConfirmModal(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorId,
          periodId,
          scores: {
            clarity: scores.clarity,
            methodology: scores.methodology,
            punctuality: scores.punctuality,
            treatment: scores.treatment,
            knowledge: scores.knowledge,
          },
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'ALREADY_EVALUATED') {
          setSubmitError('Ya evaluaste a este profesor en este período.');
        } else if (data.code === 'PERIOD_INACTIVE') {
          setSubmitError('El período de evaluación no está activo.');
        } else {
          setSubmitError(data.error || 'Error al enviar la evaluación.');
        }
        setConfirmModal(false);
        return;
      }

      setConfirmModal(false);
      setSuccess(true);
    } catch {
      setSubmitError('Error de conexión. Intenta de nuevo.');
      setConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout role="estudiante" userName={userInfo?.name} userEmail={userInfo?.email}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  if (success) {
    return (
      <AppLayout role="estudiante" userName={userInfo?.name} userEmail={userInfo?.email}>
        <div className="p-4 sm:p-6 max-w-xl mx-auto pb-20 lg:pb-6">
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Evaluación enviada de forma anónima
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Tu opinión contribuye a mejorar la calidad educativa. Gracias por participar.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Volver al inicio
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="estudiante" userName={userInfo?.name} userEmail={userInfo?.email}>
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-20 lg:pb-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Evaluar Profesor</h1>
          {professor && (
            <div className="mt-1">
              <p className="text-sm font-medium text-blue-700">{professor.name}</p>
              <p className="text-xs text-gray-500">{professor.subject}</p>
              {professor.department && (
                <p className="text-xs text-gray-400">{professor.department}</p>
              )}
            </div>
          )}
          {period && (
            <p className="text-xs text-gray-500 mt-1">
              Período: <span className="font-medium">{period.name}</span>
            </p>
          )}
        </div>

        {pageError ? (
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-4">{pageError}</p>
              <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                Volver al inicio
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            {/* Anonymity notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
              <p className="text-xs text-blue-700 font-medium">
                Tu evaluación es completamente anónima y no puede ser rastreada hasta ti.
              </p>
            </div>

            {/* Dimension ratings */}
            <div>
              {DIMENSIONS.map((dim) => (
                <DimensionRating
                  key={dim.key}
                  label={dim.label}
                  value={scores[dim.key]}
                  onChange={(v) => handleScoreChange(dim.key, v)}
                  error={scoreErrors[dim.key]}
                />
              ))}
            </div>

            {/* Comment */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Comentario <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Comparte tu experiencia con este profesor..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/1000</p>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                Cancelar
              </Button>
              <Button onClick={handleOpenConfirm}>
                Enviar evaluación
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Confirmation modal */}
      <Modal
        open={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Confirmar evaluación"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-5">
          Tu evaluación es completamente anónima. Una vez enviada, no puede modificarse ni eliminarse. ¿Confirmar?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmModal(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={submitting}
            onClick={handleSubmit}
          >
            Sí, enviar
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
