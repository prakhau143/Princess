// SMTP-based OTP Authentication System
class SMTPAuth {
    constructor() {
        // Determine API base URL based on environment
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '5500' || port === '3000' || port === '8080') {
            this.apiBase = 'http://localhost:3000/api';
        } else if (hostname === 'princessjewellery.in' || hostname === 'www.princessjewellery.in') {
            // Production environment for Princess Jewellery
            this.apiBase = 'https://princessjewellery.in/api';
        } else {
            // Default production environment
            this.apiBase = '/api';
        }
        
        // Allow override via global variable
        if (window.OTP_API_BASE) {
            this.apiBase = window.OTP_API_BASE;
        }

        this.sessionToken = localStorage.getItem('sessionToken');
        this.userEmail = localStorage.getItem('userEmail');
        this.initializeElements();
    }

    initializeElements() {
        // Wait for DOM to be fully loaded
        setTimeout(() => {
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
            
            // Re-attach event listeners after elements are found
            this.attachEventListeners();
        }, 100);
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
        const email = this.emailInput?.value?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate email
        if (!email || !emailRegex.test(email)) {
            this.showError(this.invalidEmail, 'Please enter a valid email address');
            this.emailInput?.focus();
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
                return;
            }

            if (response.ok && data.success) {
                console.log('✅ OTP sent successfully!', data);
                
                // IMMEDIATELY hide email form and show OTP UI
                console.log('🚀 Immediately switching to OTP UI...');
                
                // Hide email section first
                const emailFormGroup = document.querySelector('#form .form-group');
                if (emailFormGroup) {
                    emailFormGroup.style.display = 'none';
                    console.log('✅ Email form hidden immediately');
                }
                
                // Hide send button
                if (this.sendOtpBtn) {
                    this.sendOtpBtn.style.display = 'none';
                }
                
                // Create new OTP UI immediately - no delays
                this.createNewOTPUI();
                
                // Show success message after UI is created
                setTimeout(() => {
                    this.showSuccess('OTP sent successfully! Check your email.');
                }, 100);
                
                // Start timer
                setTimeout(() => {
                    if (this.startNewResendTimer) {
                        this.startNewResendTimer();
                    }
                }, 300);
            } else {
                console.error('❌ OTP send failed:', data);
                this.showError(this.invalidEmail, data.error || 'Failed to send OTP');
                // Show OTP section for failed case
                setTimeout(() => {
                    this.createNewOTPUI();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error sending OTP:', error);
            this.showError(this.invalidEmail, 'Failed to send OTP. Please check your connection and try again.');

            // Always show OTP section for testing/debugging
            setTimeout(() => {
                this.showOTPSection();
            }, 500);
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
        console.log('📱 === SHOWING OTP SECTION START ===');
        
        // Always re-query elements to ensure we have the latest DOM state
        this.otpSection = document.getElementById('otpSection');
        this.otpInput = document.getElementById('otp');
        this.verifyOtpBtn = document.getElementById('verifyOtpBtn');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.invalidOtp = document.getElementById('invalidOtp');
        this.successMessage = document.getElementById('successMessage');
        this.countdownEl = document.getElementById('countdown');
        
        console.log('OTP Section found:', !!this.otpSection);
        console.log('OTP Input found:', !!this.otpInput);
        
        // Disable and style email input
        if (this.emailInput) {
            this.emailInput.disabled = true;
            this.emailInput.style.backgroundColor = '#f0f0f0';
            this.emailInput.style.color = '#666';
            console.log('✅ Email input disabled');
        }
        
        // Hide send button and show loading state is done
        if (this.sendOtpBtn) {
            this.sendOtpBtn.style.display = 'none';
            console.log('✅ Send OTP button hidden');
        }
        
        if (this.otpSection) {
            console.log('🔧 Making OTP section visible...');
            
            // Clear any existing styles that might hide it
            this.otpSection.removeAttribute('style');
            this.otpSection.classList.remove('hidden');
            
            // Apply visible styles directly
            this.otpSection.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                position: relative !important;
                z-index: 1000 !important;
                background: #f8f9fa !important;
                padding: 20px !important;
                border: 2px solid #007bff !important;
                border-radius: 8px !important;
                margin-top: 20px !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
            `;
            
            console.log('✅ OTP section made visible');
            
            // Scroll to section after a brief delay
            setTimeout(() => {
                this.otpSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
                console.log('📍 Scrolled to OTP section');
            }, 150);
            
        } else {
            console.error('❌ OTP section not found! Creating dynamically...');
            this.createOTPSectionDynamically();
            return;
        }
        
        // Focus and highlight the input
        if (this.otpInput) {
            setTimeout(() => {
                this.otpInput.focus();
                this.otpInput.style.cssText = `
                    border: 3px solid #007bff !important;
                    box-shadow: 0 0 10px rgba(0,123,255,0.3) !important;
                    background: white !important;
                    font-size: 16px !important;
                    padding: 12px !important;
                `;
                console.log('🎯 OTP input focused and highlighted');
            }, 250);
        }
        
        console.log('📱 === SHOWING OTP SECTION COMPLETE ===');
    }

    createOTPSectionDynamically() {
        console.log('🔨 === CREATING OTP SECTION DYNAMICALLY ===');
        
        const formDiv = document.getElementById('form');
        if (!formDiv) {
            console.error('❌ Form container not found!');
            return;
        }
        
        // Remove existing OTP section if any
        const existingOTP = document.getElementById('otpSection');
        if (existingOTP) {
            existingOTP.remove();
            console.log('🗑️ Removed existing OTP section');
        }
        
        const otpHTML = `
            <div id="otpSection" style="display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 20px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #007bff;">
                <div class="form-group">
                    <label for="otp" style="font-weight: bold; color: #333;">Verification Code</label>
                    <div class="input-group">
                        <input type="text" name="otp" placeholder="Enter 6-digit code" id="otp" maxlength="6" style="border: 2px solid #007bff; padding: 12px; font-size: 16px;">
                        <button type="button" id="verifyOtpBtn" style="background: #007bff; color: white; padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer;">Verify</button>
                    </div>
                    <span id="invalidOtp" class="alert alert-error" style="display: none; color: red; margin-top: 10px;">Invalid verification code</span>
                    <span id="successMessage" class="alert alert-success" style="display: none; color: green; margin-top: 10px;">✓ Verified successfully!</span>
                    <button type="button" id="resendOtpBtn" class="btn-outline" style="display: none; margin-top: 1rem; padding: 10px 15px; border: 1px solid #007bff; background: white; color: #007bff; border-radius: 4px; cursor: pointer;">
                        Resend Code (<span id="countdown">30</span>s)
                    </button>
                    <p style="margin-top: 10px; color: #666; font-size: 14px;">Check your email for the verification code</p>
                </div>
            </div>
        `;
        
        formDiv.insertAdjacentHTML('beforeend', otpHTML);
        console.log('✅ Dynamic OTP HTML inserted');
        
        // Re-initialize elements
        this.otpSection = document.getElementById('otpSection');
        this.otpInput = document.getElementById('otp');
        this.verifyOtpBtn = document.getElementById('verifyOtpBtn');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.countdownEl = document.getElementById('countdown');
        this.invalidOtp = document.getElementById('invalidOtp');
        this.successMessage = document.getElementById('successMessage');
        
        console.log('Re-initialized elements:');
        console.log('- OTP Section:', this.otpSection);
        console.log('- OTP Input:', this.otpInput);
        console.log('- Verify Button:', this.verifyOtpBtn);
        
        // Re-attach event listeners
        if (this.verifyOtpBtn) {
            this.verifyOtpBtn.addEventListener('click', () => {
                console.log('🔄 Verify button clicked');
                this.verifyOTP();
            });
        }
        
        if (this.resendOtpBtn) {
            this.resendOtpBtn.addEventListener('click', () => {
                console.log('🔄 Resend button clicked');
                this.resendOTP();
            });
        }
        
        if (this.otpInput) {
            this.otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('⏎ Enter key pressed in OTP input');
                    this.verifyOTP();
                }
            });
            
            this.otpInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
            });
        }
        
        console.log('✅ Event listeners attached to dynamic OTP section');
        
        // Force focus and highlight
        setTimeout(() => {
            if (this.otpInput) {
                this.otpInput.focus();
                this.otpInput.style.border = '3px solid #007bff';
                this.otpInput.style.boxShadow = '0 0 10px rgba(0,123,255,0.3)';
                console.log('🎯 Dynamic OTP input focused and highlighted');
            }
        }, 100);
        
        console.log('🔨 === DYNAMIC OTP SECTION CREATION COMPLETE ===');
    }

    createNewOTPUI() {
        console.log('🎨 === CREATING NEW OTP UI ===');
        
        const formDiv = document.getElementById('form');
        if (!formDiv) {
            console.error('❌ Form container not found!');
            return;
        }
        
        console.log('📍 Form div found:', formDiv);
        
        // AGGRESSIVELY hide all existing content
        const allFormGroups = formDiv.querySelectorAll('.form-group');
        allFormGroups.forEach(group => {
            group.style.display = 'none';
            group.style.visibility = 'hidden';
        });
        
        const allButtons = formDiv.querySelectorAll('button');
        allButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        const allInputs = formDiv.querySelectorAll('input');
        allInputs.forEach(input => {
            input.style.display = 'none';
        });
        
        // Hide any existing OTP sections
        const oldOtpSection = document.getElementById('otpSection');
        if (oldOtpSection) {
            oldOtpSection.remove();
        }
        
        // Remove any existing new OTP UI
        const existingOTP = document.getElementById('newOtpSection');
        if (existingOTP) {
            existingOTP.remove();
        }
        
        console.log('✅ All existing UI elements hidden/removed');
        
        // Create completely new OTP UI with forced visibility
        const newOtpHTML = `
            <div id="newOtpSection" style="
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 9999 !important;
                background: white !important;
                padding: 30px !important;
                border-radius: 15px !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
                color: #333 !important;
                text-align: center !important;
                margin-top: 20px !important;
                width: 100% !important;
                max-width: 500px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                border: 1px solid #e0e0e0 !important;
            ">
                <div style="margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #333;">
                        <ion-icon name="mail-outline" style="font-size: 28px; vertical-align: middle; margin-right: 8px;"></ion-icon>
                        Check Your Email
                    </h2>
                    <p style="margin: 0; color: #666; font-size: 16px;">We've sent a 6-digit verification code to your email</p>
                </div>
                
                <div style="margin: 25px 0;">
                    <label style="display: block; margin-bottom: 10px; font-weight: bold; font-size: 18px; color: #333;">Enter Verification Code</label>
                    <div style="display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap;">
                        <input 
                            type="text" 
                            id="newOtpInput" 
                            placeholder="000000" 
                            maxlength="6"
                            style="
                                width: 200px;
                                padding: 15px 20px;
                                font-size: 20px;
                                text-align: center;
                                border: 2px solid #e0e0e0;
                                border-radius: 10px;
                                background: #f8f9fa;
                                color: #333;
                                font-weight: bold;
                                letter-spacing: 3px;
                            "
                            autocomplete="off"
                        >
                        <button 
                        type="button" 
                        id="newVerifyBtn"
                        style="
                            padding: 15px 25px;
                            background: #607d8b;
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(96,125,139,0.3);
                        "
                        onmouseover="this.style.background='#546e7a'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.background='#607d8b'; this.style.transform='translateY(0)'"
                        >
                            <ion-icon name="checkmark-outline" style="font-size: 18px; margin-right: 5px;"></ion-icon>
                            Verify Code
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <div id="newOtpError" style="display: none; background: #ffebee; padding: 10px; border-radius: 8px; margin: 10px 0; border: 1px solid #ffcdd2;">
                    <span style="color: #d32f2f;">
                        <ion-icon name="close-circle-outline" style="font-size: 18px; margin-right: 5px;"></ion-icon>
                        Invalid verification code. Please try again.
                    </span>
                </div>
                
                <div id="newOtpSuccess" style="display: none; background: #e8f5e8; padding: 10px; border-radius: 8px; margin: 10px 0; border: 1px solid #c8e6c9;">
                    <span style="color: #2e7d32;">
                        <ion-icon name="checkmark-circle-outline" style="font-size: 18px; margin-right: 5px;"></ion-icon>
                        Verification successful! Redirecting...
                    </span>
                </div>
                    
                    <button 
                        type="button" 
                        id="newResendBtn"
                        style="
                        background: transparent;
                        color: #666;
                        border: 2px solid #e0e0e0;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        margin-top: 10px;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#bdbdbd'"
                    onmouseout="this.style.background='transparent'; this.style.borderColor='#e0e0e0'"
                    >
                        <ion-icon name="refresh-outline" style="font-size: 16px; margin-right: 5px;"></ion-icon>
                        Resend Code (<span id="newCountdown">30</span>s)
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                #newOtpInput:focus {
                    outline: none;
                    border-color: #607d8b !important;
                    background: white !important;
                    box-shadow: 0 0 10px rgba(96,125,139,0.2) !important;
                }
                
                #newOtpInput::placeholder {
                    color: #999;
                }
            </style>
        `;
        
        // Clear form content and insert new OTP UI
        formDiv.innerHTML = newOtpHTML;
        console.log('✅ Form content completely replaced with new OTP UI');
        
        // Force immediate display
        const insertedSection = document.getElementById('newOtpSection');
        if (insertedSection) {
            insertedSection.style.display = 'block';
            insertedSection.style.visibility = 'visible';
            insertedSection.style.opacity = '1';
            insertedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.log('✅ New OTP section forced visible and scrolled into view');
        } else {
            console.error('❌ New OTP section not found after insertion!');
            // Fallback - try again
            setTimeout(() => {
                const fallbackSection = document.getElementById('newOtpSection');
                if (fallbackSection) {
                    fallbackSection.style.display = 'block';
                    fallbackSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
        
        // Initialize new elements
        this.newOtpSection = document.getElementById('newOtpSection');
        this.newOtpInput = document.getElementById('newOtpInput');
        this.newVerifyBtn = document.getElementById('newVerifyBtn');
        this.newResendBtn = document.getElementById('newResendBtn');
        this.newOtpError = document.getElementById('newOtpError');
        this.newOtpSuccess = document.getElementById('newOtpSuccess');
        this.newCountdown = document.getElementById('newCountdown');
        
        // Attach event listeners
        if (this.newVerifyBtn) {
            this.newVerifyBtn.addEventListener('click', () => {
                console.log('🔍 New verify button clicked');
                this.verifyNewOTP();
            });
        }
        
        if (this.newResendBtn) {
            this.newResendBtn.addEventListener('click', () => {
                console.log('🔄 New resend button clicked');
                this.resendNewOTP();
            });
        }
        
        if (this.newOtpInput) {
            // Only allow numbers
            this.newOtpInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
            });
            
            // Enter key to verify
            this.newOtpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('⏎ Enter pressed in new OTP input');
                    this.verifyNewOTP();
                }
            });
            
            // Auto focus with multiple attempts
            setTimeout(() => {
                if (this.newOtpInput) {
                    this.newOtpInput.focus();
                    this.newOtpInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    console.log('🎯 New OTP input focused and scrolled into view');
                } else {
                    console.error('❌ New OTP input not found for focusing!');
                }
            }, 200);
            
            // Backup focus attempt
            setTimeout(() => {
                const backupInput = document.getElementById('newOtpInput');
                if (backupInput) {
                    backupInput.focus();
                    console.log('🔄 Backup focus attempt successful');
                }
            }, 500);
        }
        
        console.log('🎨 === NEW OTP UI CREATION COMPLETE ===');
    }
    
    async verifyNewOTP() {
        const email = localStorage.getItem('tempEmail');
        const otp = this.newOtpInput?.value?.trim();
        
        if (!email) {
            this.showNewError('Email not found. Please refresh and try again.');
            return;
        }
        
        if (!otp || otp.length !== 6) {
            this.showNewError('Please enter a valid 6-digit code.');
            this.newOtpInput?.focus();
            return;
        }
        
        // Show loading state
        if (this.newVerifyBtn) {
            this.newVerifyBtn.disabled = true;
            this.newVerifyBtn.innerHTML = '⏳ Verifying...';
        }
        
        this.hideNewError();
        
        try {
            console.log('📡 Verifying new OTP:', otp);
            const response = await fetch(`${this.apiBase}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp })
            });
            
            const data = await response.json();
            console.log('📄 Verification response:', data);
            
            if (response.ok && data.success) {
                // Store session data
                localStorage.setItem('sessionToken', data.sessionToken);
                localStorage.setItem('userEmail', data.email);
                
                // Show success message
                this.showNewSuccess('Verification successful! Redirecting to form...');
                
                // Redirect to form page after short delay
                setTimeout(() => {
                    window.location.href = `form.html?email=${encodeURIComponent(data.email)}`;
                }, 1500);
                
            } else {
                this.showNewError(data.error || 'Invalid verification code. Please try again.');
                this.newOtpInput?.focus();
                this.newOtpInput?.select();
            }
            
        } catch (error) {
            console.error('Error verifying new OTP:', error);
            this.showNewError('Verification failed. Please try again.');
            this.newOtpInput?.focus();
        } finally {
            // Reset button state
            if (this.newVerifyBtn) {
                this.newVerifyBtn.disabled = false;
                this.newVerifyBtn.innerHTML = '✓ Verify Code';
            }
        }
    }
    
    async resendNewOTP() {
        const email = localStorage.getItem('tempEmail');
        if (!email) {
            this.showNewError('Email not found. Please refresh and try again.');
            return;
        }
        
        // Disable resend button
        if (this.newResendBtn) {
            this.newResendBtn.disabled = true;
            this.newResendBtn.innerHTML = '⏳ Sending...';
        }
        
        try {
            const response = await fetch(`${this.apiBase}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNewSuccess('New code sent! Check your email.');
                this.startNewResendTimer();
                this.newOtpInput?.focus();
            } else {
                this.showNewError('Failed to resend code. Please try again.');
            }
            
        } catch (error) {
            console.error('Error resending OTP:', error);
            this.showNewError('Failed to resend code. Please try again.');
        }
    }
    
    showNewError(message) {
        if (this.newOtpError) {
            this.newOtpError.querySelector('span').textContent = `❌ ${message}`;
            this.newOtpError.style.display = 'block';
        }
        if (this.newOtpSuccess) {
            this.newOtpSuccess.style.display = 'none';
        }
    }
    
    hideNewError() {
        if (this.newOtpError) {
            this.newOtpError.style.display = 'none';
        }
    }
    
    showNewSuccess(message) {
        if (this.newOtpSuccess) {
            this.newOtpSuccess.querySelector('span').textContent = `✅ ${message}`;
            this.newOtpSuccess.style.display = 'block';
        }
        if (this.newOtpError) {
            this.newOtpError.style.display = 'none';
        }
    }
    
    startNewResendTimer() {
        let seconds = 30;
        if (this.newResendBtn) {
            this.newResendBtn.disabled = true;
        }
        
        if (this.newResendTimer) {
            clearInterval(this.newResendTimer);
        }
        
        this.newResendTimer = setInterval(() => {
            seconds--;
            if (this.newCountdown) {
                this.newCountdown.textContent = seconds;
            }
            
            if (seconds <= 0) {
                clearInterval(this.newResendTimer);
                if (this.newResendBtn) {
                    this.newResendBtn.disabled = false;
                    this.newResendBtn.innerHTML = '🔄 Resend Code';
                }
            }
        }, 1000);
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
    
    // Check if user is already logged in and redirect if needed
    if (window.smtpAuth.isAuthenticated()) {
        // Check if we're on login page and user is already authenticated
        if (window.location.pathname.includes('login.html')) {
            // Check if user has customer data
            const userEmail = localStorage.getItem('userEmail');
            const customerKey = `customerData_${userEmail}`;
            const existingData = localStorage.getItem(customerKey);
            
            if (existingData) {
                // User has data, redirect to home
                window.location.href = 'index.html';
                return;
            } else {
                // User needs to fill form
                window.location.href = `form.html?email=${encodeURIComponent(userEmail)}`;
                return;
            }
        }
        
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
