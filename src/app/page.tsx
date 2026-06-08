'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import StarryBackground from '@/components/StarryBackground';
import GlassCard from '@/components/GlassCard';
import SoundToggle from '@/components/SoundToggle';
import FloatingHearts from '@/components/FloatingHearts';
import { databaseApi } from '@/lib/database';
import { audioSystem } from '@/lib/audio';export default function LandingPage() {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<'anshrit' | 'mahi' | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    databaseApi.getCurrentUser().then((user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleEnterOrbit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setError('');
    setLoading(true);
    audioSystem.playClick();

    // The secret anniversary passcode is "0603" (March 6th)
    if (passcode !== '0603') {
      setError('Incorrect passcode. Hint: Our anniversary date (DDMM) 💖');
      setLoading(false);
      return;
    }

    try {
      const user = await databaseApi.selectProfile(selectedProfile);
      audioSystem.playSuccess();
      setShowCelebration(true);

      setTimeout(() => {
        // Direct to onboarding quest if they haven't finished compatibility choices
        if (user.love_language && user.personality) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-height-screen flex flex-col items-center justify-center p-4">
      <StarryBackground />
      <FloatingHearts trigger={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Top Header Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <SoundToggle />
      </div>

      <div className="w-full max-w-md my-8">
        {/* Animated Brand Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 1.5 }}
            className="inline-flex p-3.5 bg-cosmic-purple/30 border border-cosmic-lavender/20 rounded-full mb-3.5 text-cosmic-lavender shadow-glow"
          >
            <Sparkles className="w-8 h-8 animate-pulse text-cosmic-lavender" />
          </motion.div>

          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold tracking-tight text-white font-display"
          >
            Anshrit <span className="text-cosmic-pink animate-pulse">❤️</span> Mahi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-cosmic-lavender/70 tracking-widest uppercase mt-2"
          >
            Our Private Cosmic Space & Sync
          </motion.p>

          <div className="flex justify-center gap-4 mt-3">
            {['💫', '🌙', '✨', '⭐', '💖'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-sm"
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.2 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedProfile ? (
            /* PROFILE SELECTION PANEL */
            <motion.div
              key="profile-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <GlassCard>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-white mb-1">Who is entering orbit? 🚀</h2>
                  <p className="text-xs text-cosmic-lavender/70">Select your profile to load space details</p>
                </div>

                <div className="space-y-4">
                  {/* Anshrit Option */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedProfile('anshrit'); audioSystem.playClick(); }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-cosmic-purple/20 to-cosmic-violet/30 hover:to-cosmic-pink/20 border border-cosmic-lavender/10 hover:border-cosmic-lavender/25 text-left flex items-center gap-4 transition-all"
                  >
                    <div className="w-14 h-14 rounded-full bg-cosmic-purple/30 border border-cosmic-lavender/20 flex items-center justify-center text-3xl shadow-md">
                      👨
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-white">Anshrit Singh</h3>
                      <p className="text-[10px] text-cosmic-lavender/60 tracking-wider uppercase mt-0.5">Birthday: Oct 19 · Libra ♎</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-cosmic-lavender/50" />
                  </motion.button>

                  {/* Mahi Option */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedProfile('mahi'); audioSystem.playClick(); }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-cosmic-pink/15 to-cosmic-purple/20 hover:to-cosmic-pink/30 border border-cosmic-pink/10 hover:border-cosmic-pink/25 text-left flex items-center gap-4 transition-all"
                  >
                    <div className="w-14 h-14 rounded-full bg-cosmic-pink/30 border border-cosmic-pink/20 flex items-center justify-center text-3xl shadow-md">
                      👩
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-white">Mahi Saran</h3>
                      <p className="text-[10px] text-cosmic-pink/60 tracking-wider uppercase mt-0.5">Birthday: Dec 16 · Sagittarius ♐</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-cosmic-pink/50" />
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            /* PASSCODE FORM */
            <motion.div
              key="passcode-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <GlassCard>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🔑</div>
                  <h2 className="text-lg font-bold text-white mb-1">Enter Secret Passcode</h2>
                  <p className="text-xs text-cosmic-lavender/70">
                    Prove you&apos;re {selectedProfile === 'anshrit' ? 'Anshrit' : 'Mahi'} by entering our date 💖
                  </p>
                </div>

                <form onSubmit={handleEnterOrbit} className="space-y-4">
                  {error && (
                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/20 rounded-xl p-3 text-center font-medium">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-cosmic-lavender/50 uppercase mb-1.5 text-center">
                      4-DIGIT ANNIVERSARY CODE (DDMM)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••"
                      className="w-full glass-input text-center text-2xl tracking-[1em] focus:border-cosmic-pink font-bold placeholder-slate-700 py-3"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedProfile(null); setPasscode(''); setError(''); audioSystem.playClick(); }}
                      className="flex-1 py-3 rounded-xl border border-cosmic-lavender/10 hover:bg-cosmic-lavender/5 text-cosmic-lavender text-xs font-bold transition-all cursor-pointer"
                    >
                      BACK
                    </button>
                    <button
                      type="submit"
                      disabled={loading || passcode.length < 4}
                      className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cosmic-pink to-cosmic-lavender hover:from-cosmic-lavender hover:to-white text-cosmic-black font-extrabold tracking-widest text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-cosmic-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>ENTER SPACE ✨</>
                      )}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cosmic-black/70 backdrop-blur-md pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
              className="text-center"
            >
              <div className="text-7xl mb-4">✨🚀💖</div>
              <h2 className="text-3xl font-extrabold text-white text-glow font-display mb-2">Entering Orbit!</h2>
              <p className="text-sm text-cosmic-lavender/80">Welcome to our cosmic connection portal, {selectedProfile === 'anshrit' ? 'Anshrit' : 'Mahi'}...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
