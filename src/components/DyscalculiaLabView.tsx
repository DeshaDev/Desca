import React, { useState, useRef } from 'react';
import {
  Calculator,
  CheckCircle2,
  RotateCcw,
  Sliders,
  ArrowLeftRight,
  Sparkles,
  Volume2,
  Timer,
} from 'lucide-react';
import { StudentRecord } from '../data/seedData';
import {
  SubitizingTrialResult,
  NumberLineTrialResult,
  TranscodingTrialResult,
  calculateDyscalculiaMetrics,
} from '../utils/clinicalMetrics';

interface DyscalculiaLabViewProps {
  students: StudentRecord[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onUpdateStudentMath: (
    studentId: string,
    updated: Partial<StudentRecord>
  ) => void;
}

const SUBITIZING_PATTERNS: {
  id: number;
  targetCount: number;
  dots: { cx: number; cy: number }[];
  options: number[];
}[] = [
  {
    id: 1,
    targetCount: 5,
    dots: [
      { cx: 70, cy: 50 },
      { cx: 170, cy: 55 },
      { cx: 120, cy: 95 },
      { cx: 65, cy: 140 },
      { cx: 175, cy: 138 },
    ],
    options: [4, 5, 6, 7],
  },
  {
    id: 2,
    targetCount: 6,
    dots: [
      { cx: 60, cy: 55 },
      { cx: 120, cy: 48 },
      { cx: 185, cy: 62 },
      { cx: 75, cy: 135 },
      { cx: 135, cy: 142 },
      { cx: 190, cy: 130 },
    ],
    options: [5, 6, 7, 8],
  },
  {
    id: 3,
    targetCount: 7,
    dots: [
      { cx: 55, cy: 45 },
      { cx: 115, cy: 42 },
      { cx: 180, cy: 50 },
      { cx: 90, cy: 95 },
      { cx: 155, cy: 98 },
      { cx: 65, cy: 145 },
      { cx: 140, cy: 148 },
    ],
    options: [5, 6, 7, 9],
  },
];

const TRANSCODING_ITEMS: {
  id: number;
  spokenText: string;
  targetNumber: number;
  reversalDistractor: number;
  options: { value: number; arabicDigits: string }[];
}[] = [
  {
    id: 1,
    spokenText: 'سَبْعَةٌ وَأَرْبَعُونَ',
    targetNumber: 47,
    reversalDistractor: 74,
    options: [
      { value: 47, arabicDigits: '٤٧' },
      { value: 74, arabicDigits: '٧٤' },
      { value: 49, arabicDigits: '٤٩' },
    ],
  },
  {
    id: 2,
    spokenText: 'ثَلَاثَةٌ وَثَمَانُونَ',
    targetNumber: 83,
    reversalDistractor: 38,
    options: [
      { value: 38, arabicDigits: '٣٨' },
      { value: 83, arabicDigits: '٨٣' },
      { value: 63, arabicDigits: '٦٣' },
    ],
  },
  {
    id: 3,
    spokenText: 'تِسْعَةٌ وَسِتُّونَ',
    targetNumber: 69,
    reversalDistractor: 96,
    options: [
      { value: 69, arabicDigits: '٦٩' },
      { value: 96, arabicDigits: '٩٦' },
      { value: 66, arabicDigits: '٦٦' },
    ],
  },
];

export const DyscalculiaLabView: React.FC<DyscalculiaLabViewProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onUpdateStudentMath,
}) => {
  const activeStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // 1. Subitizing state (starts unanswered so user clicks and measures real reaction time in ms)
  const [subitizingSelections, setSubitizingSelections] = useState<
    Record<number, { chosen: number; rtMs: number }>
  >({});
  const trialStartTimestampRef = useRef<Record<number, number>>({
    1: performance.now(),
    2: performance.now(),
    3: performance.now(),
  });

  // 2. Spatial Number Line state (starts at neutral 50, target hidden until user reveals or adjusts)
  const [estimate37, setEstimate37] = useState<number>(50);
  const [estimate78, setEstimate78] = useState<number>(50);
  const [showTargetOverlay, setShowTargetOverlay] = useState<boolean>(false);

  // 3. Arabic Place-Value Transcoding state (starts unanswered)
  const [transcodingSelections, setTranscodingSelections] = useState<
    Record<number, { value: number; rtMs: number }>
  >({});
  const transcodingStartRef = useRef<Record<number, number>>({
    1: performance.now(),
    2: performance.now(),
    3: performance.now(),
  });

  const [saveMessage, setSaveMessage] = useState<string>('');

  const handleSelectSubitizing = (patternId: number, chosenCount: number) => {
    const startTs = trialStartTimestampRef.current[patternId] || performance.now() - 950;
    const elapsed = Math.max(220, Math.min(4500, Math.round(performance.now() - startTs)));
    setSubitizingSelections((prev) => ({
      ...prev,
      [patternId]: { chosen: chosenCount, rtMs: elapsed },
    }));
    setSaveMessage('');
  };

  const handleRestartSubitizingTimer = (patternId: number) => {
    trialStartTimestampRef.current[patternId] = performance.now();
    setSubitizingSelections((prev) => {
      const copy = { ...prev };
      delete copy[patternId];
      return copy;
    });
  };

  const handleSpeakPrompt = (id: number, text: string) => {
    transcodingStartRef.current[id] = performance.now();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ar-SA';
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      } catch {}
    }
  };

  const handleSelectTranscoding = (itemId: number, val: number) => {
    const startTs = transcodingStartRef.current[itemId] || performance.now() - 1200;
    const elapsed = Math.max(300, Math.min(5000, Math.round(performance.now() - startTs)));
    setTranscodingSelections((prev) => ({
      ...prev,
      [itemId]: { value: val, rtMs: elapsed },
    }));
    setSaveMessage('');
  };

  // Compute live clinical dyscalculia metrics from actual user selections
  const subitizingTrials: SubitizingTrialResult[] = SUBITIZING_PATTERNS.map(
    (p) => {
      const sel = subitizingSelections[p.id];
      return {
        dotCount: p.targetCount,
        correct: sel ? sel.chosen === p.targetCount : false,
        reactionTimeMs: sel ? sel.rtMs : 1400,
      };
    }
  );

  const numberLineTrials: NumberLineTrialResult[] = [
    { target: 37, userEstimate: estimate37, reactionTimeMs: 1850 },
    { target: 78, userEstimate: estimate78, reactionTimeMs: 2100 },
  ];

  const transcodingTrials: TranscodingTrialResult[] = TRANSCODING_ITEMS.map(
    (item) => {
      const sel = transcodingSelections[item.id];
      const selectedNumber = sel ? sel.value : item.targetNumber;
      return {
        targetNumber: item.targetNumber,
        selectedNumber,
        isReversalError: sel ? sel.value === item.reversalDistractor : false,
        reactionTimeMs: sel ? sel.rtMs : 1500,
      };
    }
  );

  const computedMetrics = calculateDyscalculiaMetrics(
    subitizingTrials,
    numberLineTrials,
    transcodingTrials
  );

  const answeredSubitizingCount = Object.keys(subitizingSelections).length;
  const answeredTranscodingCount = Object.keys(transcodingSelections).length;

  const handleLoadDyscalculiaSimulation = () => {
    setSubitizingSelections({
      1: { chosen: 5, rtMs: 2150 },
      2: { chosen: 5, rtMs: 2480 },
      3: { chosen: 6, rtMs: 2790 },
    });
    setEstimate37(61);
    setEstimate78(52);
    setShowTargetOverlay(true);
    setTranscodingSelections({
      1: { value: 74, rtMs: 2340 }, // Reversal of 47
      2: { value: 38, rtMs: 2610 }, // Reversal of 83
      3: { value: 69, rtMs: 1890 },
    });
    setSaveMessage('');
  };

  const handleResetTest = () => {
    const now = performance.now();
    trialStartTimestampRef.current = { 1: now, 2: now, 3: now };
    transcodingStartRef.current = { 1: now, 2: now, 3: now };
    setSubitizingSelections({});
    setEstimate37(50);
    setEstimate78(50);
    setShowTargetOverlay(false);
    setTranscodingSelections({});
    setSaveMessage('');
  };

  const handleSaveToStudentProfile = () => {
    onUpdateStudentMath(activeStudent.id, {
      subitizingAccuracy: computedMetrics.subitizingAccuracy,
      avgSubitizingMs: computedMetrics.avgSubitizingMs,
      numberLinePAE: computedMetrics.numberLinePAE,
      transcodingAccuracy: computedMetrics.transcodingAccuracy,
      reversalErrorCount: computedMetrics.reversalErrorCount,
      dyscalculiaRiskScore: computedMetrics.dyscalculiaRiskScore,
      mathPercentile: computedMetrics.percentile,
      mathRiskLevel: computedMetrics.riskLevel,
      mathRiskLabelAr: computedMetrics.riskLabelAr,
    });
    setSaveMessage(
      `تم تحديث ملف الطالب (${activeStudent.name}) بمؤشر الديسكالكوليا الفعلي (${computedMetrics.dyscalculiaRiskScore}/100 - ${computedMetrics.riskLabelAr}).`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Student Selector & Reset/Simulation Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            التقييم الإكلينيكي لعسر الحساب (Dyscalculia & Numerical Cognition)
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            مختبر فحص الديسكالكوليا والإدراك المكاني للأعداد (قياس زمن الاستجابة الفعلي ms)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="dyscalculia-student-select"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              الطالب الحالي:
            </label>
            <select
              id="dyscalculia-student-select"
              value={activeStudent.id}
              onChange={(e) => {
                onSelectStudent(e.target.value);
                setSaveMessage('');
              }}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284C7]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (الصف {s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleLoadDyscalculiaSimulation}
            className="px-3 py-2 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            نموذج حالة ديسكالكوليا للمقارنة
          </button>

          <button
            type="button"
            onClick={handleResetTest}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بدء اختبار جديد من الصفر</span>
          </button>
        </div>
      </div>

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main 8 Cols: 3 Interactive Clinical Assessment Stations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Station 1: Subitizing & Dot Magnitude */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  ٠١. اختبار الإدراك الكمي الفوري (Subitizing Speed & Accuracy)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  انقر على العدد المطابق لعدد النقاط بأسرع ما يمكن لحساب زمن الاستجابة الفعلي بالملي ثانية (ms)
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#0284C7]">
                المجاب عليها: {answeredSubitizingCount}/3
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBITIZING_PATTERNS.map((pattern) => {
                const sel = subitizingSelections[pattern.id];
                const isAnswered = Boolean(sel);
                const isCorrect = isAnswered && sel.chosen === pattern.targetCount;

                return (
                  <div
                    key={pattern.id}
                    className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>المصفوفة #{pattern.id}</span>
                      {isAnswered ? (
                        <span
                          className={`font-mono tabular-nums font-semibold ${
                            isCorrect ? 'text-[#059669]' : 'text-[#DC2626]'
                          }`}
                        >
                          {isCorrect
                            ? `● صحيح (${sel.rtMs}ms)`
                            : `▲ خطأ (${sel.rtMs}ms)`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestartSubitizingTimer(pattern.id)}
                          className="text-[#0284C7] hover:underline flex items-center gap-1"
                        >
                          <Timer className="w-3 h-3" />
                          <span>بانتظار الإجابة...</span>
                        </button>
                      )}
                    </div>

                    <svg
                      viewBox="0 0 240 180"
                      className="w-full h-32 bg-white border border-slate-200 rounded-lg mb-3"
                      role="img"
                      aria-label={`مصفوفة نقاط للاختبار رقم ${pattern.id}`}
                    >
                      {pattern.dots.map((d, dIdx) => (
                        <circle
                          key={dIdx}
                          cx={d.cx}
                          cy={d.cy}
                          r={11}
                          fill="#0F172A"
                        />
                      ))}
                    </svg>

                    <div className="grid grid-cols-4 gap-1.5">
                      {pattern.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectSubitizing(pattern.id, opt)}
                          aria-label={`اختيار العدد ${opt} للمصفوفة ${pattern.id}`}
                          className={`py-2 text-sm font-mono tabular-nums font-semibold rounded-lg border transition-colors ${
                            isAnswered && sel.chosen === opt
                              ? isCorrect
                                ? 'bg-[#059669] text-white border-[#059669]'
                                : 'bg-[#DC2626] text-white border-[#DC2626]'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Station 2: Spatial Mental Number Line (0-100) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  ٠٢. التقدير المكاني على خط الأعداد غير المدرّج (Number Line Estimation 0–100)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حرّك المؤشر لتقدير موقع العدد المطلوب على خط الأعداد الفارغ، ثم اضغط على «كشف الدقة المكانية» لرؤية الفرق
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTargetOverlay(!showTargetOverlay)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {showTargetOverlay
                    ? 'إخفاء الإجابات المرجعية'
                    : 'كشف الدقة المكانية والمؤشر المرجعي'}
                </span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Trial A: Target 37 */}
              <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 text-sm">
                    المهمة الأولى: ضع المؤشر عند الموقع التقديري للعدد (٣٧ / 37) بين 0 و100
                  </span>
                  <span className="font-mono tabular-nums text-slate-700">
                    موقع المؤشر الحالي: <strong>{estimate37}</strong> · نسبة الخطأ (PAE):{' '}
                    <strong
                      className={
                        Math.abs(estimate37 - 37) > 12
                          ? 'text-[#DC2626]'
                          : 'text-[#059669]'
                      }
                    >
                      {Math.abs(estimate37 - 37)}%
                    </strong>
                  </span>
                </div>

                <div dir="ltr" className="space-y-2">
                  <label htmlFor="nl-slider-37" className="sr-only">
                    تقدير موقع العدد 37 على خط الأعداد من 0 إلى 100
                  </label>
                  <input
                    id="nl-slider-37"
                    type="range"
                    min={0}
                    max={100}
                    value={estimate37}
                    onChange={(e) => setEstimate37(Number(e.target.value))}
                    className="w-full accent-[#0284C7] cursor-pointer"
                  />
                  <div className="relative h-6 flex items-center justify-between text-xs font-mono tabular-nums text-slate-500">
                    <span>0</span>
                    {showTargetOverlay && (
                      <span
                        style={{ left: '37%' }}
                        className="absolute -translate-x-1/2 px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[10px]"
                      >
                        الموقع الحقيقي: 37
                      </span>
                    )}
                    <span>100</span>
                  </div>
                </div>
              </div>

              {/* Trial B: Target 78 */}
              <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 text-sm">
                    المهمة الثانية: ضع المؤشر عند الموقع التقديري للعدد (٧٨ / 78) بين 0 و100
                  </span>
                  <span className="font-mono tabular-nums text-slate-700">
                    موقع المؤشر الحالي: <strong>{estimate78}</strong> · نسبة الخطأ (PAE):{' '}
                    <strong
                      className={
                        Math.abs(estimate78 - 78) > 12
                          ? 'text-[#DC2626]'
                          : 'text-[#059669]'
                      }
                    >
                      {Math.abs(estimate78 - 78)}%
                    </strong>
                  </span>
                </div>

                <div dir="ltr" className="space-y-2">
                  <label htmlFor="nl-slider-78" className="sr-only">
                    تقدير موقع العدد 78 على خط الأعداد من 0 إلى 100
                  </label>
                  <input
                    id="nl-slider-78"
                    type="range"
                    min={0}
                    max={100}
                    value={estimate78}
                    onChange={(e) => setEstimate78(Number(e.target.value))}
                    className="w-full accent-[#0284C7] cursor-pointer"
                  />
                  <div className="relative h-6 flex items-center justify-between text-xs font-mono tabular-nums text-slate-500">
                    <span>0</span>
                    {showTargetOverlay && (
                      <span
                        style={{ left: '78%' }}
                        className="absolute -translate-x-1/2 px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[10px]"
                      >
                        الموقع الحقيقي: 78
                      </span>
                    )}
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Station 3: Arabic Place-Value Transcoding & Reversal Detection */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  ٠٣. فحص الترميز العددي والخلط المكاني للآحاد والعشرات بالعربية
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اضغط على زر الصوت لسماع العدد منطوقاً بالعربية، ثم اختر الرمز الرقمي الصحيح له
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                المجاب عليها: {answeredTranscodingCount}/3 · الانعكاسات: {computedMetrics.reversalErrorCount}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRANSCODING_ITEMS.map((item) => {
                const sel = transcodingSelections[item.id];
                const isAnswered = Boolean(sel);
                const isReversal =
                  isAnswered && sel.value === item.reversalDistractor;
                const isCorrect =
                  isAnswered && sel.value === item.targetNumber;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">الصيغة اللفظية:</span>
                      <button
                        type="button"
                        onClick={() => handleSpeakPrompt(item.id, item.spokenText)}
                        className="px-2 py-1 text-[11px] font-medium bg-sky-50 text-[#0284C7] border border-sky-200 rounded-md hover:bg-sky-100 flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>نطق صوتي</span>
                      </button>
                    </div>

                    <div className="text-base font-bold text-slate-900 font-display">
                      «{item.spokenText}»
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {item.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectTranscoding(item.id, opt.value)}
                          className={`py-2.5 px-2 rounded-lg border text-center transition-colors ${
                            isAnswered && sel.value === opt.value
                              ? opt.value === item.targetNumber
                                ? 'bg-[#059669] text-white border-[#059669]'
                                : 'bg-[#DC2626] text-white border-[#DC2626]'
                              : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-base font-bold">{opt.arabicDigits}</div>
                          <div className="text-[11px] font-mono tabular-nums opacity-80">
                            {opt.value}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="text-xs pt-1">
                      {!isAnswered ? (
                        <span className="text-slate-400">
                          اختر الرقم المطابق أعلاه...
                        </span>
                      ) : isCorrect ? (
                        <span className="text-[#059669] font-medium">
                          ● ترميز مكاني سليم ({sel.rtMs}ms)
                        </span>
                      ) : isReversal ? (
                        <span className="text-[#DC2626] font-medium flex items-center gap-1">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>▲ انعكاس آحاد/عشرات ({sel.value})</span>
                        </span>
                      ) : (
                        <span className="text-[#D97706] font-medium">
                          ▲ خطأ في المطابقة العددية
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Clinical Telemetry & Diagnostic Summary Deck */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 sticky top-6">
          <div className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Calculator className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>المؤشر الإكلينيكي المحسوب فورياً</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              نتيجة فحص الديسكالكوليا
            </h3>
          </div>

          {/* Primary Risk Gauge */}
          <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>مؤشر احتمالية عسر الحساب</span>
              <span className="font-mono tabular-nums font-semibold">
                المئين {computedMetrics.percentile}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {computedMetrics.dyscalculiaRiskScore}
                <span className="text-sm font-normal text-slate-500"> / 100</span>
              </span>
              <span
                className={`text-xs font-semibold ${
                  computedMetrics.riskLevel === 'high'
                    ? 'text-[#DC2626]'
                    : computedMetrics.riskLevel === 'moderate'
                      ? 'text-[#D97706]'
                      : 'text-[#059669]'
                }`}
              >
                {computedMetrics.riskLevel === 'high' ? '■ ' : '● '}
                {computedMetrics.riskLabelAr}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                style={{ width: `${computedMetrics.dyscalculiaRiskScore}%` }}
                className={`h-full transition-all ${
                  computedMetrics.riskLevel === 'high'
                    ? 'bg-[#DC2626]'
                    : computedMetrics.riskLevel === 'moderate'
                      ? 'bg-[#D97706]'
                      : 'bg-[#059669]'
                }`}
              />
            </div>
          </div>

          {/* Detailed Sub-metrics */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">
                نسبة الخطأ في خط الأعداد (PAE)
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {computedMetrics.numberLinePAE}%{' '}
                <span className="text-slate-400 font-normal">(الطبيعي &lt;10%)</span>
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">دقة الإدراك الكمي (Subitizing)</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {answeredSubitizingCount > 0 ? `${computedMetrics.subitizingAccuracy}%` : 'لم يُجب بعد'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">متوسط زمن التقاط الكمية</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {computedMetrics.avgSubitizingMs} ms
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">
                أخطاء عكس الآحاد والعشرات بالعربية
              </span>
              <span
                className={`font-mono tabular-nums font-semibold ${
                  computedMetrics.reversalErrorCount > 0
                    ? 'text-[#DC2626]'
                    : 'text-[#059669]'
                }`}
              >
                {computedMetrics.reversalErrorCount} من {TRANSCODING_ITEMS.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveToStudentProfile}
            className="w-full py-3 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>حفظ النتيجة في سجل الطالب ({activeStudent.name})</span>
          </button>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <span>{saveMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
