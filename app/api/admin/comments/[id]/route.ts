import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { deleteComment } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const deleteHandler = async (
  _req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    await deleteComment(id, session.userId);
    return NextResponse.json({ message: 'Comentario moderado correctamente' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const DELETE = withRole(['admin'], deleteHandler);