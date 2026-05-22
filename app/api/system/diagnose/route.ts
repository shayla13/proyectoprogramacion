import { NextResponse } from 'next/server';
import { diagnoseDatabase } from '@/lib/pgMigrate';

export async function GET() {
  const db = await diagnoseDatabase();

  let blobStatus = { ok: false, error: '' };
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) blobStatus = { ok: true, error: '' };
    else blobStatus = { ok: false, error: 'BLOB_READ_WRITE_TOKEN no configurado' };
  } catch (err) {
    blobStatus = { ok: false, error: String(err) };
  }

  let resendStatus = { ok: false, error: '' };
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      resendStatus = { ok: true, error: '' };
    } else {
      resendStatus = { ok: false, error: 'RESEND_API_KEY no configurado' };
    }
  } catch (err) {
    resendStatus = { ok: false, error: String(err) };
  }

  return NextResponse.json({
    database: db,
    blob: blobStatus,
    resend: resendStatus,
    supabase: { url: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
  });
}
