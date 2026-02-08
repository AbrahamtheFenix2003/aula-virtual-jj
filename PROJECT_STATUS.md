# Estado del Proyecto - Aula Virtual Jiu-Jitsu

## Descripción General
Plataforma de gestión para academias de Jiu-Jitsu que permite el seguimiento de asistencias, gestión de grados (cinturones), control de pagos y biblioteca de videos técnicos.

---

## Lo que ya está hecho ✅

### Autenticación y Usuarios
- [x] Login con credenciales (email/password)
- [x] Registro de nuevos alumnos
- [x] Recuperación y reajuste de contraseña
- [x] Integración con NextAuth.js (soporta Google OAuth)
- [x] Roles definidos: `ALUMNO`, `INSTRUCTOR`, `ADMIN`

### Asistencias
- [x] UI con calendario interactivo para alumnos
- [x] API para registro de asistencias
- [x] API de estadísticas de asistencia
- [x] Clasificación por tipo de clase (GI, NOGI, Competición, etc.)

### Sistema de Grados y Exámenes
- [x] API de promociones de cinturón (CRUD completo)
- [x] API de exámenes (CRUD + inscripciones + evaluación)
- [x] Página `/grados` - Historial de promociones del alumno
- [x] Página `/examenes` - Listado con tabs por estado
- [x] Página `/examenes/nuevo` - Crear nuevo examen
- [x] Página `/examenes/[id]` - Detalle con gestión de inscritos
- [x] Página `/examenes/[id]/evaluar` - Evaluación masiva con promoción automática
- [x] Componentes: BeltBadge, ExamCard, ExamStatusBadge, etc.
- [x] Verificación de requisitos (asistencias mínimas, videos completados)
- [x] Control de acceso por roles (ALUMNO, INSTRUCTOR, ADMIN)

### Biblioteca de Videos (Infraestructura Base)
- [x] Listado de videos con filtrado automático por nivel de cinturón
- [x] API para registro de visualizaciones (views)
- [x] Sistema de progreso por video (segundos vistos, porcentaje)

### Infraestructura Técnica
- [x] Schema de base de datos completo (PostgreSQL + Prisma)
- [x] Configuración de UI con Tailwind CSS 4 y shadcn/ui
- [x] Layout principal y Sidebar de navegación
- [x] API v1 estructurada y versionada

---

## Lo que falta por hacer (Roadmap) 🔲

### 1. Migración de Videos (Prioridad Máxima)
- [ ] Migrar almacenamiento de Google Drive a **YouTube**
- [ ] Actualizar Schema de Prisma (`driveFileId` -> `youtubeVideoId`)
- [ ] Crear página de detalle de video (`/videos/[id]`) con reproductor embebido
- [ ] Implementar CRUD de videos para Instructores/Admins

### 2. Gestión de Pagos
- [ ] Interfaz para que el alumno vea su estado de pagos y mensualidades
- [ ] Integración completa con **Stripe** (Checkout y Webhooks)
- [ ] Panel de administración para registrar pagos manuales (Efectivo/Transferencia)

### 3. Sistema de Grados y Exámenes ✅ COMPLETADO
- [x] Interfaz de gestión de cinturones y grados (stripes)
- [x] Módulo de programación de exámenes de grado
- [x] Registro de inscripciones y evaluación de resultados de exámenes
- [x] Endpoint `/api/v1/users` con filtros por cinturón y rol

### 4. Administración y Configuración
- [ ] Panel de control (Dashboard) con métricas para instructores
- [ ] Gestión de perfiles de usuario
- [ ] Configuración de la Academia (Multi-tenancy)
- [ ] Sistema de auditoría (Logs de actividad)

---

## Decisiones Técnicas Tomadas
- **Framework**: Next.js 16 (App Router)
- **Base de Datos**: PostgreSQL + Prisma 7
- **Video**: YouTube (Videos "no listados" para privacidad básica)
- **Pagos**: Stripe + Gestión manual
- **Idioma**: UI en Español, código en Inglés (según convenciones)
