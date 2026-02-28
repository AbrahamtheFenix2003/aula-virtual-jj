# API Documentation - Aula Virtual JJ

## 📚 Documentación Interactiva

La API incluye documentación interactiva generada automáticamente con **Scalar**.

### Acceder a la documentación

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre en tu navegador:**
   - 📖 **UI Interactiva:** http://localhost:3000/api/docs
   - 📄 **Spec OpenAPI (JSON):** http://localhost:3000/api/openapi
   - 💾 **Spec estático:** http://localhost:3000/openapi.json

## 🔧 Comandos Disponibles

```bash
# Generar spec OpenAPI estático
npm run openapi:generate

# Iniciar servidor de desarrollo (incluye docs)
npm run dev
```

## 📋 Endpoints Documentados (20)

### Auth (5)
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual
- `POST /api/auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Users (1)
- `GET /api/v1/users` - Listar usuarios (con filtros y paginación)

### Exams (9)
- `GET /api/v1/exams` - Listar exámenes
- `POST /api/v1/exams` - Crear examen
- `GET /api/v1/exams/{id}` - Obtener examen por ID
- `PATCH /api/v1/exams/{id}` - Actualizar examen
- `DELETE /api/v1/exams/{id}` - Eliminar examen
- `GET /api/v1/exams/{id}/students` - Listar estudiantes inscritos
- `POST /api/v1/exams/{id}/students` - Inscribir estudiante
- `DELETE /api/v1/exams/{id}/students/{studentId}` - Desinscribir estudiante
- `POST /api/v1/exams/{id}/evaluations` - Evaluar estudiantes (bulk)

### Attendance (4)
- `GET /api/v1/attendance` - Listar asistencias
- `POST /api/v1/attendance` - Registrar asistencia(s)
- `GET /api/v1/attendance/stats` - Estadísticas de asistencias
- `DELETE /api/v1/attendance/{id}` - Eliminar asistencia

### Promotions (3)
- `GET /api/v1/promotions` - Listar promociones
- `POST /api/v1/promotions` - Registrar promoción
- `GET /api/v1/promotions/{id}` - Obtener promoción por ID
- `DELETE /api/v1/promotions/{id}` - Eliminar promoción

### Videos (2)
- `GET /api/v1/videos/{id}/stream` - Obtener stream de video
- `POST /api/v1/videos/{id}/views` - Registrar vista

### Health (1)
- `GET /api/v1/health` - Health check

## 🔐 Autenticación

La API usa **NextAuth JWT** para autenticación. En la documentación interactiva puedes configurar tu token JWT en el botón "Authorize".

### Opciones de autenticación:
1. **Bearer Auth** - Token JWT
2. **Cookie Auth** - Session cookie de NextAuth

## 📝 Agregar Nuevos Endpoints

Para documentar un nuevo endpoint:

1. **Abre** `src/lib/openapi-paths.ts`

2. **Agrega** el registro del endpoint:
   ```typescript
   registry.registerPath({
     method: "get",
     path: "/api/v1/tu-endpoint",
     summary: "Descripción corta",
     description: "Descripción detallada",
     tags: ["TuTag"],
     security: [{ bearerAuth: [] }],
     parameters: [
       {
         name: "page",
         in: "query",
         schema: { type: "number", example: 1 },
       },
     ],
     responses: {
       200: { description: "Exitoso" },
       401: { description: "No autorizado" },
     },
   });
   ```

3. **Reinicia** el servidor de desarrollo para ver los cambios.

## 🎨 Personalización de Scalar

Para personalizar la UI de Scalar, edita `src/app/api/docs/route.ts`:

```typescript
const config = {
  spec: { url: "/api/openapi" },
  theme: "default", // 'default', 'moon', 'purple', etc.
  darkMode: true,
  layout: "classic", // 'classic' o 'modern'
};
```

## 🚀 Generar Cliente TypeScript

Puedes generar un cliente tipado automáticamente:

```bash
# Instalar herramienta
npm install -D openapi-typescript-codegen

# Generar cliente
npx openapi-typescript-codegen \
  --input ./public/openapi.json \
  --output ./src/generated/api \
  --client fetch
```

Uso en tu código:
```typescript
import { ExamsService } from "@/generated/api";

const exams = await ExamsService.examsList({ 
  page: 1, 
  limit: 10,
  status: "PROGRAMADO"
});
```

## 📊 Tecnologías

- **OpenAPI 3.0.0** - Especificación
- **Scalar** - UI de documentación
- **@asteasolutions/zod-to-openapi** - Generación desde Zod
- **Next.js 16** - Framework
