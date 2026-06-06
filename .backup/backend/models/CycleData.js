const mongoose = require('mongoose');

const CycleDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    periodData: {
        isPeriod: { type: Boolean, default: false },
        flow: {
            type: String,
            enum: ['none', 'spotting', 'light', 'medium', 'heavy', 'custom']
        },
        flowCustom: String
    },
    cycleInfo: {
        averageLength: Number,
        periodDuration: Number,
        lastPeriodDate: Date,
        nextPeriodDate: Date,
        ovulationDate: Date,
        fertileWindowStart: Date,
        fertileWindowEnd: Date,
        cyclePhase: {
            type: String,
            enum: ['menstrual', 'follicular', 'ovulation', 'luteal']
        }
    },
    mood: {
        rating: { type: Number, min: 1, max: 5 },
        emoji: String,
        notes: String
    },
    symptoms: [{
        type: String
    }],
    symptomsCustom: String,
    physical: {
        energyLevel: { type: Number, min: 1, max: 10 },
        sleepQuality: String,
        sleepHours: Number,
        waterIntake: { type: Number, default: 0 },
        exercise: String,
        weight: Number,
        temperature: Number
    },
    intimateActivity: {
        occurred: { type: Boolean, default: false },
        protected: Boolean,
        notes: String
    },
    medications: [{
        name: String,
        dosage: String,
        time: String
    }],
    birthControl: {
        method: String,
        taken: Boolean,
        time: String
    },
    notes: String,
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

CycleDataSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('CycleData', CycleDataSchema);