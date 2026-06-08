'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { audioSystem } from '@/lib/audio';
import { Heart, Calendar, Droplets, Flame } from 'lucide-react';

interface CycleWheelProps {
  currentDay: number;
  totalDays: number;
  periodDuration: number;
  ovulationDay: number; // e.g., averageCycleLength - 14
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  isPartnerView?: boolean;
  partnerName?: string;
}

export default function CycleWheel({
  currentDay = 12,
  totalDays = 28,
  periodDuration = 5,
  ovulationDay = 14,
  isPartnerView = false,
  partnerName = 'Her'
}: Omit<CycleWheelProps, 'phase'>) {
  
  const radius = 90;
  const strokeWidth = 10;
  const center = 110;
  const circumference = 2 * Math.PI * radius;

  // Calculate phase helper
  const getDayPhase = (dayNum: number): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'fertile' => {
    if (dayNum <= periodDuration) return 'menstrual';
    if (dayNum === ovulationDay) return 'ovulation';
    if (dayNum >= ovulationDay - 5 && dayNum <= ovulationDay + 1) return 'fertile';
    if (dayNum < ovulationDay - 5) return 'follicular';
    return 'luteal';
  };

  const getPhaseColor = (dayPhase: string) => {
    switch (dayPhase) {
      case 'menstrual':
        return '#f472b6'; // Soft Pink
      case 'follicular':
        return '#a78bfa'; // Lavender / Violet
      case 'ovulation':
        return '#fbbf24'; // Golden Star
      case 'fertile':
        return '#c084fc'; // Bright Lavender
      case 'luteal':
        return '#6366f1'; // Indigo / Deep Purple
      default:
        return '#4b5563';
    }
  };

  const currentDayPhase = getDayPhase(currentDay);

  // Phase details text
  const getPhaseDetails = () => {
    switch (currentDayPhase) {
      case 'menstrual':
        return {
          title: 'Menstrual Phase',
          desc: isPartnerView 
            ? `${partnerName} is on her period. Energy might be low, she may experience cramps.` 
            : 'Your period has started. Be gentle with yourself, rest and hydrate.',
          tip: isPartnerView 
            ? 'Suggestion: Bring her a hot water bag, run tasks, or prepare tea.' 
            : 'Self-care: Warm bath, herbal tea, and cozy movies.',
          icon: <Droplets className="w-5 h-5 text-cosmic-pink" />
        };
      case 'follicular':
        return {
          title: 'Follicular Phase',
          desc: isPartnerView
            ? `${partnerName}'s energy is climbing. Ideal time for dates, planning, and socializing.`
            : 'Your energy levels are rising! Great time to start new projects and socialize.',
          tip: isPartnerView
            ? 'Suggestion: Plan a fun night out or an active outdoor date.'
            : 'Tip: Schedule intensive workouts and creative sessions.',
          icon: <Heart className="w-5 h-5 text-cosmic-lavender" />
        };
      case 'fertile':
      case 'ovulation':
        return {
          title: currentDayPhase === 'ovulation' ? 'Ovulation Day' : 'Fertile Window',
          desc: isPartnerView
            ? `${partnerName} is in her peak fertile window. Mood and libido are likely high.`
            : 'You are in your fertile peak! Emotions and confidence are glowing.',
          tip: isPartnerView
            ? 'Suggestion: Surprise her with flowers, give compliments, connect deeply.'
            : 'Tip: Great time for photo shoots, speeches, and deep intimacy.',
          icon: <Flame className="w-5 h-5 text-cosmic-gold" />
        };
      case 'luteal':
        return {
          title: 'Luteal Phase (PMS)',
          desc: isPartnerView
            ? `${partnerName} is entering PMS phase. She might feel anxious, tired, or emotional.`
            : 'PMS window. You might feel introspective, sensitive, or crave comfort food.',
          tip: isPartnerView
            ? 'Suggestion: Practice active listening, avoid debates, bring sweet snacks.'
            : 'Self-care: Journaling, light walking, eating dark chocolate.',
          icon: <Calendar className="w-5 h-5 text-indigo-400" />
        };
    }
  };

  const details = getPhaseDetails();

  // Angle of the current day marker (0 is top: -90 degrees)
  const currentAngleRad = ((currentDay - 1) / totalDays) * 2 * Math.PI - Math.PI / 2;
  const markerX = center + radius * Math.cos(currentAngleRad);
  const markerY = center + radius * Math.sin(currentAngleRad);

  const handleInteract = () => {
    audioSystem.playTwinkle();
  };

  return (
    <div className="flex flex-col items-center select-none" onClick={handleInteract}>
      {/* Circle Wheel Container */}
      <div className="relative w-56 h-56 flex items-center justify-center cursor-pointer">
        <svg width="220" height="220" className="transform -rotate-90">
          {/* Base background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(216, 180, 254, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Segmented color lines */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            // Draw individual dashes for a beautiful starry/clockwork feel
            const segmentPhase = getDayPhase(dayNum);
            const color = getPhaseColor(segmentPhase);

            // Compute arc dasharray to leave tiny gaps between days
            const arcLength = circumference / totalDays;
            const strokeDash = `${arcLength - 3} 3`;
            const strokeOffset = -i * arcLength;

            return (
              <circle
                key={dayNum}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth - (dayNum === currentDay ? 0 : 2)}
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-300"
                style={{ opacity: dayNum === currentDay ? 1 : 0.65 }}
              />
            );
          })}
        </svg>

        {/* Center Text Panel */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="flex flex-col items-center justify-center p-4 bg-cosmic-black/75 rounded-full border border-cosmic-lavender/10 shadow-lg w-40 h-40"
          >
            <span className="text-xs text-cosmic-lavender/60 font-medium tracking-widest uppercase">
              {isPartnerView ? `${partnerName}'s Cycle` : 'My Cycle'}
            </span>
            <span className="text-4xl font-extrabold text-glow text-white mt-1">
              Day {currentDay}
            </span>
            <span className="text-[10px] text-cosmic-lavender/80 mt-1 font-semibold px-2 py-0.5 rounded-full bg-cosmic-purple/40 border border-cosmic-lavender/10 flex items-center gap-1">
              {details.icon}
              {details.title.split(' ')[0]}
            </span>
          </motion.div>
        </div>

        {/* Glow Marker representing the current day */}
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{
            position: 'absolute',
            left: markerX - 6,
            top: markerY - 6,
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: `0 0 15px 4px ${getPhaseColor(currentDayPhase)}, 0 0 5px 1px #fff`,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Recommendations & Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-center px-4 max-w-sm"
      >
        <p className="text-sm text-cosmic-lavender font-semibold flex items-center justify-center gap-1.5 mb-1.5">
          {details.icon}
          {details.title}
        </p>
        <p className="text-xs text-cosmic-lavender/70 leading-relaxed mb-2">
          {details.desc}
        </p>
        <div className="bg-cosmic-pink-glow/10 border border-cosmic-pink/10 rounded-lg p-2.5 text-xs text-cosmic-pink/90 font-medium flex items-start gap-2 text-left justify-center max-w-xs mx-auto">
          <span>✨</span>
          <p>{details.tip}</p>
        </div>
      </motion.div>
    </div>
  );
}
