# Mejora 1: Rate Limiting en Endpoints de Autenticacion

## Estado: COMPLETADO

## Descripcion

Se implemento un sistema de rate limiting para proteger los endpoints de autenticacion contra ataques de fuerza bruta, enumeracion de usuarios y abuso del sistema.

## Archivos Creados/Modificados

### Creado
- `src/lib/rate-limit.ts` - Utilidad de rate limiting

### Modificados
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

## Configuraciones de Rate Limit

| Endpoint | Limite | Ventana | Razon |
|----------|--------|---------|-------|
| `/api/auth/register` | 5 requests | 15 min | Prevenir registro masivo |
| `/api/auth/forgot-password` | 3 requests | 1 hora | Prevenir abuso de emails |
| `/api/auth/reset-password` GET | 10 requests | 1 min | Validacion de token |
| `/api/auth/reset-password` POST | 5 requests | 15 min | Cambio de password |

## Caracteristicas Implementadas

1. **Rate limiting basado en IP** - Usa headers `X-Forwarded-For` y `X-Real-IP` para proxies
2. **Almacenamiento en memoria** - Limpieza automatica cada 5 minutos
3. **Headers informativos**:
   - `X-RateLimit-Remaining`: Requests restantes
   - `X-RateLimit-Reset`: Timestamp de reinicio
   - `Retry-After`: Segundos hasta poder reintentar
4. **Respuesta estandar 429** con codigo de error estructurado

## Ejemplo de Respuesta (429 Too Many Requests)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Demasiadas solicitudes. Por favor, espera antes de intentar de nuevo.",
    "retryAfter": 847
  }
}
```

## Uso de la Utilidad

```typescript
import {
  checkRateLimit,
  getClientIP,
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/rate-limit";

// En un endpoint
const clientIP = getClientIP(request);
const rateLimit = checkRateLimit(`endpoint:${clientIP}`, RATE_LIMITS.AUTH_STRICT);

if (!rateLimit.allowed) {
  return createRateLimitResponse(rateLimit.retryAfter);
}
```

## Notas para Produccion

- Para despliegues multi-instancia, reemplazar el `Map` en memoria por Redis
- Considerar implementar rate limiting tambien por usuario autenticado
- Monitorear los logs de 429 para ajustar limites si es necesario

## Verificacion

- [x] TypeScript compila sin errores
- [x] Endpoints protegidos con rate limiting
- [x] Respuestas con headers apropiados
