'use client';

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { audioSystem } from '@/lib/audio';
import { Sparkles } from 'lucide-react';

interface ConstellationMatchProps {
  score: number;
  sign1: string;
  sign2: string;
  name1: string;
  name2: string;
}

export default function ConstellationMatch({
  score = 88,
  sign1 = 'Virgo',
  sign2 = 'Taurus',
  name1 = 'Her',
  name2 = 'Him',
}: ConstellationMatchProps) {
  const controls = useAnimation();

  useEffect(() => {
    // Play transition when rendering the matching constellations
    audioSystem.playConstellation();
    controls.start({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2.0, ease: 'easeInOut' },
    });
  }, [controls, score]);

  const handleTriggerSound = () => {
    audioSystem.playConstellation();
  };

  return (
    <div 
      className="flex flex-col items-center select-none cursor-pointer p-4 w-full"
      onClick={handleTriggerSound}
    >
      <div className="relative w-full max-w-sm h-48 flex items-center justify-center">
        {/* Constellation SVG Canvas */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
          {/* Star 1 node (Her) */}
          <g transform="translate(60, 100)">
            <motion.circle
              r="24"
              fill="rgba(124, 58, 237, 0.15)"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            />
            <motion.circle
              r="8"
              fill="#d8b4fe"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.0, ease: 'easeInOut' }}
              className="shadow-glow"
              style={{ filter: 'drop-shadow(0px 0px 6px #d8b4fe)' }}
            />
            {/* Pulsing glow ring */}
            <circle cx="0" cy="0" r="16" stroke="rgba(216, 180, 254, 0.3)" strokeWidth="1" fill="none" />
          </g>

          {/* Star 2 node (Him) */}
          <g transform="translate(240, 100)">
            <motion.circle
              r="24"
              fill="rgba(244, 114, 182, 0.15)"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.circle
              r="8"
              fill="#fbcfe8"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.0, ease: 'easeInOut', delay: 0.5 }}
              style={{ filter: 'drop-shadow(0px 0px 6px #fbcfe8)' }}
            />
            <circle cx="0" cy="0" r="16" stroke="rgba(244, 114, 182, 0.3)" strokeWidth="1" fill="none" />
          </g>

          {/* Linking Constellation Line */}
          <motion.path
            d="M 68 100 L 232 100"
            fill="none"
            stroke="url(#constellation-grad)"
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={controls}
            style={{ filter: 'drop-shadow(0px 0px 5px rgba(216, 180, 254, 0.8))' }}
          />

          {/* Secondary branching geometric constellation lines */}
          <motion.path
            d="M 60 100 L 110 50 L 150 70 L 190 50 L 240 100"
            fill="none"
            stroke="rgba(216, 180, 254, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 0.5 }}
          />
          <motion.path
            d="M 60 100 L 100 150 L 150 130 L 200 150 L 240 100"
            fill="none"
            stroke="rgba(244, 114, 182, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 0.5 }}
          />

          {/* Background sparkles */}
          {[
            { cx: 80, cy: 40, delay: 0.2 },
            { cx: 120, cy: 160, delay: 0.8 },
            { cx: 220, cy: 50, delay: 0.5 },
            { cx: 180, cy: 150, delay: 1.1 },
            { cx: 150, cy: 100, delay: 1.4 },
          ].map((spark, idx) => (
            <motion.circle
              key={idx}
              cx={spark.cx}
              cy={spark.cy}
              r="2"
              fill="#ffffff"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: spark.delay }}
            />
          ))}

          {/* Gradients Definition */}
          <defs>
            <linearGradient id="constellation-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Zodiac Badges */}
        <div className="absolute left-3 top-[124px] flex flex-col items-center">
          <span className="text-sm font-bold text-white tracking-wide">{name1}</span>
          <span className="text-[10px] text-cosmic-lavender px-2 py-0.5 rounded-full bg-cosmic-purple/50 border border-cosmic-lavender/10 mt-1 uppercase font-semibold">
            {sign1}
          </span>
        </div>

        <div className="absolute right-3 top-[124px] flex flex-col items-center">
          <span className="text-sm font-bold text-white tracking-wide">{name2}</span>
          <span className="text-[10px] text-cosmic-pink px-2 py-0.5 rounded-full bg-cosmic-purple/50 border border-cosmic-pink/10 mt-1 uppercase font-semibold">
            {sign2}
          </span>
        </div>

        {/* Center Compatibility Score Display */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.8, stiffness: 120 }}
          className="z-10 flex flex-col items-center justify-center p-3 bg-cosmic-black/85 rounded-full border-2 border-cosmic-lavender/30 shadow-glow shadow-cosmic-purple/30 w-28 h-28"
        >
          <span className="text-3xl font-extrabold text-glow text-white tracking-tight flex items-baseline">
            {score}
            <span className="text-sm font-bold text-cosmic-pink">%</span>
          </span>
          <span className="text-[10px] text-cosmic-lavender/70 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-cosmic-gold animate-pulse" />
            Match
          </span>
        </motion.div>
      </div>

      <div className="text-center mt-2">
        <p className="text-xs text-cosmic-lavender/60 font-medium italic">
          Tap the constellation to hear the cosmic chime
        </p>
      </div>
    </div>
  );
}
