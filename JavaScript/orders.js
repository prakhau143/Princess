// Orders Management System
class OrdersManager {
    constructor() {
        this.sessionToken = localStorage.getItem('sessionToken');
        this.userEmail = localStorage.getItem('userEmail');
        
        // Detect API base URL
        const currentPort = window.location.port;
        this.apiBase = (currentPort === '5500' || currentPort === '5501' || currentPort === '5502') 
            ? 'http://localhost:3000/api' 
            : '/api';
            
        this.init();
    }

    init() {
        // Check authentication
        if (!this.sessionToken || !this.userEmail) {
            this.showLoginRequired();
            return;
        }

        this.loadOrders();
        this.updateCartCount();
    }

    showLoginRequired() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').innerHTML = `
            <div class="empty-icon">🔐</div>
            <h3>Login Required</h3>
            <p>Please login to view your order history.</p>
            <a href="login.html" class="btn-primary">Login Now</a>
        `;
        document.getElementById('emptyState').style.display = 'block';
    }

    async loadOrders() {
        try {
            const response = await fetch(`${this.apiBase}/my-orders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.orders.length > 0) {
                    this.displayOrders(result.orders);
                } else {
                    this.showEmptyState();
                }
            } else {
                throw new Error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.loadLocalOrders();
        }

        document.getElementById('loadingState').style.display = 'none';
    }

    loadLocalOrders() {
        // Fallback: Load orders from localStorage
        const orderConfirmation = localStorage.getItem('orderConfirmation');
        if (orderConfirmation) {
            const order = JSON.parse(orderConfirmation);
            const mockOrders = [{
                id: order.orderId,
                customer_id: 1,
                products: JSON.stringify(order.items || []),
                total_amount: parseFloat(order.total),
                status: 'confirmed',
                created_at: order.date || new Date().toISOString()
            }];
            this.displayOrders(mockOrders);
        } else {
            this.showEmptyState();
        }
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
    }

    displayOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        let ordersHTML = '';

        orders.forEach(order => {
            const products = typeof order.products === 'string' 
                ? JSON.parse(order.products) 
                : order.products;
            
            const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const statusClass = `status-${order.status.toLowerCase()}`;
            const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);

            ordersHTML += `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <h3>Order #${order.id}</h3>
                            <div class="order-date">${orderDate}</div>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    
                    <div class="order-summary">
                        <div class="order-items">
                            ${this.renderOrderItems(products)}
                        </div>
                        <div class="order-total">
                            <div class="total-amount">₹${order.total_amount.toFixed(2)}</div>
                            <div class="total-label">Total Amount</div>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <button class="btn-secondary" onclick="viewOrderDetails('${order.id}')">
                            <ion-icon name="eye-outline"></ion-icon>
                            View Details
                        </button>
                        ${order.status === 'delivered' ? 
                            '<button class="btn-outline" onclick="reorderItems(\'' + order.id + '\')">Reorder</button>' : 
                            '<button class="btn-outline" onclick="trackOrder(\'' + order.id + '\')">Track Order</button>'
                        }
                    </div>
                </div>
            `;
        });

        ordersList.innerHTML = ordersHTML;
        ordersList.style.display = 'block';
    }

    renderOrderItems(products) {
        if (!products || products.length === 0) {
            return '<div class="order-item">No items found</div>';
        }

        return products.slice(0, 3).map(product => `
            <div class="order-item">
                <span class="item-name">${product.name}</span>
                <span class="item-quantity"> × ${product.quantity}</span>
            </div>
        `).join('') + (products.length > 3 ? `<div class="order-item">+${products.length - 3} more items</div>` : '');
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = cart.length;
        }
    }
}

// Global functions
function viewOrderDetails(orderId) {
    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('orderModalBody');
    
    // Get order details (in a real app, this would fetch from server)
    const orderConfirmation = localStorage.getItem('orderConfirmation');
    if (orderConfirmation) {
        const order = JSON.parse(orderConfirmation);
        if (order.orderId === orderId) {
            modalBody.innerHTML = `
                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Order Information</h4>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                        <p><strong>Order ID:</strong> #${order.orderId}</p>
                        <p><strong>Order Date:</strong> ${order.date}</p>
                        <p><strong>Total Amount:</strong> ₹${order.total}</p>
                        <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: 600;">Confirmed</span></p>
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Items Ordered</h4>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                        ${order.items ? order.items.map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ecf0f1;">
                                <div>
                                    <div style="font-weight: 500;">${item.name}</div>
                                    <div style="color: #7f8c8d; font-size: 0.9rem;">Quantity: ${item.quantity}</div>
                                </div>
                                <div style="font-weight: 600; color: #27ae60;">₹${(parseFloat(item.price.replace('₹', '')) * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('') : '<p>No items found</p>'}
                    </div>
                </div>
                
                <div>
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Delivery Information</h4>
                    <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); padding: 20px; border-radius: 10px;">
                        <p style="margin: 0; color: #2c3e50;"><strong>🚚 Estimated Delivery:</strong> 5-7 business days</p>
                        <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 0.9rem;">You will receive email updates about your order status and tracking information.</p>
                    </div>
                </div>
            `;
        }
    } else {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📦</div>
                <h4 style="color: #2c3e50; margin-bottom: 15px;">Order Details Not Found</h4>
                <p style="color: #7f8c8d;">Unable to load order details at this time.</p>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function trackOrder(orderId) {
    alert(`🚚 Tracking Order #${orderId}\n\nYour order is being processed and will be shipped within 2-3 business days.\n\nYou will receive tracking information via email once the order is dispatched.`);
}

function reorderItems(orderId) {
    const orderConfirmation = localStorage.getItem('orderConfirmation');
    if (orderConfirmation) {
        const order = JSON.parse(orderConfirmation);
        if (order.orderId === orderId && order.items) {
            // Add items back to cart
            const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
            order.items.forEach(item => {
                const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    currentCart.push(item);
                }
            });
            localStorage.setItem('cart', JSON.stringify(currentCart));
            
            alert(`✅ Items from Order #${orderId} have been added to your cart!`);
            window.location.href = 'cartPage.html';
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeOrderModal();
    }
});

// Initialize when page loads
window.addEventListener('load', function() {
    new OrdersManager();
});
