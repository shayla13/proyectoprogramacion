import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/lib/pgMigrate';
import { supabaseAdmin } from '@/lib/supabase';
import { getSeedData } from '@/lib/seedReader';
import { recordAudit } from '@/lib/dataService';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-bootstrap-secret');
  if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { applied, skipped, errors } = await runMigrations();

    if (errors.length > 0) {
      return NextResponse.json({ success: false, applied, skipped, errors }, { status: 500 });
    }

    // Seed system_config if empty
    const { count: configCount } = await supabaseAdmin
      .from('system_config')
      .select('*', { count: 'exact', head: true });

    if ((configCount ?? 0) === 0) {
      const seed = getSeedData();
      await supabaseAdmin.from('system_config').insert(seed.system_config);
    }

    // Seed admin user if not exists
    const seed = getSeedData();
    for (const user of seed.users) {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('email', user.email);
      if ((count ?? 0) === 0) {
        await supabaseAdmin.from('users').insert({ ...user, login_attempts: 0 });
      }
    }

    await recordAudit({
      id: randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      action: 'bootstrap',
      entity: 'system',
      summary: `Bootstrap ejecutado. Migrations aplicadas: ${applied.join(', ') || 'ninguna'}`,
    });

    return NextResponse.json({ success: true, applied, skipped, errors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
