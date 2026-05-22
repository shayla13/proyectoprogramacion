import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@/lib/schemas';
import { getUserByEmail, resetLoginAttempts, incrementLoginAttempts, getSystemMode, recordAudit } from '@/lib/dataService';
import { signToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = LoginSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { email, password } = parse.data;
  const user = await getUserByEmail(email);

  if (!user) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  // Check account lock
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutes} minuto${minutes !== 1 ? 's' : ''}.` },
      { status: 429 }
    );
  }

  // Check active account
  if (!user.is_active) {
    return NextResponse.json(
      { error: 'Tu cuenta aún no está verificada. Revisa tu correo institucional.', code: 'NOT_VERIFIED' },
      { status: 401 }
    );
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const mode = await getSystemMode();
    if (mode === 'live') {
      await incrementLoginAttempts(user.id);
    }
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const mode = await getSystemMode();
  if (mode === 'live') {
    await resetLoginAttempts(user.id);
  }

  if (user.role === 'admin') {
    try {
      await recordAudit({
        id: randomBytes(16).toString('hex'),
        timestamp: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
        user_role: 'admin',
        action: 'login',
        entity: 'user',
        summary: `Admin inició sesión: ${user.email}`,
      });
    } catch {}
  }

  const token = await signToken({ userId: user.id, role: user.role, email: user.email });

  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return res;
}
