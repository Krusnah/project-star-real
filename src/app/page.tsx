'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, UserPlus, LogIn, Clipboard, Check, HelpCircle } from 'lucide-react';
import StarryBackground from '@/components/StarryBackground';
import GlassCard from '@/components/GlassCard';
import SoundToggle from '@/components/SoundToggle';
import { databaseApi, UserProfile } from '@/lib/database';
import { audioSystem } from '@/lib/audio';

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [birthday, setBirthday] = useState('');
  
  // Pairing states
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    databaseApi.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        if (user.couple_id) {
          router.push('/dashboard');
        }
      }
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    audioSystem.playClick();

    try {
      if (isLogin) {
        const user = await databaseApi.signIn(email);
        setCurrentUser(user);
        audioSystem.playSuccess();
        if (user.couple_id) {
          router.push('/dashboard');
        }
      } else {
        if (!name || !birthday) {
          throw new Error('Please fill in all fields.');
        }
        const user = await databaseApi.signUp(email, name, gender, birthday);
        setCurrentUser(user);
        audioSystem.playSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCouple = async () => {
    if (!currentUser) return;
    setLoading(true);
    audioSystem.playClick();
    try {
      const couple = await databaseApi.createCouple(currentUser.id);
      const updatedProfile = await databaseApi.getCurrentUser();
      setCurrentUser(updatedProfile);
      audioSystem.playSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create couple.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !partnerCode.trim()) return;
    setLoading(true);
    setError('');
    audioSystem.playClick();
    try {
      const couple = await databaseApi.linkPartner(currentUser.id, partnerCode.trim());
      audioSystem.playSuccess();
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to link with partner. Double check the code.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.id);
    setCopied(true);
    audioSystem.playTwinkle();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await databaseApi.signOut();
    setCurrentUser(null);
    audioSystem.playClick();
  };

  return (
    <main className="relative min-height-screen flex flex-col items-center justify-center p-4">
      <StarryBackground />
      
      {/* Top Header Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <SoundToggle />
        {currentUser && (
          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 rounded-full glass-panel hover:bg-red-500/20 border border-red-500/20 text-xs text-red-200 transition-all active:scale-95"
          >
            Sign Out
          </button>
        )}
      </div>

      <div className="w-full max-w-md my-8">
        {/* Animated Brand Title */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 1.5 }}
            className="inline-flex p-3 bg-cosmic-purple/30 border border-cosmic-lavender/20 rounded-full mb-3 text-cosmic-lavender shadow-glow"
          >
            <Sparkles className="w-8 h-8 animate-pulse text-cosmic-lavender" />
          </motion.div>
          
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold tracking-tight text-white font-display"
          >
            Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-cosmic-lavender via-cosmic-pink to-white text-glow-pink">Star</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-cosmic-lavender/70 tracking-widest uppercase mt-1.5"
          >
            Your Cosmic Connection & Cycle Sync
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!currentUser ? (
            /* AUTH PANEL */
            <motion.div
              key="auth-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard>
                <div className="flex border-b border-cosmic-lavender/10 pb-4 mb-5">
                  <button
                    onClick={() => { setIsLogin(true); audioSystem.playClick(); }}
                    className={`flex-1 text-center py-2 text-sm font-bold tracking-wider transition-colors duration-200 ${
                      isLogin ? 'text-white border-b-2 border-cosmic-lavender' : 'text-cosmic-lavender/50 hover:text-cosmic-lavender'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    onClick={() => { setIsLogin(false); audioSystem.playClick(); }}
                    className={`flex-1 text-center py-2 text-sm font-bold tracking-wider transition-colors duration-200 ${
                      !isLogin ? 'text-white border-b-2 border-cosmic-pink' : 'text-cosmic-lavender/50 hover:text-cosmic-lavender'
                    }`}
                  >
                    CREATE ACCOUNT
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {error && (
                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/20 rounded-lg p-3 text-center font-medium">
                      {error}
                    </div>
                  )}

                  {!isLogin && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">NAME / NICKNAME</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="How should your partner call you?"
                          className="w-full glass-input text-sm focus:border-cosmic-pink"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">GENDER</label>
                          <select
                            value={gender}
                            onChange={(e: any) => setGender(e.target.value)}
                            className="w-full glass-input text-sm focus:border-cosmic-pink appearance-none cursor-pointer"
                          >
                            <option value="female" className="bg-cosmic-black">Female</option>
                            <option value="male" className="bg-cosmic-black">Male</option>
                            <option value="other" className="bg-cosmic-black">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">BIRTHDAY</label>
                          <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full glass-input text-sm focus:border-cosmic-pink cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. love@cosmic.com"
                      className="w-full glass-input text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cosmic-purple to-cosmic-violet hover:from-cosmic-violet hover:to-cosmic-pink text-white font-bold tracking-widest text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isLogin ? (
                      <>
                        ENTER ORBIT <LogIn className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        BEGIN JOURNEY <UserPlus className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          ) : (
            /* PAIRING PANEL */
            <motion.div
              key="pairing-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard>
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold text-white mb-1">Link Your Hearts</h2>
                  <p className="text-xs text-cosmic-lavender/70">
                    Connect with your partner to share journal pages, match charts, and sync cycle tracks in real time.
                  </p>
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/20 rounded-lg p-3 mb-4 text-center font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Generate / Share Code */}
                  <div className="p-4 rounded-xl bg-cosmic-black/60 border border-cosmic-lavender/10">
                    <span className="block text-[10px] font-bold text-cosmic-lavender/50 tracking-wider uppercase mb-2">
                      YOUR PARTNER CODE
                    </span>
                    <div className="flex gap-2">
                      <div className="flex-1 font-mono text-sm font-semibold tracking-wider text-glow text-cosmic-lavender bg-cosmic-purple/30 rounded-lg px-3 py-2 border border-cosmic-lavender/10 flex items-center justify-center">
                        {currentUser.id}
                      </div>
                      <button
                        onClick={copyCode}
                        className="px-3 rounded-lg bg-cosmic-purple hover:bg-cosmic-violet text-white transition-colors duration-200 flex items-center justify-center"
                        title="Copy code"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-300" /> : <Clipboard className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {!currentUser.couple_id && (
                      <button
                        onClick={handleCreateCouple}
                        disabled={loading}
                        className="w-full mt-3 py-2 rounded-lg bg-cosmic-lavender/10 hover:bg-cosmic-lavender/20 border border-cosmic-lavender/20 text-xs font-bold text-white tracking-widest transition-all duration-200 cursor-pointer"
                      >
                        {loading ? 'GENERATING...' : 'GENERATE HEART LINK'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-center">
                    <span className="h-px bg-cosmic-lavender/10 flex-1" />
                    <span className="text-[10px] text-cosmic-lavender/40 font-bold tracking-widest">OR</span>
                    <span className="h-px bg-cosmic-lavender/10 flex-1" />
                  </div>

                  {/* Connect with partner's code */}
                  <form onSubmit={handleLinkPartner} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-cosmic-lavender/50 tracking-wider uppercase mb-1.5">
                        ENTER PARTNER'S CODE
                      </label>
                      <input
                        type="text"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value)}
                        placeholder="Paste partner's code here..."
                        className="w-full glass-input text-center font-mono text-sm tracking-widest placeholder-slate-600 focus:border-cosmic-pink"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !partnerCode.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cosmic-pink to-cosmic-lavender hover:from-cosmic-lavender hover:to-white text-cosmic-black font-bold tracking-widest text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-cosmic-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          LINK PARTNER <Heart className="w-4 h-4 text-cosmic-black fill-current animate-pulse" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center flex justify-center items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cosmic-lavender/50" />
          <p className="text-[11px] text-cosmic-lavender/50 font-medium">
            Demo Tip: Sign up User A. Copy code. Sign up User B in another tab. Paste A's code to link instantly.
          </p>
        </div>
      </div>
    </main>
  );
}
