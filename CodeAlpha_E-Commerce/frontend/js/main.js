// Utility functions
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    const main = document.querySelector('main');
    main.insertBefore(messageDiv, main.firstChild);
    
    setTimeout(() => messageDiv.remove(), 3000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function updateHeader() {
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;

    if (api.getToken()) {
        userMenu.innerHTML = `
            <a href="dashboard.html">Dashboard</a>
            <a href="cart.html">Cart <span class="badge" id="cart-count">0</span></a>
            <a href="#" onclick="logout()">Logout</a>
        `;
        updateCartCount();
    } else {
        userMenu.innerHTML = `
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
            <a href="cart.html">Cart</a>
        `;
    }
}

async function updateCartCount() {
    if (!api.getToken()) return;
    
    const result = await api.getCartItems();
    if (result.success) {
        const count = result.data.length;
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }
}

function logout() {
    api.clearToken();
    localStorage.removeItem('cart');
    updateHeader();
    window.location.href = 'index.html';
}

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    
    // Load featured products on homepage
    const featuredSection = document.querySelector('.featured-products');
    if (featuredSection) {
        loadFeaturedProducts();
    }
});

async function loadFeaturedProducts() {
    const result = await api.getProducts(1, '', '');
    if (result.success && result.data.results) {
        const productList = document.querySelector('.product-list');
        productList.innerHTML = '';
        
        result.data.results.slice(0, 6).forEach(product => {
            const productDiv = createProductCard(product);
            productList.appendChild(productDiv);
        });
    }
}

function getProductImageUrl(product) {
    return product.image_url || 'https://via.placeholder.com/200?text=No+Image';
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-item';
    const imageUrl = getProductImageUrl(product);
    div.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}">
        <div class="product-item-content">
            <h3>${product.name}</h3>
            <p class="product-price">${formatPrice(product.price)}</p>
            <p class="product-description">${product.description.substring(0, 80)}...</p>
            <div class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-small btn-primary" onclick="goToProduct(${product.id})">View Details</button>
                <button class="btn btn-small" onclick="addProductToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
            </div>
        </div>
    `;
    return div;
}

function goToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

async function addProductToCart(productId, quantity = 1) {
    if (!api.getToken()) {
        showMessage('Please login to add items to cart', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    const result = await api.addToCart(productId, quantity);
    if (result.success) {
        showMessage('Product added to cart!', 'success');
        updateCartCount();
    } else {
        showMessage(result.error, 'error');
    }
}
