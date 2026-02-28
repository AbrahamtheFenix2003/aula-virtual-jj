import { registry } from "./openapi";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createExamSchema,
  updateExamSchema,
  registerExamStudentSchema,
  updateExamResultSchema,
  bulkEvaluateExamSchema,
  createAttendanceSchema,
  bulkAttendanceSchema,
  createPromotionSchema,
  createVideoSchema,
  updateVideoProgressSchema,
  createPaymentSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserBeltSchema,
} from "./validations";

// ============================================
// AUTH ENDPOINTS
// ============================================
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Registrar nuevo usuario",
  description: "Crea una nueva cuenta de alumno. Verifica que las contraseñas coincidan.",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Usuario registrado exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Usuario registrado" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                  role: { type: "string", example: "ALUMNO" },
                },
              },
            },
          },
        },
      },
    },
    400: { description: "Datos inválidos o email ya registrado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/signin",
  summary: "Iniciar sesión",
  description: "Autenticación con NextAuth. Email y password.",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Sesión iniciada exitosamente" },
    401: { description: "Credenciales inválidas" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/signout",
  summary: "Cerrar sesión",
  description: "Cierra la sesión del usuario actual",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Sesión cerrada exitosamente" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/session",
  summary: "Obtener sesión actual",
  description: "Obtiene la sesión del usuario autenticado",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Sesión obtenida",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                  role: { type: "string" },
                  belt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autenticado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/forgot-password",
  summary: "Solicitar recuperación de contraseña",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: forgotPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Email de recuperación enviado" },
    400: { description: "Email inválido" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/reset-password",
  summary: "Restablecer contraseña",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Contraseña actualizada" },
    400: { description: "Token inválido o expirado" },
  },
});

// ============================================
// USERS ENDPOINTS
// ============================================
registry.registerPath({
  method: "get",
  path: "/api/v1/users",
  summary: "Listar usuarios",
  description: "Obtiene lista paginada de usuarios con filtros (Solo INSTRUCTOR o ADMIN)",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "page",
      in: "query",
      schema: { type: "number", example: 1 },
      description: "Número de página",
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "number", example: 10 },
      description: "Elementos por página",
    },
    {
      name: "search",
      in: "query",
      schema: { type: "string" },
      description: "Buscar por nombre o email",
    },
    {
      name: "belt",
      in: "query",
      schema: {
        type: "string",
        enum: ["BLANCA", "AZUL", "PURPURA", "MARRON", "NEGRA", "CORAL", "ROJA"],
      },
    },
    {
      name: "role",
      in: "query",
      schema: {
        type: "string",
        enum: ["ALUMNO", "INSTRUCTOR", "ADMIN"],
      },
    },
    {
      name: "isActive",
      in: "query",
      schema: { type: "boolean" },
    },
  ],
  responses: {
    200: {
      description: "Lista de usuarios obtenida exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" },
                    belt: { type: "string" },
                    stripe: { type: "string" },
                    isActive: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              meta: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  totalPages: { type: "number" },
                  hasNext: { type: "boolean" },
                  hasPrev: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Forbidden - Solo instructores o admins" },
  },
});

// ============================================
// EXAMS ENDPOINTS
// ============================================
registry.registerPath({
  method: "get",
  path: "/api/v1/exams",
  summary: "Listar exámenes",
  description: "Obtiene lista paginada de exámenes con filtros opcionles",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "page",
      in: "query",
      schema: { type: "number", example: 1 },
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "number", example: 10 },
    },
    {
      name: "status",
      in: "query",
      schema: {
        type: "string",
        enum: ["PROGRAMADO", "EN_CURSO", "COMPLETADO", "CANCELADO"],
      },
    },
    {
      name: "beltTo",
      in: "query",
      schema: {
        type: "string",
        enum: ["BLANCA", "AZUL", "PURPURA", "MARRON", "NEGRA", "CORAL", "ROJA"],
      },
    },
    {
      name: "upcoming",
      in: "query",
      schema: { type: "boolean", example: false },
      description: "Filtrar solo exámenes futuros",
    },
  ],
  responses: {
    200: {
      description: "Lista de exámenes obtenida exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    date: { type: "string", format: "date-time" },
                    status: { type: "string" },
                    beltFrom: { type: "string" },
                    beltTo: { type: "string" },
                    studentsCount: { type: "number" },
                  },
                },
              },
              meta: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  totalPages: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/exams",
  summary: "Crear examen",
  description: "Crea un nuevo examen (solo INSTRUCTOR o ADMIN)",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createExamSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Examen creado exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Examen creado exitosamente" },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  date: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    400: { description: "Datos inválidos" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden - No tienes permisos" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/exams/{id}",
  summary: "Obtener examen por ID",
  description: "Obtiene detalles completos de un examen incluyendo estudiantes inscritos",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Examen obtenido exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  date: { type: "string", format: "date-time" },
                  status: { type: "string" },
                  students: { type: "array" },
                  studentsCount: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    404: { description: "Examen no encontrado" },
    403: { description: "Sin acceso al examen" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/exams/{id}",
  summary: "Actualizar examen",
  description: "Actualiza un examen existente (solo INSTRUCTOR o ADMIN). No permite modificar exámenes completados.",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateExamSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Examen actualizado",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Examen actualizado" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    400: { description: "Datos inválidos" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    404: { description: "Examen no encontrado" },
    409: { description: "Conflicto - Examen completado" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/exams/{id}",
  summary: "Eliminar examen",
  description: "Elimina un examen (solo ADMIN). No permite eliminar exámenes completados.",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Examen eliminado",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Examen eliminado" },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Forbidden - Solo ADMIN" },
    404: { description: "Examen no encontrado" },
    409: { description: "Conflicto - Examen completado" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/exams/{id}/students",
  summary: "Listar estudiantes inscritos en examen",
  description: "Obtiene lista de estudiantes inscritos con sus requisitos (asistencias y videos completados)",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Lista de estudiantes obtenida",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    user: { type: "object" },
                    result: { type: "string" },
                    requirements: {
                      type: "object",
                      properties: {
                        attendances: { type: "object" },
                        videos: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Sin acceso al examen" },
    404: { description: "Examen no encontrado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/exams/{id}/students",
  summary: "Inscribir estudiante en examen",
  description: "Inscribe un estudiante en un examen (solo INSTRUCTOR o ADMIN). Verifica cupo, cinturón requerido y que el estudiante no esté ya inscrito.",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerExamStudentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Estudiante inscrito exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    400: { description: "Datos inválidos" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    404: { description: "Examen o estudiante no encontrado" },
    409: { description: "Ya está inscrito o cupo lleno" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/exams/{id}/students/{studentId}",
  summary: "Desinscribir estudiante de examen",
  description: "Elimina la inscripción de un estudiante (solo INSTRUCTOR o ADMIN). No permite desinscribir si ya fue evaluado o el examen está completado.",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "studentId",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Estudiante desinscrito del examen",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Estudiante desinscrito del examen" },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    404: { description: "Inscripción no encontrada" },
    409: { description: "Conflicto - Ya evaluado o examen completado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/exams/{id}/evaluations",
  summary: "Evaluar estudiantes de examen (bulk)",
  description: "Evalúa múltiples estudiantes de un examen. Si un estudiante aprueba, automáticamente crea la promoción y actualiza su cinturón. Marca el examen como COMPLETADO cuando todos son evaluados.",
  tags: ["Exams"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: bulkEvaluateExamSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Evaluaciones registradas exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Evaluaciones registradas" },
              data: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  approved: { type: "number" },
                  failed: { type: "number" },
                  noShow: { type: "number" },
                  results: { type: "array" },
                },
              },
            },
          },
        },
      },
    },
    400: { description: "Datos inválidos" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    404: { description: "Examen no encontrado" },
    409: { description: "Conflicto - Examen cancelado o completado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/videos/{id}/views",
  summary: "Registrar vista de video",
  description: "Incrementa el contador de vistas de un video. Se debe llamar después de iniciar la reproducción del video.",
  tags: ["Videos"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Vista registrada exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Vista registrada" },
              data: {
                type: "object",
                properties: {
                  videoId: { type: "string" },
                  viewCount: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Video no disponible" },
    404: { description: "Video no encontrado" },
  },
});

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================
registry.registerPath({
  method: "get",
  path: "/api/v1/attendance",
  summary: "Listar asistencias",
  description: "Obtiene lista paginada de asistencias con filtros",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "page",
      in: "query",
      schema: { type: "number", example: 1 },
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "number", example: 10 },
    },
    {
      name: "userId",
      in: "query",
      schema: { type: "string" },
    },
    {
      name: "month",
      in: "query",
      schema: { type: "string", example: "2024-01" },
      description: "Filtrar por mes (YYYY-MM)",
    },
    {
      name: "classType",
      in: "query",
      schema: {
        type: "string",
        enum: ["GI", "NOGI", "COMPETICION", "INFANTIL", "FUNDAMENTALS", "AVANZADO"],
      },
    },
  ],
  responses: {
    200: {
      description: "Lista de asistencias obtenida",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              meta: { type: "object" },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/attendance",
  summary: "Registrar asistencia(s)",
  description: "Registra una asistencia individual o múltiples (bulk)",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createAttendanceSchema.or(bulkAttendanceSchema),
        },
      },
    },
  },
  responses: {
    201: { description: "Asistencia(s) registrada(s)" },
    400: { description: "Datos inválidos" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    409: { description: "Conflicto - Ya existe asistencia" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/attendance/stats",
  summary: "Obtener estadísticas de asistencias",
  description: "Obtiene estadísticas detalladas de asistencias: total, asistencias del mes, racha actual, tipo de clase favorita, y fechas con asistencia para calendario",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "userId",
      in: "query",
      schema: { type: "string" },
      description: "ID del usuario. Si no se proporciona, usa el usuario autenticado",
    },
  ],
  responses: {
    200: {
      description: "Estadísticas obtenidas exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  totalAttendances: { type: "number" },
                  thisMonthAttendances: { type: "number" },
                  currentStreak: { type: "number" },
                  favoriteClassType: { type: "string" },
                  attendancesByType: { type: "array" },
                  attendanceDates: { type: "array" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Forbidden - Alumnos solo pueden ver sus propias estadísticas" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/attendance/{id}",
  summary: "Eliminar asistencia",
  description: "Elimina un registro de asistencia (solo INSTRUCTOR o ADMIN)",
  tags: ["Attendance"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    204: { description: "Asistencia eliminada exitosamente" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    404: { description: "Asistencia no encontrada" },
  },
});

// ============================================
// PROMOTIONS ENDPOINTS
// ============================================
registry.registerPath({
  method: "get",
  path: "/api/v1/promotions",
  summary: "Listar promociones de cinturón",
  description: "Obtiene historial de promociones con paginación",
  tags: ["Promotions"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "page",
      in: "query",
      schema: { type: "number", example: 1 },
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "number", example: 10 },
    },
    {
      name: "studentId",
      in: "query",
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Lista de promociones obtenida",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              meta: { type: "object" },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/promotions",
  summary: "Registrar promoción de cinturón",
  description: "Registra una nueva promoción (solo INSTRUCTOR o ADMIN)",
  tags: ["Promotions"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPromotionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Promoción registrada exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    400: { description: "Datos inválidos" },
    401: { description: "No autorizado" },
    403: { description: "Forbidden" },
    404: { description: "Alumno no encontrado" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/promotions/{id}",
  summary: "Obtener promoción por ID",
  description: "Obtiene detalles de una promoción específica. Alumnos solo pueden ver sus propias promociones.",
  tags: ["Promotions"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Promoción obtenida exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  fromBelt: { type: "string" },
                  toBelt: { type: "string" },
                  promotedAt: { type: "string", format: "date-time" },
                  student: { type: "object" },
                  promotedBy: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Sin acceso a esta promoción" },
    404: { description: "Promoción no encontrada" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/promotions/{id}",
  summary: "Eliminar promoción",
  description: "Elimina una promoción y revierte el cinturón del alumno al anterior (solo ADMIN)",
  tags: ["Promotions"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Promoción eliminada y cinturón revertido",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Promoción eliminada y cinturón revertido" },
            },
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Forbidden - Solo ADMIN" },
    404: { description: "Promoción no encontrada" },
  },
});

// ============================================
// VIDEOS ENDPOINTS
// ============================================
registry.registerPath({
  method: "get",
  path: "/api/v1/videos/{id}/stream",
  summary: "Obtener stream de video",
  description: "Obtiene el stream de video desde Google Drive. Verifica que el usuario tenga el nivel de cinturón requerido y que el video esté publicado. Soporta Range requests para seeking.",
  tags: ["Videos"],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "Stream de video obtenido (contenido binario)",
      content: {
        "video/mp4": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
    206: {
      description: "Partial Content (Range request)",
      content: {
        "video/mp4": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
    401: { description: "No autorizado" },
    403: { description: "Sin acceso - Nivel de cinturón insuficiente o video no publicado" },
    404: { description: "Video no encontrado" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  summary: "Health check",
  description: "Verifica el estado de la API",
  tags: ["Health"],
  responses: {
    200: {
      description: "API saludable",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
});
