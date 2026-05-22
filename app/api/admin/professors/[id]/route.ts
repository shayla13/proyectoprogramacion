import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getProfessorById, updateProfessor, deactivateProfessor } from '@/lib/dataService';
import { UpdateProfessorSchema } from '@/lib/schemas';
import type { JWTPayload } from '@/lib/types';

const putHandler = async (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    const professor = await getProfessorById(id);
    if (!professor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 });
    }
    const body = await req.json();
    const parsed = UpdateProfessorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const updated = await updateProfessor(id, session.userId, parsed.data);
    return NextResponse.json({ professor: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

const deleteHandler = async (
  _req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    const professor = await getProfessorById(id);
    if (!professor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 });
    }
    const deactivated = await deactivateProfessor(id, session.userId);
    return NextResponse.json({ professor: deactivated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const PUT = withRole(['admin'], putHandler);
export const DELETE = withRole(['admin'], deleteHandler);
