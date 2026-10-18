import React, { useState, useRef, useMemo } from 'react';
import {
  Volume2,
  Sparkles,
  Eye,
  Type as TypeIcon,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Wand2,
  Check,
  Code2,
} from 'lucide-react';
import {
  segmentArabicWordIntoSyllables,
  getConfusableLetterGroup,
} from '../utils/clinicalMetrics';
import {
  analyzeTextWithDyslexico,
  computeDyslexicoWeightedLevenshtein,
  encodeSoundex,
  encodeDoubleMetaphoneLite,
  encodeArabicPhoneticSkeleton,
  ARABIC_DIALECT_PROFILES,
  ArabicDialectCode,
} from '../utils/dyslexiaEngines';
import { ARABIC_READING_PASSAGES } from '../data/seedData';

interface WordBreakdownItem {
  word: string;
  syllables: string;
  root: string;
  meaning: string;
}

const DEFAULT_ADAPTIVE_TEXT = ARABIC_READING_PASSAGES[0].words.join(' ');

const DYSLEXICO_PRESETS: {
  id: string;
  label: string;
  dialect: ArabicDialectCode;
  sample: string;
}[] = [
  {
    id: 'ar-dyslexic',
    label: 'نموذج ديسلكسيا عربية (إبدال صوتي وبصري)',
    dialect: 'msa',
    sample: 'قرأ التالب كتاب في المدرسه وكتب بقلم ازرق عن المنضار والضوء',
  },
  {
    id: 'ar-gulf',
    label: 'نموذج طالب باللهجة الخليجية والسعودية',
    dialect: 'gulf',
    sample: 'توجه طارق صوب الجبل وشاف المنضار في المدرسه وكتب الملاحضات',
  },
  {
    id: 'ar-egyptian-levantine',
    label: 'نموذج طالب باللهجة المصرية والشامية',
    dialect: 'egyptian',
    sample: 'تارق قري كتاب في المدرسه وشاف المنضار والضوء',
  },
];

export const AdaptiveReaderView: React.FC = () => {
  const [text, setText] = useState<string>(DEFAULT_ADAPTIVE_TEXT);
  const [syllableMode, setSyllableMode] = useState<boolean>(true);
  const [letterColorMode, setLetterColorMode] = useState<boolean>(false);
  const [readingRuler, setReadingRuler] = useState<boolean>(true);
  const [openDyslexicMode, setOpenDyslexicMode] = useState<boolean>(true);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);

  // Typography & Anti-Crowding CSS Engineering controls
  const [fontSizePx, setFontSizePx] = useState<number>(26);
  const [wordSpacingPx, setWordSpacingPx] = useState<number>(10);
  const [letterSpacingPx, setLetterSpacingPx] = useState<number>(1.5);
  const [lineHeightRatio, setLineHeightRatio] = useState<number>(2.0);
  const [surfaceTheme, setSurfaceTheme] = useState<
    'white' | 'cream' | 'sky' | 'night'
  >('cream');

  // Dyslexico Smart Phonetic & Weighted Levenshtein Engine State
  const [selectedDialect, setSelectedDialect] =
    useState<ArabicDialectCode>('gulf');
  const [dyslexicoInput, setDyslexicoInput] = useState<string>(
    DYSLEXICO_PRESETS[0].sample
  );
  const [pairSource, setPairSource] = useState<string>('المنضار');
  const [pairTarget, setPairTarget] = useState<string>('المنظار');

  // AI Adaptation & TTS state
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [keyIdea, setKeyIdea] = useState<string>(
    'زيارة علمية مسائية لطلاب المدرسة إلى المرصد الفلكي لرصد حلقات كوكب زحل وتدوين الملاحظات.'
  );
  const [wordBreakdowns, setWordBreakdowns] = useState<WordBreakdownItem[]>([
    {
      word: 'لِمُشَاهَدَةِ',
      syllables: 'لِـ · مُـ · شَا · هَـ · دَةِ',
      root: 'ش - ه - د',
      meaning: 'النظر بتمعّن ورؤية الأجرام السماوية بوضوح.',
    },
    {
      word: 'المِنْظَارَ',
      syllables: 'ال · مِنْ · ظَا · رَ',
      root: 'ن - ظ - ر',
      meaning: 'جهاز بصري يقرّب الأجسام البعيدة في الفضاء (التلسكوب).',
    },
    {
      word: 'مُلَاحَظَاتِهِمْ',
      syllables: 'مُـ · لَا · حَـ · ظَا · تِـ · هِمْ',
      root: 'ل - ح - ظ',
      meaning: 'ما يكتبه الباحث من مشاهدات دقيقة أثناء التجربة.',
    },
  ]);

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<
    number | null
  >(null);
  const speechTimerRef = useRef<number | null>(null);

  // Live Dyslexico token analysis with Arabic Dialect Normalization
  const dyslexicoAnalysis = useMemo(
    () => analyzeTextWithDyslexico(dyslexicoInput, selectedDialect),
    [dyslexicoInput, selectedDialect]
  );

  const misspelledTokens = useMemo(
    () => dyslexicoAnalysis.filter((item) => !item.isCorrect),
    [dyslexicoAnalysis]
  );

  // Live Pairwise Weighted Levenshtein + Phonetic inspector
  const pairMetrics = useMemo(() => {
    const s = pairSource.trim() || 'froot';
    const t = pairTarget.trim() || 'fruit';
    const isAr = /[\u0600-\u06FF]/.test(s) || /[\u0600-\u06FF]/.test(t);
    const { weightedDistance, standardDistance, detectedPatterns } =
      computeDyslexicoWeightedLevenshtein(s, t);
    const codeS = isAr
      ? encodeArabicPhoneticSkeleton(s)
      : `${encodeDoubleMetaphoneLite(s)} (${encodeSoundex(s)})`;
    const codeT = isAr
      ? encodeArabicPhoneticSkeleton(t)
      : `${encodeDoubleMetaphoneLite(t)} (${encodeSoundex(t)})`;
    return {
      weightedDistance,
      standardDistance,
      detectedPatterns,
      codeS,
      codeT,
      isPhoneticMatch: codeS === codeT,
    };
  }, [pairSource, pairTarget]);

  const handleApplyCorrection = (originalWord: string, replacement: string) => {
    setDyslexicoInput((prev) =>
      prev
        .split(/\s+/)
        .map((w) => (w === originalWord ? replacement : w))
        .join(' ')
    );
  };

  const handleApplyAllCorrections = () => {
    const corrected = dyslexicoAnalysis
      .map((item) => (item.isCorrect ? item.originalWord : item.bestCorrection))
      .join(' ');
    setDyslexicoInput(corrected);
  };

  // Split text into lines of 7 words for the Reading Ruler
  const allWords = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const WORDS_PER_LINE = 7;
  const lines: { words: { word: string; globalIdx: number }[] }[] = [];
  for (let i = 0; i < allWords.length; i += WORDS_PER_LINE) {
    lines.push({
      words: allWords.slice(i, i + WORDS_PER_LINE).map((w, idx) => ({
        word: w,
        globalIdx: i + idx,
      })),
    });
  }

  const handleRunAIAdaptation = async () => {
    if (!text.trim()) return;
    setIsAdapting(true);
    try {
      const res = await fetch('/api/ai/adapt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.adaptation) {
          if (data.adaptation.simplifiedText) {
            setText(data.adaptation.simplifiedText);
          }
          if (data.adaptation.keyIdea) {
            setKeyIdea(data.adaptation.keyIdea);
          }
          if (Array.isArray(data.adaptation.wordBreakdowns)) {
            setWordBreakdowns(data.adaptation.wordBreakdowns);
          }
        }
      }
    } catch {
      // Keeps current breakdown
    } finally {
      setIsAdapting(false);
    }
  };

  const handleSpeakPassage = async () => {
    if (isSpeaking) {
      if (speechTimerRef.current) {
        window.clearInterval(speechTimerRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      return;
    }

    setIsSpeaking(true);
    setHighlightedWordIndex(0);

    let currentIdx = 0;
    speechTimerRef.current = window.setInterval(() => {
      currentIdx += 1;
      if (currentIdx >= allWords.length) {
        if (speechTimerRef.current) {
          window.clearInterval(speechTimerRef.current);
        }
        setIsSpeaking(false);
        setHighlightedWordIndex(null);
      } else {
        setHighlightedWordIndex(currentIdx);
        setActiveLineIdx(Math.floor(currentIdx / WORDS_PER_LINE));
      }
    }, 520);

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.play().catch(() => {});
          return;
        }
      }
    } catch {
      // Fallback to Web Speech API
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore if headless browser blocks speechSynthesis
      }
    }
  };

  const renderWordWithAssist = (word: string) => {
    const bottomHeavyClass = openDyslexicMode
      ? 'font-opendyslexic border-b-2 border-slate-900/15 pb-0.5'
      : '';

    if (syllableMode) {
      const syllables = segmentArabicWordIntoSyllables(word);
      const isNight = surfaceTheme === 'night';
      return (
        <span className={bottomHeavyClass}>
          {syllables.map((syl, sIdx) => (
            <React.Fragment key={sIdx}>
              <span
                className={
                  sIdx % 2 === 0
                    ? isNight
                      ? 'text-sky-300'
                      : 'text-[#0284C7]'
                    : isNight
                      ? 'text-amber-300'
                      : 'text-slate-900'
                }
              >
                {syl}
              </span>
              {sIdx < syllables.length - 1 && (
                <span className="text-slate-400 mx-0.5 font-normal">·</span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    if (letterColorMode) {
      const units: string[] = [];
      for (const ch of word) {
        if (/[\u064B-\u0652\u0670]/.test(ch) && units.length > 0) {
          units[units.length - 1] += ch;
        } else {
          units.push(ch);
        }
      }
      return (
        <span className={bottomHeavyClass}>
          {units.map((u, uIdx) => {
            const group = getConfusableLetterGroup(u);
            let colorClass = '';
            if (group === 'baa_group') colorClass = 'text-[#0284C7] font-bold';
            else if (group === 'jeem_group')
              colorClass = 'text-[#059669] font-bold';
            else if (group === 'dal_group')
              colorClass = 'text-[#D97706] font-bold';
            else if (group === 'seen_group')
              colorClass = 'text-[#DC2626] font-bold';
            else if (group === 'ain_group')
              colorClass = 'text-indigo-600 font-bold';
            return (
              <span key={uIdx} className={colorClass}>
                {u}
              </span>
            );
          })}
        </span>
      );
    }

    return <span className={bottomHeavyClass}>{word}</span>;
  };

  const surfaceStyles: Record<'white' | 'cream' | 'sky' | 'night', string> = {
    white: 'bg-white text-slate-900 border-slate-200',
    cream: 'bg-[#FEFCE8] text-slate-900 border-amber-200',
    sky: 'bg-[#F0F9FF] text-slate-900 border-sky-200',
    night: 'bg-[#0F172A] text-slate-100 border-slate-800',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            بنية مشروع Dyslexico · خوارزميات المطابقة الفونولوجية (Soundex / Double Metaphone) ومسافة ليفنشتاين الموزونة
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            استوديو Dyslexico اللغوي والقارئ العربي الذكي لذوي عسر القراءة
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSpeakPassage}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isSpeaking
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#0F172A] hover:bg-slate-800 text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>
              {isSpeaking
                ? 'إيقاف القراءة الصوتية'
                : 'قراءة صوتية متزامنة (Gemini TTS)'}
            </span>
          </button>

          <button
            type="button"
            disabled={isAdapting}
            onClick={handleRunAIAdaptation}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isAdapting
                ? 'جاري التحليل الصرفي...'
                : 'تبسيط النص وتحليل الجذور (Gemini AI)'}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: DYSLEXICO PHONETIC & WEIGHTED LEVENSHTEIN SPELLCHECKER ENGINE */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500">
              مشروع Dyslexico · المطابقة الفونولوجية العربية واللهجية + مسافة ليفنشتاين الموزونة
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              المعالج الإملائي الذكي المخصص لأنماط الديسلكسيا الفونولوجية والبصرية ولهجات الطلاب العرب (حقيقي 100%)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              يمنح أوزاناً إحصائية منخفضة جداً للإبدال البصري بين الحروف المتشابهة (ب↔ت↔ث، ج↔ح↔خ بتكلفة 0.14 بدلاً من 1.0) وللكتابة الصوتية واللهجية للطلاب العرب (مثل التالب→الطالب، المنضار→المنظار، شاف→شاهد، صوب→نحو).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="لهجة الطالب العربي في معالج Dyslexico"
              value={selectedDialect}
              onChange={(e) =>
                setSelectedDialect(e.target.value as ArabicDialectCode)
              }
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              {ARABIC_DIALECT_PROFILES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.labelAr}
                </option>
              ))}
            </select>
            {DYSLEXICO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedDialect(preset.dialect);
                  setDyslexicoInput(preset.sample);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
            {misspelledTokens.length > 0 && (
              <button
                type="button"
                onClick={handleApplyAllCorrections}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>تصحيح جميع الكلمات ({misspelledTokens.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: Live Dyslexic Text Input & Interactive Token Correction */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label
                htmlFor="dyslexico-live-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                اكتب نصاً بالعربية (أو بلهجة الطالب: خليجية، مصرية، شامية، مغاربية) يحتوي على أخطاء ديسلكسيا صوتية أو بصرية (مثل التالب، المدرسه، المنضار، الملاحضات):
              </label>
              <textarea
                id="dyslexico-live-input"
                rows={2}
                value={dyslexicoInput}
                onChange={(e) => setDyslexicoInput(e.target.value)}
                dir="auto"
                className={`w-full p-3.5 text-base bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] ${
                  openDyslexicMode ? 'font-opendyslexic' : ''
                }`}
              />
            </div>

            {/* Interactive Token Strip */}
            <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  انقر على أي كلمة تحتها خط أحمر لاستبدالها بالتصحيح الفونولوجي أو المعياري الأعلى ترجيحاً:
                </span>
                <span className="font-mono tabular-nums">
                  الأخطاء أو البدائل المكتشفة: {misspelledTokens.length} / {dyslexicoAnalysis.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1" dir="auto">
                {dyslexicoAnalysis.map((token, idx) =>
                  token.isCorrect ? (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg"
                    >
                      {token.originalWord}
                    </span>
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        handleApplyCorrection(
                          token.originalWord,
                          token.bestCorrection
                        )
                      }
                      className="px-2.5 py-1 text-sm bg-rose-50 hover:bg-emerald-50 border border-rose-300 hover:border-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 group cursor-pointer"
                      title={`انقر للتصحيح إلى: ${token.bestCorrection}`}
                    >
                      <span className="line-through text-rose-700 font-medium">
                        {token.originalWord}
                      </span>
                      <span className="text-slate-400">←</span>
                      <span className="font-bold text-[#059669] flex items-center gap-0.5">
                        {token.bestCorrection}
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right 5 cols: Pairwise Weighted Levenshtein & Phonetic Hash Calculator */}
          <div className="lg:col-span-5 bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#0284C7]" />
                  <span>مختبر حساب المسافة الموزونة والكود الصوتي العربي</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Weighted DP Matrix
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label
                    htmlFor="pair-source-input"
                    className="block text-[11px] text-slate-600 mb-1"
                  >
                    الكلمة المكتوبة (خطأ ديسلكسي):
                  </label>
                  <input
                    id="pair-source-input"
                    type="text"
                    value={pairSource}
                    onChange={(e) => setPairSource(e.target.value)}
                    dir="auto"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pair-target-input"
                    className="block text-[11px] text-slate-600 mb-1"
                  >
                    الكلمة المعجمية الصحيحة:
                  </label>
                  <input
                    id="pair-target-input"
                    type="text"
                    value={pairTarget}
                    onChange={(e) => setPairTarget(e.target.value)}
                    dir="auto"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Quick Pair Examples */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { s: 'المنضار', t: 'المنظار', label: 'المنضار ↔ المنظار (ض/ظ)' },
                  { s: 'التالب', t: 'الطالب', label: 'التالب ↔ الطالب (ت/ط)' },
                  { s: 'المدرسه', t: 'المدرسة', label: 'المدرسه ↔ المدرسة (ه/ة)' },
                  { s: 'الملاحضات', t: 'الملاحظات', label: 'الملاحضات ↔ الملاحظات' },
                ].map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPairSource(ex.s);
                      setPairTarget(ex.t);
                    }}
                    className="px-2 py-1 text-[11px] font-mono bg-white hover:bg-sky-50 border border-slate-200 rounded text-slate-700 cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500">
                    مسافة ليفنشتاين التقليدية
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                    {pairMetrics.standardDistance.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    تكلفة ثابتة (1.0 لكل حرف)
                  </div>
                </div>
                <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-lg">
                  <div className="text-[11px] text-[#0284C7] font-semibold">
                    مسافة Dyslexico الموزونة
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#0284C7] mt-0.5">
                    {pairMetrics.weightedDistance.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    وزن منخفض للإبدال البصري/الصوتي
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">الكود الصوتي للمدخل:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {pairMetrics.codeS}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">الكود الصوتي للهدف:</span>
                <span className="font-mono font-semibold text-[#059669]">
                  {pairMetrics.codeT}{' '}
                  {pairMetrics.isPhoneticMatch ? '· تطابق صوتي تام' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Diagnostic Table of Detected Dyslexic Spelling Errors */}
        {misspelledTokens.length > 0 && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-500 bg-slate-50">
                  <th className="py-2 px-3">الكلمة المدخلة</th>
                  <th className="py-2 px-3">الكود الفونولوجي (Metaphone / Soundex)</th>
                  <th className="py-2 px-3">التصحيح الأول</th>
                  <th className="py-2 px-3 text-left">مسافة تقليدية</th>
                  <th className="py-2 px-3 text-left">مسافة Dyslexico الموزونة</th>
                  <th className="py-2 px-3">تصنيف النمط الديسلكسي</th>
                  <th className="py-2 px-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {misspelledTokens.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                      {item.originalWord}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {item.phoneticCodeInput} · {item.soundexCodeInput}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#059669]">
                      {item.bestCorrection} ({item.phoneticCodeTarget})
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono tabular-nums text-slate-600">
                      {item.standardLevenshteinDistance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono tabular-nums font-bold text-[#0284C7]">
                      {item.weightedDyslexicDistance.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {item.detectedPatterns[0]?.labelAr ||
                        item.candidates[0]?.reasonAr ||
                        'تقارب صوتي وإملائي'}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyCorrection(
                            item.originalWord,
                            item.bestCorrection
                          )
                        }
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded transition-colors whitespace-nowrap"
                      >
                        تطبيق التصحيح
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Main Split Grid: Left/Top Interactive Reading Stage (8 cols) + Right Control Deck (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 8 Cols: Interactive Dyslexia Reading Canvas + Morphological Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className={`border rounded-xl p-8 transition-colors ${surfaceStyles[surfaceTheme]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-200/60 text-xs opacity-75">
              <span>
                انقر على أي سطر لتثبيت المسطرة البصرية عليه ·{' '}
                {openDyslexicMode
                  ? 'خط OpenDyslexic ثنائي الثقل السفلي مفعّل لمنع تدوير الحروف'
                  : 'الخط القياسي مفعّل'}
              </span>
              <span className="font-mono tabular-nums">
                السطر النشط: {activeLineIdx + 1} / {Math.max(1, lines.length)}
              </span>
            </div>

            <div className="space-y-5">
              {lines.map((line, lIdx) => {
                const isFocusedLine = !readingRuler || activeLineIdx === lIdx;
                return (
                  <div
                    key={lIdx}
                    onClick={() => setActiveLineIdx(lIdx)}
                    onMouseEnter={() => setActiveLineIdx(lIdx)}
                    style={{
                      fontSize: `${fontSizePx}px`,
                      wordSpacing: `${wordSpacingPx}px`,
                      letterSpacing: `${letterSpacingPx}px`,
                      lineHeight: lineHeightRatio,
                    }}
                    className={`p-3.5 rounded-xl transition-opacity cursor-pointer flex flex-wrap gap-x-3 gap-y-2 ${
                      openDyslexicMode ? 'font-opendyslexic' : 'font-display'
                    } ${
                      isFocusedLine
                        ? readingRuler
                          ? surfaceTheme === 'night'
                            ? 'bg-slate-800/90 ring-2 ring-sky-400 opacity-100'
                            : 'bg-white/90 ring-2 ring-[#0284C7] shadow-xs opacity-100'
                          : 'opacity-100'
                        : 'opacity-30'
                    }`}
                  >
                    {line.words.map(({ word, globalIdx }) => {
                      const isSpoken = highlightedWordIndex === globalIdx;
                      return (
                        <span
                          key={globalIdx}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            isSpoken
                              ? 'bg-[#0284C7] text-white font-bold'
                              : ''
                          }`}
                        >
                          {renderWordWithAssist(word)}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Morphological & Syllabic Breakdown Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  التحليل الصرفي والمقطعي للكلمات المركبة (AI Morphological Decoder)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الفكرة المحورية: {keyIdea}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wordBreakdowns.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="text-lg font-bold text-slate-900 font-display">
                    {item.word}
                  </div>
                  <div className="text-xs text-[#0284C7] font-semibold">
                    المقاطع: {item.syllables}
                  </div>
                  <div className="text-xs text-slate-600">
                    الجذر اللغوي: <strong>{item.root}</strong>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
                    {item.meaning}
                  </p>
                </div>
              ))}
            </div>

            {/* Custom Arabic Text Input Box */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label
                htmlFor="custom-arabic-text"
                className="block text-xs font-medium text-slate-700"
              >
                أدخل أي نص عربي أو إنجليزي مخصص لتطبيق خط OpenDyslexic والتقطيع المقطعي والمسطرة البصرية عليه:
              </label>
              <div className="flex gap-2">
                <textarea
                  id="custom-arabic-text"
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  onClick={() => setText(DEFAULT_ADAPTIVE_TEXT)}
                  aria-label="استعادة النص الافتراضي"
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>الافتراضي</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cols: Assistive Controls Deck */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 sticky top-6">
          <div className="pb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Sliders className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>هندسة الواجهة البصرية (CSS / UI Anti-Crowding)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              إعدادات خط OpenDyslexic والتباعد البصري
            </h3>
          </div>

          <div className="space-y-2.5">
            {/* OpenDyslexic Bottom-Heavy Toggle */}
            <button
              type="button"
              onClick={() => setOpenDyslexicMode(!openDyslexicMode)}
              className={`w-full p-3.5 rounded-xl border text-right transition-colors flex items-center justify-between ${
                openDyslexicMode
                  ? 'bg-sky-50/70 border-[#0284C7] text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">
                  خط OpenDyslexic ذو الثقل السفلي (Bottom-Heavy)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  زيادة ثقل قاعدة الحرف لمنع الدماغ من قلبه أو تدويره ذهنياً
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-[#0284C7]">
                {openDyslexicMode ? 'مفعّل' : 'مغلق'}
              </span>
            </button>

            {/* Toggle 1: Syllabic Coloring */}
            <button
              type="button"
              onClick={() => {
                setSyllableMode(!syllableMode);
                if (!syllableMode) setLetterColorMode(false);
              }}
              className={`w-full p-3.5 rounded-xl border text-right transition-colors flex items-center justify-between ${
                syllableMode
                  ? 'bg-sky-50/70 border-[#0284C7] text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">
                  التقطيع المقطعي الملون (Syllabic Chunking)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  تقسيم الكلمة إلى مقاطع صوتية متناوبة الألوان
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-[#0284C7]">
                {syllableMode ? 'مفعّل' : 'مغلق'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLetterColorMode(!letterColorMode);
                if (!letterColorMode) setSyllableMode(false);
              }}
              className={`w-full p-3.5 rounded-xl border text-right transition-colors flex items-center justify-between ${
                letterColorMode
                  ? 'bg-sky-50/70 border-[#0284C7] text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">
                  تمييز الحروف المتشابهة رسماً (ب/ت/ث · ج/ح/خ)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  تلوين المجموعات الحرفية المتجانسة لمنع الإبدال
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-[#0284C7]">
                {letterColorMode ? 'مفعّل' : 'مغلق'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReadingRuler(!readingRuler)}
              className={`w-full p-3.5 rounded-xl border text-right transition-colors flex items-center justify-between ${
                readingRuler
                  ? 'bg-sky-50/70 border-[#0284C7] text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">
                  المسطرة البصرية لعزل السطر (Reading Ruler)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  تعتيم الأسطر المجاورة لمنع القفز البصري العمودي
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-[#0284C7]">
                {readingRuler ? 'مفعّل' : 'مغلق'}
              </span>
            </button>
          </div>

          {/* Labeled Sliders for Visual Crowding Reduction */}
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="font-size-slider"
                  className="font-medium text-slate-700 flex items-center gap-1"
                >
                  <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>حجم الخط (Font Size)</span>
                </label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {fontSizePx} px
                </span>
              </div>
              <input
                id="font-size-slider"
                type="range"
                min={20}
                max={38}
                value={fontSizePx}
                onChange={(e) => setFontSizePx(Number(e.target.value))}
                className="w-full accent-[#0284C7] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="word-spacing-slider"
                  className="font-medium text-slate-700 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>تباعد الكلمات (Word Spacing)</span>
                </label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {wordSpacingPx} px
                </span>
              </div>
              <input
                id="word-spacing-slider"
                type="range"
                min={4}
                max={24}
                value={wordSpacingPx}
                onChange={(e) => setWordSpacingPx(Number(e.target.value))}
                className="w-full accent-[#0284C7] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="letter-spacing-slider"
                  className="font-medium text-slate-700"
                >
                  تباعد الحروف (Letter Spacing - منع التزاحم البصري)
                </label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {letterSpacingPx} px
                </span>
              </div>
              <input
                id="letter-spacing-slider"
                type="range"
                min={0}
                max={6}
                step={0.5}
                value={letterSpacingPx}
                onChange={(e) => setLetterSpacingPx(Number(e.target.value))}
                className="w-full accent-[#0284C7] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="line-height-slider"
                  className="font-medium text-slate-700"
                >
                  تباعد الأسطر (Line Height)
                </label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {lineHeightRatio.toFixed(1)}x
                </span>
              </div>
              <input
                id="line-height-slider"
                type="range"
                min={1.5}
                max={2.8}
                step={0.1}
                value={lineHeightRatio}
                onChange={(e) => setLineHeightRatio(Number(e.target.value))}
                className="w-full accent-[#0284C7] cursor-pointer"
              />
            </div>
          </div>

          {/* Irlen Visual Comfort Themes */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-700 mb-2">
              لون خلفية القراءة (لتقليل الإجهاد البصري - Irlen Filters):
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cream', label: 'كريمي دافئ (موصى به)' },
                { id: 'sky', label: 'سماوي هادئ' },
                { id: 'white', label: 'أبيض نقي' },
                { id: 'night', label: 'داكن مريح' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setSurfaceTheme(t.id as 'white' | 'cream' | 'sky' | 'night')
                  }
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    surfaceTheme === t.id
                      ? 'border-[#0284C7] bg-sky-50 text-[#0284C7] font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
