'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.code) {
        setCode(data.code);
        setEmailSent(data.emailSent);
      } else {
        setError('No existe una cuenta con ese correo.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="px-8 py-8">

            <div className="text-center mb-7">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-[#1E3A5F]">¿Olvidaste tu contraseña?</h1>
              <p className="text-sm text-gray-500 mt-1">Ingresa tu correo y te damos un código</p>
            </div>

            {!code ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {loading ? 'Procesando...' : 'Obtener código'}
                </button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-4 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-2">
                    {emailSent ? '📧 Código enviado a tu correo:' : 'Tu código de recuperación:'}
                  </p>
                  <p className="text-4xl font-black text-blue-700 tracking-[0.3em]">{code}</p>
                  <p className="text-xs text-blue-400 mt-2">Expira en 15 minutos</p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Cuenta: <strong>{email}</strong>
                </p>

                <Link
                  href={`/reset-password?email=${encodeURIComponent(email)}&code=${code}`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm text-center"
                >
                  Continuar → crear nueva contraseña
                </Link>
              </motion.div>
            )}

            <div className="mt-5 text-center">
              <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600">
                ← Volver al login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
