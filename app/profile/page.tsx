'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'estudiante' | 'admin';
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUserInfo(d.user))
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError('Las contrasenas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('La nueva contrasena debe tener al menos 8 caracteres');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Contrasena actualizada correctamente', variant: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToast({ message: data.error || 'Error al cambiar la contrasena', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexion', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout role="estudiante">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      role={userInfo?.role ?? 'estudiante'}
      userName={userInfo?.name}
      userEmail={userInfo?.email}
      institutionName="EvalDoc"
    >
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Mi Perfil</h1>
        </div>

        {/* User info */}
        <Card className="p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Informacion personal</h2>
          <div className="space-y-2">
            <div className="flex gap-3">
              <span className="text-sm text-gray-500 w-20 flex-shrink-0">Nombre</span>
              <span className="text-sm font-medium text-gray-900">{userInfo?.name}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sm text-gray-500 w-20 flex-shrink-0">Correo</span>
              <span className="text-sm font-medium text-gray-900">{userInfo?.email}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sm text-gray-500 w-20 flex-shrink-0">Rol</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{userInfo?.role}</span>
            </div>
          </div>
        </Card>

        {/* Change password */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Cambiar contrasena</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contrasena actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contrasena</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contrasena</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {pwError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {pwError}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <Button type="submit" loading={saving}>
                Actualizar contrasena
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}