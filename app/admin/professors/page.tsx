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
import type { Professor } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

export default function AdminProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; professor: Professor | null }>({
    open: false,
    professor: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadProfessors();
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

  async function loadProfessors() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/professors');
      if (res.ok) {
        const data = await res.json();
        setProfessors(data.professors);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!deleteModal.professor) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/professors/${deleteModal.professor.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setToast({ message: 'Profesor desactivado correctamente', variant: 'success' });
        await loadProfessors();
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Error al desactivar', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Error de conexión', variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, professor: null });
    }
  }

  const filtered = professors.filter((p) => {
    if (filterActive === 'active') return p.is_active;
    if (filterActive === 'inactive') return !p.is_active;
    return true;
  });

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
            <h1 className="text-xl font-semibold text-gray-900">Profesores</h1>
            <p className="text-sm text-gray-500 mt-0.5">{professors.length} registros</p>
          </div>
          <Link href="/admin/professors/new">
            <Button size="sm">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Profesor
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-4">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filterActive === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              title="No hay profesores"
              description="Agrega el primer profesor para comenzar."
              action={
                <Link href="/admin/professors/new">
                  <Button size="sm">Agregar profesor</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((professor) => (
              <Card key={professor.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{professor.name}</p>
                      <Badge variant={professor.is_active ? 'success' : 'gray'}>
                        {professor.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{professor.subject}</p>
                    {professor.department && (
                      <p className="text-xs text-gray-400">{professor.department}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/professors/${professor.id}/edit`}>
                      <Button variant="secondary" size="sm">Editar</Button>
                    </Link>
                    {professor.is_active && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModal({ open: true, professor })}
                      >
                        Desactivar
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
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, professor: null })}
        title="Desactivar Profesor"
      >
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de que deseas desactivar a{' '}
          <strong>{deleteModal.professor?.name}</strong>? El profesor no se eliminará,
          solo se marcará como inactivo.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteModal({ open: false, professor: null })}
          >
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDeactivate}>
            Desactivar
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
