'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  hoverScale?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  animate = true,
  delay = 0,
  hoverScale = false,
  onClick
}: GlassCardProps) {
  const baseClasses = `glass-card p-6 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (!animate) {
    return (
      <div 
        className={baseClasses} 
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 100, 
        damping: 15, 
        delay 
      }}
      whileHover={hoverScale ? { 
        scale: 1.02, 
        translateY: -2,
        boxShadow: "0 0 25px 3px rgba(192, 132, 252, 0.25)"
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={baseClasses}
      onClick={onClick}
    >
      {/* Radial soft purple background glow inside the card */}
      <div className="absolute -inset-px bg-radial-gradient from-cosmic-glow to-transparent opacity-40 pointer-events-none -z-10" />
      {children}
    </motion.div>
  );
}
