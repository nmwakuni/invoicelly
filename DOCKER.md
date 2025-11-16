# Docker Deployment Guide

Complete guide for running the Invoice Generator using Docker and Docker Compose.

## Table of Contents
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Production](#production)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your configuration
nano .env

# 3. Build and start services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8787
```

## Architecture

### Multi-Stage Docker Builds

#### Backend (Cloudflare Workers)
```
┌─────────────────────────────────────┐
│ Stage 1: Dependencies               │
│ - Install npm packages              │
│ - Cache node_modules                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Stage 2: Builder                    │
│ - Copy dependencies                 │
│ - Run type checks                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Stage 3: Runner                     │
│ - Minimal runtime image             │
│ - Wrangler dev server               │
│ - Health checks enabled             │
└─────────────────────────────────────┘
```

#### Frontend (Next.js)
```
┌─────────────────────────────────────┐
│ Stage 1: Dependencies               │
│ - Install npm packages              │
│ - Cache node_modules                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Stage 2: Builder                    │
│ - Copy dependencies                 │
│ - Build Next.js standalone          │
│ - Optimize for production           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Stage 3: Runner                     │
│ - Non-root user (nextjs:nodejs)     │
│ - Standalone server                 │
│ - Health checks enabled             │
└─────────────────────────────────────┘
```

### Service Communication

```
┌──────────────┐         ┌──────────────┐
│   Frontend   │  HTTP   │   Backend    │
│  Next.js 16  │────────▶│   Hono API   │
│  Port: 3000  │         │  Port: 8787  │
└──────────────┘         └──────────────┘
       │                        │
       └────── Docker Bridge Network ─────┘
```

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Install Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install --cask docker
```

**Windows:**
Download Docker Desktop from https://www.docker.com/products/docker-desktop

## Configuration

### Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

#### Required Variables

```env
# Better Auth (Required)
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:8787

# Email Service (Required)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_DOMAIN=yourdomain.com

# Storage (Required)
R2_PUBLIC_DOMAIN=https://your-r2-public-domain.com
```

#### Optional Variables

```env
# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Payment Providers
PADDLE_VENDOR_ID=your-paddle-vendor-id
PADDLE_API_KEY=your-paddle-api-key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Rate Limiting
ARCJET_KEY=your-arcjet-key
```

## Usage

### Starting Services

```bash
# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Stopping Services

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes
docker-compose down -v
```

### Rebuilding

```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache frontend
```

## Development

### Development Mode

The docker-compose.yml is configured for development with:
- Hot reload enabled (volume mounts)
- Source code synced to containers
- Debug ports exposed

```bash
# Start in development mode
docker-compose up

# Run backend tests
docker-compose exec backend npm test

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh
```

### File Watching

Backend and frontend support hot reload:
- Backend: Wrangler watches for file changes
- Frontend: Next.js Fast Refresh enabled

### Database Operations

```bash
# Run migrations (backend)
docker-compose exec backend npx wrangler d1 execute invoice-generator --local --file=schema.sql

# Access D1 database
docker-compose exec backend npx wrangler d1 execute invoice-generator --local --command="SELECT * FROM users"
```

## Production

### Production Build

Create a production-specific docker-compose file:

**docker-compose.prod.yml:**
```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      target: runner
    environment:
      - NODE_ENV=production
    restart: always
    
  frontend:
    build:
      context: ./frontend
      target: runner
    environment:
      - NODE_ENV=production
    restart: always
```

**Deploy:**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View status
docker-compose -f docker-compose.prod.yml ps
```

### Image Optimization

**Backend Image Size:**
- Base: ~180MB (node:20-alpine)
- Final: ~250MB (with dependencies)

**Frontend Image Size:**
- Base: ~180MB (node:20-alpine)
- Final: ~120MB (standalone build)

### Security Best Practices

1. **Non-root User**: Frontend runs as `nextjs:nodejs` user
2. **Read-only Filesystem**: Consider adding `read_only: true` in production
3. **Resource Limits**: Add CPU/memory limits
4. **Secrets**: Use Docker secrets instead of environment variables

**Example with resource limits:**
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Health Checks

Both services include health checks:

### Backend Health Check
```bash
wget --no-verbose --tries=1 --spider http://localhost:8787/health
```
- Interval: 30s
- Timeout: 3s
- Retries: 3
- Start period: 10s

### Frontend Health Check
```bash
node -e "require('http').get('http://localhost:3000', ...)"
```
- Interval: 30s
- Timeout: 3s
- Retries: 3
- Start period: 40s

### Checking Health Status

```bash
# Check all services
docker-compose ps

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' invoicegen-frontend
```

## Volumes

### Named Volumes

```yaml
volumes:
  backend_node_modules:    # Backend dependencies
  wrangler_cache:          # Wrangler cache
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect invoicegen-backend-node-modules

# Remove unused volumes
docker volume prune

# Backup volume
docker run --rm -v invoicegen-backend-node-modules:/data -v $(pwd):/backup alpine tar czf /backup/backend-modules.tar.gz /data
```

## Networking

### Bridge Network

Services communicate via `invoicegen-network`:

```bash
# Inspect network
docker network inspect invoicegen-network

# List connected containers
docker network inspect invoicegen-network --format='{{range .Containers}}{{.Name}} {{end}}'
```

### Port Mapping

- Frontend: `3000:3000`
- Backend: `8787:8787`

### Internal Communication

Services can reach each other by name:
- Frontend → Backend: `http://backend:8787`
- Backend → Frontend: `http://frontend:3000`

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -ano | grep 3000

# Kill process
kill -9 <PID>
```

#### 2. Build Failures

```bash
# Clear build cache
docker builder prune

# Rebuild from scratch
docker-compose build --no-cache --pull
```

#### 3. Permission Errors

```bash
# Fix ownership (Linux)
sudo chown -R $USER:$USER .

# Frontend image uses non-root user
# Ensure files are readable
chmod -R 755 frontend/
```

#### 4. Database Not Found

```bash
# Create D1 database
docker-compose exec backend npx wrangler d1 create invoice-generator

# Run migrations
docker-compose exec backend npx wrangler d1 execute invoice-generator --local --file=schema.sql
```

#### 5. Out of Memory

```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory

# Or add limits to docker-compose.yml
services:
  frontend:
    mem_limit: 1g
```

### Debug Mode

```bash
# Run with verbose logging
docker-compose --verbose up

# Check service logs
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend

# Follow logs in real-time
docker-compose logs -f
```

### Performance Monitoring

```bash
# Container stats
docker stats

# Specific service stats
docker stats invoicegen-frontend invoicegen-backend

# Detailed inspection
docker inspect invoicegen-frontend
```

## Advanced Configuration

### Custom Compose File

```bash
# Use custom compose file
docker-compose -f docker-compose.custom.yml up

# Use multiple compose files (override)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

### Environment-specific Configs

**docker-compose.dev.yml:**
```yaml
services:
  backend:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
```

**Usage:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker-compose build
      - name: Run tests
        run: docker-compose run backend npm test
```

## Maintenance

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove all unused images, containers, networks
docker system prune -a

# Remove volumes (⚠️ Data loss!)
docker system prune -a --volumes
```

### Updates

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --pull --no-cache

# Restart services
docker-compose up -d
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify health: `docker-compose ps`
3. Review this guide
4. Check GitHub issues

## License

Same as main project license.
