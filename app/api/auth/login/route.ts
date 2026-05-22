import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@/lib/schemas';
import { signToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import { ensureDatabase } from '@/lib/dbInit';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parse = LoginSchema.safeParse(body);
    if (!parse.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { email, password } = parse.data;

    // Buscar usuario directamente en Supabase
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !user) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    // Verificar bloqueo
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Cuenta bloqueada. Intenta en ${minutes} minuto${minutes !== 1 ? 's' : ''}.` },
        { status: 429 }
      );
    }

    // Verificar cuenta activa
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Cuenta no verificada. Regístrate de nuevo para obtener un código.', code: 'NOT_VERIFIED' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Incrementar intentos
      const attempts = (user.login_attempts || 0) + 1;
      const update: Record<string, unknown> = { login_attempts: attempts };
      if (attempts >= 5) update.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await supabaseAdmin.from('users').update(update).eq('id', user.id);
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    // Reset intentos
    await supabaseAdmin.from('users').update({ login_attempts: 0, locked_until: null }).eq('id', user.id);

    // Auditoría para admin (sin bloquear)
    if (user.role === 'admin') {
      try {
        const { appendAuditEntry } = await import('@/lib/blobAudit');
        await appendAuditEntry({
          id: randomBytes(16).toString('hex'),
          timestamp: new Date().toISOString(),
          user_id: user.id,
          user_email: user.email,
          user_role: 'admin',
          action: 'login',
          entity: 'user',
          summary: `Admin inició sesión: ${user.email}`,
        });
      } catch { /* auditoría opcional */ }
    }

    const token = await signToken({ userId: user.id, role: user.role, email: user.email });
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return res;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Login error]', msg);
    return NextResponse.json({
      error: msg.includes('not exist') || msg.includes('does not exist')
        ? 'La base de datos aún se está inicializando. Espera unos segundos e intenta de nuevo.'
        : 'Error al iniciar sesión. Intenta de nuevo.'
    }, { status: 500 });
  }
}
