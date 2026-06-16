from django.core.management.base import BaseCommand
from products.models import Category, Product
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        # Create categories
        categories_data = [
            {'name': 'Electronics', 'description': 'Electronic devices'},
            {'name': 'Clothing', 'description': 'Apparel and fashion'},
            {'name': 'Books', 'description': 'Physical and digital books'},
            {'name': 'Home & Garden', 'description': 'Home and garden items'},
        ]

        for cat_data in categories_data:
            Category.objects.get_or_create(**cat_data)

        # Create sample products
        products_data = [
            {'name': 'Wireless Headphones', 'description': 'High-quality wireless headphones with noise cancellation', 'price': 99.99, 'stock': 50, 'category': 'Electronics'},
            {'name': 'USB-C Cable', 'description': 'Fast charging USB-C cable, 2 meters', 'price': 15.99, 'stock': 100, 'category': 'Electronics'},
            {'name': 'Coffee Maker', 'description': 'Automatic coffee maker with 12 cups capacity', 'price': 45.99, 'stock': 30, 'category': 'Home & Garden'},
            {'name': 'T-Shirt', 'description': 'Comfortable cotton t-shirt in various colors', 'price': 24.99, 'stock': 200, 'category': 'Clothing'},
            {'name': 'Running Shoes', 'description': 'Professional running shoes with premium cushioning', 'price': 120.00, 'stock': 40, 'category': 'Clothing'},
            {'name': 'Programming Book', 'description': 'Clean Code: A Handbook of Agile Software Craftsmanship', 'price': 35.99, 'stock': 60, 'category': 'Books'},
            {'name': 'Desk Lamp', 'description': 'LED desk lamp with adjustable brightness', 'price': 29.99, 'stock': 75, 'category': 'Home & Garden'},
            {'name': 'Portable Speaker', 'description': 'Waterproof Bluetooth speaker with 12-hour battery', 'price': 59.99, 'stock': 45, 'category': 'Electronics'},
        ]

        for prod_data in products_data:
            category_name = prod_data.pop('category')
            category = Category.objects.get(name=category_name)
            product, _ = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults={**prod_data, 'category': category}
            )
            expected_image = f'products/product_{product.id}.jpg'
            if not product.image or product.image.name != expected_image:
                product.image = expected_image
                product.save(update_fields=['image'])

        # Create a test user
        User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com', 'first_name': 'Test', 'last_name': 'User'}
        )
        User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True}
        )

        self.stdout.write(self.style.SUCCESS('Sample data created successfully'))
