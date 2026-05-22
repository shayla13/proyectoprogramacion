import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getActivePeriod, getProfessors, getStudentProgress, getSystemMode } from '@/lib/dataService';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const mode = await getSystemMode();
  if (mode === 'seed') {
    return NextResponse.json({ mode: 'seed', period: null, professors: [], progress: [] });
  }

  const period = await getActivePeriod();
  const professors = await getProfessors({ is_active: true });

  let progress: Awaited<ReturnType<typeof getStudentProgress>> = [];
  if (period) {
    progress = await getStudentProgress(session.userId, period.id);
  }

  return NextResponse.json({ mode: 'live', period, professors, progress });
}
