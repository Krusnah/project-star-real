'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, ChevronRight, ChevronLeft, Moon } from 'lucide-react';
import StarryBackground from '@/components/StarryBackground';
import GlassCard from '@/components/GlassCard';
import { databaseApi, UserProfile } from '@/lib/database';
import { audioSystem } from '@/lib/audio';

const LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Quality Time',
  'Physical Touch',
  'Acts of Service',
  'Receiving Gifts'
];

const INTERESTS = [
  'Travel & Exploring',
  'Gaming',
  'Cooking & Baking',
  'Movies & Anime',
  'Fitness & Yoga',
  'Music & Concerts',
  'Reading & Writing',
  'Art & Design',
  'Tech & Gadgets',
  'Coffee & Cafes'
];

const SYMPTOMS_LIST = [
  'Cramps',
  'Bloating',
  'Headaches',
  'Fatigue / Tiredness',
  'Mood Swings',
  'Acne / Breakouts',
  'Cravings',
  'Sleep Disruption'
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Compatibility Quest states
  const [personality, setPersonality] = useState('Creative');
  const [customPersonality, setCustomPersonality] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [favoriteThings, setFavoriteThings] = useState('');
  const [loveLanguage, setLoveLanguage] = useState(LOVE_LANGUAGES[0]);
  const [customLoveLanguage, setCustomLoveLanguage] = useState('');

  // Period states (for Mahi Saran / tracker users)
  const [trackPeriod, setTrackPeriod] = useState(true);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [pmsDuration, setPmsDuration] = useState(7);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [pmsInfo, setPmsInfo] = useState('Moderate');

  // Total steps: Step 1 (Vibe) + Step 2 (Hobbies) + optional Step 3 (Cycle)
  const totalSteps = trackPeriod ? 3 : 2;

  useEffect(() => {
    databaseApi.getCurrentUser().then((profile) => {
      if (!profile) {
        router.push('/');
      } else {
        setUser(profile);
        if (profile.gender !== 'female') {
          setTrackPeriod(false);
        }
        // Pre-fill values if available
        if (profile.personality) {
          if (['Creative', 'Analytical', 'Adventurous', 'Introverted', 'Extroverted', 'Empathic'].includes(profile.personality)) {
            setPersonality(profile.personality);
          } else {
            setPersonality('Other');
            setCustomPersonality(profile.personality);
          }
        }
        if (profile.love_language) {
          if (LOVE_LANGUAGES.includes(profile.love_language)) {
            setLoveLanguage(profile.love_language);
          } else {
            setLoveLanguage('Other');
            setCustomLoveLanguage(profile.love_language);
          }
        }
        if (profile.interests) {
          setSelectedInterests(profile.interests.filter(i => INTERESTS.includes(i)));
        }
        if (profile.favorite_things && profile.favorite_things.length > 0) {
          setFavoriteThings(profile.favorite_things[0]);
        }
        if (profile.last_period_date) {
          setLastPeriodDate(profile.last_period_date);
        }
        if (profile.average_cycle_length) {
          setCycleLength(profile.average_cycle_length);
        }
        if (profile.average_period_duration) {
          setPeriodDuration(profile.average_period_duration);
        }
      }
    });
  }, [router]);

  if (!user) return null;

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const nextStep = () => {
    audioSystem.playClick();
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    audioSystem.playClick();
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    audioSystem.playClick();
    try {
      const finalPersonality = personality === 'Other' ? customPersonality : personality;
      const finalLoveLanguage = loveLanguage === 'Other' ? customLoveLanguage : loveLanguage;

      const allInterests = [...selectedInterests];
      if (customInterest.trim()) {
        allInterests.push(customInterest.trim());
      }

      const allSymptoms = [...symptoms];
      if (customSymptom.trim()) {
        allSymptoms.push(customSymptom.trim());
      }

      // Update User profile
      const updates: Partial<UserProfile> = {
        personality: finalPersonality,
        interests: allInterests,
        love_language: finalLoveLanguage,
        favorite_things: favoriteThings ? [favoriteThings] : [],
        average_cycle_length: cycleLength,
        average_period_duration: periodDuration,
        pms_duration: pmsDuration,
        last_period_date: lastPeriodDate || undefined,
      };

      await databaseApi.updateUserProfile(user.id, updates);

      // Seed relationship anniversary inside couple
      if (user.couple_id) {
        await databaseApi.updateStreak(user.couple_id);
      }

      audioSystem.playSuccess();
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to save compatibility quest details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-height-screen flex flex-col items-center justify-center p-4">
      <StarryBackground />

      <div className="w-full max-w-xl my-8">
        {/* Progress header */}
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-[10px] text-cosmic-lavender/50 tracking-widest font-bold uppercase">
            QUEST STAGE {step} OF {totalSteps}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 === step ? 'w-6 bg-cosmic-pink' : 
                  idx + 1 < step ? 'w-2 bg-cosmic-lavender/60' : 'w-2 bg-cosmic-lavender/25'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Personality Vibe & Love Languages */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cosmic-pink animate-pulse" />
                  Cosmic Vibe & Energy
                </h2>
                <p className="text-xs text-cosmic-lavender/70 mb-5">
                  Let&apos;s identify your energy signature. Your partner will see this profile on their dashboard.
                </p>

                <div className="space-y-5">
                  {/* Personality Select */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">YOUR PERSONALITY VIBE</label>
                    <select
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      className="w-full glass-input text-sm appearance-none cursor-pointer"
                    >
                      <option value="Creative" className="bg-cosmic-black">Creative & Dreamy 🎨</option>
                      <option value="Analytical" className="bg-cosmic-black">Analytical & Caring 💡</option>
                      <option value="Adventurous" className="bg-cosmic-black">Adventurous & Wild 🌍</option>
                      <option value="Introverted" className="bg-cosmic-black">Cozy & Quiet 🍵</option>
                      <option value="Extroverted" className="bg-cosmic-black">Cheerful & Outgoing 🎉</option>
                      <option value="Empathic" className="bg-cosmic-black">Empathic & Protective 🤍</option>
                      <option value="Other" className="bg-cosmic-black">Custom Vibe...</option>
                    </select>
                    {personality === 'Other' && (
                      <input
                        type="text"
                        value={customPersonality}
                        onChange={(e) => setCustomPersonality(e.target.value)}
                        placeholder="Describe your vibe (e.g. Silly day-dreamer)"
                        className="w-full glass-input text-sm mt-2 focus:border-cosmic-pink"
                        required
                      />
                    )}
                  </div>

                  {/* Love Languages */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">PRIMARY LOVE LANGUAGE</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LOVE_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => { setLoveLanguage(lang); audioSystem.playClick(); }}
                          className={`px-3 py-2 rounded-xl text-left text-xs font-medium border transition-all duration-200 ${
                            loveLanguage === lang
                              ? 'bg-cosmic-purple/40 border-cosmic-lavender text-white'
                              : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/60 hover:border-cosmic-lavender/30'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setLoveLanguage('Other'); audioSystem.playClick(); }}
                        className={`px-3 py-2 rounded-xl text-left text-xs font-medium border transition-all duration-200 ${
                          loveLanguage === 'Other'
                            ? 'bg-cosmic-purple/40 border-cosmic-lavender text-white'
                            : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/60 hover:border-cosmic-lavender/30'
                        }`}
                      >
                        Custom / Other
                      </button>
                    </div>
                    {loveLanguage === 'Other' && (
                      <input
                        type="text"
                        value={customLoveLanguage}
                        onChange={(e) => setCustomLoveLanguage(e.target.value)}
                        placeholder="Enter your love language"
                        className="w-full glass-input text-sm mt-2 focus:border-cosmic-pink"
                        required
                      />
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={nextStep}
                      className="px-6 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/20 text-white text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                    >
                      CONTINUE <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 2: Hobbies & Passions & Favorite Things */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-cosmic-pink animate-pulse" />
                  Hobbies & Favorite Things
                </h2>
                <p className="text-xs text-cosmic-lavender/70 mb-5">
                  Choose your interests and write down things you love so your partner can surprise you!
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                  {/* Interests */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">INTERESTS & HOBBIES</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {INTERESTS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => { handleInterestToggle(interest); audioSystem.playClick(); }}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                              isSelected
                                ? 'bg-cosmic-pink/20 border border-cosmic-pink text-white font-medium shadow-glow shadow-cosmic-pink/20'
                                : 'bg-cosmic-black/60 border border-cosmic-lavender/10 text-cosmic-lavender/60 hover:border-cosmic-lavender/25'
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      placeholder="Add custom interest..."
                      className="w-full glass-input text-sm focus:border-cosmic-pink"
                    />
                  </div>

                  {/* Favorite Things */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">MY FAVORITE THINGS</label>
                    <textarea
                      value={favoriteThings}
                      onChange={(e) => setFavoriteThings(e.target.value)}
                      placeholder="E.g., dark chocolates, roses, stargazing dates, vanilla lattes..."
                      rows={3}
                      className="w-full glass-input text-sm resize-none focus:border-cosmic-pink"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={prevStep}
                    className="px-4 py-2.5 rounded-xl border border-cosmic-lavender/10 text-cosmic-lavender hover:bg-cosmic-lavender/10 text-xs font-bold tracking-wider flex items-center gap-1 transition-all duration-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> BACK
                  </button>
                  {trackPeriod ? (
                    <button
                      onClick={nextStep}
                      className="px-6 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/20 text-white text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                    >
                      CONTINUE <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinish}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-pink to-cosmic-lavender hover:from-cosmic-lavender hover:to-white text-cosmic-black text-xs font-extrabold tracking-widest flex items-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'SAVING...' : 'ENTER SPACE ✨'}
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 3: Her Cycle Tracking Profile (Mahi Saran Only) */}
          {step === 3 && trackPeriod && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-cosmic-pink animate-pulse" />
                  Cycle Predictor Setup
                </h2>
                <p className="text-xs text-cosmic-lavender/70 mb-5">
                  Set Mahi&apos;s cycle details to calculate menstrual calendars and keep Anshrit synchronized 🌙
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">LAST PERIOD DATE</label>
                    <input
                      type="date"
                      value={lastPeriodDate}
                      onChange={(e) => setLastPeriodDate(e.target.value)}
                      className="w-full glass-input text-sm cursor-pointer focus:border-cosmic-pink"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1 flex items-center justify-between">
                        <span>CYCLE LENGTH</span>
                        <span className="text-cosmic-pink text-[11px] font-bold">{cycleLength} days</span>
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="45"
                        value={cycleLength}
                        onChange={(e) => setCycleLength(parseInt(e.target.value, 10))}
                        className="w-full accent-cosmic-pink h-1.5 rounded-lg bg-cosmic-purple/40 cursor-pointer"
                      />
                      <span className="block text-[9px] text-cosmic-lavender/50 text-right">Avg: 28 days</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1 flex items-center justify-between">
                        <span>PERIOD DURATION</span>
                        <span className="text-cosmic-pink text-[11px] font-bold">{periodDuration} days</span>
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={periodDuration}
                        onChange={(e) => setPeriodDuration(parseInt(e.target.value, 10))}
                        className="w-full accent-cosmic-pink h-1.5 rounded-lg bg-cosmic-purple/40 cursor-pointer"
                      />
                      <span className="block text-[9px] text-cosmic-lavender/50 text-right">Avg: 5 days</span>
                    </div>
                  </div>

                  {/* PMS Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1 flex items-center justify-between">
                      <span>PMS / PRE-PERIOD DAYS</span>
                      <span className="text-cosmic-pink text-[11px] font-bold">{pmsDuration} days before</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="14"
                      value={pmsDuration}
                      onChange={(e) => setPmsDuration(parseInt(e.target.value, 10))}
                      className="w-full accent-cosmic-pink h-1.5 rounded-lg bg-cosmic-purple/40 cursor-pointer"
                    />
                  </div>

                  {/* Typical Symptoms */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">TYPICAL SYMPTOMS</label>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {SYMPTOMS_LIST.map((symptom) => {
                        const isSelected = symptoms.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => { handleSymptomToggle(symptom); audioSystem.playClick(); }}
                            className={`px-3 py-2 rounded-lg text-left text-xs transition-all duration-200 border ${
                              isSelected
                                ? 'bg-cosmic-pink/20 border-cosmic-pink text-white font-medium'
                                : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/60 hover:border-cosmic-lavender/25'
                            }`}
                          >
                            {symptom}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="Add custom symptom..."
                      className="w-full glass-input text-sm focus:border-cosmic-pink"
                    />
                  </div>

                  {/* PMS Details */}
                  <div>
                    <label className="block text-xs font-semibold text-cosmic-lavender/80 mb-1.5">PMS INTENSITY</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['None', 'Mild', 'Moderate', 'Severe'].map((pms) => (
                        <button
                          key={pms}
                          type="button"
                          onClick={() => { setPmsInfo(pms); audioSystem.playClick(); }}
                          className={`py-2 rounded-lg text-center text-xs font-medium border transition-all duration-200 ${
                            pmsInfo === pms
                              ? 'bg-cosmic-purple/40 border-cosmic-lavender text-white'
                              : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/60 hover:border-cosmic-lavender/30'
                          }`}
                        >
                          {pms}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={prevStep}
                    className="px-4 py-2.5 rounded-xl border border-cosmic-lavender/10 text-cosmic-lavender hover:bg-cosmic-lavender/10 text-xs font-bold tracking-wider flex items-center gap-1 transition-all duration-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> BACK
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={loading || !lastPeriodDate}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-pink to-cosmic-lavender hover:from-cosmic-lavender hover:to-white text-cosmic-black text-xs font-extrabold tracking-widest flex items-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'SAVING...' : 'ENTER SPACE ✨'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
