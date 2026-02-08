#!/bin/sh
set -e

echo "🔧 Generando cliente Prisma..."
npx prisma generate

echo "🚀 Iniciando servidor de desarrollo..."
exec npm run dev
