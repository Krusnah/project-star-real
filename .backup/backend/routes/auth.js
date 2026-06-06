const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Couple = require('../models/Couple');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) throw new Error();
        
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Calculate zodiac sign
function calculateZodiacSign(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    return 'Sagittarius';
}

// Register
router.post('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('gender').isIn(['female', 'male']),
    body('birthday').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, gender, birthday, birthTime, birthPlace, partnerCode } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const birthDate = new Date(birthday);
        const zodiacSign = calculateZodiacSign(birthDate);

        user = new User({
            email,
            password: hashedPassword,
            profile: {
                name,
                gender,
                birthday: birthDate,
                birthTime,
                birthPlace,
                zodiacSign
            }
        });

        await user.save();

        if (partnerCode) {
            const partner = await User.findById(partnerCode);
            if (partner) {
                const couple = new Couple({
                    partner1: gender === 'female' ? user._id : partner._id,
                    partner2: gender === 'male' ? user._id : partner._id
                });
                await couple.save();

                user.coupleId = couple._id;
                partner.coupleId = couple._id;
                await user.save();
                await partner.save();
            }
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.profile.name,
                gender: user.profile.gender,
                zodiacSign: user.profile.zodiacSign,
                coupleId: user.coupleId,
                partnerCode: user._id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate('coupleId');
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.profile.name,
                gender: user.profile.gender,
                zodiacSign: user.profile.zodiacSign,
                birthday: user.profile.birthday,
                coupleId: user.coupleId,
                preferences: user.preferences,
                partnerCode: user._id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('coupleId');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: req.body },
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Link partner
router.post('/link-partner', auth, async (req, res) => {
    try {
        const { partnerCode } = req.body;
        const partner = await User.findById(partnerCode);
        
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const couple = new Couple({
            partner1: req.user.profile.gender === 'female' ? req.user._id : partner._id,
            partner2: req.user.profile.gender === 'male' ? req.user._id : partner._id
        });
        
        await couple.save();

        req.user.coupleId = couple._id;
        partner.coupleId = couple._id;
        
        await req.user.save();
        await partner.save();

        res.json({ message: 'Successfully linked', couple });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
module.exports.auth = auth;