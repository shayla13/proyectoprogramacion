import { Resend } from 'resend';
import type { Period } from './types';

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY no configurado');
  return new Resend(apiKey);
}

function getFromEmail(): string {
  const email = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  return `EvalDoc <${email}>`;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function sendVerificationCode(to: string, code: string, institutionName: string): Promise<void> {
  const resend = getResend();

  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: `${code} es tu código de verificación — EvalDoc`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB;">
        <div style="background: #2563EB; padding: 28px 32px;">
          <h1 style="color: white; font-size: 22px; margin: 0; font-weight: 800;">EvalDoc</h1>
          <p style="color: #BFDBFE; font-size: 13px; margin: 4px 0 0;">Plataforma de evaluación docente</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hola,</p>
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 28px;">Usa este código para verificar tu cuenta en <strong>${institutionName}</strong>. Expira en <strong>15 minutos</strong>.</p>
          <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1E3A5F; font-family: monospace;">${code}</div>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Si no solicitaste esta cuenta, ignora este correo. El código expira automáticamente.</p>
        </div>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, activationToken: string, institutionName: string): Promise<void> {
  const resend = getResend();
  const verifyUrl = `${getAppUrl()}/verify?token=${activationToken}`;

  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: `Activa tu cuenta en ${institutionName} - EvalDoc`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1E3A5F; font-size: 24px;">Bienvenido a EvalDoc</h1>
        <p style="color: #6B7280;">Activa tu cuenta para comenzar a evaluar a tus profesores de forma anónima.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          Activar mi cuenta
        </a>
        <p style="color: #6B7280; font-size: 14px;">Este enlace expira en 24 horas. Si no solicitaste esta cuenta, ignora este correo.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, code: string, institutionName: string): Promise<void> {
  const resend = getResend();

  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: `${code} es tu código para restablecer contraseña — EvalDoc`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB;">
        <div style="background: #1E3A5F; padding: 28px 32px;">
          <h1 style="color: white; font-size: 22px; margin: 0; font-weight: 800;">EvalDoc</h1>
          <p style="color: #93C5FD; font-size: 13px; margin: 4px 0 0;">Restablecer contraseña</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hola,</p>
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 28px;">Usa este código para restablecer tu contraseña en <strong>${institutionName}</strong>. Expira en <strong>15 minutos</strong>.</p>
          <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1E3A5F; font-family: monospace;">${code}</div>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPeriodOpenNotification(
  period: Period,
  studentEmails: string[],
  institutionName: string
): Promise<{ sent: number; failed: number }> {
  const resend = getResend();
  let sent = 0;
  let failed = 0;

  for (const email of studentEmails) {
    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: `Nuevo período de evaluación abierto - ${institutionName}`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1E3A5F; font-size: 24px;">Período de evaluación abierto</h1>
            <p style="color: #4B5563;">El período <strong>${period.name}</strong> está ahora activo.</p>
            <p style="color: #6B7280;">Puedes evaluar a tus profesores de forma completamente anónima hasta el <strong>${period.end_date}</strong>.</p>
            <a href="${getAppUrl()}/dashboard" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
              Ir a evaluar
            </a>
          </div>
        `,
      });
      sent++;
      await new Promise(r => setTimeout(r, 100));
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}
