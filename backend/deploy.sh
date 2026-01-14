#!/bin/bash
# Production Deployment Script for Render
# Ensures migrations are applied correctly before starting the application

set -e  # Exit on error

echo "=========================================="
echo "OLX Clone - Production Deployment"
echo "=========================================="

# Step 1: Run migrations
echo ""
echo "📦 Applying database migrations..."
python manage.py migrate --noinput

# Step 2: Verify migrations
echo ""
echo "🔍 Verifying database state..."
python verify_migrations.py

# Step 3: Create superuser if needed
echo ""
echo "👤 Ensuring superuser exists..."
python manage.py ensure_superuser

# Step 4: Collect static files (if not done in build)
echo ""
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo ""
echo "=========================================="
echo "✅ Deployment preparation complete!"
echo "=========================================="
echo ""
