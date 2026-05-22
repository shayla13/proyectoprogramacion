'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { AuditEntry } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

const ACTION_LABELS: Record<AuditEntry['action'], string> = {
  login: 'Inicio de sesion',
  logout: 'Cierre de sesion',
  create_professor: 'Crear profesor',
  update_professor: 'Actualizar profesor',
  deactivate_professor: 'Desactivar profesor',
  create_period: 'Crear periodo',
  update_period: 'Actualizar periodo',
  close_period: 'Cerrar periodo',
  delete_comment: 'Moderar comentario',
  update_system_config: 'Actualizar configuracion',
  create_admin_user: 'Crear administrador',
  toggle_user: 'Cambiar estado usuario',
  bootstrap: 'Bootstrap del sistema',
};

const ENTITY_LABELS: Record<AuditEntry['entity'], string> = {
  professor: 'Profesor',
  period: 'Periodo',
  comment: 'Comentario',
  user: 'Usuario',
  system: 'Sistema',
};

export default function AdminAuditPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserInfo(d.user));
  }, []);

  async function loadAudit() {
    setLoading(true);
    try {
      const yyyymm = month.replace('-', '');
      const res = await fetch(`/api/audit?month=${yyyymm}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout role="admin" userName={userInfo?.name} userEmail={userInfo?.email} institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Registro de Auditoria</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historial de acciones administrativas</p>
        </div>

        <div className="flex items-end gap-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={loadAudit} loading={loading}>
            Cargar
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : entries.length === 0 ? (
          <Card className="p-6">
            <EmptyState title="Sin registros" description="No hay actividad de auditoria para este mes." />
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ENTITY_LABELS[entry.entity] ?? entry.entity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{entry.summary}</p>
                    {entry.user_email && (
                      <p className="text-xs text-gray-400 mt-0.5">Por: {entry.user_email}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(entry.timestamp).toLocaleString('es-CO', { hour12: false })}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}