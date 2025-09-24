let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];

// Load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('./json/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        products = await response.json();
        console.log('✅ Products loaded successfully:', products.length, 'items');
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Fallback: Show error message or continue without products
    }
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    displayCart();
    updateCartCount(); // Ensure counter is updated on page load
});

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

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
    updateCartCount(); // Update counter immediately
    displayCart(); // Update display
    console.log('✅ Item added to cart:', product.name, 'Cart count:', cart.reduce((total, item) => total + item.quantity, 0));
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

    // Update cart counter in header (all pages)
    const cartCountElements = document.querySelectorAll('#cart-counter, .cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;

        // Show/hide counter based on cart contents
        if (cartCount > 0) {
            element.style.display = 'block';
            element.style.opacity = '1';
        } else {
            element.style.display = 'none';
        }
    });

    // Update cart count display in cart page
    const cartCountsElement = document.getElementById('cart_counts');
    if (cartCountsElement) {
        cartCountsElement.textContent = cartCount > 0 ? `(${cartCount})` : '';
    }

    console.log('Cart counter updated:', cartCount);
}

function displayCart() {
    // Display in main cart page
    const cartContainer = document.querySelector(".cart_page .cart_products");
    if (cartContainer) {
        displayMainCart(cartContainer);
    }
    
    // Display in popup cart
    const popupCartContainer = document.querySelector(".cart-section .cart_products");
    if (popupCartContainer) {
        displayPopupCart(popupCartContainer);
    }
    
    updateCartCount();
}

function displayMainCart(cartContainer) {
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
}

function displayPopupCart(cartContainer) {
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Your cart is empty</h3>
                <p>Add some items to get started!</p>
            </div>
        `;
        updatePopupTotal(0);
        return;
    }

    let total = 0;
    let cartHTML = '';

    cart.forEach(item => {
        const price = parseFloat(item.price.replace(/[$₹,]/g, ''));
        const itemTotal = price * item.quantity;
        total += itemTotal;

        cartHTML += `
            <div class="cart_product" data-id="${item.id}">
                <div class="cart_product_img">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart_product_info">
                    <div class="top_card">
                        <h4>${item.name}</h4>
                        <div class="product_price">${item.price}</div>
                    </div>
                    <div class="buttom_card">
                        <div class="counts">
                            <div class="counts_btns">
                                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="remove_product" onclick="removeFromCart(${item.id})">
                            <ion-icon name="trash-outline"></ion-icon>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML;
    updatePopupTotal(total);
}

function updatePopupTotal(total) {
    const totalElement = document.getElementById("total_price");
    if (totalElement) {
        totalElement.textContent = `₹${total.toFixed(2)}`;
    }
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
            total: (() => {
                const subtotal = cart.reduce((sum, item) => {
                    const price = parseFloat(item.price.replace(/[$₹,]/g, ''));
                    return sum + (price * item.quantity);
                }, 0);
                const shipping = subtotal >= 70 ? 0 : 70;
                return subtotal + shipping;
            })(),
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
