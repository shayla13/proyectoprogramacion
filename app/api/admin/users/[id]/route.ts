import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getUserById, updateUser } from '@/lib/dataService';
import type { JWTPayload } from '@/lib/types';

const putHandler = async (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    const updated = await updateUser(id, { is_active: !user.is_active });
    return NextResponse.json({ user: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const PUT = withRole(['admin'], putHandler);