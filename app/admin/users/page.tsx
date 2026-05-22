'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Toast from '@/components/ui/Toast';
import type { SafeUser } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

function getUserStatus(user: SafeUser): 'locked' | 'pending' | 'active' {
  if (user.locked_until && new Date(user.locked_until) > new Date()) return 'locked';
  if (!user.is_active) return 'pending';
  return 'active';
}

export default function AdminUsersPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserInfo(d.user));
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleToggle(user: SafeUser) {
    setToggling(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'PUT' });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
        setToast({ message: `Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`, variant: 'success' });
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Error al actualizar', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexion', variant: 'error' });
    } finally {
      setToggling(null);
    }
  }

  const statusBadge = (user: SafeUser) => {
    const status = getUserStatus(user);
    if (status === 'locked') return <Badge variant="error">Bloqueado</Badge>;
    if (status === 'pending') return <Badge variant="warning">Pendiente verificacion</Badge>;
    return <Badge variant="success">Activo</Badge>;
  };

  return (
    <AppLayout role="admin" userName={userInfo?.name} userEmail={userInfo?.email} institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} estudiantes registrados</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : users.length === 0 ? (
          <Card className="p-6">
            <EmptyState title="Sin usuarios" description="No hay estudiantes registrados aun." />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Registrado</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">{statusBadge(user)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(user.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={user.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          loading={toggling === user.id}
                          onClick={() => handleToggle(user)}
                        >
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}