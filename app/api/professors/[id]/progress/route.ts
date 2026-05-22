import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { getActivePeriod, hasStudentEvaluated } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const handler = async (
  _req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    const period = await getActivePeriod();
    if (!period) {
      return NextResponse.json({ evaluated: false, period: null });
    }
    const evaluated = await hasStudentEvaluated(session.userId, id, period.id);
    return NextResponse.json({ evaluated, period });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withAuth(handler);
