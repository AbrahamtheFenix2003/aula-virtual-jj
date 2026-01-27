-- ================================
-- Script de inicialización PostgreSQL
-- Se ejecuta solo la primera vez
-- ================================

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsquedas de texto

-- Configurar timezone
SET timezone = 'America/Mexico_City';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos aula_virtual_jj inicializada correctamente';
END $$;
