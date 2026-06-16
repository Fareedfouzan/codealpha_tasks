# Quick Start Guide

## Starting the E-Commerce Application

### Prerequisites
- Python 3.10+
- Two terminal windows

### Step 1: Start Django Backend Server

```bash
cd /Users/fareedkhan/Desktop/E-Commerce/backend
source venv/bin/activate
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Start Frontend HTTP Server

Open a NEW terminal window and run:

```bash
cd /Users/fareedkhan/Desktop/E-Commerce/frontend
python3 -m http.server 8080
```

You should see:
```
Serving HTTP on 0.0.0.0 port 8080
```

### Step 3: Open in Browser

Visit: **http://localhost:8080**

⚠️ **IMPORTANT**: Use `http://localhost:8080` NOT `file://` protocol!

## Login Credentials

**Demo User:**
- Username: `testuser`
- Password: `testuser123`

**Or Create Your Own:**
- Click "Register" to create a new account

## Testing the Application

1. **Login** with testuser credentials
2. **Browse Products** → Products page shows 8 sample items
3. **Add to Cart** → Click "Add to Cart" on any product
4. **View Cart** → Click "Shopping Cart" in header
5. **Checkout** → Fill in shipping details and place order
6. **View Orders** → Check "My Orders" in the dashboard

## Running Servers in Background (Optional)

### Terminal 1 - Backend:
```bash
cd /Users/fareedkhan/Desktop/E-Commerce/backend
source venv/bin/activate
python manage.py runserver
```
Keep this open!

### Terminal 2 - Frontend:
```bash
cd /Users/fareedkhan/Desktop/E-Commerce/frontend
python3 -m http.server 8080
```
Keep this open!

## Troubleshooting

### "Your file couldn't be accessed" error
- **Problem**: You opened `index.html` as a file (file://)
- **Solution**: Use http://localhost:8080 instead

### API connection error
- Ensure Django backend is running on port 8000
- Check that http://localhost:8000/api/ responds

### Can't move between pages
- Make sure you're using the HTTP server, not file:// protocol
- Refresh the page and try again

## API Endpoints (for reference)

- http://localhost:8000/api/products/ - View all products
- http://localhost:8000/api/products/categories/ - View categories
- http://localhost:8000/api/auth/login/ - Login endpoint
- http://localhost:8000/api/orders/ - View orders (requires login)

## File Structure

```
E-Commerce/
├── frontend/
│   ├── index.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   ├── order-confirmation.html
│   ├── styles.css
│   └── js/
│       ├── api.js
│       └── main.js
│
└── backend/
    ├── manage.py
    ├── db.sqlite3
    ├── ecommerce/
    ├── users/
    ├── products/
    ├── orders/
    └── cart/
```

## Need Help?

Check the main README.md for detailed documentation!
