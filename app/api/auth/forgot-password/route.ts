import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/emailService';
import { getSystemConfig } from '@/lib/dataService';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, is_active')
      .eq('email', email)
      .single();

    if (!user) {
      // No revelar si el correo existe — pero sí mostrar el código (por eso ponemos code: null)
      return NextResponse.json({ message: 'Si existe una cuenta, recibirás un código.', code: null });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabaseAdmin.from('password_reset_tokens').insert({
      user_id: user.id,
      token: code,
      expires_at: expiresAt,
    });

    // Intentar enviar correo
    let emailSent = false;
    try {
      const config = await getSystemConfig();
      await sendPasswordResetEmail(email, code, config.institution_name);
      emailSent = true;
    } catch (err) {
      console.error('[Reset email error]', err instanceof Error ? err.message : err);
    }

    return NextResponse.json({
      message: emailSent ? 'Código enviado a tu correo.' : 'Código generado.',
      code,
      emailSent,
    });

  } catch (err) {
    console.error('[Forgot password error]', err);
    return NextResponse.json({ error: 'Error al procesar la solicitud.' }, { status: 500 });
  }
}
