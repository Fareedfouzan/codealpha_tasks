const API_BASE_URL = 'http://localhost:8000/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    getToken() {
        return this.token;
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    async request(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }

        const config = {
            method,
            headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            if (response.status === 204) {
                return { success: true };
            }

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.detail || responseData.error || 'API Error');
            }

            return { success: true, data: responseData };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // Products API
    async getProducts(page = 1, search = '', category = '') {
        let query = `/products/?page=${page}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (category) query += `&category=${category}`;
        return this.request(query);
    }

    async getProduct(id) {
        return this.request(`/products/${id}/`);
    }

    async getCategories() {
        return this.request('/products/categories/');
    }

    // Auth API
    async register(username, email, password, firstName = '', lastName = '') {
        return this.request('/auth/register/', 'POST', {
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
        });
    }

    async getProfile() {
        return this.request('/auth/profile/');
    }

    async updateProfile(data) {
        return this.request('/auth/update_profile/', 'PUT', data);
    }

    // Cart API
    async getCartItems() {
        return this.request('/cart/list_items/');
    }

    async addToCart(productId, quantity = 1) {
        return this.request('/cart/add_item/', 'POST', {
            product_id: productId,
            quantity,
        });
    }

    async updateCartItem(productId, quantity) {
        return this.request('/cart/update_item/', 'PUT', {
            product_id: productId,
            quantity,
        });
    }

    async removeFromCart(productId) {
        return this.request('/cart/remove_item/', 'DELETE', {
            product_id: productId,
        });
    }

    async clearCart() {
        return this.request('/cart/clear_cart/', 'DELETE');
    }

    // Orders API
    async createOrder(data) {
        return this.request('/orders/', 'POST', data);
    }

    async getOrders() {
        return this.request('/orders/');
    }

    async getOrder(id) {
        return this.request(`/orders/${id}/`);
    }
}

const api = new APIClient();
