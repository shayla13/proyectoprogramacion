'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import Card from '@/components/ui/Card';

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'estudiante';
}

export default function AdminPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUserInfo(d.user));
  }, []);

  const links = [
    { href: '/admin/professors', label: 'Profesores', desc: 'Gestiona el listado de profesores' },
    { href: '/admin/periods', label: 'Periodos', desc: 'Administra los periodos de evaluacion' },
    { href: '/admin/reports', label: 'Reportes', desc: 'Consulta resultados de evaluaciones' },
    { href: '/admin/comments', label: 'Comentarios', desc: 'Modera comentarios de estudiantes' },
    { href: '/admin/users', label: 'Usuarios', desc: 'Gestiona cuentas de estudiantes' },
    { href: '/admin/config', label: 'Configuracion', desc: 'Ajusta parametros del sistema' },
    { href: '/admin/audit', label: 'Auditoria', desc: 'Revisa el historial de acciones' },
  ];

  return (
    <AppLayout role="admin" userName={userInfo?.name} userEmail={userInfo?.email} institutionName="EvalDoc">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Panel de Administracion</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bienvenido{userInfo?.name ? `, ${userInfo.name.split(' ')[0]}` : ''}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map(link => (
            <Link key={link.href} href={link.href}>
              <Card className="p-4 hover:border-blue-300 transition-colors cursor-pointer">
                <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}