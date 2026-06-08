import { ZodiacSign } from './zodiac';

// 7 rotating fortunes per sign — indexed by day-of-week (0=Sun … 6=Sat)
const FORTUNES: Record<ZodiacSign, string[]> = {
  Aries: [
    '🔥 Your passion lights up every room — let it ignite something new today.',
    '⚡ A burst of energy is yours. Channel it into something that makes your partner smile.',
    '🌟 Bold moves pay off. Trust your instincts in love and life.',
    "💪 You're unstoppable today — share that confidence with your partner.",
    '🌹 Unexpected romance is in the air. Be open to spontaneous moments.',
    '🎯 Your focus is razor-sharp. Plan something special and watch it unfold.',
    '🦁 Your courage is magnetic — your partner admires you more than you know.',
  ],
  Taurus: [
    '🌿 Ground yourself in what matters most — quality time over everything.',
    '🍓 Indulge in small pleasures together. A cozy night in works wonders.',
    '🌸 Your patience is your superpower. Someone special notices.',
    '💎 Stability creates the deepest love. Your steadiness is a gift.',
    '🕯️ Create a cozy ritual with your partner today — it will become a memory.',
    "🌻 Beautiful things take time. Trust the journey you're on together.",
    '🤍 Your loyalty is felt deeply by those you love. Keep shining.',
  ],
  Gemini: [
    '💬 Your words carry magic today — write or say something heartfelt.',
    '🎭 Embrace the playful side of your relationship. Laughter is the best glue.',
    '✨ Your curiosity leads to discovery — explore something new together.',
    '📚 Share a story, a song, or a silly joke. Connection comes in many forms.',
    '🌀 Your mind is sparkling. A deep conversation awaits.',
    '🦋 Duality is your strength — be both the comfort and the adventure.',
    '💌 Send a sweet unexpected message today. It will mean the world.',
  ],
  Cancer: [
    '🌙 Your intuition is finely tuned — trust what your heart is telling you.',
    '🫂 A warm hug can heal more than words today. Give one freely.',
    '🏠 Home is where your love thrives. Create a nurturing space together.',
    '💧 Vulnerability is strength. Sharing how you feel deepens the bond.',
    '🌊 Let emotions flow gently — communication is your love gift today.',
    '🕊️ Your care for others is boundless. Make sure you receive care too.',
    '🌺 A gentle gesture today will leave a lasting impression.',
  ],
  Leo: [
    '☀️ You radiate warmth — let it shine on your partner today.',
    '👑 You deserve to feel celebrated. Share a little victory with your love.',
    '🎉 Plan something fun and bold together. You both thrive on adventure.',
    '💛 Your generosity of spirit is magnetic. Share it without holding back.',
    '🌟 Express your affection loudly and proudly today.',
    '🎭 Be dramatic in the best possible way — romance lives here.',
    '🦁 Your roar is also a purr — show your softer side today.',
  ],
  Virgo: [
    '🌿 The little things you do speak volumes — keep noticing the details.',
    '📋 A thoughtful act of service today will feel like a declaration of love.',
    "🔍 Your attention to your partner's needs is deeply felt. Keep going.",
    '🌱 Growth is happening quietly — trust the process in your relationship.',
    '🍵 Slow down and be present. The most beautiful moments are in the now.',
    '💡 Your practical love language is rare and precious.',
    "🤍 Perfection isn't required — your effort is everything.",
  ],
  Libra: [
    '⚖️ Balance and beauty — your love is an art form.',
    '🌹 Romance and elegance flow effortlessly through you today.',
    '🎵 Share some music or art that moves you with your partner.',
    '💬 Harmony in conversation leads to harmony in the heart.',
    '🌸 Your grace under pressure is admirable. Let love guide you.',
    '✨ An act of fairness and kindness will strengthen your bond.',
    '🪩 You make ordinary moments extraordinary — keep dazzling.',
  ],
  Scorpio: [
    '🌑 Your depth is your greatest gift. Share a little of your mystery today.',
    '🔥 Intensity in love creates unforgettable bonds — lean in.',
    '💜 Transformation is at your fingertips. Embrace change together.',
    '🕯️ Trust is the foundation of your most powerful connections.',
    '🌊 Deep feelings seek expression — let them surface gently.',
    '💎 Your loyalty, once given, is unshakeable. That is rare.',
    '🖤 The passion you carry lights up your relationship from within.',
  ],
  Sagittarius: [
    '🏹 Adventure calls! Plan a spontaneous outing with your partner.',
    '🌍 Share a dream destination — even imagining it together is magical.',
    '🔮 Your optimism is contagious. Spread it generously today.',
    "✈️ Freedom and love aren't opposites — they make each other sweeter.",
    '🌟 Philosophical conversations lead to deeper connection today.',
    '🎯 Aim your enthusiasm at your relationship — watch it flourish.',
    '🌅 New horizons await. Explore them hand in hand.',
  ],
  Capricorn: [
    '🏔️ You build love that lasts — your dedication is everything.',
    '⏳ Patience in love pays dividends. Something beautiful is forming.',
    '🌿 Groundedness is your superpower. Your partner relies on it.',
    '💼 Share your goals and dreams — building futures together is romantic.',
    '🌙 Rest and restore — even the strongest need gentleness.',
    '🌟 Your quiet devotion speaks louder than grand gestures.',
    "🤍 Commitment and care — that's your love language.",
  ],
  Aquarius: [
    '⚡ Your originality is electric — show your quirky side today.',
    '🌌 The universe is vast and so is your heart. Share its strangeness.',
    '🤝 Connection through shared ideals creates the deepest bond.',
    '🛸 Surprise your partner with something entirely unexpected.',
    '💙 Your humanitarian heart also has room for deep personal love.',
    '🌊 Innovation in love — try a completely new experience together.',
    '✨ You see the world differently. That perspective is a gift to your partner.',
  ],
  Pisces: [
    '🌊 Your empathy runs deep — your partner feels seen and held by you.',
    '🎨 Express your love creatively today — a drawing, a poem, a song.',
    '🌙 Dreamtime and reality merge beautifully in your relationship.',
    '🫧 Gentle and flowing, your love adapts to what your partner needs.',
    '🐚 Intuition guides you well — follow where your heart leads.',
    '💫 Romantic idealism is your superpower. Keep dreaming beautifully.',
    '🌸 Your sensitivity is not weakness — it is your greatest strength in love.',
  ],
};

/**
 * Returns today's fortune for a given zodiac sign.
 * Rotates daily by day-of-week (0-6).
 */
export function getDailyFortune(sign: ZodiacSign): string {
  const dayOfWeek = new Date().getDay(); // 0 = Sunday
  return FORTUNES[sign][dayOfWeek];
}

/**
 * Returns a cycle-phase based tip for the partner (him) to understand her better.
 */
export const PHASE_PARTNER_TIPS: Record<'menstrual' | 'follicular' | 'ovulation' | 'luteal', {
  emoji: string;
  title: string;
  tip: string;
  color: string;
}> = {
  menstrual: {
    emoji: '🌙',
    title: 'Rest & Care Phase',
    tip: 'She may need warmth, comfort, and extra gentleness today. A hot water bottle, her favorite snack, or just a quiet cuddle goes a long way 💗',
    color: 'from-rose-950/60 to-red-900/40 border-rose-500/30',
  },
  follicular: {
    emoji: '🌱',
    title: 'Energy Rising Phase',
    tip: 'She\'s feeling fresh and motivated! Great time to plan a date, try something new, or have an important conversation 💬',
    color: 'from-emerald-950/60 to-teal-900/40 border-emerald-500/30',
  },
  ovulation: {
    emoji: '✨',
    title: 'Golden Glow Phase',
    tip: 'She\'s at her most vibrant and social! Perfect time for romance, adventures, and making beautiful memories together 💑',
    color: 'from-amber-950/60 to-yellow-900/40 border-amber-400/30',
  },
  luteal: {
    emoji: '🌸',
    title: 'Cozy Nesting Phase',
    tip: 'She might crave comfort and familiarity. Snuggle evenings, her favorite movie, or a heartfelt compliment mean everything right now 🫂',
    color: 'from-purple-950/60 to-violet-900/40 border-purple-400/30',
  },
};
