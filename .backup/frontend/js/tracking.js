const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

let trackingData = {
    periodData: {
        isPeriod: false,
        flow: null
    },
    mood: {
        rating: null,
        emoji: null
    },
    symptoms: [],
    physical: {
        energyLevel: 5,
        waterIntake: 0
    },
    notes: ''
};

// Select period status
function selectPeriodStatus(btn, isPeriod) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    trackingData.periodData.isPeriod = isPeriod;
    
    const flowSection = document.getElementById('flowSection');
    if (isPeriod) {
        flowSection.style.display = 'block';
    } else {
        flowSection.style.display = 'none';
        trackingData.periodData.flow = null;
    }
}

// Select flow
function selectFlow(btn, flow) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    trackingData.periodData.flow = flow;
}

// Select mood
function selectMood(btn, rating, emoji) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    trackingData.mood.rating = rating;
    trackingData.mood.emoji = emoji;
}

// Toggle symptom
function toggleSymptom(chip, symptom) {
    chip.classList.toggle('selected');
    
    const index = trackingData.symptoms.indexOf(symptom);
    if (index > -1) {
        trackingData.symptoms.splice(index, 1);
    } else {
        trackingData.symptoms.push(symptom);
    }
}

// Update energy
function updateEnergy(value) {
    document.getElementById('energyValue').textContent = value;
    trackingData.physical.energyLevel = parseInt(value);
}

// Update water
function updateWater(value) {
    document.getElementById('waterValue').textContent = value;
    trackingData.physical.waterIntake = parseInt(value);
}

// Save tracking
async function saveTracking() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Please login first', 'error');
        window.location.href = 'index.html';
        return;
    }

    trackingData.notes = document.getElementById('notesInput').value;
    trackingData.date = new Date().toISOString();

    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}/tracking/daily`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(trackingData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save data');
        }

        showNotification('Data saved successfully! ✨', 'success');
        
        // Refresh cycle overview
        setTimeout(() => {
            loadCycleOverview();
            showLoading(false);
        }, 1000);

    } catch (error) {
        showLoading(false);
        showNotification(error.message, 'error');
    }
}

// Load cycle overview
async function loadCycleOverview() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/tracking/cycle-overview`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.hasData) {
            document.getElementById('currentCycleDay').textContent = `Day ${data.currentDay}`;
            document.getElementById('cyclePhase').textContent = capitalizeFirst(data.currentPhase) + ' Phase';
            document.getElementById('daysUntilPeriod').textContent = data.daysUntilPeriod;
            document.getElementById('avgCycleLength').textContent = data.averageCycleLength + ' days';
            document.getElementById('fertileWindow').textContent = data.fertileWindow.isInWindow ? 'Active' : 'Not Active';
        } else {
            document.getElementById('cyclePhase').textContent = 'Start tracking to see predictions';
            document.getElementById('currentCycleDay').textContent = '--';
        }
    } catch (error) {
        console.error('Error loading cycle:', error);
    }
}

// Load compatibility
async function loadCompatibility() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/compatibility/calculate`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const content = document.getElementById('compatibilityContent');
            content.innerHTML = `
                <div class="cycle-day">${data.overall}%</div>
                <div class="cycle-label">Overall Compatibility</div>
                
                <div class="stats-row" style="margin-top: 30px;">
                    <div class="stat-box">
                        <div class="stat-value">${data.zodiac.score}%</div>
                        <div class="stat-label">Zodiac Match</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${data.numerology.score}%</div>
                        <div class="stat-label">Numerology</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: left;">
                    <h3 style="color: var(--cosmic-purple); margin-bottom: 15px;">
                        ${data.partners.partner1.name} (${data.zodiac.signs.partner1}) ❤️ 
                        ${data.partners.partner2.name} (${data.zodiac.signs.partner2})
                    </h3>
                    ${data.insights.map(insight => `
                        <p style="color: white; margin-bottom: 10px;">✨ ${insight}</p>
                    `).join('')}
                </div>
            `;
        } else {
            document.getElementById('compatibilityContent').innerHTML = `
                <p class="onboarding-subtitle">${data.error}</p>
                <p style="margin-top: 20px;">Link with your partner to see compatibility!</p>
            `;
        }
    } catch (error) {
        console.error('Error loading compatibility:', error);
        document.getElementById('compatibilityContent').innerHTML = `
            <p class="onboarding-subtitle">Link with your partner to see compatibility!</p>
        `;
    }
}

// Helper
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Set tracking date
function setTrackingDate() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const dateElement = document.getElementById('trackingDate');
    if (dateElement) {
        dateElement.textContent = dateStr;
    }
}

// Navigation functions
function goToTracking() {
    showScreen('trackingScreen');
    setTrackingDate();
    loadCycleOverview();
}

function goToCompatibility() {
    showScreen('compatibilityScreen');
    loadCompatibility();
}

function goToCalendar() {
    showNotification('Calendar feature coming soon! 📅', 'info');
}

function goToProfile() {
    showNotification('Settings feature coming soon! ⚙️', 'info');
}