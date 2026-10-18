import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectOculomotorEventsPyGaze,
  runLexploreOculomotorInference,
  encodeSoundex,
  encodeDoubleMetaphoneLite,
  encodeArabicPhoneticSkeleton,
  computeStandardLevenshtein,
  computeDyslexicoWeightedLevenshtein,
  analyzeTextWithDyslexico,
  computeIRT2PLProbability,
  computeIRTFisherInformation,
  estimateIRTAbilityEAP,
  selectNextAdaptiveIRTItem,
  CLINICAL_IRT_ITEM_BANK,
  evaluateOralReadingAlignment,
  normalizeArabicDialectWord,
  ARABIC_DIALECT_PROFILES,
  type RawGazeSample,
} from './dyslexiaEngines.ts';

test('Lexplore PyGaze I-DT detector extracts fixations and regressive saccades accurately', () => {
  // Simulate an RTL reading trace:
  // Fixation 1 at x=700 (word 0, 0..260ms)
  // Forward saccade to x=550 (word 1, 280..620ms)
  // Regressive saccade back to x=695 (word 0, 640..1080ms)
  const samples: RawGazeSample[] = [
    { x: 700, y: 200, timestampMs: 0, wordIndex: 0 },
    { x: 703, y: 202, timestampMs: 90, wordIndex: 0 },
    { x: 698, y: 199, timestampMs: 180, wordIndex: 0 },
    { x: 701, y: 201, timestampMs: 260, wordIndex: 0 },
    // Saccade jump left to word 1
    { x: 550, y: 202, timestampMs: 290, wordIndex: 1 },
    { x: 554, y: 200, timestampMs: 410, wordIndex: 1 },
    { x: 548, y: 203, timestampMs: 530, wordIndex: 1 },
    { x: 551, y: 201, timestampMs: 630, wordIndex: 1 },
    // Regressive jump right back to word 0
    { x: 695, y: 200, timestampMs: 660, wordIndex: 0 },
    { x: 699, y: 202, timestampMs: 820, wordIndex: 0 },
    { x: 696, y: 198, timestampMs: 960, wordIndex: 0 },
    { x: 697, y: 201, timestampMs: 1120, wordIndex: 0 },
  ];

  const { fixations, saccades } = detectOculomotorEventsPyGaze(samples, {
    minFixationDurationMs: 120,
    maxDispersionPx: 30,
    readingDirection: 'rtl',
  });

  assert.equal(fixations.length, 3);
  assert.equal(saccades.length, 2);
  assert.equal(saccades[0].direction, 'forward');
  assert.equal(saccades[1].direction, 'regressive');

  const mlResult = runLexploreOculomotorInference(samples, 5, {
    readingDirection: 'rtl',
  });
  assert.equal(mlResult.treeVotes.length, 5);
  assert.ok(mlResult.dyslexiaProbability >= 40);
  assert.equal(mlResult.features.regressiveSaccadeCount, 1);
});

test('Dyslexico Soundex, Double Metaphone, and Arabic Phonetic Skeleton match dyslexic spellings', () => {
  // "froot" and "fruit" share the exact same Soundex (F630) and Metaphone (FRT)
  assert.equal(encodeSoundex('froot'), encodeSoundex('fruit'));
  assert.equal(
    encodeDoubleMetaphoneLite('froot'),
    encodeDoubleMetaphoneLite('fruit')
  );

  // "fone" and "phone" share the exact same Metaphone (FN)
  assert.equal(
    encodeDoubleMetaphoneLite('fone'),
    encodeDoubleMetaphoneLite('phone')
  );

  // Arabic homophones (المنظار vs المنضار, المدرسة vs المدرسه) share the same phonetic skeleton
  assert.equal(
    encodeArabicPhoneticSkeleton('المنظار'),
    encodeArabicPhoneticSkeleton('المنضار')
  );
  assert.equal(
    encodeArabicPhoneticSkeleton('المدرسة'),
    encodeArabicPhoneticSkeleton('المدرسه')
  );
});

test('Dyslexico Weighted Levenshtein assigns near-zero cost to b/d reversals, transpositions, and phonetic pairs', () => {
  // Visual reversal: 'b' <-> 'd' in 'dird' vs 'bird'
  const bReversal = computeDyslexicoWeightedLevenshtein('dird', 'bird');
  assert.equal(bReversal.standardDistance, 1);
  assert.ok(bReversal.weightedDistance < 0.25);
  assert.ok(
    bReversal.detectedPatterns.some(
      (p) => p.type === 'visual_mirror_reversal'
    )
  );

  // Kinetic transposition: 'teh' vs 'the'
  const trans = computeDyslexicoWeightedLevenshtein('teh', 'the');
  assert.equal(trans.standardDistance, 2);
  assert.ok(trans.weightedDistance <= 0.25);

  // Phonetic vowel cluster: 'froot' vs 'fruit'
  const froot = computeDyslexicoWeightedLevenshtein('froot', 'fruit');
  assert.equal(froot.standardDistance, 2);
  assert.ok(froot.weightedDistance <= 0.25);

  // Full sentence analysis
  const analysis = analyzeTextWithDyslexico('teh froot المنضار');
  assert.equal(analysis[0].bestCorrection, 'the');
  assert.equal(analysis[1].bestCorrection, 'fruit');
  assert.equal(analysis[2].bestCorrection, 'المنظار');
});

test('Marker/Parallel Learning 2PL IRT engine updates theta, SE, and selects maximum Fisher Information item', () => {
  const pMid = computeIRT2PLProbability(0, 1.5, 0);
  assert.ok(Math.abs(pMid - 0.5) < 1e-6);

  const infoPeak = computeIRTFisherInformation(0, 2.0, 0);
  const infoOff = computeIRTFisherInformation(2.0, 2.0, 0);
  assert.ok(infoPeak > infoOff);

  // Correct responses increase theta; incorrect responses decrease theta
  const highEst = estimateIRTAbilityEAP([
    { discriminationA: 1.8, difficultyB: 0.0, correct: true },
    { discriminationA: 2.0, difficultyB: 0.8, correct: true },
  ]);
  const lowEst = estimateIRTAbilityEAP([
    { discriminationA: 1.8, difficultyB: 0.0, correct: false },
    { discriminationA: 1.5, difficultyB: -1.0, correct: false },
  ]);

  assert.ok(highEst.theta > 0.4);
  assert.ok(lowEst.theta < -0.4);
  assert.ok(highEst.standardError < 1.0);

  const nextSelection = selectNextAdaptiveIRTItem(
    CLINICAL_IRT_ITEM_BANK,
    ['irt-1'],
    0.6
  );
  assert.ok(nextSelection.nextItem !== null);
  assert.notEqual(nextSelection.nextItem?.id, 'irt-1');
});

test('Oral reading fluency alignment computes WCPM, phonetic substitutions, and understands Arabic dialects without false penalty', () => {
  const refWords = ['ذهب', 'الطالب', 'إلى', 'المدرسة', 'صباحاً'];
  const transcript = 'ذهب التالب إلى المدرسه';
  const res = evaluateOralReadingAlignment(refWords, transcript, 12, 1);

  assert.equal(res.totalWords, 5);
  assert.ok(res.wcpm > 0);
  assert.equal(res.omittedWordsCount, 1);
  assert.ok(res.phoneticSubstitutionCount >= 1);

  // Test Egyptian / Levantine / Gulf dialect variants: "دهب" is interdental dialectal variant for "ذهب"
  const normDhahab = normalizeArabicDialectWord('دهب');
  assert.equal(normDhahab.isDialectVariant, true);
  assert.equal(normDhahab.canonicalMsa, 'ذهب');

  const dialectRes = evaluateOralReadingAlignment(
    ['ذهب', 'الطالب', 'إلى', 'المدرسة'],
    'دهب الطالب إلى المدرسة',
    10,
    0
  );
  assert.equal(dialectRes.dialectVariantCount, 1);
  assert.equal(dialectRes.accuracyPercent, 100);
  assert.equal(ARABIC_DIALECT_PROFILES.length, 5);
});


