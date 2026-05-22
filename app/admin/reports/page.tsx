'use client';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { Professor, Period } from '@/lib/types';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

interface EvalRow {
  id: string;
  professor_id: string;
  professor_name: string;
  period_id: string;
  period_name: string;
  score_clarity: number;
  score_methodology: number;
  score_punctuality: number;
  score_treatment: number;
  score_knowledge: number;
  avg_general: number;
  created_at: string;
}

interface ReportData {
  evaluations: EvalRow[];
  summary: { total: number; avg_overall: number };
}

export default function AdminReportsPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [professorFilter, setProfessorFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserInfo(d.user));
    fetch('/api/admin/professors').then(r => r.ok ? r.json() : null).then(d => d && setProfessors(d.professors));
    fetch('/api/admin/periods').then(r => r.ok ? r.json() : null).then(d => d && setPeriods(d.periods));
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (professorFilter) params.set('professor_id', professorFilter);
      if (periodFilter) params.set('period_id', periodFilter);
      if (subjectFilter) params.set('subject', subjectFilter);
      const res = await fetch('/api/admin/reports?' + params.toString());
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [professorFilter, periodFilter, subjectFilter]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <AppLayout role="admin" userName={userInfo?.name} userEmail={userInfo?.email} institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Reportes de Evaluaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Consulta los resultados sin exponer identidades</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Profesor</label>
              <select
                value={professorFilter}
                onChange={e => setProfessorFilter(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los profesores</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
              <select
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los periodos</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Materia</label>
              <input
                type="text"
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                placeholder="Filtrar por materia..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Summary */}
        {report && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{report.summary.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total evaluaciones</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{report.summary.avg_overall.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Promedio general</p>
            </Card>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : !report || report.evaluations.length === 0 ? (
          <Card className="p-6">
            <EmptyState title="Sin resultados" description="No hay evaluaciones con los filtros seleccionados." />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Profesor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Periodo</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Claridad</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Metodologia</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Puntualidad</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Trato</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Dominio</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Promedio</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.evaluations.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.professor_name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.period_name}</td>
                      <td className="px-3 py-3 text-center text-gray-700">{row.score_clarity}</td>
                      <td className="px-3 py-3 text-center text-gray-700">{row.score_methodology}</td>
                      <td className="px-3 py-3 text-center text-gray-700">{row.score_punctuality}</td>
                      <td className="px-3 py-3 text-center text-gray-700">{row.score_treatment}</td>
                      <td className="px-3 py-3 text-center text-gray-700">{row.score_knowledge}</td>
                      <td className="px-3 py-3 text-center font-semibold text-blue-700">{Number(row.avg_general).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}