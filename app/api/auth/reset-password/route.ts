import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    // Buscar usuario
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) return NextResponse.json({ error: 'Correo no encontrado' }, { status: 400 });

    // Buscar token válido
    const { data: tokenData } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('token', String(code).trim())
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!tokenData) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
    }
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'El código ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    // Actualizar contraseña
    const hash = await bcrypt.hash(password, 10);
    await supabaseAdmin
      .from('users')
      .update({ password_hash: hash, login_attempts: 0, locked_until: null })
      .eq('id', user.id);

    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (err) {
    console.error('[Reset password error]', err);
    return NextResponse.json({ error: 'Error al restablecer la contraseña' }, { status: 500 });
  }
}
