'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import type { Period } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

function periodStatusBadge(status: Period['status']) {
  if (status === 'activo') return <Badge variant="success">Activo</Badge>;
  if (status === 'programado') return <Badge variant="info">Programado</Badge>;
  return <Badge variant="gray">Cerrado</Badge>;
}

export default function AdminPeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [closeModal, setCloseModal] = useState<{ open: boolean; period: Period | null }>({
    open: false,
    period: null,
  });
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadPeriods();
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.user);
      }
    } catch { /* ignore */ }
  }

  async function loadPeriods() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/periods');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data.periods);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    if (!closeModal.period) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/periods/${closeModal.period.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setToast({ message: 'Período cerrado correctamente', variant: 'success' });
        await loadPeriods();
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Error al cerrar período', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexión', variant: 'error' });
    } finally {
      setClosing(false);
      setCloseModal({ open: false, period: null });
    }
  }

  async function handleNotify(periodId: string) {
    try {
      const res = await fetch(`/api/admin/periods/${periodId}/notify`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `Notificaciones enviadas: ${data.sent} exitosas, ${data.failed} fallidas`, variant: 'success' });
      } else {
        setToast({ message: data.error || 'Error al enviar notificaciones', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexión', variant: 'error' });
    }
  }

  return (
    <AppLayout
      role="admin"
      userName={userInfo?.name}
      userEmail={userInfo?.email}
      institutionName="EvalDoc"
    >
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Períodos de Evaluación</h1>
            <p className="text-sm text-gray-500 mt-0.5">{periods.length} períodos registrados</p>
          </div>
          <Link href="/admin/periods/new">
            <Button size="sm">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Período
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : periods.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              title="No hay períodos"
              description="Crea el primer período de evaluación para comenzar."
              action={
                <Link href="/admin/periods/new">
                  <Button size="sm">Crear período</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {periods.map((period) => (
              <Card key={period.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{period.name}</p>
                      {periodStatusBadge(period.status)}
                      {period.is_manually_closed && (
                        <Badge variant="gray">Cerrado manualmente</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {period.start_date} — {period.end_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {period.status === 'activo' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleNotify(period.id)}
                      >
                        Notificar
                      </Button>
                    )}
                    {period.status !== 'cerrado' && (
                      <Link href={`/admin/periods/${period.id}/edit`}>
                        <Button variant="secondary" size="sm">Editar</Button>
                      </Link>
                    )}
                    {period.status !== 'cerrado' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCloseModal({ open: true, period })}
                      >
                        Cerrar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={closeModal.open}
        onClose={() => setCloseModal({ open: false, period: null })}
        title="Cerrar Período"
      >
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de cerrar el período{' '}
          <strong>{closeModal.period?.name}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCloseModal({ open: false, period: null })}
          >
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={closing} onClick={handleClose}>
            Cerrar período
          </Button>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </AppLayout>
  );
}
