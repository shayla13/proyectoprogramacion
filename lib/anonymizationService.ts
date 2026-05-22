import { createHash } from 'crypto';
import { supabaseAdmin } from './supabase';

export function computeEvaluationToken(
  studentId: string,
  professorId: string,
  periodId: string
): string {
  return createHash('sha256')
    .update(`${studentId}:${professorId}:${periodId}`)
    .digest('hex');
}

export async function verifyNotDuplicate(
  studentId: string,
  professorId: string,
  periodId: string
): Promise<boolean> {
  const token = computeEvaluationToken(studentId, professorId, periodId);
  const { count } = await supabaseAdmin
    .from('evaluation_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('token_hash', token);
  return (count ?? 0) === 0;
}
