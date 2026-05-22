import Link from 'next/link';

function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="22" height="29" rx="3" fill="#DBEAFE" />
      <rect x="4" y="2" width="22" height="29" rx="3" stroke="#2563EB" strokeWidth="1.8" />
      <line x1="10" y1="11" x2="20" y2="11" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="17" x2="20" y2="17" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="23" x2="16" y2="23" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="31" cy="10" r="8" fill="#2563EB" />
      <text x="31" y="14" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">★</text>
    </svg>
  );
}

const stats = [
  { value: '100%', label: 'Anónimo técnico', sub: 'Sin vínculos a tu identidad' },
  { value: '5', label: 'Dimensiones', sub: 'Claridad, metodología, puntualidad, trato, dominio' },
  { value: '≥3', label: 'Para publicar', sub: 'Mínimo 3 evaluaciones para aparecer en el ranking' },
];

const features = [
  {
    color: 'bg-blue-100 text-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Anonimato por diseño',
    description: 'Ninguna evaluación queda vinculada a tu cuenta. Ni el administrador, ni el desarrollador, ni una consulta directa a la base de datos puede revelar quién evaluó a quién.',
  },
  {
    color: 'bg-green-100 text-green-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Ranking público',
    description: 'Los promedios por dimensión y el ranking general son accesibles sin iniciar sesión. Cualquiera puede ver el impacto real de las evaluaciones.',
  },
  {
    color: 'bg-purple-100 text-purple-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: 'Evaluación multidimensional',
    description: 'Califica a cada profesor en 5 aspectos clave: claridad, metodología, puntualidad, trato al estudiante y dominio del tema. Una visión completa del desempeño docente.',
  },
  {
    color: 'bg-amber-100 text-amber-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Períodos académicos',
    description: 'Las evaluaciones se abren y cierran por períodos configurados por la institución. Recibes notificación cuando hay un período activo.',
  },
  {
    color: 'bg-red-100 text-red-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Sin doble evaluación',
    description: 'El sistema detecta automáticamente si ya evaluaste a un profesor en el período actual, sin saber quién eres. Cada evaluación cuenta una sola vez.',
  },
  {
    color: 'bg-cyan-100 text-cyan-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'Comentarios opcionales',
    description: 'Además de la calificación numérica, puedes dejar un comentario cualitativo anónimo que el administrador puede revisar para retroalimentación más detallada.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Crea tu cuenta',
    desc: 'Regístrate con cualquier correo electrónico. El proceso toma menos de un minuto.',
    color: 'text-blue-400',
  },
  {
    n: '02',
    title: 'Evalúa tus profesores',
    desc: 'Cuando haya un período activo, califica a cada profesor en 5 dimensiones de forma completamente anónima.',
    color: 'text-blue-300',
  },
  {
    n: '03',
    title: 'Ve el impacto',
    desc: 'Los resultados aparecen en el ranking público cuando un profesor acumula al menos 3 evaluaciones.',
    color: 'text-blue-200',
  },
];

const dimensions = [
  { name: 'Claridad', desc: 'Qué tan claro explica los temas', pct: 82 },
  { name: 'Metodología', desc: 'Técnicas y estrategias de enseñanza', pct: 76 },
  { name: 'Puntualidad', desc: 'Cumplimiento de horarios y compromisos', pct: 90 },
  { name: 'Trato', desc: 'Respeto y atención al estudiante', pct: 88 },
  { name: 'Dominio', desc: 'Conocimiento profundo de la materia', pct: 85 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="text-lg font-extrabold text-[#1E3A5F] tracking-tight">EvalDoc</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/ranking" className="hover:text-blue-600 transition-colors">Ranking</Link>
            <Link href="#como-funciona" className="hover:text-blue-600 transition-colors">¿Cómo funciona?</Link>
            <Link href="#dimensiones" className="hover:text-blue-600 transition-colors">Dimensiones</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-700 border border-gray-200 hover:border-blue-400 hover:text-blue-600 px-4 py-2 rounded-lg transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold shadow-sm">
              Registrarse →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-blue-700 to-blue-500 text-white">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Anonimato garantizado técnicamente
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
                Tu opinión<br />
                <span className="text-blue-200">mejora la educación.</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-md">
                Evalúa a tus profesores sin miedo a represalias. EvalDoc garantiza tu anonimato a nivel de arquitectura —
                nadie puede saber quién evaluó a quién.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-7 py-3 rounded-xl transition-colors shadow-lg">
                  Empezar a evaluar
                </Link>
                <Link href="/ranking" className="border border-white/40 hover:bg-white/10 text-white font-semibold px-7 py-3 rounded-xl transition-colors">
                  Ver ranking →
                </Link>
              </div>
            </div>

            {/* Mock evaluation card */}
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-400/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Prof. Juan Rodríguez</div>
                    <div className="text-blue-200 text-xs">Cálculo Diferencial · Ing. de Sistemas</div>
                  </div>
                </div>
                {dimensions.map((d) => (
                  <div key={d.name} className="mb-3">
                    <div className="flex justify-between text-xs text-blue-100 mb-1">
                      <span>{d.name}</span>
                      <span className="font-semibold">{(d.pct / 20).toFixed(1)} / 5</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-300 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <span className="text-xs text-blue-200">Promedio general</span>
                  <span className="text-xl font-black text-white">4.4 <span className="text-blue-200 text-sm font-normal">/ 5</span></span>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs text-green-300 bg-green-400/20 px-2 py-0.5 rounded-full">✓ Evaluación anónima</span>
                </div>
              </div>
            </div>
          </div>

          {/* Curva inferior */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 60 0 20L0 60Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-14 px-6 bg-white">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.value} className="p-5">
                <div className="text-4xl font-black text-blue-600 mb-1">{s.value}</div>
                <div className="font-semibold text-gray-800 text-sm mb-1">{s.label}</div>
                <div className="text-xs text-gray-500">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-16 px-6 bg-gray-50" id="features">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-[#1E3A5F] mb-3">¿Por qué EvalDoc?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Una plataforma diseñada desde cero para garantizar que los estudiantes puedan opinar sin miedo.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dimensiones ── */}
        <section className="py-16 px-6 bg-white" id="dimensiones">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-[#1E3A5F] mb-3">Las 5 dimensiones</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Cada profesor se evalúa en cinco aspectos clave del desempeño docente, con una calificación del 1 al 5.
              </p>
              <div className="space-y-4">
                {dimensions.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold text-gray-800">{d.name}</span>
                      <span className="text-gray-400 text-xs">{d.desc}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-blue-600">4.4</div>
                <div className="text-sm text-blue-500 mt-1">Promedio general ejemplo</div>
              </div>
              <div className="space-y-3">
                {['Claridad', 'Metodología', 'Puntualidad', 'Trato', 'Dominio'].map((dim, i) => {
                  const scores = [4, 4, 5, 5, 4];
                  return (
                    <div key={dim} className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">{dim}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <div
                            key={n}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                              n <= scores[i] ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-300'
                            }`}
                          >{n}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="py-16 px-6 bg-[#1E3A5F]" id="como-funciona">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-white mb-3">¿Cómo funciona?</h2>
              <p className="text-blue-200">Tres pasos simples para contribuir a la mejora educativa.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <div key={s.n} className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-blue-600/30 z-0" />
                  )}
                  <div className="relative z-10">
                    <div className={`text-5xl font-black ${s.color} mb-4`}>{s.n}</div>
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-blue-200 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section className="py-20 px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-block mb-4">
              <Logo size={48} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#1E3A5F] mb-4">
              Haz que tu voz cuente.
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              Cada evaluación contribuye a mejorar la calidad educativa de tu institución.
              Tu participación es anónima, segura y libre de represalias.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-blue-200 text-base"
              >
                Crear cuenta gratis →
              </Link>
              <Link
                href="/login"
                className="border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-white font-semibold">EvalDoc</span>
            <span className="text-gray-600">— Evaluación docente anónima</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/ranking" className="hover:text-white transition-colors">Ranking</Link>
            <Link href="/login" className="hover:text-white transition-colors">Ingresar</Link>
            <Link href="/register" className="hover:text-white transition-colors">Registrarse</Link>
            <Link href="/setup-database" className="hover:text-white transition-colors text-gray-600">Setup BD</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
