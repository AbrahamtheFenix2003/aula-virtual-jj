# Mejora 5: Separar Contador de Vistas de Video

## Estado: COMPLETADO

## Descripcion

Se separo la logica del contador de vistas del endpoint de streaming a un endpoint dedicado, mejorando la confiabilidad y siguiendo el principio de responsabilidad unica.

## Archivos Creados/Modificados

### Creado
- `src/app/api/videos/[id]/views/route.ts` - Endpoint para registrar vistas

### Modificados
- `src/app/api/videos/stream/[id]/route.ts` - Removido contador inline

## Problema Anterior

```typescript
// En el streaming, el contador era "fire and forget"
prisma.video.update({
  where: { id },
  data: { viewCount: { increment: 1 } },
}).catch(console.error); // Errores ignorados silenciosamente
```

**Problemas:**
1. Errores se perdian sin notificacion
2. No habia confirmacion de que la vista se registro
3. Multiples requests de streaming por video (Range requests) podian inflar contadores

## Solucion Implementada

### Nuevo Endpoint
```
POST /api/videos/{id}/views
```

### Respuesta Exitosa (200)
```json
{
  "message": "Vista registrada",
  "data": {
    "videoId": "abc123",
    "viewCount": 42
  }
}
```

## Beneficios

1. **Confiabilidad** - Errores se manejan apropiadamente
2. **Control** - El cliente decide cuando registrar vista (ej: despues de X segundos)
3. **Precision** - No se infla por Range requests del reproductor
4. **Debugging** - Facil de rastrear en logs
5. **Extensibilidad** - Se puede agregar logica (evitar duplicados, analytics, etc.)

## Uso desde Frontend

```typescript
// Registrar vista despues de 10 segundos de reproduccion
useEffect(() => {
  const timer = setTimeout(async () => {
    await fetch(`/api/videos/${videoId}/views`, {
      method: 'POST',
    });
  }, 10000);

  return () => clearTimeout(timer);
}, [videoId]);
```

## Cambios en Streaming Endpoint

El endpoint `/api/videos/stream/[id]` ahora:
- Solo maneja streaming de video
- Usa formato de errores estandar (`ApiErrors`)
- Incluye comentario documentando donde manejar vistas

## Estructura de Endpoints de Video

```
/api/videos/
├── [id]/
│   └── views/
│       └── route.ts   # POST - Registrar vista
└── stream/
    └── [id]/
        └── route.ts   # GET - Stream de video
```

## Verificacion

- [x] TypeScript compila sin errores
- [x] Nuevo endpoint creado
- [x] Streaming endpoint limpiado
- [x] Formato de errores estandar aplicado
