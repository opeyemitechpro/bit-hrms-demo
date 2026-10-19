#!/bin/bash

# Bit-HRMS Docker Setup Script
# Run this script to build and start the development environment

set -e

echo "================================================"
echo "BIT-HRMS Docker Setup"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "Building and starting containers..."
docker-compose -f docker-compose.dev.yml up -d --build

echo ""
echo "================================================"
echo "Services are starting..."
echo "================================================"
echo ""
echo "Available services:"
echo "  - Backend API:  http://localhost:8000"
echo "  - Frontend UI: http://localhost:5173"
echo "  - PostgreSQL:   localhost:5432 (hrms_db)"
echo "  - Redis:        localhost:6379"
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Run database migrations
echo ""
echo "Running database migrations..."
docker exec -it bit-hrms-dev-backend php artisan migrate --force

# Run seeders (optional - comment out for fresh database)
# echo ""
# echo "Running database seeders..."
# docker exec -it bit-hrms-dev-backend php artisan db:seed --force

echo ""
echo "================================================"
echo "Setup complete!"
echo "================================================"