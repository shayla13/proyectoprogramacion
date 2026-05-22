import { NextResponse } from 'next/server';
import { getProfessors } from '@/lib/dataService';

export async function GET() {
  try {
    const professors = await getProfessors({ is_active: true });
    return NextResponse.json({ professors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
