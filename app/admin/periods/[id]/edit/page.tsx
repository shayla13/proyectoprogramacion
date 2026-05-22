'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { Period } from '@/lib/types';

export default function EditPeriodPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [period, setPeriod] = useState<Period | null>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPeriod();
  }, [id]);

  async function loadPeriod() {
    try {
      const res = await fetch('/api/admin/periods');
      if (res.ok) {
        const data = await res.json();
        const found = (data.periods as Period[]).find((p) => p.id === id);
        if (found) {
          setPeriod(found);
          setForm({
            name: found.name,
            start_date: found.start_date,
            end_date: found.end_date,
          });
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.start_date >= form.end_date) {
      setError('La fecha de inicio debe ser anterior a la fecha de cierre');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al actualizar');
        return;
      }
      router.push('/admin/periods');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout role="admin" institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-lg mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Editar Período</h1>
          <p className="text-sm text-gray-500 mt-0.5">Actualiza los datos del período de evaluación</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : !period ? (
          <Card className="p-6 text-center text-sm text-gray-500">Período no encontrado.</Card>
        ) : period.status === 'cerrado' ? (
          <Card className="p-6 text-center text-sm text-gray-500">
            Este período ya está cerrado y no puede editarse.
          </Card>
        ) : (
          <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del período <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de cierre <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  min={form.start_date || undefined}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={saving} className="flex-1">
                  Guardar Cambios
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/admin/periods')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
