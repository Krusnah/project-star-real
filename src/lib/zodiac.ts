export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export interface CompatibilityResult {
  overall: number;
  zodiac: {
    score: number;
    sign1: ZodiacSign;
    sign2: ZodiacSign;
  };
  numerology: {
    score: number;
    lifePath1: number;
    lifePath2: number;
  };
  loveLanguageScore: number;
  interestsScore: number;
  insights: string[];
  royalDetails?: {
    styleScore: number;
    style1: string;
    style2: string;
    castleScore: number;
    castle1: string;
    castle2: string;
    intimacyLanguageScore: number;
    intimacyLang1: string;
    intimacyLang2: string;
  };
}

// Unicode symbols for each zodiac sign
export const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

// Zodiac elements for richer descriptions
export const ZODIAC_ELEMENTS: Record<ZodiacSign, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire',
  Leo: 'Fire',
  Sagittarius: 'Fire',
  Taurus: 'Earth',
  Virgo: 'Earth',
  Capricorn: 'Earth',
  Gemini: 'Air',
  Libra: 'Air',
  Aquarius: 'Air',
  Cancer: 'Water',
  Scorpio: 'Water',
  Pisces: 'Water',
};

const ZODIAC_COMPATIBILITY: Record<ZodiacSign, Partial<Record<ZodiacSign, number>>> = {
  Aries: { Leo: 95, Sagittarius: 93, Gemini: 88, Aquarius: 85, Libra: 80, Aries: 75, Scorpio: 50 },
  Taurus: { Virgo: 95, Capricorn: 93, Cancer: 90, Pisces: 88, Scorpio: 82, Taurus: 70, Libra: 65 },
  Gemini: { Libra: 95, Aquarius: 93, Aries: 88, Leo: 85, Sagittarius: 80, Gemini: 75, Virgo: 50 },
  Cancer: { Scorpio: 95, Pisces: 93, Taurus: 90, Virgo: 85, Capricorn: 83, Cancer: 75, Leo: 68 },
  Leo: { Aries: 95, Sagittarius: 93, Gemini: 85, Libra: 83, Leo: 80, Aquarius: 70, Taurus: 45 },
  Virgo: { Taurus: 95, Capricorn: 93, Cancer: 85, Scorpio: 83, Pisces: 80, Virgo: 70, Gemini: 50 },
  Libra: { Gemini: 95, Aquarius: 93, Leo: 83, Sagittarius: 80, Aries: 78, Libra: 70, Cancer: 55 },
  Scorpio: { Cancer: 95, Pisces: 93, Taurus: 82, Virgo: 83, Capricorn: 80, Scorpio: 75, Aries: 50 },
  Sagittarius: { Aries: 93, Leo: 93, Libra: 80, Aquarius: 78, Gemini: 75, Sagittarius: 70, Pisces: 60 },
  Capricorn: { Taurus: 93, Virgo: 93, Scorpio: 80, Pisces: 78, Cancer: 75, Capricorn: 70, Libra: 55 },
  Aquarius: { Gemini: 93, Libra: 93, Sagittarius: 78, Aries: 75, Leo: 70, Aquarius: 65, Scorpio: 55 },
  Pisces: { Cancer: 93, Scorpio: 93, Capricorn: 78, Taurus: 75, Virgo: 70, Pisces: 65, Leo: 50 },
};

/**
 * Returns the zodiac sign for a date string in "YYYY-MM-DD" format.
 * Parses the date string directly (no Date constructor) to avoid timezone shifts.
 */
export function getZodiacSign(dateString: string): ZodiacSign {
  // Parse directly to avoid UTC vs local timezone off-by-one errors
  const parts = dateString.split('-');
  const month = parseInt(parts[1], 10); // 1-indexed
  const day = parseInt(parts[2], 10);

  // Standard western astrology boundaries (verified against tropical zodiac)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';       // Mar 21 – Apr 19
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';      // Apr 20 – May 20
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';      // May 21 – Jun 20
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';      // Jun 21 – Jul 22
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';         // Jul 23 – Aug 22
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';       // Aug 23 – Sep 22
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';      // Sep 23 – Oct 22
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';   // Oct 23 – Nov 21
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius'; // Nov 22 – Dec 21
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';  // Dec 22 – Jan 19
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';    // Jan 20 – Feb 18
  return 'Pisces'; // Feb 19 – Mar 20
}

export function calculateLifePathNumber(birthdayString: string): number {
  // Extract all digits: e.g., '1995-05-12' -> '19950512'
  const digitsStr = birthdayString.replace(/[^0-9]/g, '');
  if (!digitsStr) return 1;

  let sum = digitsStr.split('').reduce((acc, char) => acc + parseInt(char, 10), 0);

  // Keep reducing unless it's a master number: 11, 22, or 33
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split('')
      .reduce((acc, char) => acc + parseInt(char, 10), 0);
  }

  return sum;
}

export function calculateCompatibility(
  p1: { birthday: string; loveLanguage?: string; interests?: string[]; personality?: string },
  p2: { birthday: string; loveLanguage?: string; interests?: string[]; personality?: string }
): CompatibilityResult {
  const sign1 = getZodiacSign(p1.birthday);
  const sign2 = getZodiacSign(p2.birthday);

  // Parse serialized Royal Preferences if present
  let style1 = 'Romantic', style2 = 'Romantic';
  let castle1 = 'Royal Castle', castle2 = 'Royal Castle';
  let intimacyLang1 = 'Physical affection', intimacyLang2 = 'Physical affection';

  if (p1.personality) {
    const parts = p1.personality.split(' | ');
    parts.forEach(part => {
      if (part.startsWith('Style: ')) style1 = part.replace('Style: ', '');
      if (part.startsWith('Castle: ')) castle1 = part.replace('Castle: ', '');
    });
  }
  if (p2.personality) {
    const parts = p2.personality.split(' | ');
    parts.forEach(part => {
      if (part.startsWith('Style: ')) style2 = part.replace('Style: ', '');
      if (part.startsWith('Castle: ')) castle2 = part.replace('Castle: ', '');
    });
  }

  // Parse love language to extract intimacy language if present
  let baseLoveLanguage1 = p1.loveLanguage || '';
  let baseLoveLanguage2 = p2.loveLanguage || '';
  if (p1.loveLanguage) {
    const parts = p1.loveLanguage.split(' | ');
    baseLoveLanguage1 = parts[0];
    parts.forEach(part => {
      if (part.startsWith('Intimacy: ')) intimacyLang1 = part.replace('Intimacy: ', '');
    });
  }
  if (p2.loveLanguage) {
    const parts = p2.loveLanguage.split(' | ');
    baseLoveLanguage2 = parts[0];
    parts.forEach(part => {
      if (part.startsWith('Intimacy: ')) intimacyLang2 = part.replace('Intimacy: ', '');
    });
  }

  // 1. Zodiac Compatibility Score
  const zodiacScore =
    ZODIAC_COMPATIBILITY[sign1]?.[sign2] ||
    ZODIAC_COMPATIBILITY[sign2]?.[sign1] ||
    70; // default to 70 if no match found

  // 2. Numerology Compatibility Score
  const lp1 = calculateLifePathNumber(p1.birthday);
  const lp2 = calculateLifePathNumber(p2.birthday);
  const absDiff = Math.abs((lp1 % 9 || 9) - (lp2 % 9 || 9));
  const numerologyScore = Math.max(100 - absDiff * 10, 50);

  // 3. Love Languages Compatibility
  let loveLanguageScore = 75; // baseline
  if (baseLoveLanguage1 && baseLoveLanguage2) {
    if (baseLoveLanguage1 === baseLoveLanguage2) {
      loveLanguageScore = 100;
    } else {
      const pairings = [baseLoveLanguage1, baseLoveLanguage2];
      if (pairings.includes('Words of Affirmation') && pairings.includes('Quality Time')) {
        loveLanguageScore = 90;
      } else if (pairings.includes('Physical Touch') && pairings.includes('Quality Time')) {
        loveLanguageScore = 95;
      } else if (pairings.includes('Acts of Service') && pairings.includes('Receiving Gifts')) {
        loveLanguageScore = 85;
      }
    }
  }

  // 4. Shared Interests Compatibility
  let interestsScore = 70;
  const i1 = p1.interests || [];
  const i2 = p2.interests || [];
  if (i1.length > 0 && i2.length > 0) {
    const shared = i1.filter((item) => i2.includes(item));
    const totalUnique = new Set([...i1, ...i2]).size;
    if (totalUnique > 0) {
      interestsScore = Math.round(70 + (shared.length / totalUnique) * 30);
    }
  }

  // Royal Intimacy Styles alignment score
  let styleScore = 75;
  if (style1 === style2) {
    styleScore = 100;
  } else {
    const styles = [style1, style2];
    if (styles.includes('Romantic') && styles.includes('Sensual')) {
      styleScore = 92;
    } else if (styles.includes('Playful') && styles.includes('Adventurous')) {
      styleScore = 95;
    } else if (styles.includes('Romantic') && styles.includes('Playful')) {
      styleScore = 88;
    } else if (styles.includes('Sensual') && styles.includes('Adventurous')) {
      styleScore = 85;
    }
  }

  // Sanctuary Castle Alignment
  const castleScore = castle1 === castle2 ? 100 : 70;

  // Intimacy Language alignment
  const intimacyLanguageScore = intimacyLang1 === intimacyLang2 ? 100 : 80;

  // Overall Score Calculation (Weighted blend incorporating intimacy features)
  const overall = Math.round(
    zodiacScore * 0.25 +
    numerologyScore * 0.25 +
    loveLanguageScore * 0.15 +
    interestsScore * 0.15 +
    styleScore * 0.10 +
    castleScore * 0.05 +
    intimacyLanguageScore * 0.05
  );

  // Generate Insights
  const insights: string[] = [];
  const sym1 = ZODIAC_SYMBOLS[sign1];
  const sym2 = ZODIAC_SYMBOLS[sign2];
  const elem1 = ZODIAC_ELEMENTS[sign1];
  const elem2 = ZODIAC_ELEMENTS[sign2];

  insights.push(`👑 Royal Alliance Compatibility: Your combined connection is sealed at a beautiful ${overall}% alignment!`);

  if (zodiacScore >= 90) {
    insights.push(`${sym1}${sym2} ${sign1} and ${sign2} represent a highly harmonious zodiac alignment.`);
  } else if (zodiacScore < 60) {
    insights.push(`⚡ ${sign1} and ${sign2} present dynamic contrasts that can spark creative tension and growth.`);
  } else {
    insights.push(`💫 Your ${elem1} & ${elem2} elements (${sym1} ${sign1} & ${sym2} ${sign2}) create a pleasant, supportive orbit.`);
  }

  if (lp1 === lp2) {
    insights.push(`🔢 You share the same Life Path number (${lp1}), indicating identical core frequencies and destiny vibes.`);
  } else if (numerologyScore >= 80) {
    insights.push(`🔢 Life path vibrations ${lp1} and ${lp2} flow naturally together, making communication effortless.`);
  } else {
    insights.push(`🔑 Your life paths (${lp1} and ${lp2}) call for balancing different perspectives and life lessons.`);
  }

  if (baseLoveLanguage1 && baseLoveLanguage2) {
    if (baseLoveLanguage1 === baseLoveLanguage2) {
      insights.push(`💖 Double connection! You both speak the language of "${baseLoveLanguage1}".`);
    } else {
      insights.push(`💝 Blending "${baseLoveLanguage1}" and "${baseLoveLanguage2}" creates a multi-dimensional expression of affection.`);
    }
  }

  // Intimacy Preference insights
  if (castle1 === castle2) {
    insights.push(`🏰 Magical Sanctuary: Both of you desire to construct your private domain in the enchanted "${castle1}"!`);
  } else {
    const isP1Anshrit = p1.birthday === '2004-10-19';
    const anshritCastle = isP1Anshrit ? castle1 : castle2;
    const mahiCastle = isP1Anshrit ? castle2 : castle1;
    insights.push(`🏰 Sanctuary Harmony: Anshrit prefers the ${anshritCastle} while Mahi seeks refuge in the ${mahiCastle}. You hold domains in both!`);
  }

  if (style1 === style2) {
    insights.push(`❤️ Preference Sync: Both of you share a matching "${style1}" style, ensuring complete court harmony.`);
  } else {
    insights.push(`💖 Preference Balance: Your chemistry blends ${style1} and ${style2} dynamics beautifully.`);
  }

  if (intimacyLang1 === intimacyLang2) {
    insights.push(`✨ Intimacy Sync: You share the intimacy language of "${intimacyLang1}", making emotional connection deep and natural.`);
  }

  const sharedInterests = i1.filter((val) => i2.includes(val));
  if (sharedInterests.length > 0) {
    insights.push(`🎭 Bond over your shared passion for ${sharedInterests.slice(0, 3).join(', ')}.`);
  }

  return {
    overall,
    zodiac: { score: zodiacScore, sign1, sign2 },
    numerology: { score: numerologyScore, lifePath1: lp1, lifePath2: lp2 },
    loveLanguageScore,
    interestsScore,
    insights,
    royalDetails: {
      styleScore,
      style1,
      style2,
      castleScore,
      castle1,
      castle2,
      intimacyLanguageScore,
      intimacyLang1,
      intimacyLang2,
    },
  };
}
