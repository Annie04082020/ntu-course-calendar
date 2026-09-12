const fs = require('fs');

const PERIODS = {
  '0':  { start: [7, 10],  end: [8,  0]  },
  '1':  { start: [8, 10],  end: [9,  0]  },
  '2':  { start: [9, 10],  end: [10, 0]  },
  '3':  { start: [10, 20], end: [11, 10] },
  '4':  { start: [11, 20], end: [12, 10] },
  '5':  { start: [12, 20], end: [13, 10] },
  '6':  { start: [13, 20], end: [14, 10] },
  '7':  { start: [14, 20], end: [15, 10] },
  '8':  { start: [15, 30], end: [16, 20] },
  '9':  { start: [16, 30], end: [17, 20] },
  '10': { start: [17, 30], end: [18, 20] },
  'A':  { start: [18, 25], end: [19, 15] },
  'B':  { start: [19, 20], end: [20, 10] },
  'C':  { start: [20, 15], end: [21, 5]  },
  'D':  { start: [21, 10], end: [22, 0]  },
};

const WEEKDAY_RRULE = { '一': 'MO', '二': 'TU', '三': 'WE', '四': 'TH', '五': 'FR', '六': 'SA', '日': 'SU' };
const WEEKDAY_OFFSET = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };
const PERIOD_ORDER = ['0','1','2','3','4','5','6','7','8','9','10','A','B','C','D'];

function parseTimeSlot(slotStr) {
  const clean = slotStr.replace(/\s+/g, '');
  const match = clean.match(/^([一二三四五六日])([\d,ABCDabcd]+)$/i);
  if (!match) return [];
  const weekday = match[1];
  const periodList = match[2].split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  const groups = [];
  let currentGroup = [];
  for (let i = 0; i < periodList.length; i++) {
    const p = periodList[i];
    const pIdx = PERIOD_ORDER.indexOf(p);
    if (pIdx === -1) continue;
    if (currentGroup.length === 0) {
      currentGroup.push(p);
    } else {
      const lastIdx = PERIOD_ORDER.indexOf(currentGroup[currentGroup.length - 1]);
      if (pIdx - lastIdx === 1) {
        currentGroup.push(p);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [p];
      }
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups.map(group => ({
    weekday,
    startPeriod: group[0],
    endPeriod: group[group.length - 1],
  }));
}

function calcEventDate(semesterStart, weekday) {
  const startDay = semesterStart.getDay();
  const targetDay = WEEKDAY_OFFSET[weekday];
  let diff = targetDay - startDay;
  if (diff < 0) diff += 7;
  const date = new Date(semesterStart);
  date.setDate(date.getDate() + diff);
  return date;
}

function formatICSDateTime(date, hour, minute) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
         'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
}

function foldLine(str) {
  if (!str) return '';
  const lines = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    let bytes = 1;
    if (code > 0x7ff) bytes = 3;
    else if (code > 0x7f) bytes = 2;
    if (code > 0xffff) bytes = 4;
    const limit = (lines.length === 0) ? 75 : 74;
    if (currentBytes + bytes > limit) {
      lines.push(current);
      current = ' ' + ch;
      currentBytes = 1 + bytes;
    } else {
      current += ch;
      currentBytes += bytes;
    }
  }
  if (current) lines.push(current);
  return lines.join('\r\n');
}

function escapeICS(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function cleanCourseTitle(rawName, code, serial, identifier) {
  let name = (rawName || '').trim();
  if (!name) return '';

  const removeLiteral = (val) => {
    if (!val || typeof val !== 'string') return;
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 2) return;
    const esc = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    name = name.replace(new RegExp('^[\\(\\[（【]?\\s*' + esc + '\\s*[\\)\\]）】]?\\s*[-:：_—]?\\s*', 'gi'), '');
    name = name.replace(new RegExp('\\s*[\\(\\[（【]?\\s*' + esc + '\\s*[\\)\\]）】]?\\s*$', 'gi'), '');
    name = name.replace(new RegExp('[\\(\\[（【]\\s*' + esc + '\\s*[\\)\\]）】]', 'gi'), '');
    name = name.replace(new RegExp('\\b' + esc + '\\b', 'gi'), '');
  };

  removeLiteral(code);
  removeLiteral(serial);
  removeLiteral(identifier);

  name = name.replace(/^[\\(\\[（【]?\s*[A-Za-z]{2,8}\s*\d{3,5}\s*[\\)\\]）】]?\s*[-:：_—]?\s*/g, '');
  name = name.replace(/\s*[\\(\\[（【]\s*[A-Za-z]{2,8}\s*\d{3,5}\s*[\\)\\]）】]\s*$/g, '');
  name = name.replace(/^[\\(\\[（【]?\s*\d{4,6}\s*[\\)\\]）】]?\s*[-:：_—]?\s*/g, '');
  name = name.replace(/\s*[\\(\\[（【]\s*\d{4,6}\s*[\\)\\]）】]\s*$/g, '');

  name = name.replace(/\s+/g, ' ').trim();
  return name || rawName.trim();
}

function generateICS(courses, semesterStart, totalWeeks, calTitle = '臺大課程表 115-1', lang = 'zh') {
  const isEn = (lang === 'en');
  const isBi = (lang === 'bilingual');

  const actualTitle = isEn ? 'NTU Course Schedule 115-1' : (isBi ? '臺大課程表 NTU Schedule 115-1' : calTitle);
  const prodId = isEn ? '-//NTU Course Calendar Exporter//EN' : '-//NTU Course Calendar Exporter//ZH-TW';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:' + prodId,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + actualTitle,
    'X-WR-TIMEZONE:Asia/Taipei',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Taipei',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'TZNAME:CST',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  for (const course of courses) {
    for (const slotStr of course.timeSlots) {
      const groups = parseTimeSlot(slotStr);

      for (const group of groups) {
        const pStart = PERIODS[group.startPeriod];
        const pEnd = PERIODS[group.endPeriod];
        if (!pStart || !pEnd) continue;

        const eventDate = calcEventDate(semesterStart, group.weekday);
        const dtStart = formatICSDateTime(eventDate, pStart.start[0], pStart.start[1]);
        const dtEnd = formatICSDateTime(eventDate, pEnd.end[0], pEnd.end[1]);

        const cleanZhName = cleanCourseTitle(course.name, course.code, course.serial, course.identifier);
        const cleanEnName = course.nameEn ? cleanCourseTitle(course.nameEn, course.code, course.serial, course.identifier) : '';

        let eventName = cleanZhName;
        let waitlistTag = '[候補] ';
        if (isEn) {
          eventName = cleanEnName || cleanZhName;
          waitlistTag = '[Waitlist] ';
        } else if (isBi) {
          eventName = cleanEnName ? (cleanEnName + ' ' + cleanZhName) : cleanZhName;
          waitlistTag = '[候補/Waitlist] ';
        }

        const summaryText = (course.isEnrolled === false ? waitlistTag : '') + eventName;

        const descParts = [];
        if (isEn) {
          descParts.push(course.isEnrolled === false ? '⚠️ [Status]: Waiting list (Not Enrolled)' : '✅ [Status]: Enrolled');
          if (course.instructorEn || course.instructor) descParts.push('Instructor: ' + (course.instructorEn || course.instructor));
          if (course.code) descParts.push('Course No.: ' + course.code);
          if (course.serial) descParts.push('Serial No.: ' + course.serial);
          if (course.identifier) descParts.push('Course ID: ' + course.identifier);
          if (course.locations && course.locations.length) descParts.push('Classroom: ' + course.locations.join(', '));
          if (course.remarksEn || course.remarks) descParts.push('Notes: ' + (course.remarksEn || course.remarks));
          if (course.descriptionEn || course.description) descParts.push('\n[Course Description]\n' + (course.descriptionEn || course.description));
          const enCourseUrl = (course.url && !course.url.includes('/en/courses/')) ? course.url.replace('/courses/', '/en/courses/') : (course.url || '');
          if (enCourseUrl) descParts.push('\nCourse URL: ' + enCourseUrl);
        } else if (isBi) {
          descParts.push(course.isEnrolled === false ? '⚠️【選課狀態 / Status】：志願排隊中 / Waiting list' : '✅【選課狀態 / Status】：已選上 / Enrolled');
          if (course.instructor) descParts.push('授課教師 / Instructor：' + course.instructor + (course.instructorEn ? ` (${course.instructorEn})` : ''));
          if (course.code) descParts.push('課號 / Course No.：' + course.code);
          if (course.serial) descParts.push('流水號 / Serial No.：' + course.serial);
          if (course.identifier) descParts.push('課程識別碼 / Course ID：' + course.identifier);
          if (course.locations && course.locations.length) descParts.push('教室 / Location：' + course.locations.join('、'));
          if (course.remarks || course.remarksEn) descParts.push('備註 / Notes：' + (course.remarks || '') + (course.remarksEn ? `\n[Notes] ${course.remarksEn}` : ''));
          if (course.description) descParts.push('\n【課程概述】\n' + course.description);
          if (course.descriptionEn) descParts.push('\n【Course Description】\n' + course.descriptionEn);
          if (course.url) descParts.push('\n課程網址 / URL：' + course.url);
        } else {
          descParts.push(course.isEnrolled === false ? '⚠️【選課狀態】：志願排隊中（未選上）' : '✅【選課狀態】：已選上');
          if (course.instructor) descParts.push('授課教師：' + course.instructor);
          if (course.code) descParts.push('課號：' + course.code);
          if (course.serial) descParts.push('流水號：' + course.serial);
          if (course.identifier) descParts.push('課程識別碼：' + course.identifier);
          if (course.locations.length) descParts.push('教室：' + course.locations.join('、'));
          if (course.remarks) descParts.push('備註：' + course.remarks);
          if (course.description) descParts.push('\n【課程概述】\n' + course.description);
          descParts.push('\n課程網址：' + course.url);
        }

        const locationText = course.locations.join('、') || (isEn ? 'TBA' : '未定 / 依課程公告');

        const uid = 'ntu-' + (course.serial || 'course') + '-' + (WEEKDAY_RRULE[group.weekday] || 'D') + group.startPeriod + '-' + Math.random().toString(36).slice(2, 9) + '@course.ntu.edu.tw';
        lines.push(
          'BEGIN:VEVENT',
          foldLine('UID:' + uid),
          'DTSTART;TZID=Asia/Taipei:' + dtStart,
          'DTEND;TZID=Asia/Taipei:' + dtEnd,
          'RRULE:FREQ=WEEKLY;BYDAY=' + WEEKDAY_RRULE[group.weekday] + ';COUNT=' + totalWeeks,
          foldLine('SUMMARY:' + escapeICS(summaryText)),
          foldLine('LOCATION:' + escapeICS(locationText)),
          foldLine('DESCRIPTION:' + escapeICS(descParts.join('\n'))),
          'URL:' + course.url,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        );
      }
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// 範例課表資料結構 (供模組測試與預覽示範)
const allCourses = [
  {
    name: '生醫資訊學導論',
    nameEn: 'Introduction to Biomedical Informatics',
    isEnrolled: true,
    instructor: '曾宇鳳',
    instructorEn: 'Yu-Feng Tseng',
    locations: ['資103'],
    timeSlots: ['四 2,3,4'],
    code: 'CSIE5122',
    serial: '10359',
    identifier: '922 U3490',
    credits: 3,
    url: 'https://course.ntu.edu.tw/courses/115-1/10359',
    remarks: '限學士班四年級以上。分子醫學所/智慧健康資訊本課程以英語授課。',
    remarksEn: 'Taught in English.',
    description: 'This course provides an introduction to bioinformatics and computational biology, covering genomics, proteomics, molecular modeling, and medical informatics applications.',
    descriptionEn: 'This course provides an introduction to bioinformatics and computational biology, covering genomics, proteomics, molecular modeling, and medical informatics applications.'
  },
  {
    name: '生醫信號研究方法',
    nameEn: 'Research Methods in Biomedical Signals',
    isEnrolled: true,
    instructor: '吳文超',
    instructorEn: 'Wen-Chao Wu',
    locations: ['依系所公告'],
    timeSlots: ['一 6,7,8'],
    code: 'MHI7010',
    serial: '13160',
    identifier: 'H45 M7010',
    credits: 3,
    url: 'https://course.ntu.edu.tw/courses/115-1/13160',
    remarks: '醫學健康資訊研究所碩士班核心課程。',
    remarksEn: 'Core course for Master program.',
    description: '本課程深入介紹生醫信號（EEG, ECG, fMRI, 生理穿戴裝置信號等）之擷取、濾波、時頻域分析、特徵萃取與現代機器學習生醫應用。',
    descriptionEn: 'Introduction to biomedical signal acquisition, filtering, time-frequency analysis, and machine learning.'
  },
  {
    name: '機器學習',
    nameEn: 'Machine Learning',
    isEnrolled: true,
    instructor: '劉子毓',
    instructorEn: 'Tzu-Yu Liu',
    locations: ['電二143'],
    timeSlots: ['三 2,3,4,5'],
    code: 'EE5184',
    serial: '13707',
    identifier: '921 U2620 01',
    credits: 4,
    url: 'https://course.ntu.edu.tw/courses/115-1/13707',
    remarks: '班次01。本課程以英語授課。',
    remarksEn: 'Class 01. Taught in English.',
    description: 'The machine learning course is a comprehensive program designed to engage in data-driven decision-making. Throughout the course, students will learn to develop and evaluate various predictive models across real-world datasets.',
    descriptionEn: 'The machine learning course is a comprehensive program designed to engage in data-driven decision-making. Throughout the course, students will learn to develop and evaluate various predictive models across real-world datasets.'
  },
  {
    name: '專題討論',
    nameEn: 'Seminar',
    isEnrolled: true,
    instructor: '徐翡曼',
    instructorEn: 'Fei-Man Hsu',
    locations: ['依系所公告'],
    timeSlots: ['一 3,4'],
    code: 'MHI7100',
    serial: '22882',
    identifier: 'H45 M7100 01',
    credits: 1,
    url: 'https://course.ntu.edu.tw/courses/115-1/22882',
    remarks: '班次01。醫學健康資訊研究所碩士班專題研討。',
    remarksEn: 'Class 01. Seminar for Master students.',
    description: '本課程旨在培養學生文獻研讀、邏輯思考及專業學術簡報討論之能力，邀請領域學者專家及學生進行專題報告。',
    descriptionEn: 'Developing literature review and professional scientific presentation skills.'
  },
  {
    name: '智慧醫療與健康資訊學',
    nameEn: 'Smart Healthcare and Health Informatics',
    isEnrolled: true,
    instructor: '陳玫如',
    instructorEn: 'Mei-Ju Chen',
    locations: ['綜合教學館701教室'],
    timeSlots: ['五 3,4'],
    code: 'MHI7400',
    serial: '26409',
    identifier: 'H45 M7400',
    credits: 2,
    url: 'https://course.ntu.edu.tw/courses/115-1/26409',
    remarks: '本課程以英語授課。上課教室:綜合教學館701教室。',
    remarksEn: 'Taught in English. Room 701, General Building.',
    description: '本課程涵蓋智慧醫療、電子病歷系統、健康巨量資料分析、醫療影像AI輔助診斷等核心醫療資訊技術與實務應用。',
    descriptionEn: 'Smart healthcare, electronic health records, big data analytics, and AI medical imaging.'
  },
  {
    name: '教育哲學',
    nameEn: 'Philosophy of Education',
    isEnrolled: true,
    instructor: '許育萍',
    instructorEn: 'Yu-Ping Hsu',
    locations: ['新聞所203'],
    timeSlots: ['四 6,7'],
    code: 'EduTch5104',
    serial: '56815',
    identifier: 'P01 U0110',
    credits: 2,
    url: 'https://course.ntu.edu.tw/courses/115-1/56815',
    remarks: '教育基礎課程，上課地點新聞所203。',
    remarksEn: 'Graduate Institute of Journalism Room 203.',
    description: '探討西方與東方教育哲學思想史，分析教育本質、知識論、倫理學在現代教學與教育政策中的反思與實踐。',
    descriptionEn: 'History of Western and Eastern educational philosophy and ethical reflection.'
  },
  {
    name: '人體結構與生命現象',
    nameEn: 'Human Structure and Life Phenomena',
    isEnrolled: false,
    instructor: '黃韻如',
    instructorEn: 'Yun-Ju Huang',
    locations: ['基醫406'],
    timeSlots: ['二 2,3,4'],
    code: 'DBME7040',
    serial: '45228',
    identifier: '528 M0700',
    credits: 3,
    url: 'https://course.ntu.edu.tw/courses/115-1/45228',
    remarks: '衝堂志願1 (待分發)。醫工所本課程以英語授課。合授老師:張允亮、吳培甄、吳振吉、林靜嫻、紀乃新等。',
    remarksEn: 'Taught in English.',
    description: '本課程以器官系統為架構，講授人體之巨觀與微觀解剖構造、正常生理運作機制以及與重大疾病相關之生命現象，建立跨領域生物醫學工程基礎。',
    descriptionEn: 'Anatomy and physiology of human organ systems and underlying life phenomena.'
  }
];

const semStart = new Date(2026, 8, 7, 0, 0, 0); // 2026-09-07

if (require.main === module) {
  // 1. 僅已選上 (示範檔)
  const enrolledOnly = allCourses.filter(c => c.isEnrolled);
  const icsEnrolled = generateICS(enrolledOnly, semStart, 16, '臺大示範課表 115-1 (已選上)');
  fs.writeFileSync('sample_schedule.ics', icsEnrolled, 'utf8');
  console.log('Saved sample_schedule.ics (sample courses)');
}

module.exports = { allCourses, generateICS };
