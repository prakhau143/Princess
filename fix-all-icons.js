// Comprehensive Icon Fix Script for HiKraze Ecommerce
// This script ensures all icons are properly loaded across all pages

(function() {
    'use strict';

    // Enhanced icon fallback mapping
    const iconFallbacks = {
        // Cart and shopping icons
        'cart-outline': '🛒',
        'cart': '🛒',
        'bag-outline': '🛍️',
        'bag': '🛍️',
        
        // User and authentication icons
        'person-circle-outline': '👤',
        'person-outline': '👤',
        'person': '👤',
        'log-out-outline': '🚪',
        'log-out': '🚪',
        
        // Social media icons
        'logo-instagram': '📷',
        'logo-facebook': '📘',
        'logo-whatsapp': '💬',
        
        // Navigation and UI icons
        'close-outline': '✕',
        'close': '✕',
        'arrow-up-outline': '⬆️',
        'arrow-down-outline': '⬇️',
        'arrow-back-outline': '⬅️',
        'arrow-forward-outline': '➡️',
        'arrow-forward': '➡️',
        'grid-outline': '☰',
        'menu-outline': '☰',
        'chevron-down-outline': '⌄',
        'chevron-up-outline': '⌃',
        
        // Action icons
        'heart-outline': '♡',
        'heart': '❤️',
        'star-outline': '☆',
        'star': '⭐',
        'add-outline': '➕',
        'add': '➕',
        'remove-outline': '➖',
        'remove': '➖',
        
        // Checkout and payment icons
        'checkmark-circle-outline': '✅',
        'checkmark-outline': '✓',
        'checkmark': '✓',
        'card-outline': '💳',
        'cash-outline': '💰',
        
        // Shipping and delivery icons
        'car-outline': '🚗',
        'airplane-outline': '✈️',
        'location-outline': '📍',
        
        // Communication icons
        'mail-outline': '📧',
        'call-outline': '📞',
        'chatbubble-outline': '💬'
    };

    // CSS for fallback icons
    const fallbackCSS = `
        <style id="icon-fallback-styles">
            .icon-fallback {
                display: inline-block;
                font-size: inherit;
                line-height: 1;
                vertical-align: middle;
                text-align: center;
                min-width: 1em;
            }
            
            .icon-fallback.cart-icon { font-size: 1.2em; }
            .icon-fallback.user-icon { font-size: 1.1em; }
            .icon-fallback.social-icon { font-size: 1em; }
            .icon-fallback.nav-icon { font-size: 1em; }
            .icon-fallback.action-icon { font-size: 0.9em; }
            
            /* Ensure fallback icons are visible */
            .icon-fallback {
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            /* Animation for loading state */
            .icon-loading {
                animation: iconPulse 1.5s ease-in-out infinite;
            }
            
            @keyframes iconPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        </style>
    `;

    // Function to inject fallback CSS
    function injectFallbackCSS() {
        if (!document.getElementById('icon-fallback-styles')) {
            document.head.insertAdjacentHTML('beforeend', fallbackCSS);
        }
    }

    // Function to create fallback icon
    function createFallbackIcon(iconName, originalElement) {
        const fallbackText = iconFallbacks[iconName] || '●';
        const span = document.createElement('span');
        span.className = 'icon-fallback';
        span.textContent = fallbackText;
        
        // Copy relevant attributes
        if (originalElement.id) span.id = originalElement.id;
        if (originalElement.title) span.title = originalElement.title;
        
        // Add specific classes based on icon type
        if (iconName.includes('cart') || iconName.includes('bag')) {
            span.classList.add('cart-icon');
        } else if (iconName.includes('person') || iconName.includes('log-out')) {
            span.classList.add('user-icon');
        } else if (iconName.includes('logo-')) {
            span.classList.add('social-icon');
        } else if (iconName.includes('arrow') || iconName.includes('menu') || iconName.includes('grid')) {
            span.classList.add('nav-icon');
        } else {
            span.classList.add('action-icon');
        }
        
        return span;
    }

    // Function to check if ion-icon is properly loaded
    function isIonIconLoaded(element) {
        // Check if the element has shadow DOM (indicates proper loading)
        if (element.shadowRoot) return true;
        
        // Check if element has visible content
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return true;
        
        // Check if ionicons custom element is defined
        if (customElements.get('ion-icon')) {
            // Give it a moment to render
            return element.offsetWidth > 0 || element.offsetHeight > 0;
        }
        
        return false;
    }

    // Function to fix all ion-icons on the page
    function fixAllIcons() {
        const ionIcons = document.querySelectorAll('ion-icon');
        let fixedCount = 0;
        
        ionIcons.forEach(icon => {
            const iconName = icon.getAttribute('name');
            if (!iconName) return;
            
            // Add loading class initially
            icon.classList.add('icon-loading');
            
            // Check if icon needs fixing after a shorter delay for faster response
            setTimeout(() => {
                if (!isIonIconLoaded(icon)) {
                    const fallback = createFallbackIcon(iconName, icon);
                    icon.parentNode.replaceChild(fallback, icon);
                    fixedCount++;
                    console.log(`Fixed icon: ${iconName} -> ${iconFallbacks[iconName] || '●'}`);
                } else {
                    icon.classList.remove('icon-loading');
                }
            }, 500);
        });
        
        // Additional check for stubborn icons
        setTimeout(() => {
            const stillBrokenIcons = document.querySelectorAll('ion-icon');
            stillBrokenIcons.forEach(icon => {
                const iconName = icon.getAttribute('name');
                if (iconName && !isIonIconLoaded(icon)) {
                    const fallback = createFallbackIcon(iconName, icon);
                    icon.parentNode.replaceChild(fallback, icon);
                    fixedCount++;
                    console.log(`Force fixed icon: ${iconName} -> ${iconFallbacks[iconName] || '●'}`);
                }
            });
        }, 2000);
        
        // Log results after processing
        setTimeout(() => {
            if (fixedCount > 0) {
                console.log(`✅ Fixed ${fixedCount} icons with fallbacks`);
            } else {
                console.log('✅ All icons loaded successfully');
            }
        }, 2500);
    }

    // Function to load ionicons if not already loaded
    function ensureIoniconsLoaded() {
        // Check if ionicons is already loaded
        if (typeof customElements !== 'undefined' && customElements.get('ion-icon')) {
            console.log('✅ Ionicons already loaded');
            fixAllIcons();
            return;
        }

        console.log('🔄 Loading ionicons...');
        
        // Load ionicons module
        const moduleScript = document.createElement('script');
        moduleScript.type = 'module';
        moduleScript.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
        
        // Load ionicons nomodule fallback
        const nomoduleScript = document.createElement('script');
        nomoduleScript.setAttribute('nomodule', '');
        nomoduleScript.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js';
        
        // Handle loading completion
        let scriptsLoaded = 0;
        const onScriptLoad = () => {
            scriptsLoaded++;
            if (scriptsLoaded >= 1) {
                setTimeout(() => {
                    console.log('📦 Ionicons scripts loaded, checking icons...');
                    fixAllIcons();
                }, 500);
            }
        };
        
        moduleScript.onload = onScriptLoad;
        moduleScript.onerror = () => {
            console.log('⚠️ Module script failed, trying nomodule...');
            onScriptLoad();
        };
        
        nomoduleScript.onload = onScriptLoad;
        nomoduleScript.onerror = () => {
            console.log('⚠️ Nomodule script failed, using fallbacks only');
            fixAllIcons();
        };
        
        // Append scripts to head
        document.head.appendChild(moduleScript);
        document.head.appendChild(nomoduleScript);
    }

    // Function to initialize icon fixing
    function initIconFix() {
        console.log('🎯 Initializing comprehensive icon fix...');
        
        // Inject fallback CSS
        injectFallbackCSS();
        
        // Ensure ionicons is loaded
        ensureIoniconsLoaded();
        
        // Set up mutation observer to handle dynamically added icons
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(mutations => {
                let hasNewIcons = false;
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'ION-ICON' || node.querySelector('ion-icon')) {
                                hasNewIcons = true;
                            }
                        }
                    });
                });
                
                if (hasNewIcons) {
                    setTimeout(fixAllIcons, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        // Periodic check for missed icons
        setInterval(() => {
            const brokenIcons = document.querySelectorAll('ion-icon:not(.icon-loading)');
            let needsFix = false;
            
            brokenIcons.forEach(icon => {
                if (!isIonIconLoaded(icon)) {
                    needsFix = true;
                }
            });
            
            if (needsFix) {
                console.log('🔧 Found broken icons, applying fixes...');
                fixAllIcons();
            }
        }, 5000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIconFix);
    } else {
        initIconFix();
    }

    // Also initialize on window load as backup
    window.addEventListener('load', () => {
        setTimeout(initIconFix, 1000);
    });

    // Export functions for manual use
    window.fixAllIcons = fixAllIcons;
    window.initIconFix = initIconFix;

})();