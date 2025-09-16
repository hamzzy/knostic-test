# Docker Setup for Knostic CSV Manager

This document provides instructions for running the Knostic CSV Manager application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Development Mode (Recommended for local testing)

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Or run in background
docker-compose -f docker-compose.dev.yml up --build -d
```

This will start:
- Backend API on http://localhost:4000
- Frontend React app on http://localhost:3000
- PostgreSQL database on localhost:5432 (optional)

### Production Mode

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up --build

# Or run in background
docker-compose -f docker-compose.prod.yml up --build -d
```

## Individual Services

### Backend Only

```bash
# Development
docker-compose -f docker-compose.dev.yml up backend

# Production
docker-compose -f docker-compose.prod.yml up app
```

### Frontend Only

```bash
# Development
docker-compose -f docker-compose.dev.yml up frontend
```

## Development Workflow

### Hot Reloading

The development setup includes hot reloading for both frontend and backend:

- **Backend**: Changes to `backend/src/` will automatically restart the server
- **Frontend**: Changes to `frontend/src/` will automatically reload the browser

### Viewing Logs

```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Running Tests

```bash
# Backend tests
docker-compose -f docker-compose.dev.yml exec backend npm test

# Frontend tests
docker-compose -f docker-compose.dev.yml exec frontend npm test
```

### Accessing the Database

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U knostic -d knostic
```

## Environment Variables

### Backend

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 4000)

### Frontend

- `VITE_API_URL`: Backend API URL (default: http://localhost:4000)

### Database

- `POSTGRES_DB`: Database name (default: knostic)
- `POSTGRES_USER`: Database user (default: knostic)
- `POSTGRES_PASSWORD`: Database password (default: knostic123)

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :4000
   lsof -i :3000
   
   # Kill the process or change ports in docker-compose files
   ```

2. **Container won't start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.dev.yml logs backend
   
   # Rebuild containers
   docker-compose -f docker-compose.dev.yml up --build --force-recreate
   ```

3. **Permission issues on macOS/Linux**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Clean Up

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove all images
docker-compose -f docker-compose.dev.yml down --rmi all
```

## File Structure

```
knostic-test/
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development setup
├── docker-compose.prod.yml     # Production setup
├── Dockerfile.backend          # Backend production image
├── Dockerfile.frontend         # Frontend production image
├── backend/
│   └── Dockerfile.dev          # Backend development image
├── frontend/
│   └── Dockerfile.dev          # Frontend development image
└── DOCKER.md                   # This file
```

## Health Checks

The containers include health checks:

- **Backend**: Checks `/api/health` endpoint
- **Frontend**: Checks if the app is serving on port 3000

View health status:
```bash
docker-compose -f docker-compose.dev.yml ps
```

## Performance Tips

1. **Use .dockerignore**: Add `.dockerignore` files to exclude unnecessary files
2. **Multi-stage builds**: Production images use multi-stage builds for smaller size
3. **Volume mounting**: Development uses volume mounting for hot reloading
4. **Resource limits**: Add resource limits in production

Example resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```
