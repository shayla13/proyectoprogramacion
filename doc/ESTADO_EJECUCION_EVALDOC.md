# Estado de Ejecución - EvalDoc

Última actualización: 2026-05-19

## Tabla de Fases

| Fase | Nombre | Estado | Fecha inicio | Fecha fin | Resumen |
|------|--------|--------|--------------|-----------|---------|
| 0 | Tracking y estado del proyecto | Completado | 2026-05-19 | 2026-05-19 | Creación de archivos de seguimiento en doc/ |
| 1 | Bootstrap, Login, Registro y dataService base | Completado | 2026-05-19 | 2026-05-19 | Ver RESUMEN_FASE_1_BOOTSTRAP.md |
| 2 | Gestión de profesores (CRUD admin) | Pendiente | - | - | - |
| 3 | Gestión de períodos de evaluación | Pendiente | - | - | - |
| 4 | Flujo de evaluación estudiantil (anónimo) | Pendiente | - | - | - |
| 5 | Resultados públicos y ranking | Pendiente | - | - | - |
| 6 | Panel de administración (reportes, comentarios) | Pendiente | - | - | - |
| 7 | Dashboard del estudiante | Pendiente | - | - | - |
| 8 | Notificaciones por correo (Resend) | Pendiente | - | - | - |
| 9 | Auditoría completa (Vercel Blob) | Pendiente | - | - | - |
| 10 | Pruebas, ajustes finales y deploy | Pendiente | - | - | - |

## Leyenda de estados

- **Pendiente**: No iniciado
- **En progreso**: Trabajo en curso
- **Completado**: Terminado y verificado
- **Bloqueado**: Requiere acción externa (configurar variables de entorno, etc.)

## Notas

- Las variables de entorno en `.env.local` son placeholders. Deben configurarse con valores reales antes de ejecutar en modo live.
- En modo seed (sin DB configurada), el sistema opera con `data/seed.json` como fuente de datos.
- El admin por defecto es `admin@evaldoc.edu.co` / contraseña `admin123`.
