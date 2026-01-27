import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  // Crear academia por defecto
  const academy = await prisma.academy.upsert({
    where: { slug: "academia-principal" },
    update: {},
    create: {
      name: "Academia Principal de Jiu-Jitsu",
      slug: "academia-principal",
      email: "contacto@academia.com",
      phone: "+52 55 1234 5678",
      address: "Calle Principal #123, Ciudad de México",
      timezone: "America/Mexico_City",
    },
  });
  console.log("✅ Academia creada:", academy.name);

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash("admin123", 12);

  // Crear usuario admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@academia.com" },
    update: {},
    create: {
      email: "admin@academia.com",
      password: hashedPassword,
      name: "Administrador",
      role: "ADMIN",
      belt: "NEGRA",
      stripe: "CUATRO",
      academyId: academy.id,
    },
  });
  console.log("✅ Usuario admin creado:", admin.email);

  // Crear instructor de ejemplo
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@academia.com" },
    update: {},
    create: {
      email: "instructor@academia.com",
      password: hashedPassword,
      name: "Instructor Demo",
      role: "INSTRUCTOR",
      belt: "MARRON",
      stripe: "DOS",
      academyId: academy.id,
    },
  });
  console.log("✅ Usuario instructor creado:", instructor.email);

  // Crear alumno de ejemplo
  const alumno = await prisma.user.upsert({
    where: { email: "alumno@academia.com" },
    update: {},
    create: {
      email: "alumno@academia.com",
      password: hashedPassword,
      name: "Alumno Demo",
      role: "ALUMNO",
      belt: "BLANCA",
      stripe: "CERO",
      academyId: academy.id,
    },
  });
  console.log("✅ Usuario alumno creado:", alumno.email);

  // Crear horarios de clases
  const classSchedules = [
    { name: "Clase GI Mañana", classType: "GI" as const, dayOfWeek: 1, startTime: "10:00", endTime: "11:30" },
    { name: "Clase GI Tarde", classType: "GI" as const, dayOfWeek: 1, startTime: "19:00", endTime: "20:30" },
    { name: "Clase NO-GI", classType: "NOGI" as const, dayOfWeek: 3, startTime: "19:00", endTime: "20:30" },
    { name: "Clase Competición", classType: "COMPETICION" as const, dayOfWeek: 5, startTime: "18:00", endTime: "19:30" },
    { name: "Clase Fundamentos", classType: "FUNDAMENTALS" as const, dayOfWeek: 2, startTime: "10:00", endTime: "11:00" },
  ];

  for (const schedule of classSchedules) {
    await prisma.classSchedule.create({
      data: {
        ...schedule,
        academyId: academy.id,
        maxCapacity: 20,
      },
    });
  }
  console.log("✅ Horarios de clases creados:", classSchedules.length);

  // Crear video de ejemplo (sin archivo real, solo para mostrar estructura)
  const video = await prisma.video.create({
    data: {
      title: "Armlock desde Guardia Cerrada",
      description: "Técnica fundamental de sumisión desde la guardia cerrada. En este video aprenderás el paso a paso para ejecutar un armlock efectivo.",
      driveFileId: "REPLACE_WITH_REAL_DRIVE_FILE_ID",
      duration: 480, // 8 minutos
      category: "SUMISION",
      minBelt: "BLANCA",
      tags: ["armlock", "guardia cerrada", "sumision", "basico"],
      isPublished: true,
      isFeatured: true,
      academyId: academy.id,
      uploadedById: instructor.id,
    },
  });
  console.log("✅ Video de ejemplo creado:", video.title);

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("   Admin:      admin@academia.com / admin123");
  console.log("   Instructor: instructor@academia.com / admin123");
  console.log("   Alumno:     alumno@academia.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
