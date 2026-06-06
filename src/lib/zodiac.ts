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
}

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

export function getZodiacSign(dateString: string): ZodiacSign {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
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
  p1: { birthday: string; loveLanguage?: string; interests?: string[] },
  p2: { birthday: string; loveLanguage?: string; interests?: string[] }
): CompatibilityResult {
  const sign1 = getZodiacSign(p1.birthday);
  const sign2 = getZodiacSign(p2.birthday);

  // 1. Zodiac Compatibility Score
  const zodiacScore =
    ZODIAC_COMPATIBILITY[sign1]?.[sign2] ||
    ZODIAC_COMPATIBILITY[sign2]?.[sign1] ||
    70; // default to 70 if no match found

  // 2. Numerology Compatibility Score
  const lp1 = calculateLifePathNumber(p1.birthday);
  const lp2 = calculateLifePathNumber(p2.birthday);
  // Max difference is 8 (between 1 and 9). Master numbers (11, 22, 33) are treated specially or reduced for simplicity.
  const absDiff = Math.abs((lp1 % 9 || 9) - (lp2 % 9 || 9));
  const numerologyScore = Math.max(100 - absDiff * 10, 50);

  // 3. Love Languages Compatibility
  let loveLanguageScore = 75; // baseline
  if (p1.loveLanguage && p2.loveLanguage) {
    if (p1.loveLanguage === p2.loveLanguage) {
      loveLanguageScore = 100;
    } else {
      // Complementary matches
      const pairings = [p1.loveLanguage, p2.loveLanguage];
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

  // Overall Score Calculation
  const overall = Math.round(
    zodiacScore * 0.35 +
    numerologyScore * 0.35 +
    loveLanguageScore * 0.15 +
    interestsScore * 0.15
  );

  // Generate Insights
  const insights: string[] = [];
  insights.push(`🌌 Your combined cosmic energy shines at a beautiful ${overall}% compatibility!`);

  if (zodiacScore >= 90) {
    insights.push(`✨ ${sign1} and ${sign2} represent a highly harmonious zodiac alignment.`);
  } else if (zodiacScore < 60) {
    insights.push(`⚡ ${sign1} and ${sign2} present dynamic contrasts that can spark creative tension and growth.`);
  } else {
    insights.push(`💫 Your zodiac elements (${sign1} & ${sign2}) create a pleasant, supportive orbit.`);
  }

  if (lp1 === lp2) {
    insights.push(`🔢 You share the same Life Path number (${lp1}), indicating identical core frequencies and destiny vibes.`);
  } else if (numerologyScore >= 80) {
    insights.push(`🔢 Life path vibrations ${lp1} and ${lp2} flow naturally together, making communication effortless.`);
  } else {
    insights.push(`🔑 Your life paths (${lp1} and ${lp2}) call for balancing different perspectives and life lessons.`);
  }

  if (p1.loveLanguage && p2.loveLanguage) {
    if (p1.loveLanguage === p2.loveLanguage) {
      insights.push(`💖 Double connection! You both speak the language of "${p1.loveLanguage}".`);
    } else {
      insights.push(`💝 Blending "${p1.loveLanguage}" and "${p2.loveLanguage}" creates a multi-dimensional expression of affection.`);
    }
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
  };
}
