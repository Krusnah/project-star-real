const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        name: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: ['female', 'male'],
            required: true
        },
        birthday: {
            type: Date,
            required: true
        },
        birthTime: String,
        birthPlace: String,
        zodiacSign: String,
        moonSign: String,
        risingSign: String
    },
    coupleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Couple'
    },
    preferences: {
        notifications: {
            periodPredictions: { type: Boolean, default: true },
            fertileWindow: { type: Boolean, default: true },
            pillReminders: { type: Boolean, default: false },
            dailyCheckin: { type: Boolean, default: true },
            specialDays: { type: Boolean, default: true },
            compatibility: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            default: 'cosmic'
        },
        privacy: {
            requirePin: { type: Boolean, default: false },
            privateMode: { type: Boolean, default: false },
            cloudBackup: { type: Boolean, default: true },
            shareWithPartner: { type: Boolean, default: true }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);