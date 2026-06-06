const express = require('express');
const router = express.Router();
const { auth } = require('./auth');
const Couple = require('../models/Couple');
const User = require('../models/User');

const zodiacCompat = {
    'Aries': { 'Leo': 95, 'Sagittarius': 93, 'Gemini': 88, 'Aquarius': 85, 'Libra': 80 },
    'Taurus': { 'Virgo': 95, 'Capricorn': 93, 'Cancer': 90, 'Pisces': 88 },
    'Gemini': { 'Libra': 95, 'Aquarius': 93, 'Aries': 88, 'Leo': 85 },
    'Cancer': { 'Scorpio': 95, 'Pisces': 93, 'Taurus': 90, 'Virgo': 85 },
    'Leo': { 'Aries': 95, 'Sagittarius': 93, 'Gemini': 85, 'Libra': 83 },
    'Virgo': { 'Taurus': 95, 'Capricorn': 93, 'Cancer': 85, 'Scorpio': 83 },
    'Libra': { 'Gemini': 95, 'Aquarius': 93, 'Leo': 83, 'Sagittarius': 80 },
    'Scorpio': { 'Cancer': 95, 'Pisces': 93, 'Virgo': 83, 'Capricorn': 80 },
    'Sagittarius': { 'Aries': 93, 'Leo': 93, 'Libra': 80, 'Aquarius': 78 },
    'Capricorn': { 'Taurus': 93, 'Virgo': 93, 'Scorpio': 80, 'Pisces': 78 },
    'Aquarius': { 'Gemini': 93, 'Libra': 93, 'Sagittarius': 78, 'Aries': 75 },
    'Pisces': { 'Cancer': 93, 'Scorpio': 93, 'Capricorn': 78, 'Taurus': 75 }
};

function calculateLifePath(birthday) {
    const dateStr = birthday.toISOString().split('T')[0].replace(/-/g, '');
    let sum = dateStr.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    
    return sum;
}

router.get('/calculate', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('coupleId');
        
        if (!user.coupleId) {
            return res.status(404).json({ error: 'No partner linked' });
        }

        const couple = await Couple.findById(user.coupleId)
            .populate('partner1')
            .populate('partner2');

        const p1 = couple.partner1;
        const p2 = couple.partner2;

        const sign1 = p1.profile.zodiacSign;
        const sign2 = p2.profile.zodiacSign;
        const zodiacScore = zodiacCompat[sign1]?.[sign2] || zodiacCompat[sign2]?.[sign1] || 70;

        const life1 = calculateLifePath(p1.profile.birthday);
        const life2 = calculateLifePath(p2.profile.birthday);
        const numScore = Math.max(100 - Math.abs(life1 - life2) * 10, 50);

        const overall = Math.round((zodiacScore + numScore) / 2);

        const insights = [];
        if (zodiacScore > 90) {
            insights.push(`🌟 ${sign1} and ${sign2} are a cosmic match!`);
        }
        if (numScore > 80) {
            insights.push(`🔢 Your life paths (${life1} & ${life2}) show strong connection.`);
        }

        couple.compatibility = {
            overall,
            zodiac: zodiacScore,
            numerology: numScore,
            insights
        };

        await couple.save();

        res.json({
            overall,
            zodiac: { score: zodiacScore, signs: { partner1: sign1, partner2: sign2 } },
            numerology: { score: numScore, lifePaths: { partner1: life1, partner2: life2 } },
            insights,
            partners: {
                partner1: { name: p1.profile.name, zodiac: sign1 },
                partner2: { name: p2.profile.name, zodiac: sign2 }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;