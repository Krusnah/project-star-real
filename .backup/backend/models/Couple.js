const mongoose = require('mongoose');

const CoupleSchema = new mongoose.Schema({
    partner1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    partner2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    relationshipData: {
        meetingDate: Date,
        status: String,
        anniversaryDate: Date,
        goals: [String]
    },
    compatibility: {
        overall: { type: Number, min: 0, max: 100 },
        zodiac: { type: Number, min: 0, max: 100 },
        numerology: { type: Number, min: 0, max: 100 },
        biorhythm: {
            physical: Number,
            emotional: Number,
            intellectual: Number
        },
        insights: [String]
    },
    sharedCalendar: [{
        title: String,
        date: Date,
        type: String,
        reminder: Boolean
    }],
    privacySettings: {
        shareTracking: { type: Boolean, default: true },
        sharePredictions: { type: Boolean, default: true },
        shareSymptoms: { type: Boolean, default: false },
        shareIntimateData: { type: Boolean, default: false }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Couple', CoupleSchema);