'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioSystem } from '@/lib/audio';

export default function SoundToggle() {
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return audioSystem.getMute();
    }
    return false;
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !muted;
    setMuted(nextState);
    audioSystem.setMute(nextState);
    if (!nextState) {
      // play twinkle to confirm sound is on
      setTimeout(() => {
        audioSystem.playTwinkle();
      }, 50);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2.5 rounded-full glass-panel hover:bg-cosmic-purple/50 border border-cosmic-lavender/10 hover:border-cosmic-lavender/30 transition-all duration-300 text-cosmic-lavender hover:text-white active:scale-95 shadow-md flex items-center justify-center"
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? (
        <VolumeX className="w-5 h-5 text-cosmic-pink animate-pulse" />
      ) : (
        <Volume2 className="w-5 h-5 text-cosmic-lavender" />
      )}
    </button>
  );
}
