import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { listUsers } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const getHandler = async (
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const users = await listUsers({ role: 'estudiante' });
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);