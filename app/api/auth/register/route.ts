import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { RegisterSchema } from '@/lib/schemas';
import { ConflictError } from '@/lib/dataService';
import { supabaseAdmin } from '@/lib/supabase';
import { sendVerificationCode } from '@/lib/emailService';
import { getSystemConfig } from '@/lib/dataService';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
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
    if (error.code === '23505') {
      // Si ya existe pero no está activo, permitir reenviar código
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, is_active')
        .eq('email', email)
        .single();

      if (existing && !existing.is_active) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabaseAdmin.from('activation_tokens').insert({
          user_id: existing.id,
          token: code,
          expires_at: expiresAt,
        });
        try {
          const config = await getSystemConfig();
          await sendVerificationCode(email, code, config.institution_name);
        } catch { /* ignorar error de correo */ }
        return NextResponse.json({ message: 'Nuevo código generado.', code }, { status: 200 });
      }

      return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }

  // Generar código de 6 dígitos
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabaseAdmin.from('activation_tokens').insert({
    user_id: user.id,
    token: code,
    expires_at: expiresAt,
  });

  // Intentar enviar correo
  let emailError = '';
  try {
    const config = await getSystemConfig();
    await sendVerificationCode(email, code, config.institution_name);
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error('[Resend error]', emailError);
  }

  return NextResponse.json({
    message: 'Cuenta creada. Ingresa el código para verificar.',
    code,
    emailSent: !emailError,
    emailError: emailError || undefined,
  }, { status: 201 });
}
