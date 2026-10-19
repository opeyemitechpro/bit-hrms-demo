# BIT-HRMS Docker & Deployment Guide

## Overview
This document describes how to containerize the BIT-HRMS application using Docker and deploy it to **Render.com** with an **external PostgreSQL database** (such as [Supabase](https://supabase.com)).

## Architecture

### Components
1. **Backend** (Laravel 11.x) - PHP 8.2-FPM based API server
2. **Frontend** (React + Tailwind CSS) - Vite-built SPA
3. **Database** - External PostgreSQL (Supabase or Render PostgreSQL)
4. **Cache** - Redis (local dev or managed externally in production)
5. **Storage** - Application storage (can be persisted or mounted to cloud storage)

### Docker Setup
The project includes three Dockerfile variants and multiple docker-compose files:

| File | Purpose |
|------|---------|
| `Dockerfile.backend` | Laravel backend + frontend build |
| `frontend/Dockerfile.dev` | Frontend development (hot reload) |
| `docker-compose.yml` | Local dev with PostgreSQL + Redis |
| `docker-compose.dev.yml` | Full development stack |
| `docker-compose.production.yml` | Production with external DB |

## Local Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d --build

# Or use the helper script
chmod +x .scripts/setup-docker.sh
.scripts/setup-docker.sh
```

Services:
- Backend API: http://localhost:8000
- Frontend UI: http://localhost:5173
- PostgreSQL: localhost:5432 (hrms_db)
- Redis: localhost:6379

## Deploying to Render.com

### Prerequisites
1. GitHub account with your repository pushed
2. Render.com account (free tier works for testing)
3. Supabase or external PostgreSQL database

### Step 1: Push to GitHub
```bash
git init
git add -A
git commit -m "Initial commit with Docker support"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bit-hrms-demo.git
git push -u origin main
```

### Step 2: Environment Variables
In Render.com, set these environment variables for the backend service:

| Variable | Value |
|----------|-------|
| `APP_NAME` | `BIT-HRMS` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://your-backend.onrender.com` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `your-postgres-host.supabase.co` (or Render internal DB hostname) |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `hrms_db` |
| `DB_USERNAME` | `hrms_user` |
| `DB_PASSWORD` | *(from Supabase/Render)* |
| `CACHE_DRIVER` | `redis` |
| `QUEUE_CONNECTION` | `redis` |
| `SESSION_DRIVER` | `redis` |
| `REDIS_HOST` | *(managed Redis or render internal hostname)* |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

### Step 3: Deploy on Render

#### Option A: Using Render Dashboard
1. Go to [Render.com](https://render.com) and click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `bit-hrms-backend`
   - **Environment**: Docker
   - **Dockerfile**: `Dockerfile.backend`
   - **Region**: Your preferred region
   - **Plan**: Standard (or higher)

#### Option B: Using render.yaml
The `render.yaml` file in this repo defines both backend and frontend services. Push it to GitHub and Render will auto-detect it.

### Step 4: Connect Supabase Database

#### In Supabase Dashboard:
1. Go to [Supabase](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Create the database schema using Laravel migrations:
   ```sql
   -- Run this in Supabase SQL Editor
   CREATE SCHEMA IF NOT EXISTS public;
   ```

#### Set Supabase Connection Details in Render:
- `DB_HOST`: The Supabase database hostname (e.g., `db.xyz.supabase.co`)
- `DB_PORT`: `5432`
- `DB_DATABASE`: Database name (default is `postgres`)
- `DB_USERNAME`: Supabase user (from database settings)
- `DB_PASSWORD`: Generated password

### Step 5: Database Migrations
Render will run migrations automatically on first deploy via the `startCommand`. Alternatively, use the Render shell:
```bash
php artisan migrate --force
php artisan db:seed --force
```

## Connecting to Supabase

### 1. Get Supabase Credentials
In Supabase SQL Editor, run:
```sql
SELECT
  inet_server_addr() AS host,
  inet_server_port() AS port,
  current_database() AS database,
  current_user AS user;
```

### 2. Enable pg_trgm Extension (for better search)
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3. Configure Connection Pooling
Supabase provides connection pooling via [Supavis](https://supabase.com/docs/guides/database/connection-pooling). Use the pooled connection:
- Host: `db.xyz.supabase.co`
- Port: `6543` (pooled) or `5432` (direct)

## CI/CD Workflow (GitHub Actions)

Add `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          coverage: none
      - run: composer install --no-interaction --prefer-dist
      - run: php artisan test
      - run: vendor/bin/phpunit

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        run: curl -fsSL https://raw.githubusercontent.com/render-oss/deploys/main/deploy.sh | bash -s bit-hrms-backend --service-id <your-service-id>
```

## Production Optimizations

The backend Dockerfile includes:
- `--prefer-dist` for faster package installation
- PHP OPcache configured
- Composer scripts disabled during install
- Storage and cache directories pre-wired

## Notes

1. The `dist/index.php` file is for local builds and is excluded from production.
2. Storage directories should be mounted or use cloud storage (S3/Spaces) for persistence.
3. For production, consider using **Render's managed PostgreSQL** instead of Supabase for lower latency and free tier.
4. The health check endpoint at `/up` confirms app status (included by default in Laravel 11).