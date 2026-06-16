# E-Commerce Website - Full Stack Application

A complete e-commerce web application built with Django REST Framework (backend) and vanilla HTML/CSS/JavaScript (frontend).

## Features

- ✅ User Registration & Authentication (JWT Token-based)
- ✅ Browse Products with Search & Filtering
- ✅ Shopping Cart Management
- ✅ Order Placement & Management
- ✅ Order History Tracking
- ✅ Responsive Design (Mobile & Desktop)
- ✅ RESTful API with Django
- ✅ SQLite Database

## Project Structure

```
E-Commerce/
├── backend/
│   ├── ecommerce/          # Django project settings
│   ├── users/              # User management app
│   ├── products/           # Product catalog app
│   ├── orders/             # Order management app
│   ├── cart/               # Shopping cart app
│   ├── manage.py
│   ├── db.sqlite3
│   ├── requirements.txt
│   └── venv/               # Virtual environment
│
└── frontend/
    ├── index.html          # Homepage
    ├── styles.css          # Global styles
    ├── js/
    │   ├── api.js          # API client
    │   └── main.js         # Common functions
    └── pages/
        ├── products.html   # Products listing
        ├── login.html      # Login page
        ├── register.html   # Registration page
        ├── cart.html       # Shopping cart
        ├── checkout.html   # Checkout
        ├── dashboard.html  # Order history
        └── order-confirmation.html # Order confirmation
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd E-Commerce/backend
```

2. Activate the virtual environment:
```bash
source venv/bin/activate
# On Windows: venv\Scripts\activate
```

3. Install dependencies (already done, but to reinstall):
```bash
pip install -r requirements.txt
```

4. Run migrations (already done, but if needed):
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Load sample data (already done, but to reload):
```bash
python manage.py populate_data
```

6. Create a superuser for admin (optional):
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd E-Commerce/frontend
```

2. Open `index.html` in your web browser, or use a simple HTTP server:
```bash
python3 -m http.server 8080
```

Then visit: `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login (returns token)
- `POST /api/auth/register/` - Register new user
- `GET /api/auth/profile/` - Get user profile (requires auth)
- `PUT /api/auth/update_profile/` - Update user profile (requires auth)

### Products
- `GET /api/products/` - List products (with pagination, search, filtering)
- `GET /api/products/{id}/` - Get product details
- `GET /api/products/categories/` - List categories

### Cart
- `GET /api/cart/list_items/` - Get cart items (requires auth)
- `POST /api/cart/add_item/` - Add item to cart (requires auth)
- `PUT /api/cart/update_item/` - Update cart item quantity (requires auth)
- `DELETE /api/cart/remove_item/` - Remove item from cart (requires auth)
- `DELETE /api/cart/clear_cart/` - Clear entire cart (requires auth)

### Orders
- `POST /api/orders/` - Create order from cart (requires auth)
- `GET /api/orders/` - List user orders (requires auth)
- `GET /api/orders/{id}/` - Get order details (requires auth)

## Sample Data

The application comes with pre-populated sample products:

**Products:**
- Wireless Headphones - $99.99
- USB-C Cable - $15.99
- Coffee Maker - $45.99
- T-Shirt - $24.99
- Running Shoes - $120.00
- Programming Book - $35.99
- Desk Lamp - $29.99
- Portable Speaker - $59.99

**Test User:**
- Username: `testuser`
- Password: (create your own via registration, or use admin account)

## Usage Flow

1. **Register/Login**: Create an account or login with test credentials
2. **Browse Products**: Browse the product catalog with search and filtering
3. **Add to Cart**: Add products to your shopping cart
4. **Checkout**: Proceed to checkout with shipping information
5. **Place Order**: Complete your purchase
6. **View Orders**: Check order history in the dashboard

## Technology Stack

### Backend
- Django 6.0
- Django REST Framework
- Token Authentication
- SQLite3 Database
- Python 3.10+

### Frontend
- HTML5
- CSS3 (Responsive Design)
- Vanilla JavaScript (ES6+)
- RESTful API Integration

## Features Implemented

### User Management
- User registration with email validation
- Token-based authentication
- User profile management
- Secure password storage

### Product Catalog
- Product browsing with pagination
- Category filtering
- Full-text search
- Product details page
- Stock availability tracking

### Shopping Cart
- Add/remove items
- Update quantities
- Persistent cart data
- Cart summary

### Order Management
- Order creation from cart
- Order history tracking
- Order status updates
- Order confirmation page

### Security
- CORS configuration for frontend-backend communication
- Token-based authentication
- Password hashing with Django's built-in system
- CSRF protection

## Development Notes

### CORS Configuration
The backend is configured to accept requests from:
- http://localhost:3000
- http://localhost:8000
- http://127.0.0.1:3000
- http://127.0.0.1:8000
- file:// (for local file opens)

### Database
SQLite is used for development. For production, consider migrating to PostgreSQL or MySQL.

### API Documentation
Visit `http://localhost:8000/api/` to browse the API with Django REST Framework's browsable API.

## Future Enhancements

- Payment gateway integration (Stripe, PayPal)
- Product reviews and ratings
- Wishlist functionality
- Email notifications
- Admin dashboard for product management
- Advanced analytics and reporting
- Multi-language support
- Product images storage
- Inventory management system

## Troubleshooting

### API not accessible
- Ensure Django server is running: `python manage.py runserver`
- Check CORS configuration in `backend/ecommerce/settings.py`

### Frontend can't connect to API
- Verify backend is running on `http://localhost:8000`
- Check browser console for error messages
- Ensure API_BASE_URL in `js/api.js` is correct

### Database errors
- Run migrations: `python manage.py migrate`
- Check database file permissions

### Port already in use
- Backend: `python manage.py runserver 8001` (use different port)
- Frontend: `python3 -m http.server 8081`

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

Happy coding! 🚀
