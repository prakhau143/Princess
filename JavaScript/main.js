// Scroll button functionality (only if element exists)
const scrollBtn = document.getElementById("scrollBtn");

if (scrollBtn) {
    window.onscroll = function() {scrollFunction()};

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollBtn.style.display = "block";
        } else {
            scrollBtn.style.display = "none";
        }
    }

    scrollBtn.addEventListener("click", function() {
        document.body.scrollTop = 0; 
        document.documentElement.scrollTop = 0; 
    });
}

// nav functionality (only if header exists)
var nav = document.getElementById('header');
var scrollUp = "scroll-up";
var scrollDown = "scroll-down";
var lastScroll = 0;

if (nav) {
    if (window.addEventListener) {
        window.addEventListener("scroll", scrollHandler);
    } else {
        window.attachEvent("scroll", scrollHandler);
    }
}

function scrollHandler() {
    if (!nav) return; // Safety check
    
    var currentScroll = window.pageYOffset;
    if (currentScroll === 0) {
        nav.classList.remove(scrollDown);
        nav.classList.remove(scrollUp);
        return;
    }
    if (currentScroll > lastScroll && !nav.classList.contains(scrollDown)) {
        // down
        nav.classList.remove(scrollUp);
        nav.classList.add(scrollDown);
    } 
    else if (currentScroll < lastScroll && nav.classList.contains(scrollDown)) {
        // up
        nav.classList.remove(scrollDown);
        nav.classList.add(scrollUp);
    }
    lastScroll = currentScroll;
}

// cart functionality (only if elements exist)
let closeCart = document.querySelector('.closeCart');
let iconCart = document.querySelector('.icon-cart');
let body = document.querySelector('body');

if (iconCart && body) {
    iconCart.addEventListener('click', () => {
        body.classList.toggle('showCart');
    });
}

if (closeCart && body) {
    closeCart.addEventListener('click', () => {
        body.classList.toggle('showCart');
    });
}

function viewCart(){
    window.location.href = "cartPage.html"
}

// Add event listeners for checkout functionality
document.addEventListener('DOMContentLoaded', function() {
    // Fix checkout button functionality
    const checkoutButtons = document.querySelectorAll('.checkout');
    checkoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof checkOut === 'function') {
                checkOut();
            } else {
                // Fallback checkout functionality
                window.location.href = 'checkout.html';
            }
        });
    });
    
    // Fix navigation buttons in checkout warning
    const backHomeBtn = document.getElementById('backHomeBtn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'products.html';
        });
    }
});

function setupUI() {
    let logout = document.getElementById("display_login");
    let login = document.getElementById("login_btn");
    let token = localStorage.getItem("email");

    if (logout && login) {
        if (token) {
            logout.style.display = "flex";
            login.style.display = "none";
        } else {
            logout.style.display = "none";
            login.style.display = "inline-block";
        }
    }
}

function logout(){
    localStorage.removeItem("email");
    localStorage.removeItem("password");
    setupUI();
}
setupUI();