#!/usr/bin/env python
"""
Script to populate the database with sample categories.
Run this after migrations: python manage.py shell < populate_categories.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'olx_backend.settings')
django.setup()

from categories.models import Category

categories = [
    {'name': 'Electronics', 'description': 'Phones, laptops, cameras, and electronic gadgets', 'icon': 'laptop'},
    {'name': 'Vehicles', 'description': 'Cars, bikes, scooters, and other vehicles', 'icon': 'car'},
    {'name': 'Real Estate', 'description': 'Houses, apartments, land, and commercial properties', 'icon': 'home'},
    {'name': 'Furniture', 'description': 'Home and office furniture', 'icon': 'chair'},
    {'name': 'Fashion', 'description': 'Clothing, shoes, bags, and accessories', 'icon': 'shirt'},
    {'name': 'Books', 'description': 'Books, magazines, comics, and educational materials', 'icon': 'book'},
    {'name': 'Sports', 'description': 'Sports equipment, gym gear, and outdoor items', 'icon': 'dumbbell'},
    {'name': 'Pets', 'description': 'Pets and pet accessories', 'icon': 'paw'},
    {'name': 'Services', 'description': 'Professional services and freelance work', 'icon': 'briefcase'},
    {'name': 'Other', 'description': 'Miscellaneous items', 'icon': 'grid'},
]

print("Creating categories...")
created_count = 0
for cat_data in categories:
    category, created = Category.objects.get_or_create(
        name=cat_data['name'],
        defaults={
            'description': cat_data['description'],
            'icon': cat_data['icon']
        }
    )
    if created:
        created_count += 1
        print(f"✓ Created: {category.name}")
    else:
        print(f"- Already exists: {category.name}")

print(f"\nDone! {created_count} new categories created.")
print(f"Total categories: {Category.objects.count()}")
