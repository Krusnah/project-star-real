const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

let currentRegStep = 1;
const totalRegSteps = 3;

// Registration step navigation
function nextRegStep(step) {
    if (!validateRegStep(currentRegStep)) {
        return; // Validation error already shown
    }

    document.getElementById('regStep' + currentRegStep).classList.remove('active');
    document.getElementById('regStep' + step).classList.add('active');
    currentRegStep = step;
    updateRegProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevRegStep(step) {
    document.getElementById('regStep' + currentRegStep).classList.remove('active');
    document.getElementById('regStep' + step).classList.add('active');
    currentRegStep = step;
    updateRegProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateRegProgress() {
    const progress = (currentRegStep / totalRegSteps) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

// Validation for each step
function validateRegStep(step) {
    if (step === 1) {
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regPasswordConfirm').value;
        
        if (!email) {
            showNotification('Please enter your email', 'error');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (!password || password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return false;
        }
        
        if (password !== confirm) {
            showNotification('Passwords do not match', 'error');
            return false;
        }
        
        return true;
    }
    
    if (step === 2) {
        const name = document.getElementById('regName').value.trim();
        const gender = document.getElementById('regGender').value;
        const birthday = document.getElementById('regBirthday').value;
        
        if (!name) {
            showNotification('Please enter your name', 'error');
            return false;
        }
        
        if (!gender) {
            showNotification('Please select your gender', 'error');
            return false;
        }
        
        if (!birthday) {
            showNotification('Please enter your birthday', 'error');
            return false;
        }
        
        // Check if birthday is in the past
        const birthDate = new Date(birthday);
        const today = new Date();
        if (birthDate >= today) {
            showNotification('Please enter a valid birthday', 'error');
            return false;
        }
        
        return true;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Handle Registration
async function handleRegister(skipPartnerLink) {
    // Final validation
    if (!validateRegStep(2)) {
        showNotification('Please complete your profile information', 'error');
        return;
    }

    const userData = {
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
        name: document.getElementById('regName').value.trim(),
        gender: document.getElementById('regGender').value,
        birthday: document.getElementById('regBirthday').value,
        birthTime: document.getElementById('regBirthTime').value || undefined,
        birthPlace: document.getElementById('regBirthPlace').value.trim() || undefined,
        partnerCode: skipPartnerLink ? undefined : document.getElementById('regPartnerCode').value.trim()
    };

    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Save authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showNotification('Account created successfully! ✨', 'success');

        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        showLoading(false);
        console.error('Registration error:', error);
        showNotification(error.message, 'error');
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Save authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showNotification('Login successful! ✨', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showLoading(false);
        console.error('Login error:', error);
        showNotification(error.message, 'error');
    }
}

// Check if user is already logged in (called on page load)
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token && window.location.pathname.includes('index.html')) {
        // Verify token is still valid
        fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (res.ok) {
                // Valid token, redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Invalid token, clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Set max date for birthday (today)
    const birthdayInput = document.getElementById('regBirthday');
    if (birthdayInput) {
        const today = new Date().toISOString().split('T')[0];
        birthdayInput.setAttribute('max', today);
    }
});