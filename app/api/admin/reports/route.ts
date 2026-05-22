import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getAdminReport } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const getHandler = async (
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const url = new URL(req.url);
    const professor_id = url.searchParams.get('professor_id') ?? undefined;
    const period_id = url.searchParams.get('period_id') ?? undefined;
    const subject = url.searchParams.get('subject') ?? undefined;

    const report = await getAdminReport({ professor_id, period_id, subject });
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);
