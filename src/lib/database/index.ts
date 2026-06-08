import { createClient } from '@supabase/supabase-js';

// Define Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determine if we should use Supabase or the LocalStorage fallback
const useSupabase = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-supabase-url');

export const supabase = useSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

console.log(`✨ Project Star Database: Using ${useSupabase ? 'Supabase Cloud' : 'Browser LocalStorage Fallback'}`);

async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return password;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function initializeCustomDatabase() {
  const coupleId = 'anshrit-mahi';
  const today = getLocalDateString();

  const seedCouple: Couple = {
    id: coupleId,
    anniversary_date: today, // Start relationship as Day 1
    love_streak: 1,
    last_streak_update: today,
    partner_1_id: 'anshrit',
    partner_2_id: 'mahi',
    created_at: new Date().toISOString(),
  };

  const seedAnshrit: UserProfile = {
    id: 'anshrit',
    email: 'anshrit',
    name: 'Anshrit Singh',
    nickname: 'Anshrit',
    gender: 'male',
    birthday: '2004-10-19',
    couple_id: coupleId,
    average_cycle_length: 28,
    average_period_duration: 5,
    pms_duration: 7,
    created_at: new Date().toISOString(),
  };

  const seedMahi: UserProfile = {
    id: 'mahi',
    email: 'mahi',
    name: 'Mahi Saran',
    nickname: 'Mahi',
    gender: 'female',
    birthday: '2005-12-16',
    couple_id: coupleId,
    average_cycle_length: 28,
    average_period_duration: 5,
    pms_duration: 7,
    created_at: new Date().toISOString(),
  };

  // Perform database reset if not done before in this client instance
  if (typeof window !== 'undefined' && !localStorage.getItem('ps_db_reset_v7')) {
    console.log('🔄 Resetting data to start clean: day 1, streak 1, prompting for questions and periods...');
    
    // Clear localStorage values and log out current user
    localStorage.removeItem('ps_current_user_id');
    localStorage.removeItem('ps_current_user');
    localStorage.removeItem('ps_questions');
    localStorage.removeItem('ps_answers');
    localStorage.removeItem('ps_gifts');
    localStorage.removeItem('ps_journals');
    localStorage.removeItem('ps_memories');
    localStorage.removeItem('ps_buckets');
    localStorage.removeItem('ps_cycle_logs');
    localStorage.removeItem('ps_love_notes');
    localStorage.removeItem('ps_seed_score');
    
    // Setup initial profiles in local storage without personality/love language/last period
    localStorage.setItem('ps_profiles', JSON.stringify([seedAnshrit, seedMahi]));
    localStorage.setItem('ps_couples', JSON.stringify([seedCouple]));

    // Perform Supabase updates if connected
    if (supabase) {
      try {
        // Clear related entries
        await supabase.from('virtual_gifts').delete().eq('couple_id', coupleId);
        await supabase.from('journal_entries').delete().eq('couple_id', coupleId);
        await supabase.from('memories').delete().eq('couple_id', coupleId);
        await supabase.from('bucket_items').delete().eq('couple_id', coupleId);
        await supabase.from('daily_answers').delete().eq('couple_id', coupleId);
        await supabase.from('cycle_logs').delete().in('user_id', ['anshrit', 'mahi']);
        
        // Reset profiles back to clean fields (nullifying love_language & personality)
        await supabase.from('profiles').update({
          personality: null,
          love_language: null,
          interests: null,
          favorite_things: null,
          last_period_date: null,
          average_cycle_length: 28,
          average_period_duration: 5,
          pms_duration: 7
        }).in('id', ['anshrit', 'mahi']);

        // Reset couple streak and dates
        await supabase.from('couples').update({
          love_streak: 1,
          last_streak_update: today,
          anniversary_date: today
        }).eq('id', coupleId);
      } catch (err) {
        console.error('Supabase reset failed:', err);
      }
    }

    localStorage.setItem('ps_db_reset_v7', 'true');
  }

  if (supabase) {
    try {
      const { data: couple } = await supabase.from('couples').select('*').eq('id', coupleId).maybeSingle();
      if (!couple) {
        await supabase.from('couples').insert([seedCouple]);
      }
      
      const { data: anshrit } = await supabase.from('profiles').select('*').eq('id', 'anshrit').maybeSingle();
      if (!anshrit) {
        await supabase.from('profiles').insert([seedAnshrit]);
      }
      
      const { data: mahi } = await supabase.from('profiles').select('*').eq('id', 'mahi').maybeSingle();
      if (!mahi) {
        await supabase.from('profiles').insert([seedMahi]);
      }
    } catch (e) {
      console.error('Supabase initialization error:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const localCouples = getStorageItem<Couple[]>('ps_couples', []);
    if (!localCouples.find(c => c.id === coupleId)) {
      localCouples.push(seedCouple);
      setStorageItem('ps_couples', localCouples);
    }

    const localProfiles = getStorageItem<UserProfile[]>('ps_profiles', []);
    if (!localProfiles.find(u => u.id === 'anshrit')) {
      localProfiles.push(seedAnshrit);
    }
    if (!localProfiles.find(u => u.id === 'mahi')) {
      localProfiles.push(seedMahi);
    }
    setStorageItem('ps_profiles', localProfiles);
  }
}

// Define TypeScript interfaces matching our database schema
export interface UserProfile {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  nickname: string;
  gender: 'female' | 'male' | 'other';
  birthday: string;
  zodiac_sign?: string;
  personality?: string;
  interests?: string[];
  hobbies?: string[];
  favorite_things?: string[];
  love_language?: string;
  couple_id?: string | null;
  // Cycle tracking defaults
  last_period_date?: string;
  average_cycle_length: number;
  average_period_duration: number;
  pms_duration: number;
  health_notes?: string;
  created_at: string;
}

export interface Couple {
  id: string;
  anniversary_date?: string;
  love_streak: number;
  last_streak_update?: string;
  partner_1_id: string;
  partner_2_id: string;
  created_at: string;
}

export interface CycleLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  is_period: boolean;
  flow?: 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
  mood_rating?: number;
  mood_emoji?: string;
  mood_notes?: string;
  symptoms: string[];
  symptoms_custom?: string;
  energy_level?: number;
  sleep_hours?: number;
  water_intake: number;
  notes?: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  couple_id: string;
  author_id: string;
  encrypted_title: string;
  encrypted_content: string;
  iv: string;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Memory {
  id: string;
  couple_id: string;
  encrypted_title: string;
  encrypted_description?: string;
  iv: string;
  photo_url?: string;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface BucketItem {
  id: string;
  couple_id: string;
  title: string;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
}

export interface DailyQuestion {
  id: string;
  question: string;
  date: string; // YYYY-MM-DD
}

export interface DailyAnswer {
  id: string;
  question_id: string;
  couple_id: string;
  user_id: string;
  encrypted_answer: string;
  iv: string;
  created_at: string;
}

export interface VirtualGift {
  id: string;
  couple_id: string;
  sender_id: string;
  gift_type: string; // 'hug', 'kiss', 'star', 'flower'
  message?: string;
  created_at: string;
}

// ==========================================
// LOCAL STORAGE DATABASE ENGINE (FALLBACK)
// ==========================================

const getStorageItem = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setStorageItem = <T>(key: string, val: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// Seed initial daily questions if empty
const seedDailyQuestions = () => {
  if (typeof window === 'undefined') return;
  const questionsKey = 'ps_questions';
  const existing = localStorage.getItem(questionsKey);
  if (!existing) {
    const list: DailyQuestion[] = [
      { id: 'q1', question: 'What is your favorite memory of us together?', date: '2026-06-07' },
      { id: 'q2', question: 'What is one thing your partner did recently that made you smile?', date: '2026-06-08' },
      { id: 'q3', question: 'Describe your perfect date night in three words.', date: '2026-06-09' },
      { id: 'q4', question: 'What is a new hobby you would love to try as a couple?', date: '2026-06-10' },
      { id: 'q5', question: 'Which zodiac trait of your partner is your favorite?', date: '2026-06-11' },
      { id: 'q6', question: 'How do you feel when your partner hugs you from behind?', date: '2026-06-12' },
      { id: 'q7', question: 'What is your favorite romantic song?', date: '2026-06-13' },
    ];
    // Populate future dates dynamically based on current date
    const today = new Date();
    const seeded = list.map((item, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      const dateString = getLocalDateString(d);
      return { ...item, date: dateString };
    });
    localStorage.setItem(questionsKey, JSON.stringify(seeded));
  }
};

class LocalDatabase {
  constructor() {
    seedDailyQuestions();
  }

  // Get active session
  getCurrentUserId(): string | null {
    return getStorageItem<string | null>('ps_current_user_id', null);
  }

  setCurrentUserId(uid: string | null) {
    setStorageItem('ps_current_user_id', uid);
  }

  // Auth
  async signUp(email: string, passwordHash: string, name: string, gender: 'female' | 'male' | 'other', birthday: string): Promise<UserProfile> {
    const users = getStorageItem<UserProfile[]>('ps_profiles', []);
    
    // Check duplication
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('User with this email already exists.');
    }

    const newUser: UserProfile = {
      id: Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      nickname: name,
      gender,
      birthday,
      average_cycle_length: 28,
      average_period_duration: 5,
      pms_duration: 7,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    setStorageItem('ps_profiles', users);
    this.setCurrentUserId(newUser.id);
    return newUser;
  }

  async signIn(email: string, passwordHash: string): Promise<UserProfile> {
    const users = getStorageItem<UserProfile[]>('ps_profiles', []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('User not found. Please sign up first.');
    }
    if (user.password_hash && user.password_hash !== passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }
    this.setCurrentUserId(user.id);
    return user;
  }

  async signOut(): Promise<void> {
    this.setCurrentUserId(null);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const users = getStorageItem<UserProfile[]>('ps_profiles', []);
    return users.find(u => u.id === uid) || null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const users = getStorageItem<UserProfile[]>('ps_profiles', []);
    const idx = users.findIndex(u => u.id === uid);
    if (idx === -1) throw new Error('User not found');
    
    users[idx] = { ...users[idx], ...updates };
    setStorageItem('ps_profiles', users);
    return users[idx];
  }

  // Couple linkage
  async getCouple(coupleId: string): Promise<Couple | null> {
    const couples = getStorageItem<Couple[]>('ps_couples', []);
    return couples.find(c => c.id === coupleId) || null;
  }

  async createCouple(user1Id: string): Promise<Couple> {
    const couples = getStorageItem<Couple[]>('ps_couples', []);
    const newCouple: Couple = {
      id: Math.random().toString(36).substring(2, 11),
      partner_1_id: user1Id,
      partner_2_id: '',
      love_streak: 1,
      last_streak_update: getLocalDateString(),
      created_at: new Date().toISOString()
    };
    couples.push(newCouple);
    setStorageItem('ps_couples', couples);

    // Update user
    await this.updateUserProfile(user1Id, { couple_id: newCouple.id });
    return newCouple;
  }

  async linkPartner(user2Id: string, partnerCode: string): Promise<Couple> {
    // partnerCode is the User ID of partner 1
    const partner1 = await this.getUserProfile(partnerCode);
    if (!partner1 || !partner1.couple_id) {
      throw new Error('Invalid partner code or partner has not generated a couple yet.');
    }

    const couple = await this.getCouple(partner1.couple_id);
    if (!couple) throw new Error('Couple record not found.');

    if (couple.partner_2_id) {
      throw new Error('This couple already has two partners linked.');
    }

    couple.partner_2_id = user2Id;
    
    // Update couple
    const couples = getStorageItem<Couple[]>('ps_couples', []);
    const cIdx = couples.findIndex(c => c.id === couple.id);
    couples[cIdx] = couple;
    setStorageItem('ps_couples', couples);

    // Update user 2
    await this.updateUserProfile(user2Id, { couple_id: couple.id });
    return couple;
  }

  // Cycle Logs
  async getCycleLogs(userId: string): Promise<CycleLog[]> {
    const logs = getStorageItem<CycleLog[]>('ps_cycle_logs', []);
    return logs.filter(log => log.user_id === userId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveCycleLog(userId: string, date: string, data: Partial<CycleLog>): Promise<CycleLog> {
    if (data.water_intake !== undefined) {
      data.water_intake = Math.round(data.water_intake);
    }
    const logs = getStorageItem<CycleLog[]>('ps_cycle_logs', []);
    const existingIdx = logs.findIndex(log => log.user_id === userId && log.date === date);

    if (existingIdx !== -1) {
      logs[existingIdx] = {
        ...logs[existingIdx],
        ...data,
        updated_at: new Date().toISOString()
      };
      setStorageItem('ps_cycle_logs', logs);
      return logs[existingIdx];
    } else {
      const newLog: CycleLog = {
        id: Math.random().toString(36).substring(2, 11),
        user_id: userId,
        date,
        is_period: data.is_period || false,
        flow: data.flow || 'none',
        mood_rating: data.mood_rating,
        mood_emoji: data.mood_emoji,
        mood_notes: data.mood_notes,
        symptoms: data.symptoms || [],
        symptoms_custom: data.symptoms_custom,
        energy_level: data.energy_level,
        sleep_hours: data.sleep_hours,
        water_intake: data.water_intake || 0,
        notes: data.notes,
        updated_at: new Date().toISOString()
      };
      logs.push(newLog);
      setStorageItem('ps_cycle_logs', logs);
      return newLog;
    }
  }

  // Journal
  async getJournal(coupleId: string): Promise<JournalEntry[]> {
    const entries = getStorageItem<JournalEntry[]>('ps_journal', []);
    return entries.filter(e => e.couple_id === coupleId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveJournal(coupleId: string, authorId: string, encryptedTitle: string, encryptedContent: string, iv: string, date: string): Promise<JournalEntry> {
    const entries = getStorageItem<JournalEntry[]>('ps_journal', []);
    const newEntry: JournalEntry = {
      id: Math.random().toString(36).substring(2, 11),
      couple_id: coupleId,
      author_id: authorId,
      encrypted_title: encryptedTitle,
      encrypted_content: encryptedContent,
      iv,
      date,
      created_at: new Date().toISOString()
    };
    entries.push(newEntry);
    setStorageItem('ps_journal', entries);
    return newEntry;
  }

  // Memories
  async getMemories(coupleId: string): Promise<Memory[]> {
    const list = getStorageItem<Memory[]>('ps_memories', []);
    return list.filter(m => m.couple_id === coupleId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveMemory(coupleId: string, encryptedTitle: string, encryptedDescription: string, iv: string, photoUrl: string, date: string): Promise<Memory> {
    const list = getStorageItem<Memory[]>('ps_memories', []);
    const newMemory: Memory = {
      id: Math.random().toString(36).substring(2, 11),
      couple_id: coupleId,
      encrypted_title: encryptedTitle,
      encrypted_description: encryptedDescription,
      iv,
      photo_url: photoUrl,
      date,
      created_at: new Date().toISOString()
    };
    list.push(newMemory);
    setStorageItem('ps_memories', list);
    return newMemory;
  }

  // Bucket List
  async getBucketList(coupleId: string): Promise<BucketItem[]> {
    const list = getStorageItem<BucketItem[]>('ps_bucket', []);
    return list.filter(b => b.couple_id === coupleId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async addBucketItem(coupleId: string, title: string): Promise<BucketItem> {
    const list = getStorageItem<BucketItem[]>('ps_bucket', []);
    const newItem: BucketItem = {
      id: Math.random().toString(36).substring(2, 11),
      couple_id: coupleId,
      title,
      completed: false,
      created_at: new Date().toISOString()
    };
    list.push(newItem);
    setStorageItem('ps_bucket', list);
    return newItem;
  }

  async toggleBucketItem(id: string): Promise<BucketItem> {
    const list = getStorageItem<BucketItem[]>('ps_bucket', []);
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Item not found');
    list[idx].completed = !list[idx].completed;
    list[idx].completed_at = list[idx].completed ? new Date().toISOString() : null;
    setStorageItem('ps_bucket', list);
    return list[idx];
  }

  // Daily Questions
  async getDailyQuestion(): Promise<DailyQuestion> {
    const questions = getStorageItem<DailyQuestion[]>('ps_questions', []);
    const today = getLocalDateString();
    const question = questions.find(q => q.date === today);
    return question || questions[0] || { id: 'q1', question: 'What is your favorite memory of us?', date: today };
  }

  async getAnswers(questionId: string, coupleId: string): Promise<DailyAnswer[]> {
    const answers = getStorageItem<DailyAnswer[]>('ps_answers', []);
    return answers.filter(a => a.question_id === questionId && a.couple_id === coupleId);
  }

  async submitAnswer(questionId: string, coupleId: string, userId: string, encryptedAnswer: string, iv: string): Promise<DailyAnswer> {
    const answers = getStorageItem<DailyAnswer[]>('ps_answers', []);
    
    // Check duplication
    const existIdx = answers.findIndex(a => a.question_id === questionId && a.couple_id === coupleId && a.user_id === userId);
    
    if (existIdx !== -1) {
      answers[existIdx] = {
        ...answers[existIdx],
        encrypted_answer: encryptedAnswer,
        iv,
        created_at: new Date().toISOString()
      };
      setStorageItem('ps_answers', answers);
      return answers[existIdx];
    } else {
      const newAnswer: DailyAnswer = {
        id: Math.random().toString(36).substring(2, 11),
        question_id: questionId,
        couple_id: coupleId,
        user_id: userId,
        encrypted_answer: encryptedAnswer,
        iv,
        created_at: new Date().toISOString()
      };
      answers.push(newAnswer);
      setStorageItem('ps_answers', answers);
      return newAnswer;
    }
  }

  // Virtual Gifts
  async getGifts(coupleId: string): Promise<VirtualGift[]> {
    const list = getStorageItem<VirtualGift[]>('ps_gifts', []);
    return list.filter(g => g.couple_id === coupleId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async sendGift(coupleId: string, senderId: string, giftType: string, message?: string): Promise<VirtualGift> {
    const list = getStorageItem<VirtualGift[]>('ps_gifts', []);
    const newGift: VirtualGift = {
      id: Math.random().toString(36).substring(2, 11),
      couple_id: coupleId,
      sender_id: senderId,
      gift_type: giftType,
      message,
      created_at: new Date().toISOString()
    };
    list.push(newGift);
    setStorageItem('ps_gifts', list);
    return newGift;
  }

  // Update Streak
  async incrementStreak(coupleId: string): Promise<Couple | null> {
    const couple = await this.getCouple(coupleId);
    if (!couple) return null;
    
    const today = getLocalDateString();
    if (couple.last_streak_update !== today) {
      couple.love_streak += 1;
      couple.last_streak_update = today;

      const couples = getStorageItem<Couple[]>('ps_couples', []);
      const idx = couples.findIndex(c => c.id === coupleId);
      couples[idx] = couple;
      setStorageItem('ps_couples', couples);
    }
    return couple;
  }
}

export const localDb = new LocalDatabase();

// ==========================================
// UNIFIED DATABASE ADAPTER API
// ==========================================

export const databaseApi = {
  // Auth Operations
  async signUp(email: string, password: string, name: string, gender: 'female' | 'male' | 'other', birthday: string): Promise<UserProfile> {
    const passwordHash = await hashPassword(password);
    if (supabase) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (existingUser) {
        throw new Error('User with this email already exists.');
      }
      const newUser: UserProfile = {
        id: Math.random().toString(36).substring(2, 11),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        nickname: name,
        gender,
        birthday,
        average_cycle_length: 28,
        average_period_duration: 5,
        pms_duration: 7,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').insert([newUser]);
      if (error) throw new Error(error.message);
      localDb.setCurrentUserId(newUser.id);
      return newUser;
    }
    return localDb.signUp(email, passwordHash, name, gender, birthday);
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    const passwordHash = await hashPassword(password);
    if (supabase) {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!user) {
        throw new Error('User not found. Please sign up first.');
      }
      if (user.password_hash && user.password_hash !== passwordHash) {
        throw new Error('Incorrect password. Please try again.');
      }
      localDb.setCurrentUserId(user.id);
      return user;
    }
    return localDb.signIn(email, passwordHash);
  },

  async signOut(): Promise<void> {
    localDb.setCurrentUserId(null);
    return localDb.signOut();
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    await initializeCustomDatabase();
    const uid = localDb.getCurrentUserId();
    if (!uid) return null;
    if (supabase) {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (error || !user) return null;
      return user;
    }
    return localDb.getUserProfile(uid);
  },

  async getPartnerProfile(coupleId: string, currentUserId: string): Promise<UserProfile | null> {
    if (supabase) {
      const { data: couple, error: cErr } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .maybeSingle();
      if (cErr || !couple) return null;
      const partnerId = couple.partner_1_id === currentUserId ? couple.partner_2_id : couple.partner_1_id;
      if (!partnerId) return null;
      const { data: partnerProfile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle();
      if (pErr) return null;
      return partnerProfile;
    }
    const couple = await localDb.getCouple(coupleId);
    if (!couple) return null;
    const partnerId = couple.partner_1_id === currentUserId ? couple.partner_2_id : couple.partner_1_id;
    if (!partnerId) return null;
    return localDb.getUserProfile(partnerId);
  },

  async createCouple(userId: string): Promise<Couple> {
    if (supabase) {
      const newCouple: Couple = {
        id: Math.random().toString(36).substring(2, 11),
        partner_1_id: userId,
        partner_2_id: '',
        love_streak: 1,
        last_streak_update: getLocalDateString(),
        created_at: new Date().toISOString()
      };
      const { error: coupleErr } = await supabase.from('couples').insert([newCouple]);
      if (coupleErr) throw new Error(coupleErr.message);
      // Update the user profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ couple_id: newCouple.id })
        .eq('id', userId);
      if (profileErr) throw new Error(profileErr.message);
      return newCouple;
    }
    return localDb.createCouple(userId);
  },

  async linkPartner(userId: string, partnerCode: string): Promise<Couple> {
    if (supabase) {
      const { data: partner1, error: p1Err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerCode.trim())
        .maybeSingle();
      if (p1Err || !partner1 || !partner1.couple_id) {
        throw new Error('Invalid partner code or partner has not generated a couple yet.');
      }
      const { data: couple, error: cErr } = await supabase
        .from('couples')
        .select('*')
        .eq('id', partner1.couple_id)
        .maybeSingle();
      if (cErr || !couple) throw new Error('Couple record not found.');
      if (couple.partner_2_id) {
        throw new Error('This couple already has two partners linked.');
      }
      // Link partner 2
      const { error: coupleUpErr } = await supabase
        .from('couples')
        .update({ partner_2_id: userId })
        .eq('id', couple.id);
      if (coupleUpErr) throw new Error(coupleUpErr.message);
      // Update user 2 profile
      const { error: user2UpErr } = await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', userId);
      if (user2UpErr) throw new Error(user2UpErr.message);
      couple.partner_2_id = userId;
      return couple;
    }
    return localDb.linkPartner(userId, partnerCode);
  },

  async getCoupleDetails(coupleId: string): Promise<Couple | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .maybeSingle();
      if (error) return null;
      return data;
    }
    return localDb.getCouple(coupleId);
  },

  // Cycle Logs
  async getCycleLogs(userId: string): Promise<CycleLog[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('cycle_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return localDb.getCycleLogs(userId);
  },

  async saveCycleLog(userId: string, date: string, data: Partial<CycleLog>): Promise<CycleLog> {
    if (data.water_intake !== undefined) {
      data.water_intake = Math.round(data.water_intake);
    }
    if (supabase) {
      const { data: existing, error: findErr } = await supabase
        .from('cycle_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();
      if (findErr) throw new Error(findErr.message);
      if (existing) {
        const updated = {
          ...existing,
          ...data,
          updated_at: new Date().toISOString()
        };
        const { error: upErr } = await supabase
          .from('cycle_logs')
          .update(updated)
          .eq('id', existing.id);
        if (upErr) throw new Error(upErr.message);
        return updated;
      } else {
        const newLog = {
          id: Math.random().toString(36).substring(2, 11),
          user_id: userId,
          date,
          is_period: data.is_period || false,
          flow: data.flow || 'none',
          mood_rating: data.mood_rating,
          mood_emoji: data.mood_emoji,
          mood_notes: data.mood_notes,
          symptoms: data.symptoms || [],
          symptoms_custom: data.symptoms_custom,
          energy_level: data.energy_level,
          sleep_hours: data.sleep_hours,
          water_intake: data.water_intake || 0,
          notes: data.notes,
          updated_at: new Date().toISOString()
        };
        const { error: insErr } = await supabase
          .from('cycle_logs')
          .insert([newLog]);
        if (insErr) throw new Error(insErr.message);
        return newLog;
      }
    }
    return localDb.saveCycleLog(userId, date, data);
  },

  // Journal
  async getJournalEntries(coupleId: string): Promise<JournalEntry[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return localDb.getJournal(coupleId);
  },

  async saveJournalEntry(
    coupleId: string,
    authorId: string,
    encryptedTitle: string,
    encryptedContent: string,
    iv: string,
    date: string
  ): Promise<JournalEntry> {
    if (supabase) {
      const newEntry = {
        id: Math.random().toString(36).substring(2, 11),
        couple_id: coupleId,
        author_id: authorId,
        encrypted_title: encryptedTitle,
        encrypted_content: encryptedContent,
        iv,
        date,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('journal_entries').insert([newEntry]);
      if (error) throw new Error(error.message);
      return newEntry;
    }
    return localDb.saveJournal(coupleId, authorId, encryptedTitle, encryptedContent, iv, date);
  },

  // Memories
  async getMemories(coupleId: string): Promise<Memory[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return localDb.getMemories(coupleId);
  },

  async saveMemory(
    coupleId: string,
    encryptedTitle: string,
    encryptedDescription: string,
    iv: string,
    photoUrl: string,
    date: string
  ): Promise<Memory> {
    if (supabase) {
      const newMemory = {
        id: Math.random().toString(36).substring(2, 11),
        couple_id: coupleId,
        encrypted_title: encryptedTitle,
        encrypted_description: encryptedDescription,
        iv,
        photo_url: photoUrl,
        date,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('memories').insert([newMemory]);
      if (error) throw new Error(error.message);
      return newMemory as Memory;
    }
    return localDb.saveMemory(coupleId, encryptedTitle, encryptedDescription, iv, photoUrl, date);
  },

  // Bucket List
  async getBucketList(coupleId: string): Promise<BucketItem[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return localDb.getBucketList(coupleId);
  },

  async addBucketItem(coupleId: string, title: string): Promise<BucketItem> {
    if (supabase) {
      const newItem = {
        id: Math.random().toString(36).substring(2, 11),
        couple_id: coupleId,
        title,
        completed: false,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('bucket_items').insert([newItem]);
      if (error) throw new Error(error.message);
      return newItem;
    }
    return localDb.addBucketItem(coupleId, title);
  },

  async toggleBucketItem(id: string): Promise<BucketItem> {
    if (supabase) {
      const { data: item, error: fErr } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (fErr || !item) throw new Error('Item not found');
      const nextCompleted = !item.completed;
      const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;
      const { error: upErr } = await supabase
        .from('bucket_items')
        .update({ completed: nextCompleted, completed_at: nextCompletedAt })
        .eq('id', id);
      if (upErr) throw new Error(upErr.message);
      item.completed = nextCompleted;
      item.completed_at = nextCompletedAt;
      return item;
    }
    return localDb.toggleBucketItem(id);
  },

  // Daily Questions
  async getDailyQuestion(): Promise<DailyQuestion> {
    if (supabase) {
      const today = getLocalDateString();
      const { data: question, error } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      if (error || !question) {
        const { data: anyQ } = await supabase
          .from('daily_questions')
          .select('*')
          .limit(1)
          .maybeSingle();
        return anyQ || { id: 'q1', question: 'What is your favorite memory of us?', date: today };
      }
      return question;
    }
    return localDb.getDailyQuestion();
  },

  async getDailyAnswers(questionId: string, coupleId: string): Promise<DailyAnswer[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('daily_answers')
        .select('*')
        .eq('question_id', questionId)
        .eq('couple_id', coupleId);
      if (error) throw new Error(error.message);
      return data || [];
    }
    return localDb.getAnswers(questionId, coupleId);
  },

  async submitDailyAnswer(
    questionId: string,
    coupleId: string,
    userId: string,
    encryptedAnswer: string,
    iv: string
  ): Promise<DailyAnswer> {
    if (supabase) {
      const { data: existing, error: fErr } = await supabase
        .from('daily_answers')
        .select('*')
        .eq('question_id', questionId)
        .eq('couple_id', coupleId)
        .eq('user_id', userId)
        .maybeSingle();
      if (fErr) throw new Error(fErr.message);
      if (existing) {
        const updated = {
          ...existing,
          encrypted_answer: encryptedAnswer,
          iv,
          created_at: new Date().toISOString()
        };
        const { error: upErr } = await supabase
          .from('daily_answers')
          .update(updated)
          .eq('id', existing.id);
        if (upErr) throw new Error(upErr.message);
        return updated;
      } else {
        const newAnswer = {
          id: Math.random().toString(36).substring(2, 11),
          question_id: questionId,
          couple_id: coupleId,
          user_id: userId,
          encrypted_answer: encryptedAnswer,
          iv,
          created_at: new Date().toISOString()
        };
        const { error: insErr } = await supabase
          .from('daily_answers')
          .insert([newAnswer]);
        if (insErr) throw new Error(insErr.message);
        return newAnswer;
      }
    }
    return localDb.submitAnswer(questionId, coupleId, userId, encryptedAnswer, iv);
  },

  // Virtual Gifts
  async getVirtualGifts(coupleId: string): Promise<VirtualGift[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('virtual_gifts')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return localDb.getGifts(coupleId);
  },

  async sendVirtualGift(coupleId: string, senderId: string, giftType: string, message?: string): Promise<VirtualGift> {
    if (supabase) {
      const newGift = {
        id: Math.random().toString(36).substring(2, 11),
        couple_id: coupleId,
        sender_id: senderId,
        gift_type: giftType,
        message,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('virtual_gifts').insert([newGift]);
      if (error) throw new Error(error.message);
      return newGift;
    }
    return localDb.sendGift(coupleId, senderId, giftType, message);
  },

  async updateStreak(coupleId: string): Promise<Couple | null> {
    if (supabase) {
      const { data: couple, error: fErr } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .maybeSingle();
      if (fErr || !couple) return null;
      const today = getLocalDateString();
      if (couple.last_streak_update !== today) {
        const updated = {
          ...couple,
          love_streak: couple.love_streak + 1,
          last_streak_update: today
        };
        const { error: upErr } = await supabase
          .from('couples')
          .update(updated)
          .eq('id', coupleId);
        if (upErr) return null;
        return updated;
      }
      return couple;
    }
    return localDb.incrementStreak(coupleId);
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return profile;
    }
    return localDb.updateUserProfile(userId, updates);
  },

  async selectProfile(uid: 'anshrit' | 'mahi'): Promise<UserProfile> {
    await initializeCustomDatabase();
    localDb.setCurrentUserId(uid);
    if (supabase) {
      const { data: user } = await supabase.from('profiles').select('*').eq('id', uid).single();
      return user;
    }
    const user = await localDb.getUserProfile(uid);
    if (!user) throw new Error('User profile seed not found.');
    return user;
  },

  async getLoveNote(coupleId: string): Promise<string> {
    const noteId = `love-note-${coupleId}`;
    if (supabase) {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('encrypted_content')
        .eq('id', noteId)
        .maybeSingle();
      if (error || !data) return '';
      return data.encrypted_content;
    }
    const journals = getStorageItem<JournalEntry[]>('ps_journals', []);
    const match = journals.find(j => j.id === noteId);
    return match ? match.encrypted_content : '';
  },

  async saveLoveNote(coupleId: string, authorId: string, content: string): Promise<void> {
    const noteId = `love-note-${coupleId}`;
    const todayStr = getLocalDateString();
    if (supabase) {
      const { data: existing } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('id', noteId)
        .maybeSingle();
      if (existing) {
        await supabase
          .from('journal_entries')
          .update({ encrypted_content: content, author_id: authorId })
          .eq('id', noteId);
      } else {
        const newEntry = {
          id: noteId,
          couple_id: coupleId,
          author_id: authorId,
          encrypted_title: 'Love Note',
          encrypted_content: content,
          iv: 'plain',
          date: todayStr,
          created_at: new Date().toISOString(),
        };
        await supabase.from('journal_entries').insert([newEntry]);
      }
      return;
    }
    const journals = getStorageItem<JournalEntry[]>('ps_journals', []);
    const idx = journals.findIndex(j => j.id === noteId);
    if (idx !== -1) {
      journals[idx].encrypted_content = content;
      journals[idx].author_id = authorId;
    } else {
      journals.push({
        id: noteId,
        couple_id: coupleId,
        author_id: authorId,
        encrypted_title: 'Love Note',
        encrypted_content: content,
        iv: 'plain',
        date: todayStr,
        created_at: new Date().toISOString(),
      });
    }
    setStorageItem('ps_journals', journals);
  },

  async getCosmicSeedScore(coupleId: string): Promise<number> {
    try {
      const journals = await this.getJournalEntries(coupleId);
      const realJournals = journals.filter(j => !j.id.startsWith('love-note'));
      const bucket = await this.getBucketList(coupleId);
      const completedBucket = bucket.filter(b => b.completed);
      const gifts = await this.getVirtualGifts(coupleId);
      const couple = await this.getCoupleDetails(coupleId);
      const streakCount = couple ? couple.love_streak : 1;

      const score = (realJournals.length * 6) + (completedBucket.length * 10) + (gifts.length * 3) + (streakCount * 4);
      return Math.min(100, score);
    } catch {
      return 10;
    }
  }
};
