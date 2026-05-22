'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import type { Period, CommentItem } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

export default function AdminCommentsPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [moderateModal, setModerateModal] = useState<{ open: boolean; comment: CommentItem | null }>({ open: false, comment: null });
  const [moderating, setModerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserInfo(d.user));
    fetch('/api/admin/periods').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setPeriods(d.periods);
        if (d.periods.length > 0) setSelectedPeriod(d.periods[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedPeriod) return;
    setLoading(true);
    fetch(`/api/admin/comments?period_id=${selectedPeriod}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setComments(d.comments))
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  async function handleModerate() {
    if (!moderateModal.comment) return;
    setModerating(true);
    try {
      const res = await fetch(`/api/admin/comments/${moderateModal.comment.id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.map(c => c.id === moderateModal.comment!.id ? { ...c, comment_is_visible: false } : c));
        setToast({ message: 'Comentario moderado correctamente', variant: 'success' });
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Error al moderar', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexion', variant: 'error' });
    } finally {
      setModerating(false);
      setModerateModal({ open: false, comment: null });
    }
  }

  // Group by professor
  const grouped = comments.reduce((acc, c) => {
    const key = c.professor_id;
    if (!acc[key]) acc[key] = { name: c.professor_name, comments: [] };
    acc[key].comments.push(c);
    return acc;
  }, {} as Record<string, { name: string; comments: CommentItem[] }>);

  return (
    <AppLayout role="admin" userName={userInfo?.name} userEmail={userInfo?.email} institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Moderacion de Comentarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revisa y modera los comentarios por periodo</p>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="w-full sm:w-72 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un periodo</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : !selectedPeriod ? (
          <Card className="p-6">
            <EmptyState title="Selecciona un periodo" description="Elige un periodo para ver sus comentarios." />
          </Card>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="p-6">
            <EmptyState title="Sin comentarios" description="No hay comentarios para este periodo." />
          </Card>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([profId, { name, comments: profComments }]) => (
              <Card key={profId} className="overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">{name}</span>
                  <span className="ml-2 text-xs text-gray-400">{profComments.length} comentario{profComments.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {profComments.map(c => (
                    <div key={c.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{c.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString('es-CO')}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {c.comment_is_visible ? (
                          <>
                            <Badge variant="success">Visible</Badge>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setModerateModal({ open: true, comment: c })}
                            >
                              Moderar
                            </Button>
                          </>
                        ) : (
                          <Badge variant="warning">Moderado</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={moderateModal.open}
        onClose={() => setModerateModal({ open: false, comment: null })}
        title="Moderar comentario"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-5">
          El comentario sera ocultado del perfil publico del profesor. Esta accion no elimina el registro.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModerateModal({ open: false, comment: null })} disabled={moderating}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={moderating} onClick={handleModerate}>
            Confirmar moderacion
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}