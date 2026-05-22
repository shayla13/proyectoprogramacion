import { NextResponse } from 'next/server';
import { getActivePeriod, getPublicRanking, getSystemMode } from '@/lib/dataService';

export async function GET() {
  try {
    const mode = await getSystemMode();
    if (mode === 'seed') {
      return NextResponse.json({ ranking: [], period: null, mode: 'seed' });
    }
    const period = await getActivePeriod();
    if (!period) {
      return NextResponse.json({ ranking: [], period: null, mode: 'live' });
    }
    const ranking = await getPublicRanking(period.id);
    return NextResponse.json({ ranking, period, mode: 'live' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
