import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { readAuditMonthData } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const getHandler = async (
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7).replace('-', '');
    const entries = await readAuditMonthData(month);
    return NextResponse.json({ entries });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);