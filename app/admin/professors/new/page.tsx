'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function NewProfessorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', subject: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/professors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          subject: form.subject.trim(),
          department: form.department.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear el profesor');
        return;
      }
      router.push('/admin/professors');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout role="admin" institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-lg mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Nuevo Profesor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registra un nuevo profesor en la plataforma</p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Ana María García"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materia / Asignatura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Ej. Cálculo Diferencial"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Ej. Ingeniería de Sistemas"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={loading} className="flex-1">
                Crear Profesor
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/professors')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
