import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getSystemConfig } from '@/lib/dataService';
import { sendVerificationEmail } from '@/lib/emailService';
import { supabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user || user.is_active) {
    return NextResponse.json({ message: 'Si la cuenta existe y no está activada, recibirás un nuevo correo.' });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin.from('activation_tokens').insert({ user_id: user.id, token, expires_at: expiresAt });

  const config = await getSystemConfig();
  try {
    await sendVerificationEmail(email, token, config.institution_name);
  } catch {}

  return NextResponse.json({ message: 'Si la cuenta existe y no está activada, recibirás un nuevo correo.' });
}
