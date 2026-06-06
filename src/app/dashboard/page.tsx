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
  Smile,
  Flame,
  Plus,
  Check,
  Trash2,
  Lock,
  Unlock,
  Send,
  Mic,
  Play,
  Volume2,
  Settings,
  LogOut,
  Droplets,
  Zap,
  Activity,
  Coffee,
  AlertCircle,
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';
import StarryBackground from '@/components/StarryBackground';
import GlassCard from '@/components/GlassCard';
import SoundToggle from '@/components/SoundToggle';
import CycleWheel from '@/components/CycleWheel';
import ConstellationMatch from '@/components/ConstellationMatch';
import { databaseApi, UserProfile, Couple, CycleLog, JournalEntry, Memory, BucketItem, DailyQuestion, DailyAnswer, VirtualGift } from '@/lib/database';
import { audioSystem } from '@/lib/audio';
import { calculateCompatibility } from '@/lib/zodiac';
import { encryptText, decryptText } from '@/lib/crypto';

type Tab = 'home' | 'wellness' | 'match' | 'memories' | 'more';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);

  // E2EE secret state
  const [passphrase, setPassphrase] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [isPassphraseRequired, setIsPassphraseRequired] = useState(false);

  // Shared state logs
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [decryptedJournals, setDecryptedJournals] = useState<Record<string, { title: string; content: string }>>({});
  const [memories, setMemories] = useState<Memory[]>([]);
  const [decryptedMemories, setDecryptedMemories] = useState<Record<string, { title: string; desc: string }>>({});
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null);
  const [dailyAnswers, setDailyAnswers] = useState<DailyAnswer[]>([]);
  const [decryptedAnswers, setDecryptedAnswers] = useState<Record<string, string>>({});
  const [virtualGifts, setVirtualGifts] = useState<VirtualGift[]>([]);

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

  // Journal form
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalContent, setNewJournalContent] = useState('');

  // Memory form
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDesc, setNewMemoryDesc] = useState('');
  const [newMemoryPhoto, setNewMemoryPhoto] = useState(''); // mock image input

  // Bucket form
  const [newBucketTitle, setNewBucketTitle] = useState('');

  // Q&A form
  const [newAnswerText, setNewAnswerText] = useState('');

  // Gifts form
  const [giftMsg, setGiftMsg] = useState('');
  const [selectedGiftType, setSelectedGiftType] = useState('hug');

  // Voice Notes Recorder Simulator State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mockVoiceNotes, setMockVoiceNotes] = useState<Array<{ id: string; duration: number; date: string }>>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      // Check cached passphrase
      const cachedPass = sessionStorage.getItem(`ps_e2ee_${userProfile.couple_id}`);
      if (cachedPass) {
        setPassphrase(cachedPass);
      } else {
        setIsPassphraseRequired(true);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    databaseApi.getCurrentUser().then((userProfile) => {
      if (!userProfile) {
        router.push('/');
      } else if (!userProfile.couple_id) {
        router.push('/');
      } else {
        setCurrentUser(userProfile);
        loadDashboardData(userProfile).then(() => setLoading(false));
      }
    });

    // Seed mock voice notes on load
    setMockVoiceNotes([
      { id: 'vn1', duration: 14, date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
      { id: 'vn2', duration: 32, date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] },
    ]);
  }, [router]);

  // Handle decryption when passphrase is set
  useEffect(() => {
    if (!passphrase) return;

    // Decrypt journals
    const newDecryptedJournals: Record<string, { title: string; content: string }> = {};
    journalEntries.forEach(async (entry) => {
      try {
        const decryptedTitle = await decryptText(entry.encrypted_title, entry.iv, passphrase);
        const decryptedContent = await decryptText(entry.encrypted_content, entry.iv, passphrase);
        newDecryptedJournals[entry.id] = { title: decryptedTitle, content: decryptedContent };
        setDecryptedJournals((prev) => ({ ...prev, [entry.id]: { title: decryptedTitle, content: decryptedContent } }));
      } catch (e) {
        console.error('Decryption failed for journal:', entry.id);
      }
    });

    // Decrypt memories
    memories.forEach(async (mem) => {
      try {
        const decryptedTitle = await decryptText(mem.encrypted_title, mem.iv, passphrase);
        const decryptedDesc = mem.encrypted_description 
          ? await decryptText(mem.encrypted_description, mem.iv, passphrase) 
          : '';
        setDecryptedMemories((prev) => ({ ...prev, [mem.id]: { title: decryptedTitle, desc: decryptedDesc } }));
      } catch (e) {
        console.error('Decryption failed for memory:', mem.id);
      }
    });

    // Decrypt answers
    dailyAnswers.forEach(async (ans) => {
      try {
        const decryptedAns = await decryptText(ans.encrypted_answer, ans.iv, passphrase);
        setDecryptedAnswers((prev) => ({ ...prev, [ans.id]: decryptedAns }));
      } catch (e) {
        console.error('Decryption failed for answer:', ans.id);
      }
    });
  }, [passphrase, journalEntries, memories, dailyAnswers]);

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
  const cycleDiff = cycleLogs.length > 0 ? new Date().getDate() - new Date(cycleLogs[0].date).getDate() : 12; // default fallback if mock
  // Calculate days since last period
  let lastPeriodDateStr = cycleUser?.last_period_date || new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0];
  let daysSinceLastPeriod = 12;
  
  if (cycleLogs.length > 0) {
    const lastP = cycleLogs.find(l => l.is_period);
    if (lastP) {
      lastPeriodDateStr = lastP.date;
      daysSinceLastPeriod = Math.floor((Date.now() - new Date(lastP.date).getTime()) / 86400000) + 1;
    }
  } else if (currentUser.last_period_date) {
    daysSinceLastPeriod = Math.floor((Date.now() - new Date(currentUser.last_period_date).getTime()) / 86400000) + 1;
  }
  const currentCycleDay = Math.max(1, Math.min(daysSinceLastPeriod % (cycleUser?.average_cycle_length || 28), cycleUser?.average_cycle_length || 28));

  // Determine current cycle phase
  let currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
  const avgDuration = cycleUser?.average_period_duration || 5;
  const avgLength = cycleUser?.average_cycle_length || 28;
  const ovulationDay = avgLength - 14;

  if (currentCycleDay <= avgDuration) {
    currentPhase = 'menstrual';
  } else if (currentCycleDay === ovulationDay) {
    currentPhase = 'ovulation';
  } else if (currentCycleDay > ovulationDay) {
    currentPhase = 'luteal';
  } else {
    currentPhase = 'follicular';
  }

  // Handle shared passphrase input validation
  const handlePassphraseUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput.trim()) return;
    audioSystem.playClick();
    
    // Save passphrase to session and state
    sessionStorage.setItem(`ps_e2ee_${currentUser.couple_id}`, passphraseInput.trim());
    setPassphrase(passphraseInput.trim());
    setIsPassphraseRequired(false);
    audioSystem.playSuccess();
  };

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

      // Play matching synth sounds
      if (selectedGiftType === 'hug') {
        audioSystem.playHug();
      } else {
        audioSystem.playSuccess();
      }

      setGiftMsg('');
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
    if (newLogCustomSymptom.trim()) {
      finalSymptoms.push(newLogCustomSymptom.trim());
    }

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

      // Increment Love Streak
      if (couple) {
        await databaseApi.updateStreak(couple.id);
      }

      audioSystem.playSuccess();
      setIsLoggingModalOpen(false);
      
      // Reset logging state
      setNewLogMoodNotes('');
      setNewLogCustomSymptom('');
      setNewLogNotes('');
      
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
    }
  };

  // Journal log submit
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournalTitle.trim() || !newJournalContent.trim() || !currentUser.couple_id) return;
    audioSystem.playClick();

    try {
      const encryptedTitle = await encryptText(newJournalTitle.trim(), passphrase);
      const encryptedContent = await encryptText(newJournalContent.trim(), passphrase);

      const todayStr = new Date().toISOString().split('T')[0];
      await databaseApi.saveJournalEntry(
        currentUser.couple_id,
        currentUser.id,
        encryptedTitle.ciphertext,
        encryptedContent.ciphertext,
        encryptedTitle.iv,
        todayStr
      );

      // Increment Love Streak
      if (couple) {
        await databaseApi.updateStreak(couple.id);
      }

      audioSystem.playSuccess();
      setNewJournalTitle('');
      setNewJournalContent('');
      loadDashboardData(currentUser);
    } catch (e) {
      console.error(e);
      alert('Encryption failed. Check passphrase.');
    }
  };

  // Memory log submit
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryTitle.trim() || !currentUser.couple_id) return;
    audioSystem.playClick();

    try {
      const encryptedTitle = await encryptText(newMemoryTitle.trim(), passphrase);
      const encryptedDesc = newMemoryDesc.trim() 
        ? await encryptText(newMemoryDesc.trim(), passphrase)
        : null;

      const todayStr = new Date().toISOString().split('T')[0];
      await databaseApi.saveMemory(
        currentUser.couple_id,
        encryptedTitle.ciphertext,
        encryptedDesc ? encryptedDesc.ciphertext : '',
        encryptedTitle.iv,
        newMemoryPhoto.trim() || 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // fallback romantic starry sky
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

  // Q&A submit
  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerText.trim() || !dailyQuestion || !currentUser.couple_id) return;
    audioSystem.playClick();

    try {
      const encrypted = await encryptText(newAnswerText.trim(), passphrase);
      await databaseApi.submitDailyAnswer(
        dailyQuestion.id,
        currentUser.couple_id,
        currentUser.id,
        encrypted.ciphertext,
        encrypted.iv
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
      // Stop recording
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      audioSystem.playSuccess();

      // Add to simulated list
      const todayStr = new Date().toISOString().split('T')[0];
      setMockVoiceNotes(prev => [
        {
          id: `vn_${Math.random()}`,
          duration: recordingSeconds,
          date: todayStr
        },
        ...prev
      ]);
    } else {
      // Start recording
      audioSystem.playClick();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const handlePlayVoiceNote = () => {
    audioSystem.playTwinkle();
  };

  // Helper: Did both partners answer?
  const bothAnswered = dailyAnswers.length >= 2;
  const myAnswer = dailyAnswers.find(a => a.user_id === currentUser.id);
  const partnerAnswer = dailyAnswers.find(a => a.user_id !== currentUser.id);

  return (
    <main className="relative min-height-screen pb-20 pt-16 flex flex-col items-center">
      <StarryBackground />

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
            <div className="px-3 py-1 rounded-full bg-cosmic-purple/40 border border-cosmic-lavender/10 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-cosmic-gold fill-current" />
              <span className="text-xs font-bold text-glow text-white">
                {couple.love_streak} Streak
              </span>
            </div>
          )}
          <SoundToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-2xl px-4 mt-6 mb-12 flex-1">
        
        {/* E2EE PASSPHRASE UNLOCK OVERLAY (MODAL IF REQUIRED) */}
        {isPassphraseRequired && (
          <div className="fixed inset-0 bg-cosmic-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm"
            >
              <GlassCard>
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-cosmic-purple/50 border border-cosmic-lavender/20 flex items-center justify-center mx-auto mb-3 text-cosmic-lavender shadow-glow">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Unlock E2EE Workspace</h3>
                  <p className="text-xs text-cosmic-lavender/70 mt-1">
                    Please enter the shared couple passphrase to encrypt/decrypt private journal pages and timeline memories.
                  </p>
                </div>

                <form onSubmit={handlePassphraseUnlock} className="space-y-4">
                  <input
                    type="password"
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    placeholder="Enter your couple passphrase..."
                    className="w-full glass-input text-center text-sm font-mono tracking-widest"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cosmic-purple to-cosmic-violet hover:from-cosmic-violet hover:to-cosmic-pink text-white text-xs font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    UNLOCK DATA <Unlock className="w-4 h-4" />
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}

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
                  <h2 className="text-xl font-bold text-white">Welcome back, {currentUser.nickname}!</h2>
                  <p className="text-xs text-cosmic-lavender/70 mt-0.5">
                    {partner ? `Orbiting in real-time with ${partner.nickname} ✨` : 'Searching for partner orbit...'}
                  </p>
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
                  {/* Streak & Gift box */}
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
                          Your zodiac elements are aligned. Click to view detailed analysis.
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
                      No star activities yet. Send your partner a virtual hug!
                    </div>
                  )}

                  {virtualGifts.slice(0, 8).map((gift) => {
                    const senderName = gift.sender_id === currentUser.id ? 'You' : (partner?.nickname || 'Partner');
                    const giftLabel = gift.gift_type === 'hug' ? 'virtual hug' : gift.gift_type === 'kiss' ? 'warm kiss' : gift.gift_type === 'star' ? 'lucky star' : 'cosmic rose';
                    const giftEmoji = gift.gift_type === 'hug' ? '🤗' : gift.gift_type === 'kiss' ? '💋' : gift.gift_type === 'star' ? '⭐' : '🌹';
                    
                    return (
                      <div
                        key={gift.id}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-cosmic-black/30 border border-cosmic-lavender/5 text-xs"
                      >
                        <div className="text-lg">{giftEmoji}</div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {senderName} sent a {giftLabel}!
                          </p>
                          {gift.message && (
                            <p className="text-cosmic-lavender/70 mt-0.5 italic">
                              "{gift.message}"
                            </p>
                          )}
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
                          <span className="text-lg" title={log.mood_notes}>
                            {log.mood_emoji} ({log.mood_rating}/5)
                          </span>
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
                          "{log.notes}"
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
                  Detailed compatibility score based on birthdays, zodiac signs, numerology, and love languages.
                </p>
              </div>

              {/* Constellation display */}
              <GlassCard className="flex items-center justify-center overflow-hidden">
                <ConstellationMatch
                  score={compatResult.overall}
                  sign1={currentUser.zodiac_sign || 'Virgo'}
                  sign2={partnerData.zodiac_sign || 'Taurus'}
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
                    <span className="text-2xl font-extrabold text-white text-glow">
                      {compatResult.zodiac.score}%
                    </span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    Based on your signs: <strong className="text-white">{compatResult.zodiac.sign1}</strong> (you) and{' '}
                    <strong className="text-white">{compatResult.zodiac.sign2}</strong> (partner).
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    NUMEROLOGY (LIFE PATH)
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">
                      {compatResult.numerology.score}%
                    </span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    Comparing life paths: <strong className="text-white">#{compatResult.numerology.lifePath1}</strong> and{' '}
                    <strong className="text-white">#{compatResult.numerology.lifePath2}</strong>.
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    LOVE LANGUAGE HARMONY
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">
                      {compatResult.loveLanguageScore}%
                    </span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    Comparing your primary styles: <strong className="text-white">"{currentUser.love_language}"</strong> and{' '}
                    <strong className="text-white">"{partnerData.love_language}"</strong>.
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-[10px] font-bold text-cosmic-lavender/50 uppercase tracking-widest block mb-1">
                    SHARED PASSIONS
                  </span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-extrabold text-white text-glow">
                      {compatResult.interestsScore}%
                    </span>
                  </div>
                  <p className="text-xs text-cosmic-lavender/70 leading-relaxed">
                    Analyzing overlapping interests and hobbies logged on your profiles.
                  </p>
                </GlassCard>
              </div>

              {/* Cosmic insights bullet points */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-3.5 tracking-wider uppercase">
                  Cosmic Matching Insights
                </h3>
                <ul className="space-y-2.5 text-xs">
                  {compatResult.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-cosmic-lavender/90 leading-relaxed">
                      <span>✨</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          )}

          {/* ========================================================
              TAB 4: SHARED JOURNAL & MEMORIES (E2EE)
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
                  <Lock className="w-5 h-5 text-cosmic-pink" />
                  E2EE Memories Vault
                </h2>
                <p className="text-xs text-cosmic-lavender/70">
                  Shared journal pages, romantic timelines, and voice notes encrypted client-side.
                </p>
              </div>

              {/* Tab Selector inside memories */}
              {/* Journal panel */}
              <div className="space-y-6">
                {/* Write Page Form */}
                <GlassCard>
                  <h3 className="text-sm font-extrabold text-white mb-3.5 tracking-wider uppercase">
                    Write New Journal Page
                  </h3>

                  <form onSubmit={handleSaveJournal} className="space-y-3.5">
                    <div>
                      <input
                        type="text"
                        value={newJournalTitle}
                        onChange={(e) => setNewJournalTitle(e.target.value)}
                        placeholder="Page Title (e.g. Under the Stars)..."
                        className="w-full glass-input text-xs font-bold"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        value={newJournalContent}
                        onChange={(e) => setNewJournalContent(e.target.value)}
                        placeholder="Write down your private feelings, couple milestones, or thoughts..."
                        rows={3}
                        className="w-full glass-input text-xs resize-none"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-purple to-cosmic-violet hover:from-cosmic-violet hover:to-cosmic-pink text-white text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        ENCRYPT & SAVE <Unlock className="w-4.5 h-4.5" />
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
                    Leave a quick voice mail for your partner. Recorded and played with 3D chimes.
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
                          Clicking mic starts recording browser voice note logs.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Voice Notes List */}
                  <div className="space-y-2.5 mt-4">
                    {mockVoiceNotes.map((vn) => (
                      <div
                        key={vn.id}
                        onClick={handlePlayVoiceNote}
                        className="flex items-center justify-between p-3 rounded-lg bg-cosmic-purple/10 hover:bg-cosmic-purple/20 border border-cosmic-lavender/10 text-xs cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Play className="w-3.5 h-3.5 text-cosmic-lavender group-hover:scale-110 transition-transform" />
                          <span className="text-white font-medium">Voice note log ({vn.duration}s)</span>
                        </div>
                        <span className="text-[10px] text-cosmic-lavender/40">{vn.date}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Journal Pages List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-white tracking-wider uppercase mb-1">
                    Decrypted Journal Pages
                  </h3>
                  
                  {journalEntries.length === 0 ? (
                    <div className="text-center py-8 bg-cosmic-purple/5 border border-cosmic-lavender/10 rounded-2xl">
                      <p className="text-xs text-cosmic-lavender/50 font-medium">No pages written yet.</p>
                    </div>
                  ) : (
                    journalEntries.map((entry) => {
                      const dec = decryptedJournals[entry.id];
                      const authorName = entry.author_id === currentUser.id ? 'You' : (partner?.nickname || 'Partner');
                      return (
                        <GlassCard key={entry.id}>
                          <div className="flex justify-between items-center border-b border-cosmic-lavender/10 pb-2.5 mb-2.5">
                            <h4 className="text-sm font-extrabold text-white">
                              {dec ? dec.title : '🔒 Encrypted Page'}
                            </h4>
                            <span className="text-[10px] text-cosmic-lavender/40">
                              By {authorName} • {entry.date}
                            </span>
                          </div>
                          <p className="text-xs text-cosmic-lavender/80 leading-relaxed whitespace-pre-line">
                            {dec ? dec.content : '••••••••••••••••••••••••••••••••••••••••••••••••'}
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
                      Memory Timeline
                    </h3>
                  </div>

                  <form onSubmit={handleSaveMemory} className="glass-card p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Add New Memory
                    </h4>
                    <div>
                      <input
                        type="text"
                        value={newMemoryTitle}
                        onChange={(e) => setNewMemoryTitle(e.target.value)}
                        placeholder="Memory Title (e.g., Anniversary Picnic)..."
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        value={newMemoryDesc}
                        onChange={(e) => setNewMemoryDesc(e.target.value)}
                        placeholder="Details of the memory..."
                        rows={2}
                        className="w-full glass-input text-xs resize-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newMemoryPhoto}
                        onChange={(e) => setNewMemoryPhoto(e.target.value)}
                        placeholder="Mock Photo URL (optional)..."
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-violet border border-cosmic-lavender/20 text-white text-xs font-bold tracking-wider cursor-pointer"
                      >
                        SAVE MEMORY
                      </button>
                    </div>
                  </form>

                  {/* Memories Feed */}
                  <div className="space-y-6 relative border-l border-cosmic-lavender/15 pl-4 ml-2">
                    {memories.length === 0 ? (
                      <p className="text-xs text-cosmic-lavender/40 italic py-2">No timeline memories added yet.</p>
                    ) : (
                      memories.map((mem) => {
                        const dec = decryptedMemories[mem.id];
                        return (
                          <div key={mem.id} className="relative group">
                            {/* Timeline dot */}
                            <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-cosmic-pink border-2 border-cosmic-black group-hover:scale-125 transition-transform" />
                            
                            <GlassCard className="p-4">
                              <span className="block text-[10px] text-cosmic-pink font-bold tracking-wider mb-1">
                                {mem.date}
                              </span>
                              <h4 className="text-sm font-extrabold text-white">
                                {dec ? dec.title : '🔒 Encrypted Memory'}
                              </h4>
                              {dec?.desc && (
                                <p className="text-xs text-cosmic-lavender/70 mt-1 leading-relaxed">
                                  {dec.desc}
                                </p>
                              )}
                              {mem.photo_url && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-cosmic-lavender/10 aspect-video relative max-w-sm">
                                  <img
                                    src={mem.photo_url}
                                    alt="Memory photo"
                                    className="object-cover w-full h-full opacity-80 group-hover:scale-105 transition-transform duration-500"
                                    onError={(e: any) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=60';
                                    }}
                                  />
                                </div>
                              )}
                            </GlassCard>
                          </div>
                        );
                      })
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
                <h2 className="text-xl font-bold text-white">Couple Activities</h2>
                <p className="text-xs text-cosmic-lavender/70">
                  Shared bucket lists, daily question games, and settings preferences.
                </p>
              </div>

              {/* DAILY QUESTION */}
              {dailyQuestion && (
                <GlassCard>
                  <span className="px-2 py-0.5 rounded-full bg-cosmic-pink-glow/10 border border-cosmic-pink/20 text-[9px] text-cosmic-pink font-extrabold tracking-wider uppercase inline-block mb-2.5">
                    Daily Question Game
                  </span>
                  <h3 className="text-sm font-extrabold text-white leading-relaxed mb-3">
                    "{dailyQuestion.question}"
                  </h3>

                  {bothAnswered ? (
                    /* Reveal Answers */
                    <div className="space-y-3.5 mt-4 pt-4 border-t border-cosmic-lavender/10">
                      <div className="p-3 rounded-xl bg-cosmic-purple/15 border border-cosmic-lavender/10 text-xs">
                        <span className="block text-[9px] text-cosmic-lavender/50 font-bold uppercase mb-1">
                          YOUR ANSWER
                        </span>
                        <p className="text-white italic">
                          "{decryptedAnswers[myAnswer?.id || ''] || 'Loading...'}"
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-cosmic-pink-glow/10 border border-cosmic-pink/15 text-xs">
                        <span className="block text-[9px] text-cosmic-pink/50 font-bold uppercase mb-1">
                          {partner?.nickname || 'PARTNER'}'S ANSWER
                        </span>
                        <p className="text-white italic">
                          "{decryptedAnswers[partnerAnswer?.id || ''] || 'Loading...'}"
                        </p>
                      </div>
                    </div>
                  ) : myAnswer ? (
                    /* Waiting for partner */
                    <div className="p-4 bg-cosmic-purple/10 border border-cosmic-lavender/15 rounded-xl text-xs text-center text-cosmic-lavender mt-3.5">
                      <p className="font-semibold text-white">Answer encrypted and saved! 🔒</p>
                      <p className="mt-1 text-cosmic-lavender/70">
                        Waiting for {partner?.nickname || 'your partner'} to submit their answer to reveal both details.
                      </p>
                    </div>
                  ) : (
                    /* Submit Form */
                    <form onSubmit={handleSaveAnswer} className="space-y-3 mt-3.5">
                      <textarea
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        placeholder="Write your answer (encrypted)..."
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
                  Shared Bucket List
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
                    ADD ITEM
                  </button>
                </form>

                <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                  {bucketList.length === 0 ? (
                    <p className="text-xs text-cosmic-lavender/40 text-center py-2">Your bucket list is empty.</p>
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
                          item.completed 
                            ? 'bg-cosmic-pink border-cosmic-pink text-cosmic-black' 
                            : 'border-cosmic-lavender/35'
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

              {/* SETTINGS / LOG OUT */}
              <GlassCard>
                <h3 className="text-sm font-extrabold text-white mb-3.5 tracking-wider uppercase">
                  Station Settings
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-cosmic-black/40 border border-cosmic-lavender/5 rounded-xl">
                    <span className="text-cosmic-lavender">Couple Code (Share with partner)</span>
                    <span className="font-mono text-white select-all font-bold">{currentUser.id}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-cosmic-black/40 border border-cosmic-lavender/5 rounded-xl">
                    <span className="text-cosmic-lavender">Encryption Status</span>
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" /> E2EE Enabled
                    </span>
                  </div>

                  <button
                    onClick={handleLogOut}
                    className="w-full mt-2 py-3 rounded-xl bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 text-red-200 text-xs font-bold tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    SIGN OUT STATION <LogOut className="w-4 h-4" />
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
                      Log Daily Health Details
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
                        <span className="block text-[10px] text-cosmic-lavender/60 mt-0.5">Toggle on to register active menstrual bleed.</span>
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
                        <label className="font-semibold text-cosmic-lavender/80">BLEED FLOW INTENSITY</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['spotting', 'light', 'medium', 'heavy'].map((flow) => (
                            <button
                              key={flow}
                              type="button"
                              onClick={() => { setNewLogFlow(flow as any); audioSystem.playClick(); }}
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
                        <label className="font-semibold text-cosmic-lavender/80">TODAY'S MOOD VALUE</label>
                        <span className="text-base">{newLogMoodEmoji} Rating: {newLogMoodRating}/5</span>
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
                        placeholder="Add quick mood description notes (e.g. anxious, excited)..."
                        className="w-full glass-input text-xs mt-1.5"
                      />
                    </div>

                    {/* Symptoms Selection */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-cosmic-lavender/80">SYMPTOMS EXPERIENCED</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SYMPTOMS_LIST.map((s) => {
                          const isSel = newLogSymptoms.includes(s);
                          return (
                            <button
                              key={s}
                              type="button; button"
                              onClick={() => { handleSymptomToggle(s); audioSystem.playClick(); }}
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
                        placeholder="Enter other custom symptom..."
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
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={newLogEnergy}
                            onChange={(e) => setNewLogEnergy(parseInt(e.target.value))}
                            className="w-full accent-cosmic-purple h-1 bg-cosmic-black rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-cosmic-lavender/70 mb-1 flex justify-between">
                            <span>Sleep</span>
                            <span className="font-bold text-white">{newLogSleep}h</span>
                          </label>
                          <input
                            type="range"
                            min="3"
                            max="12"
                            value={newLogSleep}
                            onChange={(e) => setNewLogSleep(parseInt(e.target.value))}
                            className="w-full accent-cosmic-purple h-1 bg-cosmic-black rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-cosmic-lavender/70 mb-1 flex justify-between">
                            <span>Water</span>
                            <span className="font-bold text-white">{newLogWater}L</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="4"
                            step="0.5"
                            value={newLogWater}
                            onChange={(e) => setNewLogWater(parseFloat(e.target.value))}
                            className="w-full accent-cosmic-purple h-1 bg-cosmic-black rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block font-semibold text-cosmic-lavender/80 mb-1">GENERAL NOTES</label>
                      <textarea
                        value={newLogNotes}
                        onChange={(e) => setNewLogNotes(e.target.value)}
                        placeholder="Write down any additional wellness observations..."
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
                        SAVE WELLNESS LOG
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
          { id: 'home', label: 'Dashboard', icon: <Heart className="w-5 h-5" /> },
          { id: 'wellness', label: 'Wellness', icon: <Calendar className="w-5 h-5" /> },
          { id: 'match', label: 'Star Match', icon: <Compass className="w-5 h-5" /> },
          { id: 'memories', label: 'E2EE Vault', icon: <BookOpen className="w-5 h-5" /> },
          { id: 'more', label: 'Activities', icon: <Sparkles className="w-5 h-5" /> },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                audioSystem.playClick();
              }}
              className={`flex flex-col items-center justify-center w-14 h-12 transition-all ${
                isActive 
                  ? 'text-cosmic-pink scale-110' 
                  : 'text-cosmic-lavender/60 hover:text-cosmic-lavender'
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
