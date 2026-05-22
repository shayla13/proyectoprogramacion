# Resumen Fase 1 - Bootstrap, Login, Registro y dataService base

Fecha de ejecución: 2026-05-19

## Archivos creados

### Infraestructura y configuración
- `.env.local` - Variables de entorno (placeholders)
- `next.config.ts` - Configuración de Next.js con headers anti-caché para APIs
- `proxy.ts` - Protección de rutas (Next.js 16 usa "proxy" en lugar de "middleware"): redirige a /login si no autenticado, bloquea /admin si no es admin

### Datos y migraciones
- `data/seed.json` - Usuario admin por defecto y configuración del sistema
- `data/config.json` - Versión y nombre del sistema
- `supabase/migrations/0001_init_users.sql` - Tablas: users, activation_tokens, password_reset_tokens, system_config, _migrations

### Librerías (`lib/`)
- `lib/types.ts` - Todas las interfaces TypeScript del dominio
- `lib/schemas.ts` - Esquemas de validación Zod
- `lib/supabase.ts` - Clientes Supabase (admin y público)
- `lib/auth.ts` - JWT sign/verify con jose, getSession()
- `lib/withAuth.ts` - HOC para rutas autenticadas
- `lib/withRole.ts` - HOC para rutas con control de rol
- `lib/seedReader.ts` - Lector de data/seed.json con caché
- `lib/pgMigrate.ts` - Ejecutor de migraciones SQL con pg
- `lib/blobAudit.ts` - Auditoría en Vercel Blob (append por mes)
- `lib/emailService.ts` - Correos con Resend (verificación, reset, notificación de período)
- `lib/anonymizationService.ts` - Hash SHA256 de identidad estudiantil para evaluaciones
- `lib/evaluationService.ts` - Cálculo de promedios y ranking público
- `lib/dataService.ts` - Capa única de acceso a datos. Detecta modo seed vs live automáticamente.

### API Routes
- `POST /api/system/bootstrap` - Aplica migraciones y siembra datos iniciales (requiere header x-bootstrap-secret)
- `GET /api/system/diagnose` - Estado de DB, Blob y Resend
- `GET /api/system/mode` - Devuelve 'seed' o 'live'
- `POST /api/auth/login` - Login con bcrypt + JWT cookie
- `POST /api/auth/logout` - Elimina cookie de sesión
- `POST /api/auth/register` - Registro con validación de dominio + envío de email de activación
- `POST /api/auth/verify` - Activa cuenta por token de email
- `GET /api/auth/me` - Devuelve datos del usuario autenticado
- `POST /api/auth/forgot-password` - Genera token de reset y envía email
- `POST /api/auth/reset-password` - Cambia contraseña por token
- `POST /api/auth/change-password` - Cambia contraseña (requiere sesión + password actual)
- `POST /api/auth/resend-verification` - Reenvía correo de activación

### Páginas frontend
- `app/page.tsx` - Landing pública con CTA para registro/login
- `app/login/page.tsx` - Login con identidad visual EvalDoc (Framer Motion, logo SVG, azul institucional)
- `app/register/page.tsx` - Registro con estado de éxito "revisa tu correo"
- `app/verify/page.tsx` - Verificación de email por token URL
- `app/forgot-password/page.tsx` - Solicitar reset de contraseña
- `app/reset-password/page.tsx` - Ingresar nueva contraseña por token

## Características de seguridad implementadas

1. **Bloqueo de cuenta**: 5 intentos fallidos bloquean la cuenta 15 minutos
2. **Verificación de dominio**: Solo se aceptan correos del dominio configurado
3. **Tokens de un solo uso**: activation_tokens y password_reset_tokens se marcan como usados
4. **Expiración**: Tokens de activación 24h, reset 15 min
5. **Cookie httpOnly**: El JWT se almacena en cookie httpOnly (no accesible por JS del cliente)
6. **Anonimato**: Las evaluaciones no almacenan student_id, solo el hash SHA256
7. **Audit log**: Logins de admin y operaciones críticas se registran en Vercel Blob

## Modo seed vs live

El sistema detecta automáticamente el modo:
- **seed**: Supabase no disponible o tabla users no existe. Usa data/seed.json. El registro de nuevos usuarios está deshabilitado.
- **live**: Supabase disponible con tablas migradas. Todas las funciones están disponibles.

## Próximos pasos

- Configurar variables de entorno reales en Vercel/local
- Ejecutar `POST /api/system/bootstrap` con el header correcto para aplicar migraciones
- Continuar con Fase 2: CRUD de profesores
