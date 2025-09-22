let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];

// Load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('./json/products.json');
        products = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    displayCart();
});

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: 1
        });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    displayCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    displayCart();
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            localStorage.setItem("cart", JSON.stringify(cart));
            displayCart();
        }
    }
}

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
    });
}

function displayCart() {
    const cartContainer = document.getElementById("cart-container");
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Your cart is empty</h3>
                <p>Add some items to get started!</p>
                <a href="products.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }

    let total = 0;
    let cartHTML = '';

    cart.forEach(item => {
        const price = parseFloat(item.price.replace(/[$₹,]/g, ''));
        const itemTotal = price * item.quantity;
        total += itemTotal;

        cartHTML += `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">${item.price}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" class="qty-btn">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" class="qty-btn">+</button>
                </div>
                <div class="item-total">
                    ₹${itemTotal.toFixed(2)}
                </div>
                <button onclick="removeFromCart(${item.id})" class="remove-btn">×</button>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML;
    displayInCartPage(total);
    updateCartCount();
}

function displayInCartPage(total) {
    let subTotal = document.getElementById("Subtotal");
    if (subTotal) {
        subTotal.innerHTML = `₹${total.toFixed(2)}`;
        let totalOrder = parseFloat(subTotal.innerHTML.replace('₹', '')) + 70;
        const totalElement = document.getElementById("total_order");
        if (totalElement) {
            totalElement.innerHTML = `₹${totalOrder.toFixed(2)}`;
        }
    }
}

function checkOut() {
    if (cart.length > 0) {
        // Check authentication
        let emailToken = localStorage.getItem("email");
        let sessionToken = localStorage.getItem("sessionToken");
        let userEmail = localStorage.getItem("userEmail");
        
        console.log('Auth check:', { emailToken, sessionToken, userEmail });
        
        // User is authenticated if they have either email token or session token
        if (emailToken || sessionToken || userEmail) {
            // Determine the current user email
            const currentUserEmail = userEmail || emailToken;
            
            if (!currentUserEmail) {
                alert('Please login first to proceed with checkout.');
                window.location.href = "login.html";
                return;
            }
            
            // Check if customer data exists for current user
            const userSpecificKey = `customerData_${currentUserEmail}`;
            let customerData = localStorage.getItem(userSpecificKey) || localStorage.getItem("customerData");
            
            console.log('Customer data check:', { userSpecificKey, customerData });
            
            if (customerData) {
                try {
                    // Validate customer data
                    const parsedData = JSON.parse(customerData);
                    if (parsedData.name && parsedData.phone && parsedData.address) {
                        // Set current customer data for checkout
                        localStorage.setItem('currentCustomerData', customerData);
                        localStorage.setItem('currentCustomerEmail', currentUserEmail);
                        window.location.href = "checkout.html";
                    } else {
                        throw new Error('Incomplete customer data');
                    }
                } catch (e) {
                    console.error('Error parsing customer data:', e);
                    window.location.href = `form.html?email=${encodeURIComponent(currentUserEmail)}`;
                }
            } else {
                // No customer data, redirect to form
                console.log('Redirecting to form - no data');
                window.location.href = `form.html?email=${encodeURIComponent(currentUserEmail)}`;
            }
        } else {
            // User not authenticated
            alert('Please login first to proceed with checkout.');
            window.location.href = "login.html";
        }
    } else {
        alert('Your cart is empty. Please add some items first.');
    }
}

// Enhanced order placement function
async function placeOrder() {
    // Detect API base URL
    const currentPort = window.location.port;
    const apiBase = (currentPort === '5500' || currentPort === '5501' || currentPort === '5502') 
        ? 'http://localhost:3000/api' 
        : '/api';
    
    const sessionToken = localStorage.getItem('sessionToken');
    const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');
    
    if (!sessionToken) {
        alert('Please login first.');
        window.location.href = 'login.html';
        return;
    }

    if (!customerData.name || !customerData.email || !customerData.phone) {
        alert('Please complete your profile first.');
        window.location.href = 'form.html';
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    try {
        const orderData = {
            customerData,
            items: cart,
            total: cart.reduce((sum, item) => {
                const price = parseFloat(item.price.replace(/[$₹,]/g, ''));
                return sum + (price * item.quantity);
            }, 0) + 70, // Adding shipping
            orderDate: new Date().toISOString()
        };

        console.log('Placing order:', orderData);

        const response = await fetch(`${apiBase}/place-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Clear cart
            cart = [];
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartCount();
            
            // Store order confirmation
            localStorage.setItem('lastOrderId', result.orderId);
            localStorage.setItem('orderConfirmation', JSON.stringify({
                orderId: result.orderId,
                total: orderData.total,
                date: orderData.orderDate
            }));
            
            alert('Order placed successfully! Check your email for confirmation.');
            window.location.href = 'orders.html';
        } else {
            throw new Error(result.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Order placement error:', error);
        alert('Failed to place order. Please try again.');
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
