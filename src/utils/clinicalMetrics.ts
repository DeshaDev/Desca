export interface WordFixation {
  wordIndex: number;
  word: string;
  durationMs: number;
  visits: number;
  regressedFromIndex?: number;
  blinks?: number;
}

export interface EyeTrackingMetricsResult {
  wpm: number;
  avgFixationMs: number;
  regressionCount: number;
  regressionRate: number;
  saccadeCount: number;
  blinkCount: number;
  blinksPerMinute: number;
  visualStrainLevel: 'nominal' | 'moderate' | 'high';
  visualStrainLabelAr: string;
  dyslexiaRiskScore: number;
  percentile: number;
  riskLevel: 'nominal' | 'moderate' | 'high';
  riskLabelAr: string;
  problematicWords: string[];
}

export interface SubitizingTrialResult {
  dotCount: number;
  correct: boolean;
  reactionTimeMs: number;
}

export interface NumberLineTrialResult {
  target: number;
  userEstimate: number;
  reactionTimeMs: number;
}

export interface TranscodingTrialResult {
  targetNumber: number;
  selectedNumber: number;
  isReversalError: boolean;
  reactionTimeMs: number;
}

export interface DyscalculiaMetricsResult {
  subitizingAccuracy: number;
  avgSubitizingMs: number;
  numberLinePAE: number;
  transcodingAccuracy: number;
  reversalErrorCount: number;
  dyscalculiaRiskScore: number;
  percentile: number;
  riskLevel: 'nominal' | 'moderate' | 'high';
  riskLabelAr: string;
}

const GRADE_EXPECTED_WPM: Record<number, number> = {
  1: 45,
  2: 65,
  3: 85,
  4: 105,
  5: 120,
  6: 135,
};

export function calculateEyeTrackingMetrics(
  fixations: WordFixation[],
  totalDurationSeconds: number,
  gradeLevel: number = 3,
  sessionBlinkCount?: number
): EyeTrackingMetricsResult {
  if (!fixations || fixations.length === 0 || totalDurationSeconds <= 0) {
    const fallbackBlinks = sessionBlinkCount ?? 0;
    const fallbackBpm =
      totalDurationSeconds > 0 && fallbackBlinks > 0
        ? Math.round((fallbackBlinks / Math.max(4, totalDurationSeconds)) * 60)
        : 0;
    return {
      wpm: 0,
      avgFixationMs: 0,
      regressionCount: 0,
      regressionRate: 0,
      saccadeCount: 0,
      blinkCount: fallbackBlinks,
      blinksPerMinute: fallbackBpm,
      visualStrainLevel: fallbackBpm >= 23 ? 'high' : fallbackBpm >= 18 ? 'moderate' : 'nominal',
      visualStrainLabelAr:
        fallbackBpm >= 23
          ? 'إجهاد بصري مرتفع (رمش متكرر أثناء القراءة)'
          : fallbackBpm >= 18
            ? 'إجهاد بصري متوسط'
            : 'ضمن المعدل الطبيعي للرمش',
      dyslexiaRiskScore: 0,
      percentile: 50,
      riskLevel: 'nominal',
      riskLabelAr: 'بيانات غير كافية',
      problematicWords: [],
    };
  }

  const totalWords = fixations.length;
  const wpm = Math.max(1, Math.round((totalWords / totalDurationSeconds) * 60));

  let totalFixationMs = 0;
  let totalVisits = 0;
  let regressionCount = 0;
  let wordBlinksSum = 0;
  const problematicWords: string[] = [];

  for (const item of fixations) {
    const visits = Math.max(1, item.visits);
    totalFixationMs += Math.max(50, item.durationMs);
    totalVisits += visits;
    wordBlinksSum += item.blinks ?? 0;

    if (
      typeof item.regressedFromIndex === 'number' &&
      item.regressedFromIndex > item.wordIndex
    ) {
      regressionCount += 1;
    }
    if (visits > 1) {
      regressionCount += visits - 1;
    }

    if (item.durationMs >= 420 || visits >= 2 || (item.blinks ?? 0) >= 2) {
      const cleaned = item.word.replace(/[،.؟!:"«»]/g, '').trim();
      if (cleaned && !problematicWords.includes(cleaned)) {
        problematicWords.push(cleaned);
      }
    }
  }

  const blinkCount =
    typeof sessionBlinkCount === 'number'
      ? Math.max(sessionBlinkCount, wordBlinksSum)
      : wordBlinksSum;
  const blinksPerMinute =
    blinkCount > 0
      ? Math.round((blinkCount / Math.max(4, totalDurationSeconds)) * 60)
      : 0;

  let visualStrainLevel: 'nominal' | 'moderate' | 'high' = 'nominal';
  let visualStrainLabelAr = 'معدل رمش طبيعي ومريح بصرياً (٨ – ١٧ رمشة/دقيقة)';
  if (blinksPerMinute >= 23) {
    visualStrainLevel = 'high';
    visualStrainLabelAr = 'إجهاد بصري مرتفع (رمش متكرر يشير لتوتر بصري قرائي)';
  } else if (blinksPerMinute >= 18) {
    visualStrainLevel = 'moderate';
    visualStrainLabelAr = 'إجهاد بصري متوسط (زيادة الرمش عند الكلمات المركبة)';
  }

  const avgFixationMs = Math.round(
    totalFixationMs / Math.max(1, fixations.length)
  );
  const saccadeCount = Math.max(1, totalVisits - 1);
  const regressionRate = Math.min(
    100,
    Math.round((regressionCount / Math.max(1, totalVisits)) * 100)
  );

  const expectedWpm = GRADE_EXPECTED_WPM[gradeLevel] || 85;
  const speedDeficitRatio = Math.max(
    0,
    Math.min(1, (expectedWpm - wpm) / expectedWpm)
  );
  const fixationPenalty = Math.max(
    0,
    Math.min(1, (avgFixationMs - 240) / 360)
  );
  const regressionPenalty = Math.max(
    0,
    Math.min(1, (regressionRate - 12) / 35)
  );
  const blinkStrainPenalty =
    blinksPerMinute >= 18
      ? Math.min(1, (blinksPerMinute - 16) / 16) * 8
      : 0;

  const rawRisk =
    speedDeficitRatio * 36 +
    fixationPenalty * 30 +
    regressionPenalty * 28 +
    blinkStrainPenalty;
  const dyslexiaRiskScore = Math.max(5, Math.min(98, Math.round(rawRisk)));
  const percentile = Math.max(1, Math.min(99, 100 - dyslexiaRiskScore));

  let riskLevel: 'nominal' | 'moderate' | 'high' = 'nominal';
  let riskLabelAr = 'ضمن المتوسط الطبيعي';

  if (dyslexiaRiskScore >= 62) {
    riskLevel = 'high';
    riskLabelAr = 'احتمالية مرتفعة لعسر القراءة';
  } else if (dyslexiaRiskScore >= 35) {
    riskLevel = 'moderate';
    riskLabelAr = 'مؤشر متوسط - يتطلب متابعة';
  }

  return {
    wpm,
    avgFixationMs,
    regressionCount,
    regressionRate,
    saccadeCount,
    blinkCount,
    blinksPerMinute,
    visualStrainLevel,
    visualStrainLabelAr,
    dyslexiaRiskScore,
    percentile,
    riskLevel,
    riskLabelAr,
    problematicWords,
  };
}

export function calculateDyscalculiaMetrics(
  subitizing: SubitizingTrialResult[],
  numberLine: NumberLineTrialResult[],
  transcoding: TranscodingTrialResult[]
): DyscalculiaMetricsResult {
  const subitizingAccuracy =
    subitizing.length > 0
      ? Math.round(
          (subitizing.filter((t) => t.correct).length / subitizing.length) * 100
        )
      : 100;

  const avgSubitizingMs =
    subitizing.length > 0
      ? Math.round(
          subitizing.reduce((acc, t) => acc + t.reactionTimeMs, 0) /
            subitizing.length
        )
      : 900;

  const numberLinePAE =
    numberLine.length > 0
      ? Number(
          (
            numberLine.reduce(
              (acc, t) => acc + Math.abs(t.userEstimate - t.target),
              0
            ) / numberLine.length
          ).toFixed(1)
        )
      : 5.0;

  const transcodingAccuracy =
    transcoding.length > 0
      ? Math.round(
          (transcoding.filter((t) => t.targetNumber === t.selectedNumber).length /
            transcoding.length) *
            100
        )
      : 100;

  const reversalErrorCount = transcoding.filter((t) => t.isReversalError).length;

  // Clinical Risk Formula:
  // High PAE (>12%), slow/inaccurate subitizing, and Arabic place-value reversals
  const paeRisk = Math.min(1, Math.max(0, (numberLinePAE - 4) / 22));
  const subitizingRisk =
    (1 - subitizingAccuracy / 100) * 0.6 +
    Math.min(1, Math.max(0, (avgSubitizingMs - 1100) / 2200)) * 0.4;
  const transcodingRisk =
    (1 - transcodingAccuracy / 100) * 0.5 +
    Math.min(1, reversalErrorCount / Math.max(1, transcoding.length)) * 0.5;

  const dyscalculiaRiskScore = Math.max(
    5,
    Math.min(
      98,
      Math.round(paeRisk * 36 + subitizingRisk * 32 + transcodingRisk * 32)
    )
  );
  const percentile = Math.max(1, Math.min(99, 100 - dyscalculiaRiskScore));

  let riskLevel: 'nominal' | 'moderate' | 'high' = 'nominal';
  let riskLabelAr = 'إدراك كمي ومكاني طبيعي';

  if (dyscalculiaRiskScore >= 60) {
    riskLevel = 'high';
    riskLabelAr = 'احتمالية مرتفعة للديسكالكوليا';
  } else if (dyscalculiaRiskScore >= 34) {
    riskLevel = 'moderate';
    riskLabelAr = 'صعوبة متوسطة في الحس العددي';
  }

  return {
    subitizingAccuracy,
    avgSubitizingMs,
    numberLinePAE,
    transcodingAccuracy,
    reversalErrorCount,
    dyscalculiaRiskScore,
    percentile,
    riskLevel,
    riskLabelAr,
  };
}

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u0652\u0670]/;
const SUKUN = '\u0652';
const SHADDA = '\u0651';
const LONG_VOWELS = new Set(['ا', 'و', 'ي', 'ى']);

/**
 * Segments an Arabic word into visual phonological syllables (CV, CVV, CVC)
 * to assist dyslexic readers in decoding multi-syllabic words.
 */
export function segmentArabicWordIntoSyllables(word: string): string[] {
  const clean = word.trim();
  if (!clean) return [];

  // Group each base character with its immediately following diacritics
  const units: string[] = [];
  for (const ch of clean) {
    if (ARABIC_DIACRITICS_REGEX.test(ch) && units.length > 0) {
      units[units.length - 1] += ch;
    } else {
      units.push(ch);
    }
  }

  if (units.length <= 2) return [clean];

  const syllables: string[] = [];
  let i = 0;

  // Handle definite article "ال" as an initial morphological unit
  if (
    units.length >= 3 &&
    units[0].startsWith('ا') &&
    units[1].startsWith('ل')
  ) {
    syllables.push(units[0] + units[1]);
    i = 2;
  }

  while (i < units.length) {
    let current = units[i];
    const next = units[i + 1];

    if (next) {
      const nextBase = next[0];
      const nextHasSukun = next.includes(SUKUN);
      const nextHasShadda = next.includes(SHADDA);
      const nextIsLongVowel =
        LONG_VOWELS.has(nextBase) && next.length === 1;

      if (nextHasSukun || nextIsLongVowel || nextHasShadda) {
        current += next;
        i += 2;
        // If a shadda consonant is immediately followed by a long vowel (e.g. طُلَّابُ), keep the long vowel attached
        if (
          nextHasShadda &&
          i < units.length &&
          LONG_VOWELS.has(units[i][0]) &&
          units[i].length === 1
        ) {
          current += units[i];
          i += 1;
        }
        syllables.push(current);
        continue;
      }
    }

    // If it's the final single consonant, attach to previous syllable or pair with next
    if (i === units.length - 1 && syllables.length > 0) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
    i += 1;
  }

  return syllables;
}

export type ConfusableGroup =
  | 'baa_group' // ب ت ث ن
  | 'jeem_group' // ج ح خ
  | 'dal_group' // د ذ ر ز
  | 'seen_group' // س ش ص ض
  | 'ain_group' // ع غ ف ق
  | 'none';

const CONFUSABLE_MAP: Record<string, ConfusableGroup> = {
  ب: 'baa_group',
  ت: 'baa_group',
  ث: 'baa_group',
  ن: 'baa_group',
  ج: 'jeem_group',
  ح: 'jeem_group',
  خ: 'jeem_group',
  د: 'dal_group',
  ذ: 'dal_group',
  ر: 'dal_group',
  ز: 'dal_group',
  س: 'seen_group',
  ش: 'seen_group',
  ص: 'seen_group',
  ض: 'seen_group',
  ع: 'ain_group',
  غ: 'ain_group',
  ف: 'ain_group',
  ق: 'ain_group',
};

export function getConfusableLetterGroup(char: string): ConfusableGroup {
  const base = char.replace(ARABIC_DIACRITICS_REGEX, '')[0] || '';
  return CONFUSABLE_MAP[base] || 'none';
}
