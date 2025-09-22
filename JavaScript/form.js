// Customer Details Form Handler for SMTP-based Backend
class CustomerDetailsForm {
    constructor() {
        // Detect if we're running on Live Server and use correct API base
        const currentPort = window.location.port;
        if (currentPort === '5500' || currentPort === '5501' || currentPort === '5502') {
            this.apiBase = 'http://localhost:3000/api';
        } else {
            this.apiBase = '/api';
        }
        
        this.sessionToken = localStorage.getItem('sessionToken');
        this.userEmail = localStorage.getItem('userEmail') || this.getEmailFromURL();
        this.initializeForm();
        this.attachEventListeners();
    }

    getEmailFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('email') || '';
    }

    initializeForm() {
        // Form elements - initialize first
        this.form = document.getElementById('userDetailsForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.submitText = document.getElementById('submitText');
        this.submitSpinner = document.getElementById('submitSpinner');
        this.formSuccess = document.getElementById('formSuccess');
        this.formError = document.getElementById('formError');

        // Set email field
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.value = this.userEmail;
        }

        // Check authentication
        if (!this.sessionToken || !this.userEmail) {
            console.log('No session token or email found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        // Verify token is still valid
        this.verifyToken();

        // Check if this customer has already filled the form (only if form exists)
        if (this.form) {
            this.checkExistingCustomerData();
        }
    }
    
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBase}/verify-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            
            if (!response.ok) {
                console.log('Token invalid, redirecting to login');
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('userEmail');
                window.location.href = 'login.html';
                return;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            // Continue anyway - might be network issue
        }
    }

    checkExistingCustomerData() {
        // Clear any old current customer data that doesn't match this user
        const currentCustomerEmail = localStorage.getItem('currentCustomerEmail');
        if (currentCustomerEmail && currentCustomerEmail !== this.userEmail) {
            localStorage.removeItem('currentCustomerData');
            localStorage.removeItem('currentCustomerEmail');
        }
        
        // Check if this specific email has already filled the form
        const customerKey = `customerData_${this.userEmail}`;
        const existingData = localStorage.getItem(customerKey);
        
        if (existingData) {
            const customerData = JSON.parse(existingData);
            
            // Show message that customer has already filled the form
            const existingCustomerDiv = document.createElement('div');
            existingCustomerDiv.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                    border: 2px solid #ffc107;
                    text-align: center;
                ">
                    <h3 style="color: #856404; margin-bottom: 15px;">⚠️ Customer Details Already Exist</h3>
                    <p style="color: #856404; margin-bottom: 15px;">
                        You have already filled your details with this email address.
                    </p>
                    <div style="
                        background: rgba(255, 255, 255, 0.7);
                        padding: 15px;
                        border-radius: 10px;
                        margin: 15px 0;
                        text-align: left;
                    ">
                        <p><strong>Name:</strong> ${customerData.name}</p>
                        <p><strong>Phone:</strong> ${customerData.phone}</p>
                        <p><strong>Address:</strong> ${customerData.address}</p>
                        <p><strong>City:</strong> ${customerData.city}, ${customerData.state}</p>
                        <p><strong>PIN Code:</strong> ${customerData.pincode}</p>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="proceedToShopping()" style="
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 25px;
                            font-weight: 600;
                            cursor: pointer;
                        ">🛍️ Continue Shopping</button>
                        <button onclick="updateCustomerDetails()" style="
                            background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 25px;
                            font-weight: 600;
                            cursor: pointer;
                        ">✏️ Update Details</button>
                    </div>
                </div>
            `;
            
            // Insert before the form (with safety check)
            if (this.form && this.form.parentNode) {
                this.form.parentNode.insertBefore(existingCustomerDiv, this.form);
            } else {
                // Fallback: append to body or a container
                const container = document.querySelector('.form-container') || document.body;
                container.appendChild(existingCustomerDiv);
            }
            
            // Hide the form initially (with safety check)
            if (this.form) {
                this.form.style.display = 'none';
            }
            
            return true;
        }
        
        return false;
    }

    attachEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Auto-format phone number
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
            });
        }

        // Auto-format pincode
        const pincodeInput = document.getElementById('pincode');
        if (pincodeInput) {
            pincodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
            });
        }
    }

    validateForm() {
        let isValid = true;
        const errors = {};

        // Validate name
        const name = document.getElementById('name').value.trim();
        if (name.length < 2) {
            errors.name = 'Please enter your full name (minimum 2 characters)';
            isValid = false;
        }

        // Validate phone (Indian mobile number)
        const phone = document.getElementById('phone').value.trim();
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            errors.phone = 'Please enter a valid 10-digit Indian mobile number';
            isValid = false;
        }

        // Validate address
        const address = document.getElementById('address').value.trim();
        if (address.length < 5) {
            errors.address = 'Please enter your complete address (minimum 5 characters)';
            isValid = false;
        }

        // Validate city
        const city = document.getElementById('city').value.trim();
        if (city.length < 2) {
            errors.city = 'Please enter your city';
            isValid = false;
        }

        // Validate state
        const state = document.getElementById('state').value.trim();
        if (state.length < 2) {
            errors.state = 'Please enter your state';
            isValid = false;
        }

        // Validate pincode
        const pincode = document.getElementById('pincode').value.trim();
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(pincode)) {
            errors.pincode = 'Please enter a valid 6-digit PIN code';
            isValid = false;
        }

        // Display errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = errors[field];
                errorElement.style.display = 'block';
            }
        });

        // Hide errors for valid fields
        ['name', 'phone', 'address', 'city', 'state', 'pincode'].forEach(field => {
            if (!errors[field]) {
                const errorElement = document.getElementById(`${field}Error`);
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
        });

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const formData = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                address: document.getElementById('address').value.trim(),
                city: document.getElementById('city').value.trim(),
                state: document.getElementById('state').value.trim(),
                pincode: document.getElementById('pincode').value.trim()
            };

            console.log('Submitting with token:', this.sessionToken);
            const response = await fetch(`${this.apiBase}/customer-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify(formData)
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 401) {
                console.log('Token expired, redirecting to login');
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('userEmail');
                window.location.href = 'login.html';
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                // Store customer data locally with email-specific key
                const customerKey = `customerData_${this.userEmail}`;
                localStorage.setItem(customerKey, JSON.stringify(formData));
                
                // Also store the current customer data for checkout
                localStorage.setItem('currentCustomerData', JSON.stringify(formData));
                localStorage.setItem('currentCustomerEmail', this.userEmail);
                
                this.showSuccess('✅ Details saved successfully! Redirecting to shop...');
                
                // Disable form
                this.disableForm();
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } else {
                throw new Error(data.error || 'Failed to save details');
            }

        } catch (error) {
            console.error('Error saving customer details:', error);
            this.showError(error.message || 'Failed to save details. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        if (loading) {
            this.submitText.textContent = 'Saving Details...';
            this.submitSpinner.style.display = 'block';
            this.submitBtn.disabled = true;
        } else {
            this.submitText.textContent = 'Save Details & Continue Shopping';
            this.submitSpinner.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }

    showSuccess(message) {
        if (this.formSuccess) {
            this.formSuccess.textContent = message;
            this.formSuccess.style.display = 'block';
        }
        if (this.formError) {
            this.formError.style.display = 'none';
        }
    }

    showError(message) {
        if (this.formError) {
            this.formError.textContent = message;
            this.formError.style.display = 'block';
        }
        if (this.formSuccess) {
            this.formSuccess.style.display = 'none';
        }
    }

    setLoadingState(loading) {
        if (loading) {
            this.submitText.textContent = 'Saving Details...';
            this.submitSpinner.style.display = 'block';
            this.submitBtn.disabled = true;
        } else {
            this.submitText.textContent = 'Save Details & Continue Shopping';
            this.submitSpinner.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }

    disableForm() {
        const inputs = this.form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            if (input.id !== 'email') { // Keep email readonly but not disabled
                input.disabled = true;
            }
        });
        
        this.submitBtn.style.backgroundColor = '#28a745';
        this.submitText.textContent = '✓ Details Saved';
    }

}

// Utility function to clear customer data for user switching
function clearCustomerDataForUserSwitch(newUserEmail) {
    const currentCustomerEmail = localStorage.getItem('currentCustomerEmail');
    if (currentCustomerEmail && currentCustomerEmail !== newUserEmail) {
        localStorage.removeItem('currentCustomerData');
        localStorage.removeItem('currentCustomerEmail');
        console.log(`Cleared customer data when switching from ${currentCustomerEmail} to ${newUserEmail}`);
    }
}

// Global functions for existing customer buttons
function proceedToShopping() {
    window.location.href = 'index.html';
}

function updateCustomerDetails() {
    // Show the form to update details
    const form = document.getElementById('userDetailsForm');
    if (form) {
        form.style.display = 'block';
    }
    
    // Hide the existing customer message
    const existingDiv = document.querySelector('div[style*="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)"]');
    if (existingDiv && existingDiv.parentNode) {
        existingDiv.parentNode.removeChild(existingDiv);
    }
}

// Initialize form when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.customerForm = new CustomerDetailsForm();
});
