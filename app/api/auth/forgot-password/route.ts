import { NextRequest, NextResponse } from 'next/server';
import { ForgotPasswordSchema } from '@/lib/schemas';
import { createPasswordResetToken, getSystemMode } from '@/lib/dataService';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = ForgotPasswordSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });

  const mode = await getSystemMode();
  if (mode === 'seed') {
    return NextResponse.json({ message: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación.' });
  }

  try {
    await createPasswordResetToken(parse.data.email);
  } catch {
    // Don't reveal if email exists
  }

  return NextResponse.json({ message: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación.' });
}
