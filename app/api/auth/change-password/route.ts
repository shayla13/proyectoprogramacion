import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ChangePasswordSchema } from '@/lib/schemas';
import { getUserById, updateUser } from '@/lib/dataService';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const parse = ChangePasswordSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });

  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const valid = await bcrypt.compare(parse.data.currentPassword, user.password_hash);
  if (!valid) return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });

  const newHash = await bcrypt.hash(parse.data.newPassword, 10);
  await updateUser(session.userId, { password_hash: newHash });

  return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
}
