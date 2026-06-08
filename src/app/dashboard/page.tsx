'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Calendar,
  Sparkles,
  BookOpen,
  Compass,
  Gift,
  Flame,
  Plus,
  Check,
  Send,
  Mic,
  Play,
  LogOut,
  Droplets,
  Activity,
} from 'lucide-react';
import StarryBackground from '@/components/StarryBackground';
import GlassCard from '@/components/GlassCard';
import SoundToggle from '@/components/SoundToggle';
import CycleWheel from '@/components/CycleWheel';
import ConstellationMatch from '@/components/ConstellationMatch';
import FloatingHearts from '@/components/FloatingHearts';
import { databaseApi, UserProfile, Couple, CycleLog, JournalEntry, Memory, BucketItem, DailyQuestion, DailyAnswer, VirtualGift } from '@/lib/database';
import { audioSystem } from '@/lib/audio';
import { calculateCompatibility, getZodiacSign, ZODIAC_SYMBOLS, ZodiacSign } from '@/lib/zodiac';
import { getDailyFortune, PHASE_PARTNER_TIPS } from '@/lib/fortunes';

type Tab = 'home' | 'wellness' | 'match' | 'memories' | 'more';

// Symptoms used in the wellness logger modal
const SYMPTOMS_LIST = [
  'Cramps', 'Bloating', 'Headaches', 'Fatigue / Tiredness',
  'Mood Swings', 'Acne / Breakouts', 'Cravings', 'Sleep Disruption'
];

const INITIAL_VOICE_NOTES = [
  { id: 'vn1', duration: 14, date: '2026-06-07' },
  { id: 'vn2', duration: 32, date: '2026-06-05' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentTime] = useState(() => Date.now());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);

  // Shared state logs
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null);
  const [dailyAnswers, setDailyAnswers] = useState<DailyAnswer[]>([]);
  const [virtualGifts, setVirtualGifts] = useState<VirtualGift[]>([]);

  // Confetti trigger
  const [showConfetti, setShowConfetti] = useState(false);

  // Forms state
  const [newLogFlow, setNewLogFlow] = useState<'none' | 'spotting' | 'light' | 'medium' | 'heavy'>('none');
  const [newLogMoodRating, setNewLogMoodRating] = useState(3);
  const [newLogMoodEmoji, setNewLogMoodEmoji] = useState('😊');
  const [newLogMoodNotes, setNewLogMoodNotes] = useState('');
  const [newLogSymptoms, setNewLogSymptoms] = useState<string[]>([]);
  const [newLogCustomSymptom, setNewLogCustomSymptom] = useState('');
  const [newLogEnergy, setNewLogEnergy] = useState(7);
  const [newLogSleep, setNewLogSleep] = useState(8);
  const [newLogWater, setNewLogWater] = useState(1);
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newLogIsPeriod, setNewLogIsPeriod] = useState(false);
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);

  // Journal form (stores as plain text in the encrypted_title/content fields)
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalContent, setNewJournalContent] = useState('');

  // Memory form
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDesc, setNewMemoryDesc] = useState('');
  const [newMemoryPhoto, setNewMemoryPhoto] = useState('');

  // bucket form
  const [newBucketTitle, setNewBucketTitle] = useState('');

  // Q&A form
  const [newAnswerText, setNewAnswerText] = useState('');

  // Sticky Love Note and Seed Score states
  const [loveNote, setLoveNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [seedScore, setSeedScore] = useState(10);

  // Gifts form
  const [giftMsg, setGiftMsg] = useState('');
  const [selectedGiftType, setSelectedGiftType] = useState('hug');

  // Voice Notes Recorder Simulator State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mockVoiceNotes, setMockVoiceNotes] = useState<Array<{ id: string; duration: number; date: string }>>(INITIAL_VOICE_NOTES);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGiftCountRef = useRef<number | null>(null);

  // Fetch all dashboard data
  const loadDashboardData = async (userProfile: UserProfile) => {
    try {
      if (!userProfile.couple_id) return;

      const coupleDetails = await databaseApi.getCoupleDetails(userProfile.couple_id);
      setCouple(coupleDetails);

      const partnerProfile = await databaseApi.getPartnerProfile(userProfile.couple_id, userProfile.id);
      setPartner(partnerProfile);

      // Load cycle data
      const logs = await databaseApi.getCycleLogs(
        userProfile.gender === 'female' ? userProfile.id : (partnerProfile?.id || '')
      );
      setCycleLogs(logs);

      // Load journals
      const journals = await databaseApi.getJournalEntries(userProfile.couple_id);
      setJournalEntries(journals);

      // Load memories
      const listMemories = await databaseApi.getMemories(userProfile.couple_id);
      setMemories(listMemories);

      // Load bucket list
      const buckets = await databaseApi.getBucketList(userProfile.couple_id);
      setBucketList(buckets);

      // Load daily question
      const q = await databaseApi.getDailyQuestion();
      setDailyQuestion(q);

      if (q) {
        const answers = await databaseApi.getDailyAnswers(q.id, userProfile.couple_id);
        setDailyAnswers(answers);
      }

      // Load gifts
      const giftsList = await databaseApi.getVirtualGifts(userProfile.couple_id);
      setVirtualGifts(giftsList);

      // Load love note
      const note = await databaseApi.getLoveNote(userProfile.couple_id);
      setLoveNote(note);

      // Load seed score
      const score = await databaseApi.getCosmicSeedScore(userProfile.couple_id);
      setSeedScore(score);

      // Automatically trigger confetti and sounds if a new gift from partner is received
      if (lastGiftCountRef.current !== null && giftsList.length > lastGiftCountRef.current) {
        const newGiftsCount = giftsList.length - lastGiftCountRef.current;
        const newGifts = giftsList.slice(0, newGiftsCount);
        const hasPartnerGift = newGifts.some(g => g.sender_id !== userProfile.id);
        if (hasPartnerGift) {
          const latestGift = newGifts[0];
          if (latestGift.gift_type === 'hug') {
            audioSystem.playHug();
          } else {
            audioSystem.playTwinkle();
          }
          setShowConfetti(true);
        }
      }
      lastGiftCountRef.current = giftsList.length;
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    let activeUser: UserProfile | null = null;

    databaseApi.getCurrentUser().then((userProfile) => {
      if (!userProfile) {
        router.push('/');
      } else if (!userProfile.couple_id) {
        router.push('/');
      } else {
        activeUser = userProfile;
        setCurrentUser(userProfile);
        loadDashboardData(userProfile).then(() => setLoading(false));
      }
    });

    // Set up polling interval every 10 seconds to keep partners synchronized
    const pollInterval = setInterval(() => {
      if (activeUser) {
        loadDashboardData(activeUser);
      }
    }, 10000);

    // Voice notes are pre-seeded statically

    return () => {
      clearInterval(pollInterval);
    };
  }, [router]);

  if (loading || !currentUser) {
    return (
      <main className="relative min-height-screen flex flex-col items-center justify-center p-4">
        <StarryBackground />
        <div className="flex flex-col items-center justify-center gap-3">
          <span className="w-12 h-12 border-4 border-cosmic-lavender border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-cosmic-lavender/70 font-semibold tracking-wider uppercase animate-pulse">
            Connecting to Stars...
          </p>
        </div>
      </main>
    );
  }

  // Calculate compatibility result if partner is linked
  const partnerData = partner || { birthday: '1995-01-01', love_language: 'Quality Time', interests: [] };
  const compatResult = calculateCompatibility(
    { birthday: currentUser.birthday, loveLanguage: currentUser.love_language, interests: currentUser.interests },
    { birthday: partnerData.birthday, loveLanguage: partnerData.love_language, interests: partnerData.interests }
  );

  // Calculate Her cycle information
  const cycleUser = currentUser.gender === 'female' ? currentUser : partner;
  let daysSinceLastPeriod = 12;

  if (cycleLogs.length > 0) {
    const lastP = cycleLogs.find(l => l.is_period);
    if (lastP) {
      daysSinceLastPeriod = Math.floor((currentTime - new Date(lastP.date).getTime()) / 86400000) + 1;
    }
  } else if (cycleUser?.last_period_date) {
    daysSinceLastPeriod = Math.floor((currentTime - new Date(cycleUser.last_period_date).getTime()) / 86400000) + 1;
  }

  const avgDuration = cycleUser?.average_period_duration || 5;
  const avgLength = cycleUser?.average_cycle_length || 28;
  const ovulationDay = avgLength - 14;
  const currentCycleDay = Math.max(1, Math.min(daysSinceLastPeriod % avgLength || avgLength, avgLength));

  let currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
  if (currentCycleDay <= avgDuration) {
    currentPhase = 'menstrual';
  } else if (Math.abs(currentCycleDay - ovulationDay) <= 1) {
    currentPhase = 'ovulation';
  } else if (currentCycleDay > ovulationDay) {
    currentPhase = 'luteal';
  } else {
    currentPhase = 'follicular';
  }

  // Auth logout
  const handleLogOut = async () => {
    audioSystem.playClick();
    await databaseApi.signOut();
    router.push('/');
  };

  // Virtual Gifts
  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.couple_id) return;
    audioSystem.playClick();
    try {
      await databaseApi.sendVirtualGift(
        currentUser.couple_id,
        currentUser.id,
        selectedGiftType,
        giftMsg.trim() || undefined
      );
      if (selectedGiftType === 'hug') audioSystem.playHug();
      else audioSystem.playSuccess();
      setGiftMsg('');
      setShowConfetti(true);
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Wellness logger submit
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    audioSystem.playClick();
    const todayStr = new Date().toISOString().split('T')[0];
    const finalSymptoms = [...newLogSymptoms];
    if (newLogCustomSymptom.trim()) finalSymptoms.push(newLogCustomSymptom.trim());
    try {
      await databaseApi.saveCycleLog(currentUser.id, todayStr, {
        is_period: newLogIsPeriod,
        flow: newLogIsPeriod ? newLogFlow : 'none',
        mood_rating: newLogMoodRating,
        mood_emoji: newLogMoodEmoji,
        mood_notes: newLogMoodNotes.trim() || undefined,
        symptoms: finalSymptoms,
        energy_level: newLogEnergy,
        sleep_hours: newLogSleep,
        water_intake: newLogWater,
        notes: newLogNotes.trim() || undefined
      });
      if (couple) await databaseApi.updateStreak(couple.id);
      audioSystem.playSuccess();
      setIsLoggingModalOpen(false);
      setNewLogMoodNotes('');
      setNewLogCustomSymptom('');
      setNewLogNotes('');
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Journal log submit (stored as plain text in encrypted_title/encrypted_content fields)
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournalTitle.trim() || !newJournalContent.trim() || !currentUser.couple_id) return;
    audioSystem.playClick();
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await databaseApi.saveJournalEntry(
        currentUser.couple_id,
        currentUser.id,
        newJournalTitle.trim(),
        newJournalContent.trim(),
        'plain', // iv placeholder — no encryption
        todayStr
      );
      if (couple) await databaseApi.updateStreak(couple.id);
      audioSystem.playSuccess();
      setNewJournalTitle('');
      setNewJournalContent('');
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Memory log submit
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryTitle.trim() || !currentUser.couple_id) return;
    audioSystem.playClick();
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await databaseApi.saveMemory(
        currentUser.couple_id,
        newMemoryTitle.trim(),
        newMemoryDesc.trim(),
        'plain',
        newMemoryPhoto.trim() || 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=60',
        todayStr
      );
      audioSystem.playSuccess();
      setNewMemoryTitle('');
      setNewMemoryDesc('');
      setNewMemoryPhoto('');
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Bucket list submit
  const handleAddBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketTitle.trim() || !currentUser.couple_id) return;
    audioSystem.playClick();
    try {
      await databaseApi.addBucketItem(currentUser.couple_id, newBucketTitle.trim());
      audioSystem.playSuccess();
      setNewBucketTitle('');
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBucket = async (id: string) => {
    audioSystem.playClick();
    try {
      await databaseApi.toggleBucketItem(id);
      audioSystem.playSuccess();
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Q&A submit (stored as plain text)
  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerText.trim() || !dailyQuestion || !currentUser.couple_id) return;
    audioSystem.playClick();
    try {
      await databaseApi.submitDailyAnswer(
        dailyQuestion.id,
        currentUser.couple_id,
        currentUser.id,
        newAnswerText.trim(),
        'plain'
      );
      audioSystem.playSuccess();
      setNewAnswerText('');
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Voice Notes Recorder Simulator
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      audioSystem.playSuccess();
      const todayStr = new Date().toISOString().split('T')[0];
      setMockVoiceNotes(prev => [{ id: `vn_${Math.random()}`, duration: recordingSeconds, date: todayStr }, ...prev]);
    } else {
      audioSystem.playClick();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(prev => prev + 1), 1000);
    }
  };

  const handlePlayVoiceNote = () => audioSystem.playTwinkle();

  // Helper: Did both partners answer?
  const bothAnswered = dailyAnswers.length >= 2;
  const myAnswer = dailyAnswers.find(a => a.user_id === currentUser.id);
  const partnerAnswer = dailyAnswers.find(a => a.user_id !== currentUser.id);

  const relationshipStartDate = new Date('2026-03-06T00:00:00');
  const relationshipDiff = currentTime - relationshipStartDate.getTime();
  const relationshipDays = Math.max(1, Math.floor(relationshipDiff / (1000 * 60 * 60 * 24)) + 1);

  // Daily fortune for current user
  const mySign = (currentUser.zodiac_sign || getZodiacSign(currentUser.birthday)) as ZodiacSign;
  const myZodiacSymbol = ZODIAC_SYMBOLS[mySign] || '⭐';
  const myFortune = getDailyFortune(mySign);

  // Phase tip card (shown for him or for her with a self-care angle)
  const phaseTip = PHASE_PARTNER_TIPS[currentPhase];

  // Streak milestone check
  const isStreakMilestone = couple && [7, 14, 30, 60, 100, 365].includes(couple.love_streak);

  return (
    <main className="relative min-height-screen pb-20 pt-16 flex flex-col items-center">
      <StarryBackground phase={currentPhase} />
      <FloatingHearts trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Top Header Navbar */}
      <header className="fixed top-0 inset-x-0 h-16 glass-panel flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-cosmic-pink fill-current animate-pulse" />
          <span className="font-extrabold text-sm tracking-widest text-white uppercase font-display">
            Project Star
          </span>
        </div>

        <div className="flex items-center gap-3">
          {couple && (
            <motion.div
              className={`px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                isStreakMilestone
                  ? 'bg-amber-500/30 border-amber-400/40'
                  : 'bg-cosmic-purple/40 border-cosmic-lavender/10'
              }`}
              animate={isStreakMilestone ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: isStreakMilestone ? Infinity : 0, duration: 1.5 }}
            >
              <Flame className={`w-4 h-4 fill-current ${isStreakMilestone ? 'text-amber-400' : 'text-cosmic-gold'}`} />
              <span className="text-xs font-bold text-glow text-white">
                {couple.love_streak} Streak
                {isStreakMilestone && ' 🎉'}
              </span>
            </motion.div>
          )}
          <SoundToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-2xl px-4 mt-6 mb-12 flex-1">

        <AnimatePresence mode="wait">
          {/* ========================================================
              TAB 1: GALAXY HOME (DASHBOARD)
              ======================================================== */}
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Welcome Banner */}
              <div className="text-center md:text-left md:flex md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Welcome back, {currentUser.nickname}! {myZodiacSymbol}
                  </h2>
                  <p className="text-xs text-cosmic-lavender/70 mt-0.5">
                    {partner ? `Orbiting in real-time with ${partner.nickname} ${ZODIAC_SYMBOLS[(partner.zodiac_sign || getZodiacSign(partner.birthday)) as ZodiacSign] || '✨'}` : 'Searching for partner orbit...'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cosmic-pink/15 border border-cosmic-pink/20 text-xs font-bold text-cosmic-pink shadow-glow">
                    💖 Orbiting since March 6, 2026 · Day {relationshipDays}
                  </div>
                </div>
                {currentUser.gender === 'female' && (
                  <button
                    onClick={() => { audioSystem.playClick(); setIsLoggingModalOpen(true); }}
                    className="mt-3 md:mt-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-pink to-cosmic-lavender hover:from-cosmic-lavender hover:to-white text-cosmic-black text-xs font-extrabold tracking-widest flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-cosmic-black" /> LOG TODAY
                  </button>
                )}
              </div>

              {/* Daily Zodiac Fortune Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-cosmic-purple/30 to-cosmic-deep/60 border border-cosmic-lavender/15 relative overflow-hidden"
              >
                <div className="absolute -top-2 -right-2 text-5xl opacity-20 select-none">{myZodiacSymbol}</div>
                <span className="text-[10px] font-bold text-cosmic-lavender/50 tracking-widest uppercase block mb-1.5">
                  ✨ Today&apos;s Cosmic Fortune
                </span>
                <p className="text-sm text-white leading-relaxed font-medium">
                  {myFortune}
                </p>
                <span className="text-[10px] text-cosmic-lavender/40 mt-1 block">
                  {mySign} · {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </motion.div>

              {/* Cosmic Love Seed Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-cosmic-purple/20 via-cosmic-deep/50 to-cosmic-violet/25 border border-cosmic-lavender/10 relative overflow-hidden animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl select-none">
                    {seedScore < 25 ? '🌱' : seedScore < 50 ? '🌿' : seedScore < 75 ? '🌸' : '🌹'}
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-cosmic-lavender/50 tracking-widest uppercase block mb-1">
                      Our Cosmic Love Seed
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span>{seedScore < 25 ? 'Seedling Stage' : seedScore < 50 ? 'Sprout Stage' : seedScore < 75 ? 'Blossom Stage' : 'Cosmic Rose Stage!'}</span>
                      <span className="text-cosmic-pink">{seedScore}% Grown</span>
                    </div>
                    <div className="w-full bg-cosmic-black/50 h-2.5 rounded-full border border-cosmic-lavender/5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cosmic-purple via-cosmic-pink to-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${seedScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Phase Partner Tip Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`p-4 rounded-2xl bg-gradient-to-br ${phaseTip.color} relative overflow-hidden`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{phaseTip.emoji}</span>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 block mb-0.5">
                      {currentUser.gender === 'female' ? '🌙 Your Current Phase' : `💑 ${partner?.nickname || 'Her'}'s Phase`}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mb-1">{phaseTip.title}</h4>
                    <p className="text-xs text-white/75 leading-relaxed">{phaseTip.tip}</p>
                  </div>
                </div>
              </motion.div>

              {/* Cycle Overview & Partner Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cycle Wheel widget */}
                <GlassCard className="flex flex-col items-center justify-center">
                  <CycleWheel
                    currentDay={currentCycleDay}
                    totalDays={avgLength}
                    periodDuration={avgDuration}
                    ovulationDay={ovulationDay}
                    phase={currentPhase}
                    isPartnerView={currentUser.gender !== 'female'}
                    partnerName={partner?.nickname || 'Partner'}
                  />
                </GlassCard>

                <div className="space-y-6">
                  {/* Love Note widget */}
                  <GlassCard>
                    <div className="flex items-center justify-between mb-2.5 border-b border-cosmic-lavender/10 pb-2">
                      <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                        💌 Sticky Love Note
                      </h3>
                      {!isEditingNote && (
                        <button
                          onClick={() => { setNoteInput(loveNote); setIsEditingNote(true); audioSystem.playClick(); }}
                          className="text-[10px] font-bold text-cosmic-pink hover:text-white transition-colors"
                        >
                          EDIT NOTE
                        </button>
                      )}
                    </div>

                    {isEditingNote ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Write a sweet note of the day..."
                          maxLength={120}
                          rows={2}
                          className="w-full glass-input text-xs resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setIsEditingNote(false); audioSystem.playClick(); }}
                            className="px-2.5 py-1 rounded-lg border border-cosmic-lavender/10 text-cosmic-lavender text-[10px] font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              audioSystem.playClick();
                              try {
                                await databaseApi.saveLoveNote(currentUser.couple_id, currentUser.id, noteInput.trim());
                                setLoveNote(noteInput.trim());
                                setIsEditingNote(false);
                                audioSystem.playSuccess();
                                const updatedScore = await databaseApi.getCosmicSeedScore(currentUser.couple_id);
                                setSeedScore(updatedScore);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-cosmic-purple text-white text-[10px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs italic text-yellow-100/90 leading-relaxed relative overflow-hidden">
                        <div className="absolute top-1 right-2 text-2xl opacity-15">📌</div>
                        {loveNote ? `"${loveNote}"` : '"No notes left today. Leave a sweet message for Mahi/Anshrit!"'}
                      </div>
                    )}
                  </GlassCard>

                  {/* Send Love Sparkles */}
                  <GlassCard>
                    <h3 className="text-sm font-extrabold text-white mb-3 tracking-wider uppercase flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-cosmic-pink" />
                      Send Love Sparkles
                    </h3>

                    <form onSubmit={handleSendGift} className="space-y-3.5">
                      <div className="flex gap-2">
                        {[
                          { id: 'hug', label: '🤗 Hug' },
                          { id: 'kiss', label: '💋 Kiss' },
                          { id: 'star', label: '⭐ Star' },
                          { id: 'flower', label: '🌹 Rose' },
                        ].map((gift) => (
                          <button
                            key={gift.id}
                            type="button"
                            onClick={() => { setSelectedGiftType(gift.id); audioSystem.playClick(); }}
                            className={`flex-1 py-2 rounded-xl text-center text-xs font-medium border transition-all duration-200 ${
                              selectedGiftType === gift.id
                                ? 'bg-cosmic-pink/20 border-cosmic-pink text-white'
                                : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/60 hover:border-cosmic-lavender/30'
                            }`}
                          >
                            {gift.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={giftMsg}
                          onChange={(e) => setGiftMsg(e.target.value)}
                          placeholder="Add cute note (optional)..."
                          className="flex-1 glass-input text-xs"
                        />
                        <button
                          type="submit"
                          className="px-4 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/15 text-white transition-all duration-200 flex items-center justify-center cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </GlassCard>

                  {/* Compatibility score widget preview */}
                  <GlassCard
                    onClick={() => { setActiveTab('match'); audioSystem.playClick(); }}
                    hoverScale
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-white tracking-wider uppercase">
                          Constellation Match
                        </h3>
                        <p className="text-[11px] text-cosmic-lavender/70 mt-1 max-w-[170px]">
                          {myZodiacSymbol} {mySign} & {ZODIAC_SYMBOLS[(partnerData.zodiac_sign || getZodiacSign(partnerData.birthday || '1995-01-01')) as ZodiacSign] || '✨'} — Click to view
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-cosmic-purple/30 border border-cosmic-lavender/25 rounded-full w-16 h-16 shadow-glow">
                        <span className="text-lg font-bold text-glow text-white">
                          {compatResult.overall}%
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>

              {/* Real-time Notifications Feed */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-3 tracking-wider uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cosmic-lavender animate-pulse" />
                  Cosmic Activity Log
                </h3>

                <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                  {virtualGifts.length === 0 && (
                    <div className="text-center py-4 text-xs text-cosmic-lavender/40">
                      No star activities yet. Send your partner a virtual hug! 🤗
                    </div>
                  )}
                  {virtualGifts.slice(0, 8).map((gift) => {
                    const senderName = gift.sender_id === currentUser.id ? 'You' : (partner?.nickname || 'Partner');
                    const giftLabel = gift.gift_type === 'hug' ? 'virtual hug' : gift.gift_type === 'kiss' ? 'warm kiss' : gift.gift_type === 'star' ? 'lucky star' : 'cosmic rose';
                    const giftEmoji = gift.gift_type === 'hug' ? '🤗' : gift.gift_type === 'kiss' ? '💋' : gift.gift_type === 'star' ? '⭐' : '🌹';
                    return (
                      <div key={gift.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-cosmic-black/30 border border-cosmic-lavender/5 text-xs">
                        <div className="text-lg">{giftEmoji}</div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{senderName} sent a {giftLabel}!</p>
                          {gift.message && <p className="text-cosmic-lavender/70 mt-0.5 italic">&quot;{gift.message}&quot;</p>}
                        </div>
                        <span className="text-[10px] text-cosmic-lavender/40">
                          {new Date(gift.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ========================================================
              TAB 2: WELLNESS CYCLE LOGGER
              ======================================================== */}
          {activeTab === 'wellness' && (
            <motion.div
              key="wellness-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Cycle Log & Symptoms</h2>
                  <p className="text-xs text-cosmic-lavender/70">
                    Track cycle flow, moods, and symptoms to improve calendar predictions.
                  </p>
                </div>
                {currentUser.gender === 'female' && (
                  <button
                    onClick={() => { audioSystem.playClick(); setIsLoggingModalOpen(true); }}
                    className="px-4 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/15 text-white text-xs font-bold tracking-widest flex items-center justify-center gap-1 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> LOG STATUS
                  </button>
                )}
              </div>

              {/* Cycle Log Timeline list */}
              <div className="space-y-4">
                {cycleLogs.length === 0 ? (
                  <div className="text-center py-12 glass-card">
                    <p className="text-sm text-cosmic-lavender/50 font-medium">No cycles logged yet.</p>
                    <p className="text-xs text-cosmic-lavender/30 mt-1">Tap &quot;+ LOG STATUS&quot; to add today&apos;s entry.</p>
                  </div>
                ) : (
                  cycleLogs.map((log) => (
                    <GlassCard key={log.id}>
                      <div className="flex justify-between items-start border-b border-cosmic-lavender/10 pb-3.5 mb-3.5">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {new Date(log.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            {log.is_period && (
                              <span className="px-2 py-0.5 rounded-full bg-cosmic-pink/20 border border-cosmic-pink/20 text-[9px] text-cosmic-pink font-extrabold uppercase">
                                Period
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-cosmic-lavender">
                          <span>Mood:</span>
                          <span className="text-lg" title={log.mood_notes}>{log.mood_emoji} ({log.mood_rating}/5)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        {log.is_period && log.flow && (
                          <div className="p-2 rounded-lg bg-cosmic-purple/20 border border-cosmic-lavender/5">
                            <span className="block text-[10px] text-cosmic-lavender/50 mb-0.5">Flow Intensity</span>
                            <span className="text-white font-bold capitalize">{log.flow}</span>
                          </div>
                        )}
                        {log.energy_level && (
                          <div className="p-2 rounded-lg bg-cosmic-purple/20 border border-cosmic-lavender/5">
                            <span className="block text-[10px] text-cosmic-lavender/50 mb-0.5">Energy Level</span>
                            <span className="text-white font-bold">{log.energy_level} / 10</span>
                          </div>
                        )}
                        {log.sleep_hours && (
                          <div className="p-2 rounded-lg bg-cosmic-purple/20 border border-cosmic-lavender/5">
                            <span className="block text-[10px] text-cosmic-lavender/50 mb-0.5">Sleep Hours</span>
                            <span className="text-white font-bold">{log.sleep_hours} hrs</span>
                          </div>
                        )}
                        {log.water_intake && (
                          <div className="p-2 rounded-lg bg-cosmic-purple/20 border border-cosmic-lavender/5">
                            <span className="block text-[10px] text-cosmic-lavender/50 mb-0.5">Water Intake</span>
                            <span className="text-white font-bold">{log.water_intake} L</span>
                          </div>
                        )}
                      </div>

                      {log.symptoms.length > 0 && (
                        <div className="mt-3 text-xs">
                          <span className="block text-[10px] text-cosmic-lavender/50 mb-1">Symptoms Tracked</span>
                          <div className="flex flex-wrap gap-1.5">
                            {log.symptoms.map((symptom) => (
                              <span key={symptom} className="px-2.5 py-1 rounded-full bg-cosmic-black/55 border border-cosmic-lavender/10 text-cosmic-lavender/90 font-medium">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.notes && (
                        <div className="mt-3.5 p-3 rounded-lg bg-cosmic-black/40 border border-cosmic-lavender/10 text-xs text-cosmic-lavender/80 italic leading-relaxed">
                          &quot;{log.notes}&quot;
                        </div>
                      )}
                    </GlassCard>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB 3: STAR COMPATIBILITY ANALYSIS
              ======================================================== */}
          {activeTab === 'match' && (
            <motion.div
              key="match-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white">Star Match Matrix</h2>
                <p className="text-xs text-cosmic-lavender/70">
                  Compatibility based on birthdays, zodiac signs, numerology, and love languages.
                </p>
              </div>

              {/* Zodiac pair banner */}
              <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-2xl bg-cosmic-purple/20 border border-cosmic-lavender/10">
                <div className="text-center">
                  <div className="text-3xl">{ZODIAC_SYMBOLS[compatResult.zodiac.sign1]}</div>
                  <div className="text-xs font-bold text-cosmic-lavender mt-1">{currentUser.nickname}</div>
                  <div className="text-[10px] text-cosmic-lavender/50">{compatResult.zodiac.sign1}</div>
                </div>
                <div className="text-2xl text-cosmic-pink animate-pulse">💞</div>
                <div className="text-center">
                  <div className="text-3xl">{ZODIAC_SYMBOLS[compatResult.zodiac.sign2]}</div>
                  <div className="text-xs font-bold text-cosmic-pink mt-1">{partner?.nickname || 'Partner'}</div>
                  <div className="text-[10px] text-cosmic-lavender/50">{compatResult.zodiac.sign2}</div>
                </div>
              </div>

              {/* Constellation display */}
              <GlassCard className="flex items-center justify-center overflow-hidden">
                <ConstellationMatch
                  score={compatResult.overall}
                  sign1={currentUser.zodiac_sign || mySign}
                  sign2={partnerData.zodiac_sign || getZodiacSign(partnerData.birthday || '1995-01-01')}
                  name1={currentUser.nickname}
                  name2={partnerData.nickname || 'Partner'}
                />
              </GlassCard>

              {/* Scoring Breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    ZODIAC AFFINITY
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">{compatResult.zodiac.score}%</span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    <strong className="text-white">{ZODIAC_SYMBOLS[compatResult.zodiac.sign1]} {compatResult.zodiac.sign1}</strong> (you) and{' '}
                    <strong className="text-white">{ZODIAC_SYMBOLS[compatResult.zodiac.sign2]} {compatResult.zodiac.sign2}</strong> (partner).
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    NUMEROLOGY (LIFE PATH)
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">{compatResult.numerology.score}%</span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    Life paths: <strong className="text-white">#{compatResult.numerology.lifePath1}</strong> and{' '}
                    <strong className="text-white">#{compatResult.numerology.lifePath2}</strong>.
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    LOVE LANGUAGE HARMONY
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">{compatResult.loveLanguageScore}%</span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    <strong className="text-white">&quot;{currentUser.love_language}&quot;</strong> and{' '}
                    <strong className="text-white">&quot;{partnerData.love_language}&quot;</strong>.
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    SHARED PASSIONS
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">{compatResult.interestsScore}%</span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    Analyzing overlapping interests and hobbies logged on your profiles.
                  </p>
                </GlassCard>
              </div>

              {/* Cosmic insights */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-3.5 tracking-wider uppercase">
                  Cosmic Matching Insights
                </h3>
                <ul className="space-y-2.5 text-xs">
                  {compatResult.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-cosmic-lavender/90 leading-relaxed">
                      <span className="text-base">{insight.slice(0, 2)}</span>
                      <span>{insight.slice(2)}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          )}

          {/* ========================================================
              TAB 4: SHARED JOURNAL & MEMORIES
              ======================================================== */}
          {activeTab === 'memories' && (
            <motion.div
              key="memories-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cosmic-pink" />
                  Memories Vault
                </h2>
                <p className="text-xs text-cosmic-lavender/70">
                  Shared journal pages, romantic timelines, and voice notes for both of you.
                </p>
              </div>

              <div className="space-y-6">
                {/* Write Page Form */}
                <GlassCard>
                  <h3 className="text-sm font-extrabold text-white mb-3.5 tracking-wider uppercase">
                    Write New Journal Page ✍️
                  </h3>
                  <form onSubmit={handleSaveJournal} className="space-y-3.5">
                    <input
                      type="text"
                      value={newJournalTitle}
                      onChange={(e) => setNewJournalTitle(e.target.value)}
                      placeholder="Page Title (e.g. Under the Stars)..."
                      className="w-full glass-input text-xs font-bold"
                      required
                    />
                    <textarea
                      value={newJournalContent}
                      onChange={(e) => setNewJournalContent(e.target.value)}
                      placeholder="Write down your feelings, couple milestones, or thoughts..."
                      rows={3}
                      className="w-full glass-input text-xs resize-none"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-purple to-cosmic-violet hover:from-cosmic-violet hover:to-cosmic-pink text-white text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        SAVE PAGE 💖
                      </button>
                    </div>
                  </form>
                </GlassCard>

                {/* Simulated Voice Notes Recorder */}
                <GlassCard>
                  <h3 className="text-sm font-extrabold text-white mb-3 tracking-wider uppercase flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-cosmic-pink" />
                    Starry Voice Mailbox
                  </h3>
                  <p className="text-xs text-cosmic-lavender/70 mb-4">
                    Leave a quick voice mail for your partner.
                  </p>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-cosmic-black/60 border border-cosmic-lavender/10">
                    <button
                      onClick={handleToggleRecord}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse shadow-glow shadow-red-500/40'
                          : 'bg-cosmic-purple hover:bg-cosmic-violet text-white border border-cosmic-lavender/20'
                      }`}
                    >
                      <Mic className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">
                        {isRecording ? 'RECORDING AUDIO...' : 'TAP TO RECORD MESSAGE'}
                      </p>
                      {isRecording ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-xs font-mono text-red-200">
                            {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-cosmic-lavender/50 mt-1 block">
                          Tap mic to start recording.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-4">
                    {mockVoiceNotes.map((vn) => (
                      <div
                        key={vn.id}
                        onClick={handlePlayVoiceNote}
                        className="flex items-center justify-between p-3 rounded-lg bg-cosmic-purple/10 hover:bg-cosmic-purple/20 border border-cosmic-lavender/10 text-xs cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Play className="w-3.5 h-3.5 text-cosmic-lavender group-hover:scale-110 transition-transform" />
                          <span className="text-white font-medium">Voice note ({vn.duration}s)</span>
                        </div>
                        <span className="text-[10px] text-cosmic-lavender/40">{vn.date}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Journal Pages List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-white tracking-wider uppercase mb-1">
                    Journal Pages 📖
                  </h3>
                  {journalEntries.length === 0 ? (
                    <div className="text-center py-8 bg-cosmic-purple/5 border border-cosmic-lavender/10 rounded-2xl">
                      <p className="text-xs text-cosmic-lavender/50 font-medium">No pages written yet. Start your story! 💌</p>
                    </div>
                  ) : (
                    journalEntries.map((entry) => {
                      const authorName = entry.author_id === currentUser.id ? 'You' : (partner?.nickname || 'Partner');
                      // encrypted_title/content now stores plain text since E2EE removed
                      return (
                        <GlassCard key={entry.id}>
                          <div className="flex justify-between items-center border-b border-cosmic-lavender/10 pb-2.5 mb-2.5">
                            <h4 className="text-sm font-extrabold text-white">{entry.encrypted_title}</h4>
                            <span className="text-[10px] text-cosmic-lavender/40">By {authorName} · {entry.date}</span>
                          </div>
                          <p className="text-xs text-cosmic-lavender/80 leading-relaxed whitespace-pre-line">
                            {entry.encrypted_content}
                          </p>
                        </GlassCard>
                      );
                    })
                  )}
                </div>

                {/* Shared Timeline / Memories Section */}
                <div className="space-y-4 pt-4">
                  <div className="border-t border-cosmic-lavender/15 pt-5 flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-white tracking-wider uppercase">
                      Memory Timeline 🗺️
                    </h3>
                  </div>

                  <form onSubmit={handleSaveMemory} className="glass-card p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add New Memory</h4>
                    <input
                      type="text"
                      value={newMemoryTitle}
                      onChange={(e) => setNewMemoryTitle(e.target.value)}
                      placeholder="Memory Title (e.g., Anniversary Picnic)..."
                      className="w-full glass-input text-xs"
                      required
                    />
                    <textarea
                      value={newMemoryDesc}
                      onChange={(e) => setNewMemoryDesc(e.target.value)}
                      placeholder="Details of the memory..."
                      rows={2}
                      className="w-full glass-input text-xs resize-none"
                    />
                    <input
                      type="text"
                      value={newMemoryPhoto}
                      onChange={(e) => setNewMemoryPhoto(e.target.value)}
                      placeholder="Photo URL (optional)..."
                      className="w-full glass-input text-xs"
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="px-4 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/20 text-white text-xs font-bold tracking-wider cursor-pointer">
                        SAVE MEMORY 🌸
                      </button>
                    </div>
                  </form>

                  {/* Memories Feed */}
                  <div className="space-y-6 relative border-l border-cosmic-lavender/15 pl-4 ml-2">
                    {memories.length === 0 ? (
                      <p className="text-xs text-cosmic-lavender/40 italic py-2">No timeline memories added yet.</p>
                    ) : (
                      memories.map((mem) => (
                        <div key={mem.id} className="relative group">
                          <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-cosmic-pink border-2 border-cosmic-black group-hover:scale-125 transition-transform" />
                          <GlassCard className="p-4">
                            <span className="block text-[10px] text-cosmic-pink font-bold tracking-wider mb-1">{mem.date}</span>
                            <h4 className="text-sm font-extrabold text-white">{mem.encrypted_title}</h4>
                            {mem.encrypted_description && (
                              <p className="text-xs text-cosmic-lavender/70 mt-1 leading-relaxed">{mem.encrypted_description}</p>
                            )}
                            {mem.photo_url && (
                              <div className="mt-3 overflow-hidden rounded-xl border border-cosmic-lavender/10 aspect-video relative max-w-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={mem.photo_url}
                                  alt="Memory photo"
                                  className="object-cover w-full h-full opacity-80 group-hover:scale-105 transition-transform duration-500"
                                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=60'; }}
                                />
                              </div>
                            )}
                          </GlassCard>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB 5: MORE INTERACTIVE FEATURES (Q&A, BUCKET LIST)
              ======================================================== */}
          {activeTab === 'more' && (
            <motion.div
              key="more-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white">Couple Activities ✨</h2>
                <p className="text-xs text-cosmic-lavender/70">
                  Shared bucket lists, daily question games, and settings.
                </p>
              </div>

              {/* DAILY QUESTION */}
              {dailyQuestion && (
                <GlassCard>
                  <span className="px-2 py-0.5 rounded-full bg-cosmic-pink-glow/10 border border-cosmic-pink/20 text-[9px] text-cosmic-pink font-extrabold tracking-wider uppercase inline-block mb-2.5">
                    ✨ Daily Question Game
                  </span>
                  <h3 className="text-sm font-extrabold text-white leading-relaxed mb-3">
                    &quot;{dailyQuestion.question}&quot;
                  </h3>

                  {bothAnswered ? (
                    <div className="space-y-3.5 mt-4 pt-4 border-t border-cosmic-lavender/10">
                      <div className="p-3 rounded-xl bg-cosmic-purple/15 border border-cosmic-lavender/10 text-xs">
                        <span className="block text-[9px] text-cosmic-lavender/50 font-bold uppercase mb-1">YOUR ANSWER</span>
                        <p className="text-white italic">&quot;{myAnswer ? dailyAnswers.find(a => a.id === myAnswer.id)?.encrypted_answer : 'Loading...'}&quot;</p>
                      </div>
                      <div className="p-3 rounded-xl bg-cosmic-pink-glow/10 border border-cosmic-pink/15 text-xs">
                        <span className="block text-[9px] text-cosmic-pink/50 font-bold uppercase mb-1">
                          {partner?.nickname || 'PARTNER'}&apos;S ANSWER
                        </span>
                        <p className="text-white italic">&quot;{partnerAnswer ? dailyAnswers.find(a => a.id === partnerAnswer.id)?.encrypted_answer : 'Loading...'}&quot;</p>
                      </div>
                    </div>
                  ) : myAnswer ? (
                    <div className="p-4 bg-cosmic-purple/10 border border-cosmic-lavender/15 rounded-xl text-xs text-center text-cosmic-lavender mt-3.5">
                      <p className="font-semibold text-white">Answer saved! 💌</p>
                      <p className="mt-1 text-cosmic-lavender/70">
                        Waiting for {partner?.nickname || 'your partner'} to submit their answer to reveal both!
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveAnswer} className="space-y-3 mt-3.5">
                      <textarea
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        placeholder="Write your answer..."
                        rows={2}
                        className="w-full glass-input text-xs"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/10 text-white text-xs font-bold cursor-pointer"
                        >
                          SUBMIT ANSWER
                        </button>
                      </div>
                    </form>
                  )}
                </GlassCard>
              )}

              {/* BUCKET LIST */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-1.5 tracking-wider uppercase">
                  Shared Bucket List 🌍
                </h3>
                <p className="text-xs text-cosmic-lavender/70 mb-4">
                  Milestones and travel goals you want to conquer together.
                </p>

                <form onSubmit={handleAddBucket} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newBucketTitle}
                    onChange={(e) => setNewBucketTitle(e.target.value)}
                    placeholder="E.g., Go Northern Lights spotting..."
                    className="flex-1 glass-input text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/15 text-white font-semibold text-xs cursor-pointer"
                  >
                    ADD
                  </button>
                </form>

                <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                  {bucketList.length === 0 ? (
                    <p className="text-xs text-cosmic-lavender/40 text-center py-2">Your bucket list is empty. Dream big! 🌟</p>
                  ) : (
                    bucketList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleBucket(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          item.completed
                            ? 'bg-cosmic-pink-glow/10 border-cosmic-pink/25 opacity-70'
                            : 'bg-cosmic-purple/10 border-cosmic-lavender/10 hover:border-cosmic-lavender/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          item.completed ? 'bg-cosmic-pink border-cosmic-pink text-cosmic-black' : 'border-cosmic-lavender/35'
                        }`}>
                          {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs ${item.completed ? 'line-through text-cosmic-lavender/50' : 'text-white font-medium'}`}>
                          {item.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* CUTE MINI GAMES / TIPS */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-3 tracking-wider uppercase">
                  Mini Love Games 🎮
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '💌', title: 'Love Letter', desc: 'Write one thing you love about your partner right now', color: 'from-pink-950/50 to-rose-900/30 border-pink-500/20' },
                    { emoji: '🎲', title: 'Date Roulette', desc: 'Spin to pick your next date idea!', color: 'from-violet-950/50 to-purple-900/30 border-violet-500/20' },
                    { emoji: '🌟', title: 'Compliment Jar', desc: 'Leave a sweet compliment for them to find', color: 'from-amber-950/50 to-yellow-900/30 border-amber-500/20' },
                    { emoji: '📸', title: 'Photo Dare', desc: 'Take a cute selfie together today!', color: 'from-teal-950/50 to-emerald-900/30 border-teal-500/20' },
                  ].map((game) => (
                    <motion.div
                      key={game.title}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className={`p-3 rounded-xl bg-gradient-to-br ${game.color} border cursor-pointer`}
                      onClick={() => audioSystem.playTwinkle()}
                    >
                      <div className="text-2xl mb-1">{game.emoji}</div>
                      <div className="text-xs font-bold text-white mb-1">{game.title}</div>
                      <div className="text-[10px] text-white/60 leading-relaxed">{game.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              {/* SETTINGS / LOG OUT */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-3.5 tracking-wider uppercase">
                  Cosmic Station Settings ⚙️
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-cosmic-black/40 border border-cosmic-lavender/5 rounded-xl">
                    <span className="text-cosmic-lavender">Relationship</span>
                    <span className="font-bold text-white">Anshrit &amp; Mahi (since 06/03/2026) ❤️</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-cosmic-black/40 border border-cosmic-lavender/5 rounded-xl">
                    <span className="text-cosmic-lavender">Your Zodiac</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      {myZodiacSymbol} {mySign}
                    </span>
                  </div>
                  {partner && (
                    <div className="flex items-center justify-between p-2.5 bg-cosmic-black/40 border border-cosmic-lavender/5 rounded-xl">
                      <span className="text-cosmic-lavender">{partner.nickname}&apos;s Zodiac</span>
                      <span className="font-bold text-cosmic-pink flex items-center gap-1">
                        {ZODIAC_SYMBOLS[(partner.zodiac_sign || getZodiacSign(partner.birthday)) as ZodiacSign]} {partner.zodiac_sign || getZodiacSign(partner.birthday)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleLogOut}
                    className="w-full mt-2 py-3 rounded-xl bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 text-red-200 text-xs font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    DISCONNECT STATION <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================
            WELLNESS LOGGER POPUP MODAL (HER PANEL)
            ======================================================== */}
        <AnimatePresence>
          {isLoggingModalOpen && (
            <div className="fixed inset-0 bg-cosmic-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg"
              >
                <GlassCard className="max-h-[85vh] overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center border-b border-cosmic-lavender/10 pb-3 mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-cosmic-pink animate-pulse" />
                      Log Daily Health
                    </h3>
                    <button
                      onClick={() => { audioSystem.playClick(); setIsLoggingModalOpen(false); }}
                      className="text-cosmic-lavender hover:text-white font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
                    {/* Period Active Switch */}
                    <div className="p-3 bg-cosmic-pink-glow/15 border border-cosmic-pink/20 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block font-bold text-white">Active Period Day?</span>
                        <span className="block text-[10px] text-cosmic-lavender/60 mt-0.5">Toggle on to register active menstrual flow.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setNewLogIsPeriod(!newLogIsPeriod); audioSystem.playClick(); }}
                        className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                          newLogIsPeriod ? 'bg-cosmic-pink justify-end' : 'bg-slate-800 justify-start'
                        }`}
                      >
                        <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                      </button>
                    </div>

                    {/* Flow Selection */}
                    {newLogIsPeriod && (
                      <div className="space-y-1.5">
                        <label className="font-semibold text-cosmic-lavender/80">FLOW INTENSITY</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['spotting', 'light', 'medium', 'heavy'].map((flow) => (
                            <button
                              key={flow}
                              type="button"
                              onClick={() => { setNewLogFlow(flow as 'spotting' | 'light' | 'medium' | 'heavy'); audioSystem.playClick(); }}
                              className={`py-2 rounded-lg text-center text-xs font-semibold capitalize border transition-all ${
                                newLogFlow === flow
                                  ? 'bg-cosmic-pink/20 border-cosmic-pink text-white'
                                  : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/60'
                              }`}
                            >
                              {flow}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mood Rating */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-cosmic-lavender/80">TODAY&apos;S MOOD</label>
                        <span className="text-base">{newLogMoodEmoji} {newLogMoodRating}/5</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        {[
                          { rating: 1, emoji: '😢' },
                          { rating: 2, emoji: '😔' },
                          { rating: 3, emoji: '😊' },
                          { rating: 4, emoji: '😄' },
                          { rating: 5, emoji: '💖' },
                        ].map((m) => (
                          <button
                            key={m.rating}
                            type="button"
                            onClick={() => { setNewLogMoodRating(m.rating); setNewLogMoodEmoji(m.emoji); audioSystem.playClick(); }}
                            className={`flex-1 py-2 rounded-xl text-lg text-center border transition-all ${
                              newLogMoodRating === m.rating
                                ? 'bg-cosmic-purple/35 border-cosmic-lavender'
                                : 'bg-cosmic-black/40 border-cosmic-lavender/10'
                            }`}
                          >
                            {m.emoji}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newLogMoodNotes}
                        onChange={(e) => setNewLogMoodNotes(e.target.value)}
                        placeholder="Quick mood notes (e.g. anxious, excited)..."
                        className="w-full glass-input text-xs mt-1.5"
                      />
                    </div>

                    {/* Symptoms Selection */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-cosmic-lavender/80">SYMPTOMS</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SYMPTOMS_LIST.map((s) => {
                          const isSel = newLogSymptoms.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setNewLogSymptoms(prev => isSel ? prev.filter(x => x !== s) : [...prev, s]);
                                audioSystem.playClick();
                              }}
                              className={`py-1.5 rounded-lg text-center text-[10px] border transition-all ${
                                isSel
                                  ? 'bg-cosmic-pink/20 border-cosmic-pink text-white'
                                  : 'bg-cosmic-black/40 border-cosmic-lavender/10 text-cosmic-lavender/70'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={newLogCustomSymptom}
                        onChange={(e) => setNewLogCustomSymptom(e.target.value)}
                        placeholder="Enter custom symptom..."
                        className="w-full glass-input text-xs mt-1"
                      />
                    </div>

                    {/* Sliders (Energy, Sleep, Water) */}
                    <div className="space-y-3.5 p-3 rounded-xl bg-cosmic-purple/10 border border-cosmic-lavender/10">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-semibold text-cosmic-lavender/70 mb-1 flex justify-between">
                            <span>Energy</span>
                            <span className="font-bold text-white">{newLogEnergy}/10</span>
                          </label>
                          <input type="range" min="1" max="10" value={newLogEnergy} onChange={(e) => setNewLogEnergy(parseInt(e.target.value))} className="w-full accent-cosmic-purple h-1 bg-cosmic-black rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold text-cosmic-lavender/70 mb-1 flex justify-between">
                            <span>Sleep</span>
                            <span className="font-bold text-white">{newLogSleep}h</span>
                          </label>
                          <input type="range" min="3" max="12" value={newLogSleep} onChange={(e) => setNewLogSleep(parseInt(e.target.value))} className="w-full accent-cosmic-purple h-1 bg-cosmic-black rounded-lg" />
                        </div>
                        <div>
                          <label className="block font-semibold text-cosmic-lavender/70 mb-1 flex justify-between">
                            <span>Water</span>
                            <span className="font-bold text-white">{newLogWater}L</span>
                          </label>
                          <input type="range" min="0" max="4" step="0.5" value={newLogWater} onChange={(e) => setNewLogWater(parseFloat(e.target.value))} className="w-full accent-cosmic-purple h-1 bg-cosmic-black rounded-lg" />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block font-semibold text-cosmic-lavender/80 mb-1">GENERAL NOTES</label>
                      <textarea
                        value={newLogNotes}
                        onChange={(e) => setNewLogNotes(e.target.value)}
                        placeholder="Any additional wellness observations..."
                        rows={2}
                        className="w-full glass-input text-xs resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { audioSystem.playClick(); setIsLoggingModalOpen(false); }}
                        className="flex-1 py-2.5 rounded-xl border border-cosmic-lavender/10 text-cosmic-lavender text-xs font-bold hover:bg-cosmic-lavender/5 cursor-pointer"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-pink to-cosmic-lavender text-cosmic-black text-xs font-extrabold tracking-widest cursor-pointer shadow-md"
                      >
                        SAVE LOG ✨
                      </button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 h-16 glass-panel border-t border-cosmic-lavender/10 flex items-center justify-around z-45 px-2">
        {[
          { id: 'home', label: 'Home', icon: <Heart className="w-5 h-5" /> },
          { id: 'wellness', label: 'Wellness', icon: <Calendar className="w-5 h-5" /> },
          { id: 'match', label: 'Match', icon: <Compass className="w-5 h-5" /> },
          { id: 'memories', label: 'Memories', icon: <BookOpen className="w-5 h-5" /> },
          { id: 'more', label: 'Activities', icon: <Sparkles className="w-5 h-5" /> },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); audioSystem.playClick(); }}
              className={`flex flex-col items-center justify-center w-14 h-12 transition-all ${
                isActive ? 'text-cosmic-pink scale-110' : 'text-cosmic-lavender/60 hover:text-cosmic-lavender'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-bold tracking-wider mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
