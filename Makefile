# ================================
# MAKEFILE - Comandos útiles
# ================================

.PHONY: dev prod down logs migrate seed ssl-init backup

# =============================
# DESARROLLO
# =============================

# Iniciar entorno de desarrollo
dev:
	docker-compose -f docker-compose.dev.yml up --build

# Iniciar en segundo plano
dev-detached:
	docker-compose -f docker-compose.dev.yml up -d --build

# Detener desarrollo
dev-down:
	docker-compose -f docker-compose.dev.yml down

# Ver logs de desarrollo
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Reconstruir solo la app
dev-rebuild:
	docker-compose -f docker-compose.dev.yml up -d --build app

# =============================
# PRODUCCIÓN
# =============================

# Iniciar producción
prod:
	docker-compose up -d --build

# Detener producción
prod-down:
	docker-compose down

# Ver logs de producción
prod-logs:
	docker-compose logs -f

# Reiniciar app
prod-restart:
	docker-compose restart app

# =============================
# BASE DE DATOS
# =============================

# Ejecutar migraciones en desarrollo
migrate:
	docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Ejecutar migraciones en producción
migrate-prod:
	docker-compose exec app npx prisma migrate deploy

# Push schema sin migraciones
db-push:
	docker-compose -f docker-compose.dev.yml exec app npx prisma db push

# Abrir Prisma Studio
studio:
	docker-compose -f docker-compose.dev.yml exec app npx prisma studio

# Ejecutar seed
seed:
	docker-compose -f docker-compose.dev.yml exec app npm run db:seed

# =============================
# SSL / CERTBOT
# =============================

# Primera vez - obtener certificados
ssl-init:
	@echo "Asegúrate de que el dominio apunta a este servidor"
	docker-compose run --rm certbot certonly --webroot \
		-w /var/www/certbot \
		-d tudominio.com \
		-d www.tudominio.com \
		--email tu@email.com \
		--agree-tos \
		--no-eff-email
	docker-compose restart nginx

# Renovar certificados manualmente
ssl-renew:
	docker-compose run --rm certbot renew
	docker-compose restart nginx

# =============================
# BACKUPS
# =============================

# Crear backup de la base de datos
backup:
	@mkdir -p backups
	docker-compose exec db pg_dump -U $${DB_USER:-postgres} $${DB_NAME:-aula_virtual_jj} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup creado en backups/"

# Restaurar backup
restore:
	@echo "Uso: make restore FILE=backups/tu_archivo.sql"
	docker-compose exec -T db psql -U $${DB_USER:-postgres} $${DB_NAME:-aula_virtual_jj} < $(FILE)

# =============================
# UTILIDADES
# =============================

# Limpiar todo (CUIDADO: borra volúmenes)
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose down -v
	docker system prune -f

# Ver estado de contenedores
status:
	docker-compose ps

# Shell en el contenedor de la app
shell:
	docker-compose -f docker-compose.dev.yml exec app sh

# Shell en producción
shell-prod:
	docker-compose exec app sh
