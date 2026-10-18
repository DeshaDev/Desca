import { WordFixation } from '../utils/clinicalMetrics';

export interface ClinicalReport {
  clinicalSummary: string;
  ocularMotorAnalysis: string;
  orthographicAndPhonologicalPatterns: string;
  dyscalculiaSpatialAnalysis: string;
  interventionExercises: {
    title: string;
    durationMinutes: number;
    description: string;
  }[];
  classroomAccommodations: string[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  gradeLevel: number;
  category: string;
  words: string[];
  comprehensionQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

export interface StudentRecord {
  id: string;
  name: string;
  gradeLevel: number;
  ageYears: number;
  schoolName: string;
  lastScreenedDate: string;
  passageId: string;
  dialectRegionAr?: string;
  // Dyslexia / Eye-Tracking & Blink Rate metrics
  wpm: number;
  avgFixationMs: number;
  regressionRate: number;
  regressionCount: number;
  blinkCount?: number;
  blinksPerMinute?: number;
  visualStrainLevel?: 'nominal' | 'moderate' | 'high' | 'severe';
  visualStrainLabelAr?: string;
  dyslexiaRiskScore: number;
  readingPercentile: number;
  readingRiskLevel: 'nominal' | 'moderate' | 'high';
  readingRiskLabelAr: string;
  problematicWords: string[];
  fixations: WordFixation[];
  comprehensionScore: number; // 0-100
  // Dyscalculia metrics
  subitizingAccuracy: number;
  avgSubitizingMs: number;
  numberLinePAE: number;
  transcodingAccuracy: number;
  reversalErrorCount: number;
  dyscalculiaRiskScore: number;
  mathPercentile: number;
  mathRiskLevel: 'nominal' | 'moderate' | 'high';
  mathRiskLabelAr: string;
  clinicalReport: ClinicalReport;
}

export const ARABIC_READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'passage-g3-astronomy',
    title: 'رِحْلَةٌ إِلَى المَرْصَدِ الفَلَكِيِّ',
    gradeLevel: 3,
    category: 'علوم وفلك · الصف الثالث الابتدائي',
    words: [
      'زَارَ',
      'طُلَّابُ',
      'المَدْرَسَةِ',
      'المَرْصَدَ',
      'الفَلَكِيَّ',
      'فِي',
      'مَسَاءٍ',
      'صَافٍ',
      'لِمُشَاهَدَةِ',
      'الكَوَاكِبِ',
      'المُضِيئَةِ.',
      'وَضَعَ',
      'المُهَنْدِسُ',
      'المِنْظَارَ',
      'الدَّقِيقَ',
      'نَحْوَ',
      'السَّمَاءِ،',
      'فَظَهَرَتْ',
      'حَلَقَاتُ',
      'كَوْكَبِ',
      'زُحَلَ',
      'الوَاضِحَةُ',
      'أَمَامَ',
      'الجَمِيعِ.',
      'سَجَّلَ',
      'الأَطْفَالُ',
      'مُلَاحَظَاتِهِمْ',
      'فِي',
      'دَفْتَرِ',
      'البَحْثِ',
      'العِلْمِيِّ',
      'بِحَمَاسٍ',
      'شَدِيدٍ.',
    ],
    comprehensionQuestions: [
      {
        question: 'مَتَى زَارَ الطُّلَّابُ المَرْصَدَ الفَلَكِيَّ؟',
        options: ['فِي الصَّبَاحِ البَاكِرِ', 'فِي مَسَاءٍ صَافٍ', 'عِنْدَ هُطُولِ المَطَرِ'],
        correctIndex: 1,
      },
      {
        question: 'مَا الكَوْكَبُ الَّذِي ظَهَرَتْ حَلَقَاتُهُ فِي المِنْظَارِ؟',
        options: ['كَوْكَبُ المِرِّيخِ', 'كَوْكَبُ زُحَلَ', 'كَوْكَبُ عُطَارِدَ'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'passage-g4-oasis',
    title: 'وَاحَةُ النَّخِيلِ وَالقَنَوَاتُ المَائِيَّةُ',
    gradeLevel: 4,
    category: 'بيئة وتراث · الصف الرابع الابتدائي',
    words: [
      'تَتَمَيَّزُ',
      'الوَاحَاتُ',
      'العَرَبِيَّةُ',
      'بِنِظَامٍ',
      'هَنْدَسِيٍّ',
      'عَرِيقٍ',
      'يُعْرَفُ',
      'بِاسْمِ',
      'الأَفْلَاجِ',
      'المَائِيَّةِ.',
      'تَنْسَابُ',
      'المِيَاهُ',
      'العَذْبَةُ',
      'مِنَ',
      'اليَنَابِيعِ',
      'الجَبَلِيَّةِ',
      'عَبْرَ',
      'قَنَوَاتٍ',
      'مُتَّصِلَةٍ',
      'لِتَرْوِيَ',
      'بَسَاتِينَ',
      'النَّخِيلِ',
      'وَالحُقُولَ',
      'الخَضْرَاءَ.',
      'يَتَعَاوَنُ',
      'المُزَارِعُونَ',
      'يَوْمِيّاً',
      'لِتَوْزِيعِ',
      'الحِصَصِ',
      'بِالعَدْلِ',
      'وَالدِّقَّةِ',
      'المُتَنَاهِيَةِ.',
    ],
    comprehensionQuestions: [
      {
        question: 'مَا اسْمُ النِّظَامِ الهَنْدَسِيِّ الَّذِي يَنْقُلُ المِيَاهَ فِي الوَاحَةِ؟',
        options: ['السُّدُودُ الرَّمْلِيَّةُ', 'الأَفْلَاجُ المَائِيَّةُ', 'الصَّهَارِيجُ المعدنية'],
        correctIndex: 1,
      },
      {
        question: 'مِنْ أَيْنَ تَنْبُعُ المِيَاهُ العَذْبَةُ فِي هَذَا النِّظَامِ؟',
        options: ['مِنَ اليَنَابِيعِ الجَبَلِيَّةِ', 'مِنَ البِحَارِ المَالِحَةِ', 'مِنَ البُحَيْرَاتِ الصِّنَاعِيَّةِ'],
        correctIndex: 0,
      },
    ],
  },
];

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-rayan',
    name: 'ريان بن طلال العتيبي',
    gradeLevel: 3,
    ageYears: 9,
    schoolName: 'مدرسة الرواد النموذجية - الرياض',
    lastScreenedDate: '٢٠٢٦/١٠/١٥',
    passageId: 'passage-g3-astronomy',
    dialectRegionAr: 'اللهجة الخليجية / السعودية',
    wpm: 39,
    avgFixationMs: 445,
    regressionRate: 34,
    regressionCount: 14,
    blinkCount: 22,
    blinksPerMinute: 26,
    visualStrainLevel: 'high',
    visualStrainLabelAr: 'إجهاد بصري مرتفع (رمش متكرر ٢٦ رمشة/دقيقة)',
    dyslexiaRiskScore: 76,
    readingPercentile: 18,
    readingRiskLevel: 'high',
    readingRiskLabelAr: 'احتمالية مرتفعة لعسر القراءة',
    problematicWords: ['لِمُشَاهَدَةِ', 'الكَوَاكِبِ', 'المُضِيئَةِ', 'المِنْظَارَ', 'مُلَاحَظَاتِهِمْ'],
    comprehensionScore: 50,
    fixations: [
      { wordIndex: 0, word: 'زَارَ', durationMs: 260, visits: 1 },
      { wordIndex: 1, word: 'طُلَّابُ', durationMs: 340, visits: 1 },
      { wordIndex: 2, word: 'المَدْرَسَةِ', durationMs: 410, visits: 2, regressedFromIndex: 3, blinks: 1 },
      { wordIndex: 3, word: 'المَرْصَدَ', durationMs: 480, visits: 2, regressedFromIndex: 4, blinks: 1 },
      { wordIndex: 4, word: 'الفَلَكِيَّ', durationMs: 430, visits: 2 },
      { wordIndex: 5, word: 'فِي', durationMs: 190, visits: 1 },
      { wordIndex: 6, word: 'مَسَاءٍ', durationMs: 310, visits: 1 },
      { wordIndex: 7, word: 'صَافٍ', durationMs: 330, visits: 1 },
      { wordIndex: 8, word: 'لِمُشَاهَدَةِ', durationMs: 620, visits: 3, regressedFromIndex: 10, blinks: 2 },
      { wordIndex: 9, word: 'الكَوَاكِبِ', durationMs: 540, visits: 2, regressedFromIndex: 10, blinks: 1 },
      { wordIndex: 10, word: 'المُضِيئَةِ.', durationMs: 590, visits: 3, blinks: 2 },
      { wordIndex: 11, word: 'وَضَعَ', durationMs: 280, visits: 1 },
      { wordIndex: 12, word: 'المُهَنْدِسُ', durationMs: 470, visits: 2, regressedFromIndex: 13 },
      { wordIndex: 13, word: 'المِنْظَارَ', durationMs: 580, visits: 3, regressedFromIndex: 14, blinks: 2 },
      { wordIndex: 14, word: 'الدَّقِيقَ', durationMs: 440, visits: 2 },
      { wordIndex: 15, word: 'نَحْوَ', durationMs: 240, visits: 1 },
      { wordIndex: 16, word: 'السَّمَاءِ،', durationMs: 350, visits: 1 },
      { wordIndex: 17, word: 'فَظَهَرَتْ', durationMs: 490, visits: 2, regressedFromIndex: 18 },
      { wordIndex: 18, word: 'حَلَقَاتُ', durationMs: 390, visits: 1 },
      { wordIndex: 19, word: 'كَوْكَبِ', durationMs: 310, visits: 1 },
      { wordIndex: 20, word: 'زُحَلَ', durationMs: 360, visits: 2 },
      { wordIndex: 21, word: 'الوَاضِحَةُ', durationMs: 460, visits: 2 },
      { wordIndex: 22, word: 'أَمَامَ', durationMs: 250, visits: 1 },
      { wordIndex: 23, word: 'الجَمِيعِ.', durationMs: 300, visits: 1 },
      { wordIndex: 24, word: 'سَجَّلَ', durationMs: 320, visits: 1 },
      { wordIndex: 25, word: 'الأَطْفَالُ', durationMs: 350, visits: 1 },
      { wordIndex: 26, word: 'مُلَاحَظَاتِهِمْ', durationMs: 690, visits: 3, regressedFromIndex: 28, blinks: 3 },
      { wordIndex: 27, word: 'فِي', durationMs: 180, visits: 1 },
      { wordIndex: 28, word: 'دَفْتَرِ', durationMs: 340, visits: 1 },
      { wordIndex: 29, word: 'البَحْثِ', durationMs: 390, visits: 2 },
      { wordIndex: 30, word: 'العِلْمِيِّ', durationMs: 410, visits: 1 },
      { wordIndex: 31, word: 'بِحَمَاسٍ', durationMs: 380, visits: 1 },
      { wordIndex: 32, word: 'شَدِيدٍ.', durationMs: 330, visits: 1 },
    ],
    subitizingAccuracy: 67,
    avgSubitizingMs: 1980,
    numberLinePAE: 18.4,
    transcodingAccuracy: 50,
    reversalErrorCount: 2,
    dyscalculiaRiskScore: 68,
    mathPercentile: 24,
    mathRiskLevel: 'high',
    mathRiskLabelAr: 'احتمالية مرتفعة للديسكالكوليا',
    clinicalReport: {
      clinicalSummary:
        'يُظهر فحص تتبع العين (Lexplore Scanpath) للطالب ريان نمطاً كلاسيكياً لعسر القراءة الفونولوجي المصحوب بارتفاع معدل الرمش (٢٦ رمشة/دقيقة) نتيجة الإجهاد البصري القرائي، وصعوبة في الترميز المكاني للأعداد (الديسكالكوليا). تطول فترات التثبيت البصري (445ms) عند الكلمات العربية المشتملة على سوابق ولواحق متصلة مثل (لِمُشَاهَدَةِ، مُلَاحَظَاتِهِمْ)، مع قفزات تراجعية متكررة بنسبة 34%.',
      ocularMotorAnalysis:
        'تُبيّن خريطة مسار النظر تجمّع دوائر تثبيت كبيرة وعناقيد رمش متكررة فوق المقاطع الوسطى للكلمات الرباعية والخماسية، مع 14 قفزة تراجعية (Regressions) نحو اليمين لإعادة التحقق من مواقع النقاط في الحروف المتشابهة (ظ/ض، ذ/د).',
      orthographicAndPhonologicalPatterns:
        'صعوبة في التقطيع الصوتي التلقائي للكلمات المتصلة بضمائر الملكية وحروف الجر، وبطء في التمييز البصري السريع بين الحروف المتجانسة رسماً.',
      dyscalculiaSpatialAnalysis:
        'في اختبار الديسكالكوليا، بلغ خطأ التقدير المكاني على خط الأعداد (PAE) 18.4% (المعيار الطبيعي أقل من 8%)، مع رصد خطأين في عكس خانات الآحاد والعشرات عند قراءة الأعداد المكونة من رقمين (مثل قراءة ٤٧ كـ ٧٤).',
      interventionExercises: [
        {
          title: 'تفكيك الكلمات الطويلة بالمقاطع الملونة',
          durationMinutes: 12,
          description: 'استخدام القارئ الذكي لتقسيم الكلمات متعددة المقاطع (مثل مُـ · لَا · حَـ · ظَا · تِـ · هِمْ) مع التتبع السمعي البصري المتزامن.',
        },
        {
          title: 'تدريب خط الأعداد المكاني الملموس (0 - 100)',
          durationMinutes: 10,
          description: 'ربط الكميات العشرية بمواقعها المرجعية (25، 50، 75) لتقليص الانحراف المكاني PAE.',
        },
        {
          title: 'تثبيت اتجاه ترميز الآحاد والعشرات بالعربية',
          durationMinutes: 8,
          description: 'تدريب بصري بلونين (الأزرق للآحاد والأخضر للعشرات) لمنع الانعكاس المكاني أثناء قراءة الأرقام.',
        },
      ],
      classroomAccommodations: [
        'تفعيل المسطرة البصرية والخلفية الكريمية الدافئة لتقليل الإجهاد البصري ومعدل الرمش.',
        'تقسيم الفقرات الطويلة إلى جمل قصيرة مشكّلة بوضوح بخط Readex Pro.',
        'استخدام شبكة المربعات المكانية عند إجراء العمليات الحسابية.',
      ],
    },
  },
  {
    id: 'stu-layla',
    name: 'ليلى بنت سامي المنصور',
    gradeLevel: 3,
    ageYears: 9,
    schoolName: 'مدرسة الرواد النموذجية - الرياض',
    lastScreenedDate: '٢٠٢٦/١٠/١٦',
    passageId: 'passage-g3-astronomy',
    dialectRegionAr: 'اللهجة الشامية / الفصحى',
    wpm: 88,
    avgFixationMs: 235,
    regressionRate: 9,
    regressionCount: 3,
    blinkCount: 7,
    blinksPerMinute: 12,
    visualStrainLevel: 'nominal',
    visualStrainLabelAr: 'معدل رمش طبيعي ومريح (١٢ رمشة/دقيقة)',
    dyslexiaRiskScore: 18,
    readingPercentile: 82,
    readingRiskLevel: 'nominal',
    readingRiskLabelAr: 'ضمن المتوسط الطبيعي',
    problematicWords: ['مُلَاحَظَاتِهِمْ'],
    comprehensionScore: 100,
    fixations: [
      { wordIndex: 0, word: 'زَارَ', durationMs: 185, visits: 1 },
      { wordIndex: 1, word: 'طُلَّابُ', durationMs: 210, visits: 1 },
      { wordIndex: 2, word: 'المَدْرَسَةِ', durationMs: 230, visits: 1 },
      { wordIndex: 3, word: 'المَرْصَدَ', durationMs: 245, visits: 1 },
      { wordIndex: 4, word: 'الفَلَكِيَّ', durationMs: 240, visits: 1 },
      { wordIndex: 5, word: 'فِي', durationMs: 150, visits: 1 },
      { wordIndex: 6, word: 'مَسَاءٍ', durationMs: 205, visits: 1 },
      { wordIndex: 7, word: 'صَافٍ', durationMs: 195, visits: 1 },
      { wordIndex: 8, word: 'لِمُشَاهَدَةِ', durationMs: 290, visits: 1 },
      { wordIndex: 9, word: 'الكَوَاكِبِ', durationMs: 240, visits: 1 },
      { wordIndex: 10, word: 'المُضِيئَةِ.', durationMs: 260, visits: 1 },
      { wordIndex: 11, word: 'وَضَعَ', durationMs: 190, visits: 1 },
      { wordIndex: 12, word: 'المُهَنْدِسُ', durationMs: 250, visits: 1 },
      { wordIndex: 13, word: 'المِنْظَارَ', durationMs: 265, visits: 1 },
      { wordIndex: 14, word: 'الدَّقِيقَ', durationMs: 230, visits: 1 },
      { wordIndex: 15, word: 'نَحْوَ', durationMs: 180, visits: 1 },
      { wordIndex: 16, word: 'السَّمَاءِ،', durationMs: 215, visits: 1 },
      { wordIndex: 17, word: 'فَظَهَرَتْ', durationMs: 245, visits: 1 },
      { wordIndex: 18, word: 'حَلَقَاتُ', durationMs: 225, visits: 1 },
      { wordIndex: 19, word: 'كَوْكَبِ', durationMs: 210, visits: 1 },
      { wordIndex: 20, word: 'زُحَلَ', durationMs: 200, visits: 1 },
      { wordIndex: 21, word: 'الوَاضِحَةُ', durationMs: 235, visits: 1 },
      { wordIndex: 22, word: 'أَمَامَ', durationMs: 185, visits: 1 },
      { wordIndex: 23, word: 'الجَمِيعِ.', durationMs: 210, visits: 1 },
      { wordIndex: 24, word: 'سَجَّلَ', durationMs: 200, visits: 1 },
      { wordIndex: 25, word: 'الأَطْفَالُ', durationMs: 220, visits: 1 },
      { wordIndex: 26, word: 'مُلَاحَظَاتِهِمْ', durationMs: 430, visits: 2, regressedFromIndex: 27, blinks: 1 },
      { wordIndex: 27, word: 'فِي', durationMs: 165, visits: 1 },
      { wordIndex: 28, word: 'دَفْتَرِ', durationMs: 210, visits: 1 },
      { wordIndex: 29, word: 'البَحْثِ', durationMs: 225, visits: 1 },
      { wordIndex: 30, word: 'العِلْمِيِّ', durationMs: 235, visits: 1 },
      { wordIndex: 31, word: 'بِحَمَاسٍ', durationMs: 215, visits: 1 },
      { wordIndex: 32, word: 'شَدِيدٍ.', durationMs: 195, visits: 1 },
    ],
    subitizingAccuracy: 60,
    avgSubitizingMs: 2150,
    numberLinePAE: 21.5,
    transcodingAccuracy: 50,
    reversalErrorCount: 2,
    dyscalculiaRiskScore: 74,
    mathPercentile: 19,
    mathRiskLevel: 'high',
    mathRiskLabelAr: 'احتمالية مرتفعة للديسكالكوليا',
    clinicalReport: {
      clinicalSummary:
        'تتمتع الطالبة ليلى بطلاقة قرائية ممتازة (المئين 82) مع حركة عين منتظمة ومعدل رمش طبيعي مريح (١٢ رمشة/دقيقة)، غير أن فحص الحس العددي يكشف عن مؤشر مرتفع لعسر الحساب المنفرد (Pure Dyscalculia) يتجلى في ضعف تقدير الكميات المكانية على خط الأعداد (PAE 21.5%).',
      ocularMotorAnalysis:
        'حركة العين أثناء قراءة النصوص العربية سلسة ومنتظمة بمتوسط تثبيت 235ms دون إجهاد بصري، بينما يزداد تشتت النظر والتردد البصري بشكل ملحوظ عند مقارنة المجموعات النقطية والأعداد.',
      orthographicAndPhonologicalPatterns:
        'لا توجد صعوبات فونولوجية أو صرفية في القراءة؛ المعالجة اللغوية سليمة تماماً.',
      dyscalculiaSpatialAnalysis:
        'تعتمد الطالبة على العد الفردي البطيء بدلاً من الإدراك الكمي الفوري (Subitizing) للكميات الصغيرة (4-6 نقاط)، مع انحراف واضح في تمثيل موقع الأعداد على خط 0-100 وعكس ترتيب الآحاد والعشرات.',
      interventionExercises: [
        {
          title: 'تدريب الإدراك الكمي السريع (Subitizing Flash)',
          durationMinutes: 10,
          description: 'عرض أنماط نقطية منتظمة وعشوائية (3 إلى 7 نقاط) لمدة ثانية واحدة لتعزيز الحس الكمي المباشر دون عدّ أصابعي.',
        },
        {
          title: 'معايرة خط الأعداد الذهني (0-100)',
          durationMinutes: 12,
          description: 'تمارين تفاعلية لتحديد نقاط الارتكاز المكانية (10، 25، 50، 75) وربطها بحجم الكمية.',
        },
      ],
      classroomAccommodations: [
        'الاعتماد على الشرح اللفظي والقصصي للمفاهيم الرياضية للاستفادة من تفوقها القرائي.',
        'توفير خط أعداد مرئي على مكتب الطالبة أثناء حل المسائل.',
      ],
    },
  },
  {
    id: 'stu-omar',
    name: 'عمر بن خالد الدوسري',
    gradeLevel: 4,
    ageYears: 10,
    schoolName: 'مدرسة الرواد النموذجية - الرياض',
    lastScreenedDate: '٢٠٢٦/١٠/١٤',
    passageId: 'passage-g4-oasis',
    dialectRegionAr: 'اللهجة المصرية / الخليجية',
    wpm: 64,
    avgFixationMs: 345,
    regressionRate: 21,
    regressionCount: 7,
    blinkCount: 15,
    blinksPerMinute: 19,
    visualStrainLevel: 'moderate',
    visualStrainLabelAr: 'إجهاد بصري متوسط (١٩ رمشة/دقيقة)',
    dyslexiaRiskScore: 48,
    readingPercentile: 44,
    readingRiskLevel: 'moderate',
    readingRiskLabelAr: 'مؤشر متوسط - يتطلب متابعة',
    problematicWords: ['تَتَمَيَّزُ', 'الأَفْلَاجِ', 'اليَنَابِيعِ', 'المُتَنَاهِيَةِ'],
    comprehensionScore: 100,
    fixations: [
      { wordIndex: 0, word: 'تَتَمَيَّزُ', durationMs: 430, visits: 2, regressedFromIndex: 1, blinks: 1 },
      { wordIndex: 1, word: 'الوَاحَاتُ', durationMs: 310, visits: 1 },
      { wordIndex: 2, word: 'العَرَبِيَّةُ', durationMs: 320, visits: 1 },
      { wordIndex: 3, word: 'بِنِظَامٍ', durationMs: 290, visits: 1 },
      { wordIndex: 4, word: 'هَنْدَسِيٍّ', durationMs: 360, visits: 1 },
      { wordIndex: 5, word: 'عَرِيقٍ', durationMs: 280, visits: 1 },
      { wordIndex: 6, word: 'يُعْرَفُ', durationMs: 270, visits: 1 },
      { wordIndex: 7, word: 'بِاسْمِ', durationMs: 250, visits: 1 },
      { wordIndex: 8, word: 'الأَفْلَاجِ', durationMs: 490, visits: 2, regressedFromIndex: 9, blinks: 2 },
      { wordIndex: 9, word: 'المَائِيَّةِ.', durationMs: 350, visits: 1 },
      { wordIndex: 10, word: 'تَنْسَابُ', durationMs: 340, visits: 1 },
      { wordIndex: 11, word: 'المِيَاهُ', durationMs: 260, visits: 1 },
      { wordIndex: 12, word: 'العَذْبَةُ', durationMs: 330, visits: 1 },
      { wordIndex: 13, word: 'مِنَ', durationMs: 180, visits: 1 },
      { wordIndex: 14, word: 'اليَنَابِيعِ', durationMs: 460, visits: 2, regressedFromIndex: 15, blinks: 1 },
      { wordIndex: 15, word: 'الجَبَلِيَّةِ', durationMs: 340, visits: 1 },
      { wordIndex: 16, word: 'عَبْرَ', durationMs: 220, visits: 1 },
      { wordIndex: 17, word: 'قَنَوَاتٍ', durationMs: 310, visits: 1 },
      { wordIndex: 18, word: 'مُتَّصِلَةٍ', durationMs: 350, visits: 1 },
      { wordIndex: 19, word: 'لِتَرْوِيَ', durationMs: 370, visits: 1 },
      { wordIndex: 20, word: 'بَسَاتِينَ', durationMs: 330, visits: 1 },
      { wordIndex: 21, word: 'النَّخِيلِ', durationMs: 290, visits: 1 },
      { wordIndex: 22, word: 'وَالحُقُولَ', durationMs: 310, visits: 1 },
      { wordIndex: 23, word: 'الخَضْرَاءَ.', durationMs: 340, visits: 1 },
      { wordIndex: 24, word: 'يَتَعَاوَنُ', durationMs: 320, visits: 1 },
      { wordIndex: 25, word: 'المُزَارِعُونَ', durationMs: 380, visits: 2 },
      { wordIndex: 26, word: 'يَوْمِيّاً', durationMs: 280, visits: 1 },
      { wordIndex: 27, word: 'لِتَوْزِيعِ', durationMs: 330, visits: 1 },
      { wordIndex: 28, word: 'الحِصَصِ', durationMs: 310, visits: 1 },
      { wordIndex: 29, word: 'بِالعَدْلِ', durationMs: 290, visits: 1 },
      { wordIndex: 30, word: 'وَالدِّقَّةِ', durationMs: 320, visits: 1 },
      { wordIndex: 31, word: 'المُتَنَاهِيَةِ.', durationMs: 510, visits: 2, blinks: 2 },
    ],
    subitizingAccuracy: 83,
    avgSubitizingMs: 1290,
    numberLinePAE: 8.2,
    transcodingAccuracy: 100,
    reversalErrorCount: 0,
    dyscalculiaRiskScore: 22,
    mathPercentile: 78,
    mathRiskLevel: 'nominal',
    mathRiskLabelAr: 'إدراك كمي ومكاني طبيعي',
    clinicalReport: {
      clinicalSummary:
        'يُظهر الطالب عمر فهماً قرائياً كاملاً (100%) وحساً عددياً طبيعياً، مع بطء نسبي في فك ترميز المفردات غير المألوفة وارتفاع متوسط في معدل الرمش (١٩ رمشة/دقيقة). يحتاج إلى دعم وقائي في الطلاقة البصرية.',
      ocularMotorAnalysis:
        'متوسط تثبيت معتدل (345ms) يرتفع فقط عند الكلمات التراثية أو النادرة في المعجم المدرسي مثل (الأَفْلَاجِ، المُتَنَاهِيَةِ).',
      orthographicAndPhonologicalPatterns:
        'يمتلك وعياً صوتياً جيداً، لكنه يتأنى عند قراءة الكلمات المحتوية على تضعيف (شدّة) متبوع بمدّ.',
      dyscalculiaSpatialAnalysis:
        'المهارات الحسابية والمكانية ضمن المستوى الطبيعي المرتفع (خطأ خط الأعداد 8.2% فقط وبدون أي أخطاء عكس أرقام).',
      interventionExercises: [
        {
          title: 'القراءة المتكررة الموقوتة لرفع الطلاقة',
          durationMinutes: 10,
          description: 'قراءة النص مرتين متتاليتين مع تتبع تحسن السرعة من 64 إلى 85 كلمة/دقيقة.',
        },
      ],
      classroomAccommodations: [
        'تقديم قائمة بالمفردات الجديدة قبل بدء قراءة النص العلمي.',
      ],
    },
  },
  {
    id: 'stu-sara',
    name: 'سارة بنت فهد الزهراني',
    gradeLevel: 4,
    ageYears: 10,
    schoolName: 'مدرسة الرواد النموذجية - الرياض',
    lastScreenedDate: '٢٠٢٦/١٠/١٦',
    passageId: 'passage-g4-oasis',
    dialectRegionAr: 'الفصحى المعيارية / الخليجية',
    wpm: 112,
    avgFixationMs: 210,
    regressionRate: 6,
    regressionCount: 2,
    blinkCount: 6,
    blinksPerMinute: 11,
    visualStrainLevel: 'nominal',
    visualStrainLabelAr: 'معدل رمش طبيعي ومريح (١١ رمشة/دقيقة)',
    dyslexiaRiskScore: 11,
    readingPercentile: 91,
    readingRiskLevel: 'nominal',
    readingRiskLabelAr: 'ضمن المتوسط الطبيعي',
    problematicWords: [],
    comprehensionScore: 100,
    fixations: ARABIC_READING_PASSAGES[1].words.map((w, idx) => ({
      wordIndex: idx,
      word: w,
      durationMs: 185 + ((idx * 17) % 55),
      visits: 1,
    })),
    subitizingAccuracy: 100,
    avgSubitizingMs: 890,
    numberLinePAE: 3.8,
    transcodingAccuracy: 100,
    reversalErrorCount: 0,
    dyscalculiaRiskScore: 9,
    mathPercentile: 92,
    mathRiskLevel: 'nominal',
    mathRiskLabelAr: 'إدراك كمي ومكاني طبيعي',
    clinicalReport: {
      clinicalSummary:
        'تُحقق الطالبة سارة أداءً متقدماً في كلٍّ من الطلاقة القرائية (المئين 91) والإدراك الكمي والمكاني (المئين 92)، مع كفاءة عالية في حركة العين عبر الأسطر.',
      ocularMotorAnalysis:
        'تثبيتات بصرية قصيرة ودقيقة (210ms) وقفزات أمامية منتظمة دون تراجعات معطِّلة.',
      orthographicAndPhonologicalPatterns:
        'معالجة صرفية وفونولوجية تلقائية وسريعة للكلمات العربية المشكّلة وغير المشكّلة.',
      dyscalculiaSpatialAnalysis:
        'دقة عالية جداً في خط الأعداد (PAE 3.8%) وإدراك كمي فوري سليم 100%.',
      interventionExercises: [
        {
          title: 'نصوص إثرائية متقدمة وغير مشكّلة جزئياً',
          durationMinutes: 10,
          description: 'الانتقال إلى نصوص علمية وأدبية بمستوى الصف الخامس لتعزيز الاستنتاج اللغوي.',
        },
      ],
      classroomAccommodations: [
        'إشراك الطالبة في أنشطة القراءة القيادية ومسابقات الرياضيات الذهنية.',
      ],
    },
  },
];
