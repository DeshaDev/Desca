import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEyeTrackingMetrics,
  calculateDyscalculiaMetrics,
  segmentArabicWordIntoSyllables,
  getConfusableLetterGroup,
} from './clinicalMetrics.ts';

test('calculateEyeTrackingMetrics identifies high dyslexia risk on slow reading with frequent regressions', () => {
  const fixations = [
    { wordIndex: 0, word: 'يَقرَأُ', durationMs: 520, visits: 3, regressedFromIndex: 2 },
    { wordIndex: 1, word: 'الطَّالِبُ', durationMs: 490, visits: 2, regressedFromIndex: 3 },
    { wordIndex: 2, word: 'النَّصَّ', durationMs: 460, visits: 2 },
    { wordIndex: 3, word: 'بِتَركِيزٍ', durationMs: 580, visits: 3, regressedFromIndex: 4 },
    { wordIndex: 4, word: 'عَالٍ.', durationMs: 410, visits: 1 },
  ];

  // 5 words in 12 seconds = 25 WPM (well below Grade 3 benchmark of 85 WPM)
  const result = calculateEyeTrackingMetrics(fixations, 12, 3);

  assert.equal(result.wpm, 25);
  assert.ok(result.regressionCount >= 5);
  assert.equal(result.riskLevel, 'high');
  assert.ok(result.dyslexiaRiskScore >= 62);
  assert.ok(result.problematicWords.includes('يَقرَأُ'));
  assert.ok(result.problematicWords.includes('بِتَركِيزٍ'));
});

test('calculateEyeTrackingMetrics classifies fluent reader with low regressions as nominal', () => {
  const fixations = [
    { wordIndex: 0, word: 'تُشْرِقُ', durationMs: 210, visits: 1 },
    { wordIndex: 1, word: 'الشَّمْسُ', durationMs: 195, visits: 1 },
    { wordIndex: 2, word: 'صَبَاحاً', durationMs: 220, visits: 1 },
    { wordIndex: 3, word: 'فَتَمْلَأُ', durationMs: 230, visits: 1 },
    { wordIndex: 4, word: 'الأُفُقَ', durationMs: 205, visits: 1 },
    { wordIndex: 5, word: 'نُوراً.', durationMs: 190, visits: 1 },
  ];

  // 6 words in 3.8 seconds = ~95 WPM
  const result = calculateEyeTrackingMetrics(fixations, 3.8, 3);

  assert.ok(result.wpm >= 90);
  assert.equal(result.regressionCount, 0);
  assert.equal(result.riskLevel, 'nominal');
  assert.ok(result.percentile >= 70);
});

test('calculateDyscalculiaMetrics detects high dyscalculia risk when PAE and reversals are elevated', () => {
  const subitizing = [
    { dotCount: 4, correct: true, reactionTimeMs: 2100 },
    { dotCount: 5, correct: false, reactionTimeMs: 2600 },
    { dotCount: 6, correct: false, reactionTimeMs: 2900 },
  ];
  const numberLine = [
    { target: 37, userEstimate: 64, reactionTimeMs: 3200 },
    { target: 78, userEstimate: 48, reactionTimeMs: 2900 },
  ];
  const transcoding = [
    { targetNumber: 47, selectedNumber: 74, isReversalError: true, reactionTimeMs: 2800 },
    { targetNumber: 83, selectedNumber: 38, isReversalError: true, reactionTimeMs: 3100 },
  ];

  const metrics = calculateDyscalculiaMetrics(subitizing, numberLine, transcoding);

  assert.equal(metrics.reversalErrorCount, 2);
  assert.ok(metrics.numberLinePAE > 20);
  assert.equal(metrics.riskLevel, 'high');
  assert.ok(metrics.dyscalculiaRiskScore >= 60);
});

test('segmentArabicWordIntoSyllables segments definite article and long vowels cleanly', () => {
  const syllables = segmentArabicWordIntoSyllables('المكتبة');
  assert.ok(syllables.length >= 2);
  assert.equal(syllables[0], 'ال');
  assert.equal(syllables.join(''), 'المكتبة');
});

test('getConfusableLetterGroup identifies homographic Arabic letter families', () => {
  assert.equal(getConfusableLetterGroup('بَ'), 'baa_group');
  assert.equal(getConfusableLetterGroup('ث'), 'baa_group');
  assert.equal(getConfusableLetterGroup('خُ'), 'jeem_group');
  assert.equal(getConfusableLetterGroup('ض'), 'seen_group');
  assert.equal(getConfusableLetterGroup('م'), 'none');
});
