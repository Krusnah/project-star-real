const express = require('express');
const router = express.Router();
const { auth } = require('./auth');
const CycleData = require('../models/CycleData');

// Save daily tracking
router.post('/daily', auth, async (req, res) => {
    try {
        const { date, ...trackingData } = req.body;
        const trackingDate = date ? new Date(date) : new Date();
        trackingDate.setHours(0, 0, 0, 0);

        let cycleData = await CycleData.findOne({
            userId: req.user._id,
            date: trackingDate
        });

        if (cycleData) {
            Object.assign(cycleData, trackingData);
            cycleData.updatedAt = new Date();
        } else {
            cycleData = new CycleData({
                userId: req.user._id,
                date: trackingDate,
                ...trackingData
            });
        }

        await cycleData.save();
        res.json(cycleData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get tracking data
router.get('/data', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const query = { userId: req.user._id };
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const data = await CycleData.find(query).sort({ date: -1 }).limit(100);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific date
router.get('/data/:date', auth, async (req, res) => {
    try {
        const date = new Date(req.params.date);
        date.setHours(0, 0, 0, 0);

        const data = await CycleData.findOne({
            userId: req.user._id,
            date: date
        });

        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get cycle overview
router.get('/cycle-overview', auth, async (req, res) => {
    try {
        const periodDays = await CycleData.find({
            userId: req.user._id,
            'periodData.isPeriod': true
        }).sort({ date: -1 }).limit(10);

        if (periodDays.length === 0) {
            return res.json({ hasData: false });
        }

        const lastPeriod = periodDays[0].date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));

        let avgCycle = 28;
        if (periodDays.length >= 2) {
            const cycles = [];
            for (let i = 0; i < periodDays.length - 1; i++) {
                const diff = Math.floor((periodDays[i].date - periodDays[i + 1].date) / (1000 * 60 * 60 * 24));
                if (diff > 15 && diff < 45) cycles.push(diff);
            }
            if (cycles.length > 0) {
                avgCycle = Math.round(cycles.reduce((a, b) => a + b) / cycles.length);
            }
        }

        const daysUntil = avgCycle - daysSince;
        const nextPeriod = new Date(lastPeriod);
        nextPeriod.setDate(nextPeriod.getDate() + avgCycle);

        const ovulationDay = avgCycle - 14;
        const ovulation = new Date(lastPeriod);
        ovulation.setDate(ovulation.getDate() + ovulationDay);

        const fertileStart = new Date(ovulation);
        fertileStart.setDate(fertileStart.getDate() - 5);
        
        const fertileEnd = new Date(ovulation);
        fertileEnd.setDate(fertileEnd.getDate() + 1);

        let phase = 'follicular';
        if (daysSince <= 5) phase = 'menstrual';
        else if (daysSince >= ovulationDay - 2 && daysSince <= ovulationDay + 2) phase = 'ovulation';
        else if (daysSince > ovulationDay + 2) phase = 'luteal';

        res.json({
            hasData: true,
            currentDay: daysSince + 1,
            daysUntilPeriod: Math.max(0, daysUntil),
            averageCycleLength: avgCycle,
            lastPeriodDate: lastPeriod,
            nextPeriodDate: nextPeriod,
            ovulationDate: ovulation,
            fertileWindow: {
                start: fertileStart,
                end: fertileEnd,
                isInWindow: today >= fertileStart && today <= fertileEnd
            },
            currentPhase: phase,
            periodDuration: 5
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;