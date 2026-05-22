import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getSystemConfig, updateSystemConfig } from '@/lib/dataService';
import { SystemConfigSchema } from '@/lib/schemas';
import type { JWTPayload } from '@/lib/types';

const getHandler = async (
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const config = await getSystemConfig();
    return NextResponse.json({ config });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

const putHandler = async (
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const body = await req.json();
    const parsed = SystemConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const config = await updateSystemConfig(parsed.data, session.userId);
    return NextResponse.json({ config });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);
export const PUT = withRole(['admin'], putHandler);