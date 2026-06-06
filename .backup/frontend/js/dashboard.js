// Dashboard specific functions
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Check authentication
function checkDashboardAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    loadUserProfile();
}

// Load user profile
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const userData = await response.json();

        if (!response.ok) {
            throw new Error('Session expired');
        }

        // Update UI
        const welcomeMsg = document.getElementById('welcomeMessage');
        const userInfo = document.getElementById('userInfo');
        const partnerCode = document.getElementById('partnerCode');
        const linkSection = document.getElementById('linkPartnerSection');

        if (welcomeMsg) {
            welcomeMsg.textContent = `Welcome back, ${userData.profile.name}! ✨`;
        }

        if (userInfo) {
            userInfo.textContent = `${userData.profile.zodiacSign} | Joined ${new Date(userData.createdAt).toLocaleDateString()}`;
        }

        if (partnerCode) {
            partnerCode.textContent = userData._id;
        }

        // Hide link section if already linked
        if (userData.coupleId && linkSection) {
            linkSection.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

// Link partner
async function linkPartner() {
    const token = localStorage.getItem('token');
    const partnerCode = document.getElementById('partnerCodeInput').value.trim();

    if (!partnerCode) {
        showNotification('Please enter a partner code', 'error');
        return;
    }

    try {
        showLoading(true);

        const response = await fetch(`${API_URL}/auth/link-partner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ partnerCode })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to link partner');
        }

        showNotification('Successfully linked with partner! 💕', 'success');
        
        setTimeout(() => {
            showLoading(false);
            document.getElementById('linkPartnerSection').style.display = 'none';
        }, 1500);

    } catch (error) {
        showLoading(false);
        showNotification(error.message, 'error');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        checkDashboardAuth();
    }
});