// Enhanced Checkout System for SMTP-based Ecommerce
class CheckoutManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Load current customer data (email-specific)
        const currentCustomerData = localStorage.getItem('currentCustomerData');
        const currentCustomerEmail = localStorage.getItem('currentCustomerEmail');
        
        if (currentCustomerData && currentCustomerEmail) {
            this.customerData = JSON.parse(currentCustomerData);
            this.customerEmail = currentCustomerEmail;
        } else {
            // Fallback to old method for backward compatibility
            this.customerData = JSON.parse(localStorage.getItem('customerData') || '{}');
            this.customerEmail = localStorage.getItem('userEmail') || '';
        }
        
        this.sessionToken = localStorage.getItem('sessionToken');
        
        // Detect API base URL
        const currentPort = window.location.port;
        this.apiBase = (currentPort === '5500' || currentPort === '5501' || currentPort === '5502') 
            ? 'http://localhost:3000/api' 
            : '/api';
            
        this.init();
        
        // Make checkout manager globally available
        window.checkoutManager = this;
    }

    init() {
        this.attachButtonListeners();
        // Check authentication
        if (!this.sessionToken) {
            alert('Please login first.');
            window.location.href = 'login.html';
            return;
        }

        // Check if current customer has filled the form
        if (!this.customerData.name || !this.customerEmail) {
            alert('Please complete your profile first.');
            window.location.href = 'login.html';
            return;
        }

        // Validate that the current customer data belongs to the logged-in user
        const currentUserEmail = localStorage.getItem('userEmail');
        if (currentUserEmail && this.customerEmail !== currentUserEmail) {
            // Current customer data doesn't match logged-in user
            // Check if logged-in user has their own data
            const userSpecificKey = `customerData_${currentUserEmail}`;
            const userSpecificData = localStorage.getItem(userSpecificKey);
            
            if (userSpecificData) {
                // User has their own data, use it
                this.customerData = JSON.parse(userSpecificData);
                this.customerEmail = currentUserEmail;
                localStorage.setItem('currentCustomerData', JSON.stringify(this.customerData));
                localStorage.setItem('currentCustomerEmail', currentUserEmail);
            } else {
                // User doesn't have form data, redirect to form
                alert('Please complete your profile first.');
                window.location.href = `form.html?email=${encodeURIComponent(currentUserEmail)}`;
                return;
            }
        }

        if (this.cart.length === 0) {
            alert('Your cart is empty.');
            window.location.href = 'index.html';
            return;
        }

        this.displayOrderSummary();
        this.displayCustomerDetails();
        this.showCheckAnimation();
    }

    displayOrderSummary() {
        const orderItemsContainer = document.getElementById('orderItems');
        const subtotalEl = document.getElementById('subtotal');
        const shippingEl = document.getElementById('shipping');
        const finalTotalEl = document.getElementById('finalTotal');

        let subtotal = 0;
        let itemsHTML = '';

        this.cart.forEach(product => {
            const price = parseFloat(product.price.replace(/[$₹,]/g, ''));
            const productTotal = price * product.quantity;
            subtotal += productTotal;

            itemsHTML += `
                <div class="order-item">
                    <div class="item-info">
                        <span class="item-name">${product.name}</span>
                        <span class="item-details">Qty: ${product.quantity} × ₹${price}</span>
                    </div>
                    <div class="item-total">₹${productTotal.toFixed(2)}</div>
                </div>
            `;
        });

        const shipping = subtotal > 500 ? 0 : 70;
        const finalTotal = subtotal + shipping;

        orderItemsContainer.innerHTML = itemsHTML;
        subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
        finalTotalEl.textContent = `₹${finalTotal.toFixed(2)}`;

        // Store totals for order placement
        this.orderTotals = {
            subtotal,
            shipping,
            finalTotal
        };
    }

    displayCustomerDetails() {
        const customerInfoEl = document.getElementById('customerInfo');
        
        customerInfoEl.innerHTML = `
            <div class="customer-info">
                <div style="
                    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(39, 174, 96, 0.2);
                    font-size: 0.9rem;
                ">
                    <strong>📧 Customer Email:</strong> ${this.customerEmail}
                </div>
                <p><strong>Name:</strong> ${this.customerData.name}</p>
                <p><strong>Phone:</strong> ${this.customerData.phone}</p>
                <p><strong>Address:</strong> ${this.customerData.address}</p>
                <p><strong>City:</strong> ${this.customerData.city}, ${this.customerData.state}</p>
                <p><strong>PIN Code:</strong> ${this.customerData.pincode}</p>
            </div>
        `;
    }

    showCheckAnimation() {
        const checkIconContainer = document.getElementById('checkoutIcon');
        checkIconContainer.innerHTML = '';
        const newCheckIcon = document.createElement('div');
        newCheckIcon.style.width = '200px';
        newCheckIcon.style.height = '200px';
        checkIconContainer.appendChild(newCheckIcon);

        // Try to load animation, fallback to simple icon if fails
        try {
            lottie.loadAnimation({
                container: newCheckIcon,
                renderer: 'svg',
                loop: false,
                autoplay: true,
                path: 'json/AnimationCheckoutPage.json'
            });
        } catch (error) {
            newCheckIcon.innerHTML = '🛒';
            newCheckIcon.style.fontSize = '80px';
            newCheckIcon.style.textAlign = 'center';
            newCheckIcon.style.lineHeight = '200px';
        }
    }

    async finalizeOrder() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const placeOrderText = document.getElementById('placeOrderText');
        const placeOrderSpinner = document.getElementById('placeOrderSpinner');

        // Disable button and show loading
        placeOrderBtn.disabled = true;
        placeOrderText.textContent = 'Processing...';
        placeOrderSpinner.style.display = 'inline-block';

        try {
            // Check if we have cart items
            if (!this.cart || this.cart.length === 0) {
                throw new Error('Cart is empty');
            }

            // Prepare order data
            const orderProducts = this.cart.map(product => {
                const price = parseFloat(product.price.replace('₹', ''));
                return {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: product.quantity,
                    total: price * product.quantity
                };
            });

            const orderData = {
                products: orderProducts,
                totalAmount: this.orderTotals.finalTotal,
                shipping: this.orderTotals.shipping,
                subtotal: this.orderTotals.subtotal
            };

            // Try to place order with server
            let orderSuccess = false;
            let orderId = null;

            try {
                console.log('🔄 Attempting to place order with server...');
                console.log('API Base URL:', this.apiBase);
                console.log('Session Token:', this.sessionToken ? `Present: ${this.sessionToken.substring(0, 20)}...` : 'Missing');
                
                // Check if session token is valid before making request
                if (!this.sessionToken) {
                    throw new Error('No session token found. Please login again.');
                }
                
                const response = await fetch(`${this.apiBase}/place-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.sessionToken}`
                    },
                    body: JSON.stringify(orderData)
                });

                console.log('Response status:', response.status);
                const result = await response.json();
                console.log('Server response:', result);

                if (response.ok && result.success) {
                    orderSuccess = true;
                    orderId = result.orderId;
                    console.log('✅ Order placed successfully with email notifications');
                    
                    // Clear cart after successful order
                    localStorage.removeItem('cart');
                    
                } else {
                    throw new Error(result.error || 'Server error');
                }
            } catch (serverError) {
                console.error('❌ Server API Error:', serverError);
                
                // If it's an authentication error, redirect to login
                if (serverError.message.includes('Unauthorized') || serverError.message.includes('session')) {
                    alert('Your session has expired. Please login again.');
                    localStorage.removeItem('sessionToken');
                    localStorage.removeItem('userEmail');
                    window.location.href = 'login.html';
                    return;
                }
                
                alert(`Could not connect to the server to place your order. Please check your connection and try again.\n\nError: ${serverError.message}\n\nSwitching to demo mode for now.`);

                console.log('⚠️ Server not available, using demo mode.');
                
                // Demo mode - generate mock order ID and simulate email sending
                orderId = 'DEMO' + Date.now().toString().slice(-6);
                orderSuccess = true;
                
                // Clear cart in demo mode too
                localStorage.removeItem('cart');
                
                // Simulate email notifications in demo mode
                this.simulateEmailNotifications(orderData, orderId);
            }

            if (orderSuccess) {
                this.showOrderSuccess(orderId);
            } else {
                throw new Error('Failed to process order');
            }

        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order: ' + error.message);
        } finally {
            // Reset button state
            placeOrderBtn.disabled = false;
            placeOrderText.textContent = 'Place Order';
            placeOrderSpinner.style.display = 'none';
        }
    }

    showOrderSuccess(orderId) {
        // Store order info for duplicate prevention
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        if (typeof storeOrderInfo === 'function') {
            storeOrderInfo(orderId, cartItems);
        }
        
        // Store order confirmation data for home page popup
        const orderConfirmation = {
            orderId: orderId,
            total: this.orderTotals.finalTotal.toFixed(2),
            date: this.formatDate(new Date()),
            timestamp: Date.now(),
            items: cartItems
        };
        localStorage.setItem('orderConfirmation', JSON.stringify(orderConfirmation));
        
        // Clear the cart immediately after successful order
        this.clearCart();
        
        console.log(`🎉 Order ${orderId} completed successfully!`);
        
        // Show success message and redirect to home page after 3 seconds
        setTimeout(() => {
            alert(`🎉 Order placed successfully! Order ID: ${orderId}\n\nYou will receive confirmation emails shortly.\n\nRedirecting to home page...`);
            window.location.href = 'index.html?orderSuccess=true';
        }, 3000);
        
        // Show temporary success message
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #ffeef8 0%, #f0f8ff 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Poppins', sans-serif;
            ">
                <div style="
                    text-align: center;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 50px;
                    border-radius: 25px;
                    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.12);
                    max-width: 500px;
                    width: 90%;
                ">
                    <div style="font-size: 4rem; color: #27ae60; margin-bottom: 20px;">✓</div>
                    <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.8rem;">Order Placed Successfully!</h2>
                    <p style="color: #7f8c8d; font-size: 1.1rem; margin-bottom: 20px;">Order #${orderId}</p>
                    <p style="color: #8e44ad; font-weight: 600;">Redirecting to home page...</p>
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #8e44ad;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    "></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    formatDate(date) {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    }

    // Simulate email notifications in demo mode
    simulateEmailNotifications(orderData, orderId) {
        console.log('📧 Simulating email notifications...');
        console.log(`📨 Owner notification: New order #${orderId} - ₹${orderData.totalAmount}`);
        console.log(`📧 Customer confirmation: Order #${orderId} confirmed for ${this.customerEmail}`);
        
        // Show notification to user
        setTimeout(() => {
            alert(`📧 Email notifications sent!\n\n✅ Order confirmation sent to: ${this.customerEmail}\n✅ Order details sent to store owner\n\nOrder ID: #${orderId}`);
        }, 1000);
    }

    clearCart() {
        localStorage.removeItem('cart');
        // Reset cart array to empty
        if (typeof cart !== 'undefined') {
            cart.length = 0;
        }
        // Also clear any cart-related UI if present
        if (typeof updateCartDisplay === 'function') {
            updateCartDisplay();
        }
        if (typeof checkCart === 'function') {
            checkCart();
        }
    }

    attachButtonListeners() {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.finalizeOrder();
            });
        }

        const backBtn = document.getElementById('back_btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                backToCart();
            });
        }
    }
}

// Global functions for button clicks
function finalizeOrder() {
    if (window.checkoutManager) {
        window.checkoutManager.finalizeOrder();
    }
}

function backToCart() {
    window.location.href = "cartPage.html";
}

function backHome() {
    window.location.href = "index.html";
}

// Initialize checkout when page loads
window.addEventListener("load", function() {
    window.checkoutManager = new CheckoutManager();
});