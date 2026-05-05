.PHONY: help build up down logs clean restart test

# Derive the commit SHA from the current checkout and export it so docker-compose
# (which uses ${GIT_COMMIT_SHA:?...}) and the backend Dockerfile (ARG GIT_COMMIT_SHA)
# can pick it up. If you're not in a git checkout this fails loudly - that's the point.
GIT_COMMIT_SHA := $(shell git rev-parse --short HEAD 2>/dev/null)
ifeq ($(GIT_COMMIT_SHA),)
$(error GIT_COMMIT_SHA could not be derived. Run inside a git checkout, or set GIT_COMMIT_SHA=<sha> explicitly)
endif
export GIT_COMMIT_SHA

help:
	@echo "Magician Props Store - Available Commands"
	@echo ""
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-backend   - View backend logs"
	@echo "  make logs-frontend  - View frontend logs"
	@echo "  make logs-db        - View database logs"
	@echo "  make clean          - Remove all containers and volumes"
	@echo "  make shell-db       - Open database shell"
	@echo ""
	@echo "  Hud session tag commit_sha = $(GIT_COMMIT_SHA)"
	@echo ""

build:
	@echo "Building with GIT_COMMIT_SHA=$(GIT_COMMIT_SHA)"
	docker-compose build

up:
	@echo "Starting with GIT_COMMIT_SHA=$(GIT_COMMIT_SHA)"
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:3001"
	@echo "Database: postgres://localhost:5432"
	@echo "Hud commit_sha tag: $(GIT_COMMIT_SHA)"

down:
	docker-compose down

restart: down up

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

clean:
	docker-compose down -v
	@echo "✅ All containers and volumes removed"

shell-db:
	docker-compose exec postgres psql -U postgres -d magician_props_store

shell-backend:
	docker-compose exec backend /bin/sh

test-backend:
	docker-compose exec backend npm run lint

test-api:
	@echo "Testing API endpoints..."
	@curl -s http://localhost:3001/products | jq '.' | head -50
	@echo ""
	@echo "✅ API is responding"
