import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { updatePeriod, closePeriod, getPeriods } from '@/lib/dataService';
import { UpdatePeriodSchema } from '@/lib/schemas';
import type { JWTPayload } from '@/lib/types';

const putHandler = async (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = UpdatePeriodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const period = await updatePeriod(id, session.userId, parsed.data);
    return NextResponse.json({ period });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

// DELETE = close period (soft close per spec)
const deleteHandler = async (
  _req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    // Verify it exists
    const periods = await getPeriods();
    const period = periods.find((p) => p.id === id);
    if (!period) {
      return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
    }
    const closed = await closePeriod(id, session.userId);
    return NextResponse.json({ period: closed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const PUT = withRole(['admin'], putHandler);
export const DELETE = withRole(['admin'], deleteHandler);
