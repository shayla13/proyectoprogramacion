import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ResetPasswordSchema } from '@/lib/schemas';
import { resetPassword, NotFoundError, ValidationError } from '@/lib/dataService';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = ResetPasswordSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });

  const { token, password } = parse.data;
  const hash = await bcrypt.hash(password, 10);

  try {
    await resetPassword(token, hash);
    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al restablecer la contraseña' }, { status: 500 });
  }
}
