#!/usr/bin/env python
"""
Migration Verification Script for Production Deployment

This script verifies that all required database tables exist
and migrations are properly applied before starting the application.

Usage:
    python verify_migrations.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'olx_backend.settings')
django.setup()

from django.db import connection
from django.core.management import call_command
from django.conf import settings


def check_table_exists(table_name):
    """Check if a table exists in the database"""
    from django.db import connection
    return table_name in connection.introspection.table_names()


def verify_critical_tables():
    """Verify all critical tables exist"""
    critical_tables = [
        'users_user',
        'users_pendingregistration',
        'listings_listing',
        'listings_listingimage',
        'listings_savedlisting',
        'listings_listingreport',
        'listings_adminaction',
        'categories_category',
    ]
    
    print("=" * 60)
    print("VERIFYING DATABASE TABLES")
    print("=" * 60)
    
    missing_tables = []
    for table in critical_tables:
        exists = check_table_exists(table)
        status = "✓" if exists else "✗"
        print(f"{status} {table}")
        if not exists:
            missing_tables.append(table)
    
    return missing_tables


def check_migration_status():
    """Check migration status for all apps"""
    print("\n" + "=" * 60)
    print("MIGRATION STATUS")
    print("=" * 60)
    
    call_command('showmigrations', '--list')


def verify_models_accessible():
    """Verify that all models can be imported"""
    print("\n" + "=" * 60)
    print("VERIFYING MODEL IMPORTS")
    print("=" * 60)
    
    try:
        from users.models import User, PendingRegistration
        print("✓ users.models.User")
        print("✓ users.models.PendingRegistration")
        
        from listings.models import (
            Listing, ListingImage, SavedListing, 
            ListingReport, AdminAction
        )
        print("✓ listings.models.Listing")
        print("✓ listings.models.ListingImage")
        print("✓ listings.models.SavedListing")
        print("✓ listings.models.ListingReport")
        print("✓ listings.models.AdminAction")
        
        from categories.models import Category
        print("✓ categories.models.Category")
        
        return True
    except Exception as e:
        print(f"✗ Error importing models: {e}")
        return False


def main():
    """Main verification function"""
    print("\n🔍 Starting Migration Verification...\n")
    
    # Check migration status
    check_migration_status()
    
    # Verify tables exist
    missing_tables = verify_critical_tables()
    
    # Verify models are accessible
    models_ok = verify_models_accessible()
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    if missing_tables:
        print(f"\n❌ FAILED: {len(missing_tables)} table(s) missing:")
        for table in missing_tables:
            print(f"   - {table}")
        print("\n⚠️  Run: python manage.py migrate")
        sys.exit(1)
    elif not models_ok:
        print("\n❌ FAILED: Model imports failed")
        sys.exit(1)
    else:
        print("\n✅ SUCCESS: All tables exist and models are accessible")
        print("✅ Database is ready for production use")
        sys.exit(0)


if __name__ == '__main__':
    main()
