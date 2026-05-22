'use client';

export default function SeedModeBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-400 px-4 py-2 text-center">
      <p className="text-sm text-amber-800 font-medium">
        Modo Semilla activo — Base de datos no configurada.{' '}
        <a href="/admin/db-setup" className="underline hover:text-amber-900">
          Ir a configuración del sistema →
        </a>
      </p>
    </div>
  );
}
