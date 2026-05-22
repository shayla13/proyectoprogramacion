'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import type { SystemConfig } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

export default function AdminConfigPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ institution_name: '', allowed_domain: '', min_evaluations_to_publish: 1 });
  const [warnModal, setWarnModal] = useState(false);
  const [pendingData, setPendingData] = useState<typeof form | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserInfo(d.user));
    fetch('/api/admin/config').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.config) {
        setConfig(d.config);
        setForm({
          institution_name: d.config.institution_name,
          allowed_domain: d.config.allowed_domain,
          min_evaluations_to_publish: d.config.min_evaluations_to_publish,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (config && form.allowed_domain !== config.allowed_domain) {
      setPendingData(form);
      setWarnModal(true);
    } else {
      saveConfig(form);
    }
  }

  async function saveConfig(data: typeof form) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const d = await res.json();
        setConfig(d.config);
        setToast({ message: 'Configuracion guardada correctamente', variant: 'success' });
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Error al guardar', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexion', variant: 'error' });
    } finally {
      setSaving(false);
      setWarnModal(false);
    }
  }

  return (
    <AppLayout role="admin" userName={userInfo?.name} userEmail={userInfo?.email} institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Configuracion del Sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ajusta los parametros de la plataforma</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : (
          <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la institucion</label>
                <input
                  type="text"
                  value={form.institution_name}
                  onChange={e => setForm(prev => ({ ...prev, institution_name: e.target.value }))}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dominio permitido</label>
                <input
                  type="text"
                  value={form.allowed_domain}
                  onChange={e => setForm(prev => ({ ...prev, allowed_domain: e.target.value }))}
                  required
                  placeholder="unimagdalena.edu.co"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Solo se permitira el registro con correos de este dominio</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluaciones minimas para publicar</label>
                <input
                  type="number"
                  min={1}
                  value={form.min_evaluations_to_publish}
                  onChange={e => setForm(prev => ({ ...prev, min_evaluations_to_publish: parseInt(e.target.value) || 1 }))}
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Un profesor debe tener al menos este numero de evaluaciones para aparecer en el ranking</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}>
                  Guardar configuracion
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <Modal open={warnModal} onClose={() => setWarnModal(false)} title="Cambio de dominio" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Vas a cambiar el dominio permitido. Esto afectara los nuevos registros. Los usuarios existentes no se veran afectados. ¿Confirmar?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWarnModal(false)}>Cancelar</Button>
          <Button size="sm" loading={saving} onClick={() => pendingData && saveConfig(pendingData)}>
            Si, cambiar dominio
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}