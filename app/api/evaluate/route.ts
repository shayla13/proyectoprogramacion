import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { SubmitEvaluationSchema } from '@/lib/schemas';
import { submitEvaluation, ConflictError, ForbiddenError, NotFoundError } from '@/lib/dataService';

export const POST = withAuth(async (req: NextRequest, _ctx, session) => {
  const body = await req.json();
  const parse = SubmitEvaluationSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
  }

  try {
    await submitEvaluation(session.userId, parse.data);
    return NextResponse.json({ message: 'Evaluación enviada de forma anónima.' });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message, code: 'PERIOD_INACTIVE' }, { status: 403 });
    if (err instanceof ConflictError) return NextResponse.json({ error: err.message, code: 'ALREADY_EVALUATED' }, { status: 409 });
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    return NextResponse.json({ error: 'Error al enviar la evaluación' }, { status: 500 });
  }
});
