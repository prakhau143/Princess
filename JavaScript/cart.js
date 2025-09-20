let cart = [];
let products = [];
let totalPrice = document.getElementById("total_price");
let cartCounter = document.getElementById("cart-counter");
let cartItemsCount = document.getElementById("cart_counts");
const cartTextElements = document.querySelectorAll(".cart_products");
const btnControl = document.querySelector(".btn_control");
const cartTotal = document.querySelector(".cart_total");

// Only initialize cart functionality if cart elements exist
if (cartCounter || totalPrice || cartTextElements.length > 0) {
    loadCart();
    getData();
    checkCart();
}

async function getData() {
    let response = await fetch('json/products.json');
    let json = await response.json();
    products = json;
}
function loadCart() {
    let storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Function to completely clear cart and update UI
function clearCartCompletely() {
    cart = [];
    localStorage.removeItem('cart');
    
    // Update cart counter
    if (cartCounter) cartCounter.innerHTML = 0;
    
    // Update cart display
    cartTextElements.forEach(element => {
        element.classList.add("empty");
        element.innerHTML = "Your cart is empty";
    });
    
    // Hide cart controls
    if (btnControl) btnControl.style.display = "none";
    if (cartTotal) cartTotal.style.display = "none";
    
    // Update total price
    if (totalPrice) totalPrice.innerHTML = "₹0.00";
    
    // Update cart items count
    if (cartItemsCount) cartItemsCount.innerHTML = 0;
    
    checkCartPage(0, 0);
    
    console.log('Cart cleared completely');
}

function addToCart(productId,inputQuantity = 1) {
    let product = products.find(p => p.id == productId);
    if (product) {
        let existingProduct = cart.find(p => p.id == productId);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            let productWithQuantity = { ...product, quantity: inputQuantity };
            cart.push(productWithQuantity);
        }
        saveCart();
        checkCart();
    }
}

function addCartToHTML() {
    let content = ``;
    cart.forEach((product, index) => {
        let price = parseFloat(product.price.replace('$', ''));
        let totalPrice = price * product.quantity;
        content += `
        <div class="cart_product">
            <div class="cart_product_img">  
                <img src=${product.images[0]}>
            </div>
            <div class="cart_product_info">  
                <div class="top_card">
                    <div class="left_card">
                        <h4 class="product_name">${product.name}</h4>
                        <span class="product_price">${product.price}</span>
                    </div>
                    <div class="remove_product" onclick="removeFromCart(${index})">
                        <ion-icon name="close-outline"></ion-icon>
                    </div>
                </div>
                <div class="buttom_card">
                    <div class="counts">
                        <button class="counts_btns minus"  onclick="decreaseQuantity(${index})">-</button>
                        <input type="number" inputmode="numeric" name="productCount" min="1" step="1" max="999"
                            class="product_count"  value=${product.quantity}>
                        <button  class="counts_btns plus" onclick="increaseQuantity(${index})">+</button>
                    </div>
                    <span class="total_price">$${totalPrice}.00</span>
                </div>
            </div>
        </div>`;
    });
    cartTextElements.forEach(element => {
        element.innerHTML = content;
    });;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    checkCart();
}
function increaseQuantity(index){
    cart[index].quantity += 1;
    saveCart();
    checkCart();
}
function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        saveCart();
        checkCart();
    } else {
        removeFromCart(index);
    }
}

function updateTotalPrice() {
    let total = cart.reduce((sum, product) => {
        let price = parseFloat(product.price.replace('$', ''));
        return sum + (price * product.quantity);
    }, 0);
    totalPrice.innerHTML = `$${total.toFixed(2)}`;
    localStorage.setItem("total price" , total + 70);
    return total;
}

// Initial call to display the cart products on page load
function checkCart(){
    if (cart.length == 0) {
        cartTextElements.forEach(element => {
            element.classList.add("empty");
            element.innerHTML = "Your cart is empty";
        })
        if (cartCounter) cartCounter.innerHTML = 0;
        if (btnControl) btnControl.style.display = "none";
        if (cartTotal) cartTotal.style.display = "none";
        checkCartPage(0,0);
    } else {
        cartTextElements.forEach(element => {
            element.classList.remove("empty");
        })
        addCartToHTML();
        let totalQuantity = cart.reduce((sum, product) => sum + product.quantity, 0);
        if (cartCounter) cartCounter.innerHTML = totalQuantity;
        if (btnControl) btnControl.style.display = "flex";
        if (cartTotal) cartTotal.style.display = "flex";
        let total = updateTotalPrice();
        checkCartPage(total,totalQuantity);       
    }
}
// Add cart page not cart section
function checkCartPage(total,totalQuantity){
    if (window.location.pathname.includes("cartPage.html")) {
        if (cart.length == 0) {
            cartItemsCount.innerHTML = `(0 items)`;
            document.getElementById("Subtotal").innerHTML = `$0.00`;
            document.getElementById("total_order").innerHTML = `$0.00`;
        }
        else{
            cartItemsCount.innerHTML = `(${totalQuantity} items)`;
            displayInCartPage(total);
        }
    }
}
function displayInCartPage(total){
    let subTotal = document.getElementById("Subtotal");
    subTotal.innerHTML = `$${total.toFixed(2)}`;
    let totalOrder= parseFloat(subTotal.innerHTML.replace('$', '')) + 70;
    document.getElementById("total_order").innerHTML = `$${totalOrder.toFixed(2)}`;
}
function checkOut(){
    let sessionToken = localStorage.getItem('sessionToken');
    let userEmail = localStorage.getItem('userEmail');
    let customerData = localStorage.getItem('customerData');
    
    if (cart.length != 0) {
        if(sessionToken && userEmail){
            if(customerData){
                // User is authenticated and has filled details, proceed to checkout
                window.location.href = "checkout.html";
            } else {
                // User is authenticated but hasn't filled details
                alert('Please complete your profile first.');
                window.location.href = "form.html";
            }
        }
        else {
            // User not authenticated
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
        ? 'http://localhost:3002/api' 
        : '/api';
    
    const sessionToken = localStorage.getItem('sessionToken');
    const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');
    
    if (!sessionToken) {
        alert('Please login first.');
        window.location.href = 'login.html';
        return;
    }
    
    if (!customerData.name) {
        alert('Please complete your profile first.');
        window.location.href = 'form.html';
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    
    try {
        // Calculate total
        let total = 0;
        const orderProducts = cart.map(product => {
            const price = parseFloat(product.price.replace(/[$₹,]/g, ''));
            const productTotal = price * product.quantity;
            total += productTotal;
            
            return {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                total: productTotal
            };
        });
        
        // Add shipping if applicable
        const shipping = total > 500 ? 0 : 70;
        const finalTotal = total + shipping;
        
        const orderData = {
            products: orderProducts,
            totalAmount: finalTotal,
            shipping: shipping,
            subtotal: total
        };
        
        // Show loading state
        const checkoutBtn = document.querySelector('.checkout');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Placing Order...';
        }
        
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
            saveCart();
            checkCart();
            
            // Show success message
            alert(`Order placed successfully! Order ID: #${result.orderId}\n\nYou will receive confirmation emails shortly.`);
            
            // Redirect to products page
            window.location.href = 'products.html';
            
        } else {
            throw new Error(result.error || 'Failed to place order');
        }
        
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order: ' + error.message);
    } finally {
        // Reset button state
        const checkoutBtn = document.querySelector('.checkout');
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Place Order';
        }
    }
}
