# Mejora 3: Formato de Error Estandar

## Estado: COMPLETADO

## Descripcion

Se implemento un sistema de errores estandarizado que proporciona respuestas consistentes en toda la API, facilitando el manejo de errores en el cliente.

## Archivos Creados/Modificados

### Creado
- `src/lib/api-errors.ts` - Sistema centralizado de errores

### Modificados
- `src/app/api/attendance/route.ts`
- `src/app/api/attendance/[id]/route.ts`

## Estructura de Error Estandar

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados son invalidos",
    "details": [
      { "field": "email", "message": "Email invalido", "code": "invalid_string" }
    ],
    "timestamp": "2026-02-05T12:00:00.000Z"
  }
}
```

## Codigos de Error Disponibles

| Codigo | HTTP Status | Uso |
|--------|-------------|-----|
| `VALIDATION_ERROR` | 400 | Datos invalidos |
| `UNAUTHORIZED` | 401 | No autenticado |
| `FORBIDDEN` | 403 | Sin permisos |
| `NOT_FOUND` | 404 | Recurso no existe |
| `CONFLICT` | 409 | Conflicto (duplicado) |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite de requests |
| `INTERNAL_ERROR` | 500 | Error del servidor |

## Uso de la Utilidad

```typescript
import { ApiErrors } from "@/lib/api-errors";

// Errores simples
return ApiErrors.unauthorized();
return ApiErrors.forbidden("Mensaje personalizado");
return ApiErrors.notFound("Usuario");
return ApiErrors.conflict("Ya existe un registro");

// Errores de validacion Zod
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return ApiErrors.fromZod(parsed.error);
}

// Errores internos
return ApiErrors.internal("Error al procesar");
```

## Beneficios

1. **Consistencia** - Todos los errores tienen la misma estructura
2. **Codigos de error** - Facilita manejo programatico en el cliente
3. **Timestamps** - Util para debugging y logs
4. **Detalles de validacion** - Muestra todos los errores de Zod
5. **Internacionalizacion** - Mensajes en espanol para usuarios

## Ejemplo: Error de Validacion Multiple

Request:
```json
{ "email": "invalido", "name": "" }
```

Response (400):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados son invalidos",
    "details": [
      { "field": "email", "message": "Email invalido", "code": "invalid_string" },
      { "field": "name", "message": "Minimo 2 caracteres", "code": "too_small" }
    ],
    "timestamp": "2026-02-05T12:00:00.000Z"
  }
}
```

## Verificacion

- [x] TypeScript compila sin errores
- [x] Utilidad exportada y reutilizable
- [x] Endpoints de attendance actualizados
- [x] Manejo de errores Zod integrado
