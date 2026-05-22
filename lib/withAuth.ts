import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import type { JWTPayload } from './types';

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }, session: JWTPayload) => Promise<NextResponse>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }
    return handler(req, ctx, session);
  };
}
