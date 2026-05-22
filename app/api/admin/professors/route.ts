import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getProfessors, createProfessor } from '@/lib/dataService';
import { CreateProfessorSchema } from '@/lib/schemas';
import type { JWTPayload } from '@/lib/types';

const getHandler = async (
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const url = new URL(req.url);
    const activeParam = url.searchParams.get('is_active');
    const filters = activeParam !== null ? { is_active: activeParam === 'true' } : undefined;
    const professors = await getProfessors(filters);
    return NextResponse.json({ professors });
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
    const parsed = CreateProfessorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const professor = await createProfessor(session.userId, parsed.data);
    return NextResponse.json({ professor }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const GET = withRole(['admin'], getHandler);
export const POST = withRole(['admin'], postHandler);
