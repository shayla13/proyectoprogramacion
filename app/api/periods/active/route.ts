import { NextResponse } from 'next/server';
import { getActivePeriod } from '@/lib/dataService';

export async function GET() {
  try {
    const period = await getActivePeriod();
    return NextResponse.json({ period });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
