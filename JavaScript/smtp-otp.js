// SMTP-based OTP Authentication System
class SMTPAuth {
    constructor() {
        // Detect if we're running on Live Server and use correct API base
        const currentPort = window.location.port;
        if (currentPort === '5500' || currentPort === '5501' || currentPort === '5502') {
            this.apiBase = 'http://localhost:3002/api';
        } else {
            this.apiBase = '/api';
        }
        
        this.sessionToken = localStorage.getItem('sessionToken');
        this.userEmail = localStorage.getItem('userEmail');
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.emailInput = document.getElementById('email');
        this.sendOtpBtn = document.getElementById('sendOtpBtn');
        this.sendText = document.getElementById('sendText');
        this.spinner = document.getElementById('spinner');
        this.otpSection = document.getElementById('otpSection');
        this.otpInput = document.getElementById('otp');
        this.verifyOtpBtn = document.getElementById('verifyOtpBtn');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.countdownEl = document.getElementById('countdown');
        this.invalidEmail = document.getElementById('invalidEmail');
        this.invalidOtp = document.getElementById('invalidOtp');
        this.successMessage = document.getElementById('successMessage');
        this.confirmationDialog = document.getElementById('confirmationDialog');
        this.confirmEmail = document.getElementById('confirmEmail');
        this.confirmSendBtn = document.getElementById('confirmSendBtn');
        this.cancelSendBtn = document.getElementById('cancelSendBtn');
        
        this.resendTimer = null;
        
        // Debug: Log which elements are found
        console.log('🔍 Element Check:');
        console.log('Email Input:', this.emailInput ? '✅' : '❌');
        console.log('Send OTP Button:', this.sendOtpBtn ? '✅' : '❌');
        console.log('OTP Section:', this.otpSection ? '✅' : '❌');
        console.log('OTP Input:', this.otpInput ? '✅' : '❌');
        console.log('Verify Button:', this.verifyOtpBtn ? '✅' : '❌');
        console.log('Confirmation Dialog:', this.confirmationDialog ? '✅' : '❌');
    }

    attachEventListeners() {
        this.sendOtpBtn?.addEventListener('click', () => this.sendOTP());
        this.verifyOtpBtn?.addEventListener('click', () => this.verifyOTP());
        this.resendOtpBtn?.addEventListener('click', () => this.resendOTP());
        
        // Enter key support
        this.emailInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendOTP();
        });
        
        this.otpInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyOTP();
        });

        // Auto-format OTP input
        this.otpInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
        });
    }


    async sendOTP() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate email
        if (!emailRegex.test(email)) {
            this.showError(this.invalidEmail, 'Please enter a valid email address');
            this.emailInput.focus();
            return;
        }

        this.hideError(this.invalidEmail);
        
        // Store email temporarily for verification
        localStorage.setItem('tempEmail', email);
        
        // Show loading state
        this.setLoadingState(true);

        try {
            console.log('📤 Sending OTP to:', email);
            const response = await fetch(`${this.apiBase}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            console.log('📡 Response status:', response.status);
            
            let data;
            try {
                const responseText = await response.text();
                console.log('📄 Raw response:', responseText);
                data = JSON.parse(responseText);
                console.log('📄 Parsed data:', data);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.log('📄 Response was not valid JSON, might be HTML error page');
                // Show OTP section anyway since email might have been sent
                this.showOTPSection();
                throw new Error('Server returned invalid response, but OTP section is shown for testing.');
            }

            if (response.ok && data.success) {
                console.log('✅ OTP sent successfully!', data);
                this.showSuccess('OTP sent successfully! Check your email.');
                this.showOTPSection();
                this.startResendTimer();
            } else {
                console.error('❌ OTP send failed:', data);
                this.showError(this.invalidEmail, data.error || 'Failed to send OTP');
                // Don't show OTP section if sending failed
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            this.showError(this.invalidEmail, error.message || 'Failed to send OTP. Please try again.');
            
            // If it's a JSON parsing error but email might have been sent, show OTP section
            if (error.message.includes('JSON') || error.message.includes('Unexpected')) {
                console.log('🔄 JSON error detected, but email might have been sent. Showing OTP section...');
                setTimeout(() => {
                    this.showOTPSection();
                }, 1000);
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    async verifyOTP() {
        // Get email from stored value or input
        const email = localStorage.getItem('tempEmail') || this.emailInput.value.trim();
        const otp = this.otpInput.value.trim();

        console.log('🔍 Verifying OTP:', { email, otp: otp.length + ' digits' });

        if (!otp || otp.length !== 6) {
            this.showError(this.invalidOtp, 'Please enter a valid 6-digit OTP');
            return;
        }

        if (!email) {
            this.showError(this.invalidOtp, 'Email not found. Please refresh and try again.');
            return;
        }

        this.verifyOtpBtn.disabled = true;
        this.verifyOtpBtn.innerHTML = 'Verifying...';

        try {
            console.log('📡 Sending verification request...');
            const response = await fetch(`${this.apiBase}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp })
            });

            console.log('📡 Response status:', response.status);
            const data = await response.json();
            console.log('📄 Response data:', data);

            if (response.ok && data.success) {
                // Store session data
                localStorage.setItem('sessionToken', data.sessionToken);
                localStorage.setItem('userEmail', data.email);
                
                // Clear any old current customer data that doesn't belong to this user
                const currentCustomerEmail = localStorage.getItem('currentCustomerEmail');
                if (currentCustomerEmail && currentCustomerEmail !== data.email) {
                    localStorage.removeItem('currentCustomerData');
                    localStorage.removeItem('currentCustomerEmail');
                    console.log('Cleared old customer data for different user');
                }
                
                this.showSuccess('✓ Verified successfully!');
                
                // Disable form elements
                this.otpInput.disabled = true;
                this.verifyOtpBtn.innerHTML = '✓ Verified';
                this.verifyOtpBtn.style.background = '#28a745';
                this.verifyOtpBtn.style.cursor = 'default';
                this.resendOtpBtn.disabled = true;
                
                // Clear timer
                if (this.resendTimer) {
                    clearInterval(this.resendTimer);
                }
                
                // Check if this user already has form data
                const userSpecificKey = `customerData_${data.email}`;
                const existingUserData = localStorage.getItem(userSpecificKey);
                
                if (existingUserData) {
                    // User has existing data, set as current and redirect to home
                    localStorage.setItem('currentCustomerData', existingUserData);
                    localStorage.setItem('currentCustomerEmail', data.email);
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    // New user, redirect to form page
                    setTimeout(() => {
                        window.location.href = `form.html?email=${encodeURIComponent(data.email)}`;
                    }, 1500);
                }
                
            } else {
                throw new Error(data.error || 'Invalid OTP');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            this.showError(this.invalidOtp, error.message || 'Failed to verify OTP');
            this.shakeElement(this.otpInput);
        } finally {
            this.verifyOtpBtn.disabled = false;
            this.verifyOtpBtn.innerHTML = 'Verify';
        }
    }

    showOTPSection() {
        console.log('📱 Showing OTP section...');
        console.log('OTP Section element:', this.otpSection);
        console.log('OTP Input element:', this.otpInput);
        
        if (this.otpSection) {
            this.otpSection.style.display = 'block';
            console.log('✅ OTP section displayed');
            
            // Scroll to OTP section
            this.otpSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.error('❌ OTP section element not found!');
            return;
        }
        
        if (this.otpInput) {
            // Focus on OTP input after a short delay
            setTimeout(() => {
                this.otpInput.focus();
                console.log('🎯 OTP input focused');
            }, 500);
        }
        
        if (this.sendOtpBtn) {
            this.sendOtpBtn.style.display = 'none';
            console.log('🔒 Send OTP button hidden');
        }
        
        if (this.resendOtpBtn) {
            this.resendOtpBtn.style.display = 'inline-flex';
            console.log('🔄 Resend button shown');
        }
        
        // Hide email section completely
        const emailSection = this.emailInput?.closest('.form-group');
        if (emailSection) {
            emailSection.style.display = 'none';
            console.log('🙈 Email section hidden');
        }
        
        // Update page title/instruction
        const instruction = document.querySelector('.section-header p');
        if (instruction) {
            instruction.textContent = 'Please verify your email with the code we sent';
        }
    }

    async resendOTP() {
        // Get stored email
        const email = localStorage.getItem('tempEmail');
        if (!email) {
            this.showError(this.invalidOtp, 'Email not found. Please refresh and try again.');
            return;
        }
        
        console.log('🔄 Resending OTP to:', email);
        
        // Reset OTP input
        this.otpInput.value = '';
        this.hideError(this.invalidOtp);
        
        // Call sendOTP with stored email
        this.emailInput.value = email;
        await this.sendOTP();
    }

    startResendTimer() {
        let seconds = 30;
        this.resendOtpBtn.disabled = true;
        
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
        }
        
        this.resendTimer = setInterval(() => {
            seconds--;
            this.countdownEl.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(this.resendTimer);
                this.resendOtpBtn.disabled = false;
                this.resendOtpBtn.innerHTML = 'Resend Code';
            }
        }, 1000);
    }

    setLoadingState(loading) {
        if (loading) {
            this.sendText.style.display = 'none';
            this.spinner.style.display = 'block';
            this.sendOtpBtn.disabled = true;
        } else {
            this.sendText.style.display = 'block';
            this.spinner.style.display = 'none';
            this.sendOtpBtn.disabled = false;
        }
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    hideError(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    showSuccess(message) {
        if (this.successMessage) {
            this.successMessage.textContent = message;
            this.successMessage.style.display = 'block';
        }
    }

    shakeElement(element) {
        if (element) {
            element.style.animation = 'shake 0.5s';
            setTimeout(() => {
                element.style.animation = '';
            }, 500);
        }
    }

    // Check if user is already authenticated
    isAuthenticated() {
        return this.sessionToken && this.userEmail;
    }

    // Logout function
    logout() {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html';
    }
}

// Initialize the authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smtpAuth = new SMTPAuth();
    
    // Check if user is already logged in
    if (window.smtpAuth.isAuthenticated()) {
        // Update UI to show logged in state
        const loginBtn = document.getElementById('login_btn');
        const displayLogin = document.getElementById('display_login');
        const userName = document.getElementById('user_name');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (displayLogin) displayLogin.style.display = 'flex';
        if (userName) userName.textContent = window.smtpAuth.userEmail.split('@')[0];
    }
});

// Global logout function
function logout() {
    if (window.smtpAuth) {
        window.smtpAuth.logout();
    }
}

// Add shake animation CSS if not present
if (!document.querySelector('style[data-shake]')) {
    const shakeStyle = document.createElement('style');
    shakeStyle.setAttribute('data-shake', 'true');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(shakeStyle);
}
