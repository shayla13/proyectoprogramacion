import { NextRequest, NextResponse } from 'next/server';
import { getActivePeriod, getPublicProfessorProfile } from '@/lib/dataService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const period = await getActivePeriod();
    if (!period) {
      return NextResponse.json({ error: 'No hay período activo' }, { status: 404 });
    }
    const profile = await getPublicProfessorProfile(id, period.id);
    if (!profile) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ profile, period });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
