import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getPeriods, createPeriod } from '@/lib/dataService';
import { CreatePeriodSchema } from '@/lib/schemas';
import type { JWTPayload } from '@/lib/types';
import { ConflictError } from '@/lib/dataService';

const getHandler = async (
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const periods = await getPeriods();
    return NextResponse.json({ periods });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

const postHandler = async (
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const body = await req.json();
    const parsed = CreatePeriodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const period = await createPeriod(session.userId, parsed.data);
    return NextResponse.json({ period }, { status: 201 });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);
export const POST = withRole(['admin'], postHandler);
