// Debugging helper
function debugLog(message) {
    console.log('[DEBUG]', message);
}

// Initialize EmailJS with your user ID
(function() {
    // Replace these with your actual EmailJS credentials
    const emailjsUserId = 'Pf4cZAaeYv4qn7WbF'; // Found in Account > API Keys
    const emailjsServiceId = 'service_n9t5xtr'; // Found in Email Services
    const emailjsTemplateId = 'template_gx9kj67'; // Found in Email Templates
    
    debugLog('Initializing EmailJS with User ID: ' + emailjsUserId);
    emailjs.init(emailjsUserId);
    
    // Make these available globally for debugging
    window.emailjsConfig = {
        userId: emailjsUserId,
        serviceId: emailjsServiceId,
        templateId: emailjsTemplateId
    };
})();

// Generate a random 6-digit OTP
function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    debugLog('Generated OTP: ' + otp);
    return otp;
}

// DOM Elements
const emailInput = document.getElementById('email');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const sendText = document.getElementById('sendText');
const spinner = document.getElementById('spinner');
const otpSection = document.getElementById('otpSection');
const otpInput = document.getElementById('otp');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const countdownEl = document.getElementById('countdown');
const invalidEmail = document.getElementById('invalidEmail');
const invalidOtp = document.getElementById('invalidOtp');
const successMessage = document.getElementById('successMessage');
const confirmationDialog = document.getElementById('confirmationDialog');
const confirmEmail = document.getElementById('confirmEmail');
const confirmSendBtn = document.getElementById('confirmSendBtn');
const cancelSendBtn = document.getElementById('cancelSendBtn');

// Variables
let generatedOTP = '';
let userEmail = '';
let resendTimer;

// Event Listeners
sendOtpBtn.addEventListener('click', showConfirmationDialog);
verifyOtpBtn.addEventListener('click', verifyOTP);
resendOtpBtn.addEventListener('click', showConfirmationDialog);
confirmSendBtn.addEventListener('click', sendOTP);
cancelSendBtn.addEventListener('click', hideConfirmationDialog);

// Show confirmation dialog
function showConfirmationDialog() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        invalidEmail.style.display = 'block';
        emailInput.focus();
        debugLog('Invalid email format');
        return;
    }

    invalidEmail.style.display = 'none';
    userEmail = email;
    confirmEmail.textContent = email;
    confirmationDialog.style.display = 'flex';
    debugLog('Showing confirmation dialog for email: ' + email);
}

// Hide confirmation dialog
function hideConfirmationDialog() {
    confirmationDialog.style.display = 'none';
    debugLog('Hiding confirmation dialog');
}

// Send OTP
function sendOTP() {
    hideConfirmationDialog();
    generatedOTP = generateOTP();

    // Show loading state
    sendText.style.display = 'none';
    spinner.style.display = 'block';
    sendOtpBtn.disabled = true;
    debugLog('Preparing to send OTP to: ' + userEmail);

    // Send via EmailJS
    emailjs.send(window.emailjsConfig.serviceId, window.emailjsConfig.templateId, {
        to_email: userEmail,
        otp: generatedOTP
    })
    .then(function(response) {
        debugLog('OTP sent successfully! Response: ', response);
        
        // Show OTP section
        otpSection.style.display = 'block';
        otpInput.focus();
        
        // Hide send button, show resend button
        sendOtpBtn.style.display = 'none';
        resendOtpBtn.style.display = 'inline-flex';
        
        // Start resend timer
        startResendTimer();
    })
    .catch(function(error) {
        console.error("Failed to send OTP:", error);
        alert("Failed to send verification code. Please check console for details and try again.");
    })
    .finally(function() {
        // Reset button state
        sendText.style.display = 'block';
        spinner.style.display = 'none';
        sendOtpBtn.disabled = false;
    });
}

// Resend OTP timer
function startResendTimer() {
    let seconds = 30;
    resendOtpBtn.disabled = true;
    
    debugLog('Starting resend timer (30 seconds)');
    
    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(resendTimer);
            resendOtpBtn.disabled = false;
            resendOtpBtn.innerHTML = 'Resend Code';
            debugLog('Resend timer expired');
        }
    }, 1000);
}

// Verify OTP
function verifyOTP() {
    const enteredOTP = otpInput.value.trim();
    debugLog('Verifying OTP. Entered: ' + enteredOTP + ', Expected: ' + generatedOTP);
    
    if (enteredOTP === generatedOTP) {
        invalidOtp.style.display = 'none';
        successMessage.style.display = 'block';
        debugLog('OTP verification successful');
        
        // Disable OTP fields after successful verification
        otpInput.disabled = true;
        verifyOtpBtn.disabled = true;
        resendOtpBtn.disabled = true;
        
        // Change button to indicate success
        verifyOtpBtn.innerHTML = '✓ Verified';
        verifyOtpBtn.style.background = 'var(--success)';
        verifyOtpBtn.style.cursor = 'default';
        
        // Clear the timer
        clearInterval(resendTimer);
        countdownEl.parentElement.style.display = 'none';
        
        // Redirect to form.html after 1.5 seconds with email as parameter
        setTimeout(() => {
            window.location.href = `form.html?email=${encodeURIComponent(userEmail)}`;
        }, 1500);
    } else {
        invalidOtp.style.display = 'block';
        otpInput.focus();
        // Shake animation for error
        otpInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            otpInput.style.animation = '';
        }, 500);
        debugLog('OTP verification failed');
    }
}

// Debugging: Log all elements to console
debugLog('All DOM elements loaded successfully');
