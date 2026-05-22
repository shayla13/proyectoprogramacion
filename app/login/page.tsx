'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function EvalDocLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="26" height="34" rx="3" fill="#DBEAFE" />
      <rect x="6" y="4" width="26" height="34" rx="3" stroke="#2563EB" strokeWidth="2" />
      <line x1="13" y1="14" x2="26" y2="14" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="20" x2="26" y2="20" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="26" x2="21" y2="26" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="12" r="8" fill="#2563EB" />
      <text x="36" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">★</text>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResend(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        if (data.code === 'NOT_VERIFIED') {
          setShowResend(true);
        }
        return;
      }

      // Redirect based on role
      if (data.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setError('Te enviamos un nuevo correo de verificación.');
      setShowResend(false);
    } catch {
      setError('No se pudo reenviar el correo. Intenta más tarde.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Blue top border */}
          <div className="h-1 bg-blue-600" />

          <div className="px-8 py-8">
            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-8">
              <EvalDocLogo />
              <h1 className="mt-3 text-2xl font-semibold text-blue-900">EvalDoc</h1>
              <p className="mt-1 text-sm text-gray-400">Tu opinión mejora la educación.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo institucional
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@evaldoc.edu.co"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-300"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-300"
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                >
                  {error}
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="block mt-1 text-blue-600 hover:underline"
                    >
                      Reenviar correo de verificación
                    </button>
                  )}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-5 flex flex-col items-center gap-2 text-sm text-gray-500">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Olvidé mi contraseña
              </Link>
              <span>
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Regístrate
                </Link>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
