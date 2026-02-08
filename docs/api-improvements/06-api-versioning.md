# Mejora 6: Versionado de API - IMPLEMENTADO

## Estado: COMPLETADO

## Descripcion

Se implemento versionado de API usando URL Path Versioning. Todos los endpoints (excepto auth) ahora estan bajo `/api/v1/`.

## Nueva Estructura de Carpetas

```
src/app/api/
├── auth/                          # Sin version (NextAuth requiere ubicacion fija)
│   ├── [...nextauth]/route.ts
│   ├── register/route.ts
│   ├── forgot-password/route.ts
│   └── reset-password/route.ts
├── v1/                            # VERSION 1
│   ├── attendance/
│   │   ├── route.ts               # GET (list), POST (create)
│   │   ├── [id]/route.ts          # DELETE
│   │   └── stats/route.ts         # GET (statistics)
│   ├── videos/
│   │   ├── stream/[id]/route.ts   # GET (streaming)
│   │   └── [id]/views/route.ts    # POST (register view)
│   └── health/route.ts            # GET (health check)
├── attendance/                    # DEPRECATED - Redirects a v1
├── videos/                        # DEPRECATED - Redirects a v1
└── health/                        # DEPRECATED - Redirects a v1
```

## Endpoints Nuevos (v1)

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/attendance` | Listar asistencias (paginado) |
| POST | `/api/v1/attendance` | Crear asistencia(s) |
| DELETE | `/api/v1/attendance/{id}` | Eliminar asistencia |
| GET | `/api/v1/attendance/stats` | Estadisticas de asistencia |
| GET | `/api/v1/videos/stream/{id}` | Stream de video |
| POST | `/api/v1/videos/{id}/views` | Registrar vista |
| GET | `/api/v1/health` | Health check |

## Compatibilidad Hacia Atras

Los endpoints antiguos (sin version) redirigen automaticamente a v1:

| Endpoint Antiguo | Redirige a | Tipo |
|------------------|------------|------|
| `/api/attendance` | `/api/v1/attendance` | Redirect 308 / Rewrite |
| `/api/attendance/{id}` | `/api/v1/attendance/{id}` | Rewrite |
| `/api/attendance/stats` | `/api/v1/attendance/stats` | Redirect 308 |
| `/api/videos/stream/{id}` | `/api/v1/videos/stream/{id}` | Rewrite |
| `/api/videos/{id}/views` | `/api/v1/videos/{id}/views` | Rewrite |
| `/api/health` | `/api/v1/health` | Redirect 308 |

### Tipos de Redireccion

- **Redirect 308**: Para GET requests. El cliente vera la nueva URL.
- **Rewrite**: Para POST/DELETE. Mantiene la URL original pero procesa en v1.

## Por que Auth no tiene version

Los endpoints de `/api/auth/*` se mantienen sin version porque:

1. NextAuth.js espera rutas especificas (`/api/auth/[...nextauth]`)
2. Los providers OAuth tienen callbacks configurados a estas URLs
3. El SDK de NextAuth en el frontend asume estas rutas

## Como Migrar Clientes

### Antes (deprecated)
```typescript
fetch("/api/attendance")
fetch("/api/videos/stream/abc123")
```

### Despues (recomendado)
```typescript
fetch("/api/v1/attendance")
fetch("/api/v1/videos/stream/abc123")
```

## Header de Version

Todas las respuestas de `/api/*` incluyen:
```
X-API-Version: 1.0.0
```

El health check tambien retorna la version en el body:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  ...
}
```

## Creando v2 en el Futuro

Cuando se necesiten cambios incompatibles:

1. Crear `/api/v2/` con los nuevos endpoints
2. Mantener `/api/v1/` funcionando
3. Actualizar redirects de rutas sin version a v2
4. Documentar fecha de deprecacion de v1
5. Eventualmente eliminar v1

## Verificacion

- [x] TypeScript compila sin errores
- [x] Estructura v1 creada
- [x] Endpoints movidos a v1
- [x] Redirects para compatibilidad
- [x] Auth endpoints sin version (correcto)
