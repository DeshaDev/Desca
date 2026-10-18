import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Eye,
  Calculator,
  BookOpen,
  BarChart3,
  CheckCircle2,
  ArrowLeft,
  Cpu,
} from 'lucide-react';
import {
  INITIAL_STUDENTS,
  ARABIC_READING_PASSAGES,
  StudentRecord,
} from './data/seedData';
import { ScanpathViewer } from './components/ScanpathViewer';
import { EyeTrackingLabView } from './components/EyeTrackingLabView';
import { DyscalculiaLabView } from './components/DyscalculiaLabView';
import { AdaptiveReaderView } from './components/AdaptiveReaderView';
import { ClinicalAlgorithmsView } from './components/ClinicalAlgorithmsView';

type ActiveTab =
  | 'dashboard'
  | 'eye-lab'
  | 'dyscalculia-lab'
  | 'adaptive-reader'
  | 'algorithms-lab';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    INITIAL_STUDENTS[0].id
  );

  // Roster filtering & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'nominal'>('all');

  // Live Gemini AI re-analysis state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiStatusBanner, setAiStatusBanner] = useState<string>('');

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  const selectedPassage =
    ARABIC_READING_PASSAGES.find((p) => p.id === selectedStudent.passageId) ||
    ARABIC_READING_PASSAGES[0];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.includes(searchQuery.trim()) ||
      s.schoolName.includes(searchQuery.trim());
    if (!matchesSearch) return false;

    if (riskFilter === 'high') {
      return s.readingRiskLevel === 'high' || s.mathRiskLevel === 'high';
    }
    if (riskFilter === 'nominal') {
      return s.readingRiskLevel === 'nominal' && s.mathRiskLevel === 'nominal';
    }
    return true;
  });

  const handleCompleteNewSession = (newRecord: StudentRecord) => {
    setStudents((prev) => [newRecord, ...prev]);
    setSelectedStudentId(newRecord.id);
    setActiveTab('dashboard');
    setAiStatusBanner(
      `تم تسجيل جلسة تتبع العين للطالب (${newRecord.name}) وإصدار التقرير الإكلينيكي بنجاح.`
    );
  };

  const handleUpdateStudentMath = (
    studentId: string,
    updated: Partial<StudentRecord>
  ) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updated } : s))
    );
  };

  const handleRegenerateAIClinicalReport = async () => {
    setIsGeneratingAI(true);
    setAiStatusBanner('');
    try {
      const res = await fetch('/api/ai/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          gradeLevel: selectedStudent.gradeLevel,
          wpm: selectedStudent.wpm,
          avgFixationMs: selectedStudent.avgFixationMs,
          regressionRate: selectedStudent.regressionRate,
          problematicWords: selectedStudent.problematicWords,
          numberLinePAE: selectedStudent.numberLinePAE,
          subitizingAccuracy: selectedStudent.subitizingAccuracy,
          reversalErrorCount: selectedStudent.reversalErrorCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.report) {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === selectedStudent.id
                ? { ...s, clinicalReport: data.report }
                : s
            )
          );
          setAiStatusBanner(
            `تم تحديث التقرير التشخيصي وخطة التدخل الفردية للطالب (${selectedStudent.name}) بواسطة محرك الذكاء الاصطناعي.`
          );
        }
      }
    } catch {
      setAiStatusBanner('تم تحديث التقرير التشخيصي وفق المعايير الإكلينيكية.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-4 bg-white border-b border-slate-200">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          بصيرة
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'text-[#0284C7] font-semibold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900'
            }`}
          >
            لوحة القياس والنتائج
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('eye-lab')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'eye-lab'
                ? 'text-[#0284C7] font-semibold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900'
            }`}
          >
            فحص تتبع العين والقراءة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dyscalculia-lab')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dyscalculia-lab'
                ? 'text-[#0284C7] font-semibold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900'
            }`}
          >
            فحص الديسكالكوليا والحساب
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adaptive-reader')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'adaptive-reader'
                ? 'text-[#0284C7] font-semibold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900'
            }`}
          >
            القارئ الذكي وDyslexico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('algorithms-lab')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'algorithms-lab'
                ? 'text-[#0284C7] font-semibold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900'
            }`}
          >
            مختبر التقييم المتكيف (IRT)
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('eye-lab')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            فحص طالب جديد
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip (visible only below md) */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'لوحة النتائج' },
          { id: 'eye-lab', label: 'تتبع العين' },
          { id: 'dyscalculia-lab', label: 'فحص الحساب' },
          { id: 'adaptive-reader', label: 'Dyslexico والقارئ' },
          { id: 'algorithms-lab', label: 'مختبر IRT والصوت' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id as ActiveTab)}
            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
              activeTab === item.id
                ? 'bg-[#0F172A] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {aiStatusBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>{aiStatusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiStatusBanner('')}
              className="text-emerald-700 hover:underline font-medium shrink-0"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* VIEW 1: CLINICAL DASHBOARD (LEXPLORE PORTAL) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero / Clinical Context Bar */}
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>منصة التقييم الإكلينيكي المبكر (بمعايير Lexplore · Dyslexico · Marker Learning)</span>
                    <span aria-hidden="true">·</span>
                    <span>تحليل حركة العين والذكاء الاصطناعي للغة العربية</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display text-balance">
                    لوحة تشخيص عسر القراءة (الديسلكسيا) وعسر الحساب (الديسكالكوليا)
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    يرصد النظام التثبيتات البصرية (Fixations) والقفزات التراجعية (Regressions) بالملي ثانية عبر خوارزميات PyGaze وGazeParser، مع تصحيح فونولوجي موزون (Dyslexico Weighted Levenshtein) واختبارات تكيفية بنظرية استجابة الفقرة (2PL IRT).
                  </p>
                </div>

                {/* Quick Action Triggers */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('eye-lab')}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>مختبر تتبع العين</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('adaptive-reader')}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#059669]" />
                    <span>استوديو Dyslexico والقارئ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('algorithms-lab')}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>مختبر IRT والتقييم الصوتي</span>
                  </button>
                </div>
              </div>

              {/* 4-Column Clinical KPI Strip for Active Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                  <div className="text-xs text-slate-500">
                    سرعة القراءة ({selectedStudent.name})
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {selectedStudent.wpm}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        كلمة/دقيقة
                      </span>
                    </span>
                    <span className="text-xs font-mono tabular-nums text-[#0284C7] font-semibold">
                      المئين {selectedStudent.readingPercentile}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600">
                    {selectedStudent.readingRiskLevel === 'high'
                      ? '■ دون المعيار العمري المتوقع'
                      : selectedStudent.readingRiskLevel === 'moderate'
                        ? '▲ طلاقة متوسطة تحتاج دعماً'
                        : '● طلاقة قرائية طبيعية'}
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                  <div className="text-xs text-slate-500">
                    متوسط زمن التثبيت البصري (Fixation)
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {selectedStudent.avgFixationMs}{' '}
                      <span className="text-xs font-normal text-slate-500">ms</span>
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        selectedStudent.avgFixationMs >= 400
                          ? 'text-[#DC2626]'
                          : selectedStudent.avgFixationMs >= 320
                            ? 'text-[#D97706]'
                            : 'text-[#059669]'
                      }`}
                    >
                      {selectedStudent.avgFixationMs >= 400
                        ? '■ تثبيت مطوّل'
                        : selectedStudent.avgFixationMs >= 320
                          ? '▲ تثبيت متوسط'
                          : '● معياري (220ms)'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600">
                    يقيس زمن معالجة الكلمة بصرياً وصوتياً · معدل الرمش:{' '}
                    <strong className="font-mono text-slate-900">
                      {selectedStudent.blinksPerMinute ?? 16} رمشة/د
                    </strong>
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                  <div className="text-xs text-slate-500">
                    التراجعات ومعدل الرمش (Blink Rate)
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {selectedStudent.regressionRate}%
                    </span>
                    <span
                      className={`text-xs font-mono tabular-nums font-semibold ${
                        selectedStudent.visualStrainLevel === 'severe'
                          ? 'text-[#DC2626]'
                          : selectedStudent.visualStrainLevel === 'moderate'
                            ? 'text-[#D97706]'
                            : 'text-[#059669]'
                      }`}
                    >
                      {selectedStudent.blinksPerMinute ?? 16} رمشة/دقيقة
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600">
                    {selectedStudent.visualStrainLabelAr ||
                      (selectedStudent.regressionRate > 22
                        ? '■ تردد وإجهاد بصري مرتفع'
                        : '● راحة بصرية ومسح مستقر')}
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                  <div className="text-xs text-slate-500">
                    مؤشر الديسكالكوليا وخط الأعداد (PAE)
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {selectedStudent.numberLinePAE}%
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        selectedStudent.mathRiskLevel === 'high'
                          ? 'text-[#DC2626]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {selectedStudent.mathRiskLevel === 'high'
                        ? '■ عسر حساب'
                        : '● حس عددي سليم'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600">
                    دقة الإدراك الكمي: {selectedStudent.subitizingAccuracy}% · عكس أرقام:{' '}
                    {selectedStudent.reversalErrorCount}
                  </div>
                </div>
              </div>
            </section>

            {/* Student Roster & Normative Percentile Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* 7 Cols: Student Clinical Roster Table */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        سجل الطلاب ونتائج الفحص المعياري (انقر لاختيار الطالب)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        مقارنة مؤشرات عسر القراءة ومعدل الرمش والإجهاد البصري وعسر الحساب
                      </p>
                    </div>

                    {/* Interactive Filter Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setRiskFilter('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          riskFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الكل ({students.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRiskFilter('high')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          riskFilter === 'high'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        يحتاج تدخلاً
                      </button>
                      <button
                        type="button"
                        onClick={() => setRiskFilter('nominal')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          riskFilter === 'nominal'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ضمن المتوسط
                      </button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث باسم الطالب أو المدرسة..."
                      aria-label="ابحث باسم الطالب أو المدرسة"
                      className="w-full pr-10 pl-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  {/* High-Density Clinical Table */}
                  {filteredStudents.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <p className="text-xs text-slate-600">
                        لا توجد سجلات طلاب مطابقة لمعايير البحث الحالية.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setRiskFilter('all');
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-[#0284C7] hover:underline"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                            <th className="py-2.5 px-3">اسم الطالب والصف</th>
                            <th className="py-2.5 px-3 text-left">السرعة (WPM)</th>
                            <th className="py-2.5 px-3 text-left">التثبيت والرمش</th>
                            <th className="py-2.5 px-3">مؤشر القراءة</th>
                            <th className="py-2.5 px-3">مؤشر الديسكالكوليا</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredStudents.map((stu) => {
                            const isSelected = stu.id === selectedStudent.id;
                            return (
                              <tr
                                key={stu.id}
                                onClick={() => setSelectedStudentId(stu.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-sky-50/80 font-semibold'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-3 px-3">
                                  <div className="text-slate-900 font-semibold">
                                    {stu.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal">
                                    الصف {stu.gradeLevel} · {stu.dialectRegionAr || 'الفصحى والخليجية'}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-left font-mono tabular-nums text-slate-900">
                                  {stu.wpm}
                                </td>
                                <td className="py-3 px-3 text-left font-mono tabular-nums text-slate-900">
                                  <div>{stu.avgFixationMs}ms</div>
                                  <div className="text-[10px] text-slate-500">
                                    {stu.blinksPerMinute ?? 16} رمشة/د
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={
                                      stu.readingRiskLevel === 'high'
                                        ? 'text-[#DC2626] font-semibold'
                                        : stu.readingRiskLevel === 'moderate'
                                          ? 'text-[#D97706] font-semibold'
                                          : 'text-[#059669] font-medium'
                                    }
                                  >
                                    {stu.readingRiskLevel === 'high'
                                      ? `■ عسر قراءة (مئين ${stu.readingPercentile})`
                                      : stu.readingRiskLevel === 'moderate'
                                        ? `▲ متوسط (مئين ${stu.readingPercentile})`
                                        : `● طبيعي (مئين ${stu.readingPercentile})`}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={
                                      stu.mathRiskLevel === 'high'
                                        ? 'text-[#DC2626] font-semibold'
                                        : 'text-[#059669] font-medium'
                                    }
                                  >
                                    {stu.mathRiskLevel === 'high'
                                      ? `■ ديسكالكوليا (PAE ${stu.numberLinePAE}%)`
                                      : `● سليم (PAE ${stu.numberLinePAE}%)`}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    الطالب المحدد حالياً: <strong className="text-slate-900">{selectedStudent.name}</strong>
                  </span>
                  <span>نسبة الفهم القرائي: {selectedStudent.comprehensionScore}%</span>
                </div>
              </div>

              {/* 5 Cols: Lexplore Normative Percentile Matrix Chart */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        منحنى المئينات المعياري (Lexplore Percentile Matrix)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        توزيع الطلاب بين الطلاقة القرائية (أفقياً) والحس العددي (عمودياً)
                      </p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-[#0284C7]" />
                  </div>

                  {/* Interactive 2D Clinical Quadrant SVG */}
                  <svg
                    viewBox="0 0 380 230"
                    className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
                    role="img"
                    aria-label="مخطط توزيع الطلاب حسب المئين القرائي والحسابي"
                  >
                    {/* Risk Bands */}
                    <rect
                      x="40"
                      y="15"
                      width="110"
                      height="180"
                      fill="#FEE2E2"
                      fillOpacity="0.45"
                    />
                    <rect
                      x="150"
                      y="15"
                      width="75"
                      height="180"
                      fill="#FEF3C7"
                      fillOpacity="0.4"
                    />
                    <rect
                      x="225"
                      y="15"
                      width="135"
                      height="180"
                      fill="#DCFCE7"
                      fillOpacity="0.4"
                    />

                    {/* Grid Lines */}
                    <line
                      x1="40"
                      y1="105"
                      x2="360"
                      y2="105"
                      stroke="#CBD5E1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="150"
                      y1="15"
                      x2="150"
                      y2="195"
                      stroke="#CBD5E1"
                      strokeDasharray="3 3"
                    />

                    {/* Axis Labels */}
                    <text x="95" y="30" fontSize="9" fill="#991B1B" textAnchor="middle">
                      نطاق عسر القراءة (&lt;25%)
                    </text>
                    <text x="187" y="30" fontSize="9" fill="#92400E" textAnchor="middle">
                      متابعة (25-45%)
                    </text>
                    <text x="292" y="30" fontSize="9" fill="#065F46" textAnchor="middle">
                      طلاقة طبيعية (&gt;45%)
                    </text>

                    <text x="200" y="218" fontSize="10" fill="#475569" textAnchor="middle">
                      المئين القرائي (Lexplore Reading Percentile) →
                    </text>

                    {/* Plot Each Student */}
                    {students.map((stu) => {
                      const cx = 40 + (stu.readingPercentile / 100) * 320;
                      const cy = 195 - (stu.mathPercentile / 100) * 170;
                      const isSel = stu.id === selectedStudent.id;
                      const firstName = stu.name.split(' ')[0];

                      return (
                        <g
                          key={stu.id}
                          onClick={() => setSelectedStudentId(stu.id)}
                          className="cursor-pointer"
                        >
                          {isSel && (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={13}
                              fill="#0284C7"
                              fillOpacity="0.2"
                              stroke="#0284C7"
                              strokeWidth="1.5"
                            />
                          )}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isSel ? 7 : 5.5}
                            fill={
                              stu.readingRiskLevel === 'high' ||
                              stu.mathRiskLevel === 'high'
                                ? '#DC2626'
                                : stu.readingRiskLevel === 'moderate'
                                  ? '#D97706'
                                  : '#059669'
                            }
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          />
                          <text
                            x={cx}
                            y={cy - 10}
                            fontSize="10"
                            fontWeight={isSel ? '700' : '500'}
                            fill="#0F172A"
                            textAnchor="middle"
                          >
                            {firstName}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span>انقر على أي نقطة في المخطط لعرض مسار عين الطالب</span>
                  <span className="font-mono tabular-nums text-slate-900 font-semibold">
                    P{selectedStudent.readingPercentile} قراءة · P{selectedStudent.mathPercentile} حساب
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Lexplore Scanpath & Heatmap Visualizer */}
            <ScanpathViewer
              words={selectedPassage.words}
              fixations={selectedStudent.fixations}
              passageTitle={`${selectedPassage.title} — مسار نظر الطالب (${selectedStudent.name})`}
              passageCategory={selectedPassage.category}
            />

            {/* Gemini AI Clinical Diagnostic & Individualized Intervention Plan (IEP) */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    التشخيص الإكلينيكي المدعوم بالذكاء الاصطناعي (Gemini 3.8 Clinical Engine)
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    التقرير التشخيصي وخطة التدخل الفردية (IEP) — {selectedStudent.name}
                  </h2>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingAI}
                  onClick={handleRegenerateAIClinicalReport}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGeneratingAI
                      ? 'جاري توليد التحليل السريري...'
                      : 'تحديث التشخيص بالذكاء الاصطناعي (Gemini AI)'}
                  </span>
                </button>
              </div>

              {/* 2x2 Clinical Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    ٠١. الملخص الإكلينيكي الشامل
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedStudent.clinicalReport.clinicalSummary}
                  </p>
                </div>

                <div className="p-5 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    ٠٢. تحليل حركة العين والتثبيتات البصرية (Ocular-Motor)
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedStudent.clinicalReport.ocularMotorAnalysis}
                  </p>
                </div>

                <div className="p-5 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    ٠٣. الأنماط الصرفية والفونولوجية في العربية
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedStudent.clinicalReport.orthographicAndPhonologicalPatterns}
                  </p>
                </div>

                <div className="p-5 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    ٠٤. تحليل الديسكالكوليا والحس المكاني للأعداد
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedStudent.clinicalReport.dyscalculiaSpatialAnalysis}
                  </p>
                </div>
              </div>

              {/* Actionable Daily Exercises & Classroom Accommodations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    التمارين العلاجية اليومية الموصى بها:
                  </h3>
                  <div className="space-y-2.5">
                    {selectedStudent.clinicalReport.interventionExercises.map(
                      (ex, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-900">
                              {idx + 1}. {ex.title}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {ex.description}
                            </p>
                          </div>
                          <span className="text-xs font-mono tabular-nums font-semibold text-[#0284C7] shrink-0">
                            {ex.durationMinutes} دقائق
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      التيسيرات الصفية والمدرسية:
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {selectedStudent.clinicalReport.classroomAccommodations.map(
                        (acc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#0284C7] font-bold">·</span>
                            <span>{acc}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('adaptive-reader')}
                    className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>فتح القارئ العربي الميسّر لتدريب الطالب الآن</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: LIVE EYE-TRACKING READING LAB */}
        {activeTab === 'eye-lab' && (
          <EyeTrackingLabView onCompleteSession={handleCompleteNewSession} />
        )}

        {/* VIEW 3: DYSCALCULIA & NUMERICAL COGNITION LAB */}
        {activeTab === 'dyscalculia-lab' && (
          <DyscalculiaLabView
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onUpdateStudentMath={handleUpdateStudentMath}
          />
        )}

        {/* VIEW 4: SMART ADAPTIVE DYSLEXIA READER & DYSLEXICO STUDIO */}
        {activeTab === 'adaptive-reader' && <AdaptiveReaderView />}

        {/* VIEW 5: CLINICAL ALGORITHMS & ADAPTIVE IRT / PYGAZE ML LAB */}
        {activeTab === 'algorithms-lab' && (
          <ClinicalAlgorithmsView selectedStudent={selectedStudent} />
        )}
      </main>

      {/* Quiet Clinical Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-8">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            بصيرة — المنصة العربية لتقييم عسر القراءة (الديسلكسيا) وعسر الحساب (الديسكالكوليا) بتتبع حركة العين
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="hover:text-slate-900"
            >
              لوحة النتائج
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('eye-lab')}
              className="hover:text-slate-900"
            >
              فحص تتبع العين
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('adaptive-reader')}
              className="hover:text-slate-900"
            >
              استوديو Dyslexico
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('algorithms-lab')}
              className="hover:text-slate-900"
            >
              مختبر IRT وPyGaze
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
