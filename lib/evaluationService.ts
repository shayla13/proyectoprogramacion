import { supabaseAdmin } from './supabase';
import type { PublicRankingItem } from './types';

export async function calculateAverages(professorId: string, periodId: string, minEvaluations: number) {
  const { data } = await supabaseAdmin
    .from('professor_period_stats')
    .select('*')
    .eq('professor_id', professorId)
    .eq('period_id', periodId)
    .single();

  if (!data || data.total_evaluations < minEvaluations) return null;
  return data;
}

export async function buildRanking(periodId: string, minEvaluations: number): Promise<PublicRankingItem[]> {
  const { data: stats } = await supabaseAdmin
    .from('professor_period_stats')
    .select('*')
    .eq('period_id', periodId)
    .gte('total_evaluations', minEvaluations)
    .order('avg_overall', { ascending: false });

  if (!stats || stats.length === 0) return [];

  const professorIds = stats.map((s: Record<string, unknown>) => s.professor_id);
  const { data: professors } = await supabaseAdmin
    .from('professors')
    .select('id, name, department, subject')
    .in('id', professorIds);

  const profMap = new Map((professors || []).map((p: Record<string, unknown>) => [p.id, p]));

  return stats.map((s: Record<string, unknown>) => {
    const prof = profMap.get(s.professor_id) as Record<string, unknown> | undefined;
    return {
      professor_id: s.professor_id as string,
      professor_name: (prof?.name as string) || '',
      department: (prof?.department as string | null) || null,
      subject: (prof?.subject as string) || '',
      total_evaluations: s.total_evaluations as number,
      avg_clarity: s.avg_clarity as number,
      avg_methodology: s.avg_methodology as number,
      avg_punctuality: s.avg_punctuality as number,
      avg_treatment: s.avg_treatment as number,
      avg_knowledge: s.avg_knowledge as number,
      avg_overall: s.avg_overall as number,
    };
  });
}
