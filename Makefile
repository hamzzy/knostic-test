# Knostic CSV Manager - Development Makefile

.PHONY: help install dev build test clean docker-up docker-down docker-build docker-logs lint format

# Default target
help: ## Show this help message
	@echo "Knostic CSV Manager - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation commands
install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend dependencies
	@echo "Installing backend dependencies..."
	cd backend && npm install

install-frontend: ## Install frontend dependencies
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development commands
dev: ## Start development servers (both frontend and backend)
	@echo "Starting development servers..."
	docker-compose -f docker-compose.dev.yml up --build

dev-backend: ## Start only backend development server
	@echo "Starting backend development server..."
	cd backend && npm run dev

dev-frontend: ## Start only frontend development server
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

# Build commands
build: build-backend build-frontend ## Build both frontend and backend

build-backend: ## Build backend
	@echo "Building backend..."
	cd backend && npm run build || echo "No build script found for backend"

build-frontend: ## Build frontend
	@echo "Building frontend..."
	cd frontend && npm run build

# Test commands
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	cd backend && npm test

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	cd frontend && npm test

test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	cd backend && npm run test:watch &
	cd frontend && npm run test:ui

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	cd backend && npm run test:coverage
	cd frontend && npm run test:coverage

# Linting and formatting
lint: lint-backend lint-frontend ## Run linting for both frontend and backend

lint-backend: ## Lint backend code
	@echo "Linting backend code..."
	cd backend && npm run lint || echo "No lint script found for backend"

lint-frontend: ## Lint frontend code
	@echo "Linting frontend code..."
	cd frontend && npm run lint || echo "No lint script found for frontend"

lint-fix: ## Fix linting issues
	@echo "Fixing linting issues..."
	cd backend && npm run lint:fix || echo "No lint:fix script found for backend"
	cd frontend && npm run lint:fix || echo "No lint:fix script found for frontend"

# Docker commands
docker-up: ## Start Docker containers
	@echo "Starting Docker containers..."
	docker-compose -f docker-compose.dev.yml up -d

docker-down: ## Stop Docker containers
	@echo "Stopping Docker containers..."
	docker-compose -f docker-compose.dev.yml down

docker-build: ## Build Docker images
	@echo "Building Docker images..."
	docker-compose -f docker-compose.dev.yml build

docker-logs: ## Show Docker logs
	@echo "Showing Docker logs..."
	docker-compose -f docker-compose.dev.yml logs -f

docker-clean: ## Clean Docker containers and images
	@echo "Cleaning Docker containers and images..."
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# Production build
prod-build: ## Build production images
	@echo "Building production images..."
	docker build -f Dockerfile.backend -t knostic-backend .
	docker build -f Dockerfile.frontend -t knostic-frontend .

# Cleanup commands
clean: clean-backend clean-frontend ## Clean all build artifacts and dependencies

clean-backend: ## Clean backend artifacts
	@echo "Cleaning backend artifacts..."
	cd backend && rm -rf node_modules coverage dist

clean-frontend: ## Clean frontend artifacts
	@echo "Cleaning frontend artifacts..."
	cd frontend && rm -rf node_modules dist

clean-all: clean docker-clean ## Clean everything including Docker

# Database commands (if needed in the future)
db-reset: ## Reset database (placeholder for future use)
	@echo "Database reset not implemented yet"

# Health checks
health: ## Check if services are running
	@echo "Checking service health..."
	@curl -f http://localhost:3000 > /dev/null 2>&1 && echo "Frontend: OK" || echo "Frontend: Not running"
	@curl -f http://localhost:4000/api/health > /dev/null 2>&1 && echo "Backend: OK" || echo "Backend: Not running"

# Quick start
start: install dev ## Quick start - install dependencies and start development servers

# Development workflow
setup: install docker-build ## Complete setup - install dependencies and build Docker images

# Logs
logs-backend: ## Show backend logs
	docker-compose -f docker-compose.dev.yml logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose -f docker-compose.dev.yml logs -f frontend

# Restart services
restart: docker-down docker-up ## Restart all services

restart-backend: ## Restart backend service
	docker-compose -f docker-compose.dev.yml restart backend

restart-frontend: ## Restart frontend service
	docker-compose -f docker-compose.dev.yml restart frontend
