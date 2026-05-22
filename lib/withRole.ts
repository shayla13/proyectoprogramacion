import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import type { JWTPayload, UserRole } from './types';

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }, session: JWTPayload) => Promise<NextResponse>;

export function withRole(roles: UserRole[], handler: Handler) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }
    if (!roles.includes(session.role)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }
    return handler(req, ctx, session);
  };
}
