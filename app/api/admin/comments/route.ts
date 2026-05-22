import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getComments } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const getHandler = async (
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const url = new URL(req.url);
    const period_id = url.searchParams.get('period_id');
    if (!period_id) {
      return NextResponse.json({ error: 'period_id es requerido' }, { status: 400 });
    }
    const professor_id = url.searchParams.get('professor_id') ?? undefined;
    const comments = await getComments(period_id, professor_id);
    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);
