import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { RegisterSchema } from '@/lib/schemas';
import { supabaseAdmin } from '@/lib/supabase';
import { sendVerificationCode } from '@/lib/emailService';
import { getSystemConfig } from '@/lib/dataService';
import { ensureDatabase } from '@/lib/dbInit';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parse = RegisterSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password } = parse.data;
    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario con is_active = false hasta verificar
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ name, email, password_hash, role: 'estudiante', is_active: false, login_attempts: 0 })
      .select()
      .single();

    if (error) {
      // Correo duplicado
      if (error.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id, is_active')
          .eq('email', email)
          .single();

        if (existing && !existing.is_active) {
          // Reenviar código a cuenta pendiente
          const code = generateCode();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          await supabaseAdmin.from('activation_tokens').insert({
            user_id: existing.id,
            token: code,
            expires_at: expiresAt,
          });
          let emailSent = false;
          try {
            const config = await getSystemConfig();
            await sendVerificationCode(email, code, config.institution_name);
            emailSent = true;
          } catch { /* ignorar */ }
          return NextResponse.json({ message: 'Nuevo código generado.', code, emailSent }, { status: 200 });
        }

        return NextResponse.json({ error: 'Ya existe una cuenta activa con este correo' }, { status: 409 });
      }

      console.error('[Register] Supabase error:', error.message);
      return NextResponse.json({
        error: 'No se pudo crear la cuenta. ' + (error.message.includes('does not exist')
          ? 'La base de datos aún se está inicializando, espera unos segundos y vuelve a intentarlo.'
          : error.message)
      }, { status: 500 });
    }

    // Generar y guardar código de 6 dígitos
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabaseAdmin.from('activation_tokens').insert({
      user_id: user.id,
      token: code,
      expires_at: expiresAt,
    });

    // Intentar enviar correo
    let emailSent = false;
    try {
      const config = await getSystemConfig();
      await sendVerificationCode(email, code, config.institution_name);
      emailSent = true;
    } catch (err) {
      console.error('[Resend error]', err instanceof Error ? err.message : err);
    }

    return NextResponse.json({
      message: 'Cuenta creada.',
      code,
      emailSent,
    }, { status: 201 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Register] Error inesperado:', msg);
    return NextResponse.json({
      error: msg.includes('does not exist') || msg.includes('not exist')
        ? 'La base de datos aún se está inicializando. Espera unos segundos y vuelve a intentarlo.'
        : 'Error al registrar. Intenta de nuevo.',
    }, { status: 500 });
  }
}
