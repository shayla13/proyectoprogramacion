import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verificación por código de 6 dígitos (email + code)
  if (body.email && body.code) {
    const { email, code } = body;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, is_active')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Correo no encontrado' }, { status: 400 });
    }

    if (user.is_active) {
      return NextResponse.json({ message: 'Esta cuenta ya está verificada' });
    }

    const { data: tokenData } = await supabaseAdmin
      .from('activation_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('token', String(code).trim())
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!tokenData) {
      return NextResponse.json({ error: 'Código incorrecto. Verifica e intenta de nuevo.' }, { status: 400 });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'El código ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    await supabaseAdmin.from('users').update({ is_active: true }).eq('id', user.id);
    await supabaseAdmin
      .from('activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return NextResponse.json({ message: '¡Cuenta verificada! Ya puedes iniciar sesión.' });
  }

  // Verificación por token de enlace (compatibilidad)
  if (body.token) {
    const { data: tokenData } = await supabaseAdmin
      .from('activation_tokens')
      .select('*')
      .eq('token', body.token)
      .single();

    if (!tokenData) return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    if (tokenData.used_at) return NextResponse.json({ error: 'Este enlace ya fue utilizado' }, { status: 400 });
    if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'El enlace ha expirado' }, { status: 400 });

    await supabaseAdmin.from('users').update({ is_active: true }).eq('id', tokenData.user_id);
    await supabaseAdmin
      .from('activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return NextResponse.json({ message: 'Cuenta activada exitosamente' });
  }

  return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
}
