'use client';

import { useState, useRef, useEffect, Suspense, KeyboardEvent, ClipboardEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function EvalDocLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="24" height="32" rx="3" fill="#DBEAFE" />
      <rect x="5" y="3" width="24" height="32" rx="3" stroke="#2563EB" strokeWidth="1.8" />
      <line x1="11" y1="13" x2="23" y2="13" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="19" x2="23" y2="19" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="25" x2="18" y2="25" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="34" cy="11" r="8" fill="#2563EB" />
      <text x="34" y="15" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">★</text>
    </svg>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const shownCode = searchParams.get('code') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCode, setResendCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(i: number, val: string) {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    setError('');
    if (cleaned && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit() {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Ingresa el código completo de 6 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código inválido');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || !email) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Usuario', email, password: 'placeholder-resend' }),
      });
      const data = await res.json();
      setResendMsg('Nuevo código generado.');
      if (data.code) setResendCode(data.code);
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setResendMsg('Error al reenviar. Intenta de nuevo.');
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full max-w-sm text-center p-10"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta verificada!</h2>
          <p className="text-sm text-gray-500 mb-1">Redirigiendo al inicio de sesión…</p>
          <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5 }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    );
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
            {/* Header */}
            <div className="flex flex-col items-center mb-7">
              <EvalDocLogo />
              <h1 className="mt-3 text-xl font-bold text-[#1E3A5F]">Verifica tu correo</h1>
                <p className="mt-1 text-sm text-gray-500 text-center">
                Enviamos un código de 6 dígitos a
              </p>
              <p className="text-sm font-semibold text-blue-600 mt-0.5">{email || 'tu correo'}</p>
            </div>

            {/* Código visible en pantalla */}
            {shownCode && (
              <div className="mb-5 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-2">Tu código de verificación es:</p>
                <p className="text-4xl font-black text-blue-700 tracking-[0.3em]">{shownCode}</p>
                <p className="text-xs text-blue-400 mt-2">Cópialo arriba o escríbelo en las casillas</p>
              </div>
            )}

            {/* 6 digit boxes */}
            <div className="flex gap-2 justify-center mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
                    ${d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-900'}
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    ${error ? 'border-red-400 bg-red-50' : ''}
                  `}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Código del reenvío */}
            {resendCode && (
              <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Nuevo código:</p>
                <p className="text-3xl font-black text-blue-700 tracking-[0.3em]">{resendCode}</p>
              </div>
            )}
            {resendMsg && !resendCode && (
              <p className="text-sm text-green-600 text-center mb-4">{resendMsg}</p>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading || digits.join('').length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Verificando...' : 'Verificar cuenta'}
            </button>

            {/* Resend */}
            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500 mb-1">¿No recibiste el código?</p>
              {countdown > 0 ? (
                <p className="text-sm text-gray-400">
                  Reenviar en <span className="font-semibold text-blue-600">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Enviando...' : 'Reenviar código'}
                </button>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <Link href="/register" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                ← Volver al registro
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          El código expira en 15 minutos
        </p>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
