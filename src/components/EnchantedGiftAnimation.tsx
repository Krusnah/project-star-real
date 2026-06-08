'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { audioSystem } from '@/lib/audio';

interface EnchantedGiftAnimationProps {
  type: 'kiss' | 'flower' | 'hug' | 'star';
  senderName: string;
  receiverName: string;
  message?: string;
  onComplete: () => void;
}

export default function EnchantedGiftAnimation({
  type,
  senderName,
  receiverName,
  message,
  onComplete,
}: EnchantedGiftAnimationProps) {
  const [particles] = useState<{ id: number; x: number; y: number; scale: number; duration: number }[]>(() =>
    Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 - 40, // offset from center
      y: Math.random() * -200 - 50, // drift range upward
      scale: Math.random() * 0.8 + 0.6,
      duration: Math.random() * 1.5 + 1.2,
    }))
  );

  useEffect(() => {
    // Play sound matching the gift theme
    if (type === 'hug') {
      audioSystem.playHug();
    } else if (type === 'star') {
      audioSystem.playTwinkle();
    } else if (type === 'flower') {
      audioSystem.playConstellation();
    } else {
      audioSystem.playSuccess();
    }

    // Auto complete after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2900);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  // Determine main graphics and themes
  const renderTheme = () => {
    switch (type) {
      case 'kiss':
        return {
          emoji: '💋',
          title: 'Royal Kiss!',
          glowColor: 'shadow-red-500/50',
          bgColor: 'from-pink-950/70 to-purple-950/70',
          textColor: 'text-pink-300',
          subtitle: `${senderName} blows a deep romantic kiss to ${receiverName}! 💖`,
          particleEmoji: '❤️',
        };
      case 'flower':
        return {
          emoji: '🌹',
          title: 'Enchanted Rose!',
          glowColor: 'shadow-rose-500/50',
          bgColor: 'from-purple-950/70 to-rose-950/70',
          textColor: 'text-rose-300',
          subtitle: `${senderName} offers an enchanted blooming rose to ${receiverName}! 🌹`,
          particleEmoji: '🌸',
        };
      case 'hug':
        return {
          emoji: '🫂',
          title: 'Royal Embrace!',
          glowColor: 'shadow-purple-500/50',
          bgColor: 'from-purple-950/70 to-indigo-950/70',
          textColor: 'text-purple-300',
          subtitle: `${senderName} wraps ${receiverName} in a warm, protective embrace! 🫂`,
          particleEmoji: '✨',
        };
      case 'star':
      default:
        return {
          emoji: '✨',
          title: 'Stardust Sparkles!',
          glowColor: 'shadow-yellow-500/50',
          bgColor: 'from-purple-950/70 to-amber-950/70',
          textColor: 'text-yellow-300',
          subtitle: `${senderName} showers ${receiverName} with magical stardust chimes! ⭐`,
          particleEmoji: '⭐',
        };
    }
  };

  const theme = renderTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/90 pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative z-10 w-full max-w-sm mx-4 p-8 rounded-3xl bg-gradient-to-b ${theme.bgColor} border border-white/10 text-center shadow-2xl flex flex-col items-center justify-center`}
      >
        {/* Decorative castle frame */}
        <div className="absolute inset-2 border border-dashed border-white/5 rounded-2xl pointer-events-none" />

        {/* Floating Particles/Bubbles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 0, y: 50, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: p.x,
                y: p.y,
                scale: p.scale,
              }}
              transition={{
                duration: p.duration,
                ease: 'easeOut',
                delay: p.id * 0.05,
              }}
              className="absolute left-1/2 bottom-1/2 text-lg"
              style={{ marginLeft: -10, marginBottom: -10 }}
            >
              {theme.particleEmoji}
            </motion.div>
          ))}
        </div>

        {/* Interactive gift model */}
        <div className="relative mb-6">
          {/* Outer glowing ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
            className={`absolute -inset-6 rounded-full bg-white/5 blur-xl shadow-glow ${theme.glowColor}`}
          />

          {/* Core Emoji Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={
              type === 'kiss'
                ? {
                    scale: [0, 1.3, 1],
                    rotate: [0, -10, 10, 0],
                  }
                : type === 'flower'
                ? {
                    scale: [0, 1.2, 1],
                    rotate: [0, 180, 360],
                  }
                : type === 'hug'
                ? {
                    scale: [0, 1.25, 0.95, 1],
                    y: [0, -10, 5, 0],
                  }
                : {
                    scale: [0, 1.4, 1],
                    rotate: [0, 45, 0, -45, 0],
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 140,
              damping: 15,
              duration: 1.5,
            }}
            className="text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none cursor-default"
          >
            {theme.emoji}
          </motion.div>
        </div>

        {/* Text Details */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-2xl font-extrabold tracking-wide font-display ${theme.textColor} mb-2`}
        >
          {theme.title}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-white/80 font-medium px-4 mb-4"
        >
          {theme.subtitle}
        </motion.p>

        {message && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full mt-2 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-cosmic-lavender/90 italic max-h-24 overflow-y-auto no-scrollbar"
          >
            &ldquo;{message}&rdquo;
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="mt-6 text-[9px] tracking-wider text-white/40 uppercase"
        >
          Clicking backdrop returns to kingdom court
        </motion.div>
      </motion.div>
    </div>
  );
}
