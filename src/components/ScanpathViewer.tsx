import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Eye, Flame, ArrowLeftRight } from 'lucide-react';
import { WordFixation, segmentArabicWordIntoSyllables } from '../utils/clinicalMetrics';

interface ScanpathViewerProps {
  words: string[];
  fixations: WordFixation[];
  passageTitle: string;
  passageCategory: string;
}

export const ScanpathViewer: React.FC<ScanpathViewerProps> = ({
  words,
  fixations,
  passageTitle,
  passageCategory,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(fixations.length);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showFixations, setShowFixations] = useState(true);
  const [showSaccades, setShowSaccades] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(8);

  useEffect(() => {
    setActiveStep(fixations.length);
    setIsPlaying(false);
    const maxFix = fixations.reduce(
      (best, cur) => (cur.durationMs > (best?.durationMs || 0) ? cur : best),
      fixations[0]
    );
    if (maxFix) {
      setSelectedWordIndex(maxFix.wordIndex);
    }
  }, [fixations]);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(140, Math.round(420 / playbackSpeed));
    const timer = window.setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= fixations.length) {
          setIsPlaying(false);
          return fixations.length;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, fixations.length]);

  const handleTogglePlay = () => {
    if (activeStep >= fixations.length) {
      setActiveStep(1);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveStep(fixations.length);
  };

  // Layout coordinates for RTL Arabic reading grid (7 words per line)
  const WORDS_PER_LINE = 7;
  const SVG_WIDTH = 860;
  const LINE_HEIGHT = 82;
  const totalLines = Math.ceil(words.length / WORDS_PER_LINE);
  const SVG_HEIGHT = Math.max(290, totalLines * LINE_HEIGHT + 48);

  const getWordCoords = (index: number) => {
    const lineIdx = Math.floor(index / WORDS_PER_LINE);
    const colInLine = index % WORDS_PER_LINE;
    // RTL: col 0 is on the right side
    const rightMargin = 72;
    const usableWidth = SVG_WIDTH - rightMargin * 2;
    const stepX = usableWidth / (WORDS_PER_LINE - 1);
    const x = SVG_WIDTH - rightMargin - colInLine * stepX;
    const y = 52 + lineIdx * LINE_HEIGHT;
    return { x, y, lineIdx };
  };

  const visibleFixations = fixations.slice(0, activeStep);
  const selectedFixation =
    selectedWordIndex !== null
      ? fixations.find((f) => f.wordIndex === selectedWordIndex) || null
      : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>خريطة المسار البصري (Lexplore Scanpath)</span>
            <span aria-hidden="true">·</span>
            <span>{passageCategory}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{passageTitle}</h3>
        </div>

        {/* Interactive View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setShowFixations(!showFixations)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                showFixations
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>التثبيتات البصرية</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSaccades(!showSaccades)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                showSaccades
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>القفزات والتراجعات</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                showHeatmap
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#D97706]" />
              <span>الخريطة الحرارية</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Scanpath Canvas */}
      <div className="relative bg-[#F8FAFC] border border-slate-200 rounded-lg overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`مخطط تتبع حركة العين لنص ${passageTitle}`}
          data-testid="scanpath-svg"
        >
          <defs>
            <marker
              id="arrow-forward"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" fillOpacity="0.65" />
            </marker>
            <marker
              id="arrow-regression"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
            </marker>
            <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#D97706" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-normal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle Baseline Guides */}
          {Array.from({ length: totalLines }).map((_, lineIdx) => {
            const y = 52 + lineIdx * LINE_HEIGHT;
            return (
              <g key={`line-${lineIdx}`}>
                <line
                  x1={40}
                  y1={y + 14}
                  x2={SVG_WIDTH - 40}
                  y2={y + 14}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={SVG_WIDTH - 20}
                  y={y + 4}
                  fontSize="11"
                  fill="#94A3B8"
                  textAnchor="middle"
                  className="font-mono tabular-nums"
                >
                  {lineIdx + 1}
                </text>
              </g>
            );
          })}

          {/* Thermal Heatmap Layer */}
          {showHeatmap &&
            visibleFixations.map((fix) => {
              const { x, y } = getWordCoords(fix.wordIndex);
              const isHigh = fix.durationMs >= 420 || fix.visits >= 2;
              const radius = Math.min(54, Math.max(24, fix.durationMs / 11));
              return (
                <circle
                  key={`heat-${fix.wordIndex}`}
                  cx={x}
                  cy={y - 4}
                  r={radius}
                  fill={isHigh ? 'url(#heat-high)' : 'url(#heat-normal)'}
                />
              );
            })}

          {/* Saccade Paths (Forward Progression & Backward Regressions) */}
          {showSaccades &&
            visibleFixations.map((fix, idx) => {
              if (idx === 0) return null;
              const prev = visibleFixations[idx - 1];
              const p1 = getWordCoords(prev.wordIndex);
              const p2 = getWordCoords(fix.wordIndex);

              // Forward saccade on the same line
              const sameLine = p1.lineIdx === p2.lineIdx;
              const midX = (p1.x + p2.x) / 2;
              const curveOffset = sameLine ? -18 : 0;

              return (
                <g key={`saccade-${idx}`}>
                  <path
                    d={
                      sameLine
                        ? `M ${p1.x} ${p1.y - 6} Q ${midX} ${p1.y + curveOffset} ${p2.x} ${p2.y - 6}`
                        : `M ${p1.x} ${p1.y + 4} L ${p2.x} ${p2.y - 10}`
                    }
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth={sameLine ? '1.5' : '1'}
                    strokeOpacity={sameLine ? '0.45' : '0.22'}
                    markerEnd="url(#arrow-forward)"
                  />

                  {/* Regression Arc (Backward Jump in RTL on the same line) */}
                  {typeof fix.regressedFromIndex === 'number' &&
                    (() => {
                      const fromCoord = getWordCoords(fix.regressedFromIndex);
                      if (fromCoord.lineIdx !== p2.lineIdx) return null;
                      const arcMidX = (fromCoord.x + p2.x) / 2;
                      const arcMidY = p2.y - 38;
                      return (
                        <path
                          d={`M ${fromCoord.x} ${fromCoord.y - 12} Q ${arcMidX} ${arcMidY} ${p2.x} ${p2.y - 12}`}
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                          markerEnd="url(#arrow-regression)"
                        />
                      );
                    })()}
                </g>
              );
            })}

          {/* Fixation Circles */}
          {showFixations &&
            visibleFixations.map((fix) => {
              const { x, y } = getWordCoords(fix.wordIndex);
              const isHigh = fix.durationMs >= 420 || fix.visits >= 2;
              const isModerate = !isHigh && fix.durationMs >= 320;
              const r = Math.min(24, Math.max(9, Math.round(fix.durationMs / 25)));
              const isSelected = selectedWordIndex === fix.wordIndex;

              const fillColor = isHigh
                ? '#DC2626'
                : isModerate
                  ? '#D97706'
                  : '#0284C7';

              return (
                <g
                  key={`fix-circle-${fix.wordIndex}`}
                  onClick={() => setSelectedWordIndex(fix.wordIndex)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={x}
                    cy={y - 6}
                    r={r}
                    fill={fillColor}
                    fillOpacity={isSelected ? '0.28' : '0.16'}
                    stroke={fillColor}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />
                  {fix.visits > 1 && (
                    <text
                      x={x}
                      y={y - r - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#DC2626"
                      className="font-mono tabular-nums"
                    >
                      {fix.visits}x
                    </text>
                  )}
                </g>
              );
            })}

          {/* Arabic Passage Words */}
          {words.map((word, idx) => {
            const { x, y } = getWordCoords(idx);
            const fix = fixations.find((f) => f.wordIndex === idx);
            const isProblematic =
              fix && (fix.durationMs >= 420 || fix.visits >= 2);
            const isSelected = selectedWordIndex === idx;

            return (
              <g
                key={`word-${idx}`}
                onClick={() => setSelectedWordIndex(idx)}
                className="cursor-pointer"
              >
                {isSelected && (
                  <rect
                    x={x - 42}
                    y={y - 24}
                    width={84}
                    height={34}
                    rx={6}
                    fill="#0F172A"
                    fillOpacity="0.06"
                    stroke="#0F172A"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontSize="18"
                  fontWeight={isProblematic ? '700' : '500'}
                  fill={isProblematic ? '#991B1B' : '#0F172A'}
                  style={{ fontFamily: 'Readex Pro, IBM Plex Sans Arabic, sans-serif' }}
                >
                  {word}
                </text>
                {fix && (
                  <text
                    x={x}
                    y={y + 26}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isProblematic ? '#DC2626' : '#64748B'}
                    className="font-mono tabular-nums"
                  >
                    {fix.durationMs}ms
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Playback Scrubber & Legend Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'إيقاف مؤقت لإعادة تشغيل حركة العين' : 'تشغيل مسار حركة العين'}
            className="px-3.5 py-2 text-xs font-medium text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>محاكاة مسار النظر</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label="إعادة ضبط المسار البصري"
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>عرض كامل المسار</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-mono tabular-nums">
            الكلمة {activeStep} / {fixations.length}
          </span>
        </div>

        {/* Explicit Icon + Text Legend (No Hue-Only Signaling) */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[#0284C7]">●</span>
            <span>تثبيت طبيعي (&lt;320ms)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[#D97706]">▲</span>
            <span>تثبيت مطوّل (320-419ms)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[#DC2626]">■</span>
            <span>تعثر بصري وتراجع (&ge;420ms)</span>
          </span>
        </div>
      </div>

      {/* Selected Word Ocular-Phonological Inspector */}
      {selectedFixation && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-center">
              <div className="text-xs text-slate-500 mb-0.5">الكلمة المحددة</div>
              <div className="text-xl font-bold text-slate-900 font-display">
                {selectedFixation.word}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">
                التحليل المقطعي الفونولوجي (انقر على أي كلمة في النص أعلاه لفحصها)
              </div>
              <div className="text-sm font-semibold text-[#0284C7] tracking-wide">
                {segmentArabicWordIntoSyllables(
                  selectedFixation.word.replace(/[،.؟!]/g, '')
                ).join(' · ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <div className="text-slate-500">زمن التثبيت البصري</div>
              <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                {selectedFixation.durationMs} ms
              </div>
            </div>
            <div>
              <div className="text-slate-500">عدد مرات التوقف</div>
              <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                {selectedFixation.visits} {selectedFixation.visits > 1 ? '(تراجع بصري)' : '(مسح مباشر)'}
              </div>
            </div>
            <div>
              <div className="text-slate-500">الحالة التشخيصية للكلمة</div>
              <div
                className={`text-sm font-semibold mt-0.5 ${
                  selectedFixation.durationMs >= 420 || selectedFixation.visits >= 2
                    ? 'text-[#DC2626]'
                    : 'text-[#059669]'
                }`}
              >
                {selectedFixation.durationMs >= 420 || selectedFixation.visits >= 2
                  ? '▲ إجهاد في فك الترميز'
                  : '● قراءة سلسة'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
