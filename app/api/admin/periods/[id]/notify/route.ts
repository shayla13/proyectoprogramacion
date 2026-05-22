import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/withRole';
import { getPeriods, listUsers, getSystemConfig } from '@/lib/dataService';
import { sendPeriodOpenNotification } from '@/lib/emailService';
import type { JWTPayload } from '@/lib/types';

const postHandler = async (
  _req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  _session: JWTPayload
) => {
  try {
    const { id } = await ctx.params;
    const periods = await getPeriods();
    const period = periods.find((p) => p.id === id);
    if (!period) {
      return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 });
    }

    const config = await getSystemConfig();
    const users = await listUsers({ is_active: true });
    const studentEmails = users
      .filter((u) => u.role === 'estudiante')
      .map((u) => u.email);

    const { sent, failed } = await sendPeriodOpenNotification(
      period,
      studentEmails,
      config.institution_name
    );

    return NextResponse.json({ sent, failed, total: studentEmails.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};

export const POST = withRole(['admin'], postHandler);
