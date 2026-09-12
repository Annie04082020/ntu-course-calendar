// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: graduation-cap;
/**
 * 臺大課程日曆好朋友 (NTU Course Calendar Buddy)
 * iOS / iPadOS 桌面課表小工具 (Scriptable Widget)
 *
 * 支援尺寸：
 * - 大尺寸 (Large 4x4) / iPad 特大尺寸 (Extra Large)：【週課表模式】週一至週五整週分欄矩陣，今天高亮顯示！
 * - 中尺寸 (Medium 4x2)：【今日課表模式】左側顯示目前/下堂課教室與倒數，右側顯示今日時間軸！
 * - 小尺寸 (Small 2x2)：【下堂課精簡模式】即時顯示下堂課與教室！
 * - Siri 語音朗讀支援：「嘿 Siri，我接下來有什麼課？」
 */

// =============================================================================
// 1. 課表資料 (由臺大課程日曆好朋友自動注入)
// =============================================================================
const USER_COURSES = /* __USER_COURSES_JSON__ */ [
  {
    name: "微積分甲 (一)",
    nameEn: "Calculus (1)",
    instructor: "齊震宇",
    instructorEn: "Zhen-Yu Qi",
    locations: ["共同101"],
    timeSlots: ["一 3,4", "三 3,4"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "普通物理學甲 (一)",
    nameEn: "General Physics (1)",
    instructor: "張寶棣",
    instructorEn: "Pao-Ti Chang",
    locations: ["普物館102"],
    timeSlots: ["二 2,3,4"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "計算機程式設計",
    nameEn: "Computer Programming",
    instructor: "鄭卜壬",
    instructorEn: "Pu-Jen Cheng",
    locations: ["資101"],
    timeSlots: ["四 6,7,8"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "資料結構與演算法",
    nameEn: "Data Structures and Algorithms",
    instructor: "呂學一",
    instructorEn: "Hsueh-I Lu",
    locations: ["博理101"],
    timeSlots: ["五 2,3,4"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "機器學習",
    nameEn: "Machine Learning",
    instructor: "李宏毅",
    instructorEn: "Hung-yi Lee",
    locations: ["電二143"],
    timeSlots: ["一 7,8,9"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  }
];

// 預設語言 (由匯出工具設定：'zh', 'en', 或 'bilingual')
const USER_LANG = /* __USER_LANG__ */ "zh";

const I18N_STRINGS = {
  zh: {
    weekTitle: "📅 臺大週課表",
    dayFocus: (d) => `週${d} · 課表焦點`,
    inClass: "📍 目前上課中",
    nextClass: "⏳ 下一堂課程",
    noMoreToday: "今日已無後續課程",
    noClassToday: "今日無課堂安排",
    freeDayTitle: "🎉 今日無課",
    freeDaySub: "好好放鬆休息！",
    timeColHeader: "節",
    periodUnit: "節",
    smallHeader: (d) => `臺大課表 · 週${d}`,
    smallInClass: "📍 上課中",
    smallNext: "⏳ 下一堂"
  },
  en: {
    weekTitle: "📅 NTU Timetable",
    dayFocus: (d) => `${WEEKDAY_NAMES_EN[d] || d} · Focus`,
    inClass: "📍 In Class",
    nextClass: "⏳ Next Class",
    noMoreToday: "No more classes today",
    noClassToday: "No classes scheduled today",
    freeDayTitle: "🎉 Free Day",
    freeDaySub: "Enjoy your time off!",
    timeColHeader: "Per",
    periodUnit: "P",
    smallHeader: (d) => `NTU · ${WEEKDAY_NAMES_EN[d] || d}`,
    smallInClass: "📍 In Class",
    smallNext: "⏳ Next"
  },
  bilingual: {
    weekTitle: "📅 臺大週課表 Schedule",
    dayFocus: (d) => `週${d} (${WEEKDAY_NAMES_EN[d] || d})`,
    inClass: "📍 目前上課中 Now",
    nextClass: "⏳ 下一堂課 Next",
    noMoreToday: "今日已無課 No more class",
    noClassToday: "今日無課堂 No class",
    freeDayTitle: "🎉 今日無課 Free Day",
    freeDaySub: "好好放鬆！ Enjoy your day!",
    timeColHeader: "節",
    periodUnit: "節",
    smallHeader: (d) => `課表 · ${WEEKDAY_NAMES_EN[d] || d}`,
    smallInClass: "📍 上課中",
    smallNext: "⏳ 下一堂"
  }
};

const I18N = I18N_STRINGS[USER_LANG] || I18N_STRINGS.zh;

function getCourseDisplayName(c) {
  if (!c) return "";
  if (USER_LANG === "en" && c.nameEn) return c.nameEn;
  if (USER_LANG === "bilingual" && c.nameEn && c.nameEn !== c.name) {
    return `${c.nameEn} ${c.name}`;
  }
  return c.name || "";
}

function getInstructorDisplayName(c) {
  if (!c) return "";
  if (USER_LANG === "en" && c.instructorEn) return c.instructorEn;
  return c.instructor || "";
}

// =============================================================================
// 2. 臺大標準節次與常數
// =============================================================================
const PERIOD_DEFS = {
  '0':  { p: '0',  time: '07:10', end: '08:00', startMin: 7 * 60 + 10, endMin: 8 * 60 },
  '1':  { p: '1',  time: '08:10', end: '09:00', startMin: 8 * 60 + 10, endMin: 9 * 60 },
  '2':  { p: '2',  time: '09:10', end: '10:00', startMin: 9 * 60 + 10, endMin: 10 * 60 },
  '3':  { p: '3',  time: '10:20', end: '11:10', startMin: 10 * 60 + 20, endMin: 11 * 60 + 10 },
  '4':  { p: '4',  time: '11:20', end: '12:10', startMin: 11 * 60 + 20, endMin: 12 * 60 + 10 },
  '5':  { p: '5',  time: '12:20', end: '13:10', startMin: 12 * 60 + 20, endMin: 13 * 60 + 10 },
  '6':  { p: '6',  time: '13:20', end: '14:10', startMin: 13 * 60 + 20, endMin: 14 * 60 + 10 },
  '7':  { p: '7',  time: '14:20', end: '15:10', startMin: 14 * 60 + 20, endMin: 15 * 60 + 10 },
  '8':  { p: '8',  time: '15:30', end: '16:20', startMin: 15 * 60 + 30, endMin: 16 * 60 + 20 },
  '9':  { p: '9',  time: '16:30', end: '17:20', startMin: 16 * 60 + 30, endMin: 17 * 60 + 20 },
  '10': { p: '10', time: '17:30', end: '18:20', startMin: 17 * 60 + 30, endMin: 18 * 60 + 20 },
  'A':  { p: 'A',  time: '18:25', end: '19:15', startMin: 18 * 60 + 25, endMin: 19 * 60 + 15 },
  'B':  { p: 'B',  time: '19:20', end: '20:10', startMin: 19 * 60 + 20, endMin: 20 * 60 + 10 },
  'C':  { p: 'C',  time: '20:15', end: '21:05', startMin: 20 * 60 + 15, endMin: 21 * 60 + 5 },
  'D':  { p: 'D',  time: '21:10', end: '22:00', startMin: 21 * 60 + 10, endMin: 22 * 60 }
};

const PERIOD_ORDER = ['0','1','2','3','4','5','6','7','8','9','10','A','B','C','D'];
const WEEKDAYS_MAP = ['日', '一', '二', '三', '四', '五', '六'];

// 配色主題（深色磨砂漸層）
const THEME = {
  bgStart: new Color("141824"),
  bgEnd: new Color("0b0e14"),
  cardBg: new Color("1e2433", 0.6),
  cardBgHighlight: new Color("3b82f6", 0.22),
  border: new Color("2d3748", 0.7),
  primary: new Color("ffffff"),
  secondary: new Color("94a3b8"),
  accent: new Color("60a5fa"),
  accentGlow: new Color("38bdf8"),
  success: new Color("34d399"),
  warning: new Color("fbbf24"),
  todayBadge: new Color("2563eb")
};

const WEEKDAY_NAMES_EN = {
  '一': 'MON',
  '二': 'TUE',
  '三': 'WED',
  '四': 'THU',
  '五': 'FRI',
  '六': 'SAT',
  '日': 'SUN'
};

// 課程卡片彩色磨砂主題庫
const COURSE_COLORS = [
  { bg: new Color("1d4ed8", 0.38), border: new Color("60a5fa", 0.65), text: new Color("ffffff"), sub: new Color("bfdbfe") }, // 藍
  { bg: new Color("047857", 0.38), border: new Color("34d399", 0.65), text: new Color("ffffff"), sub: new Color("a7f3d0") }, // 翡翠綠
  { bg: new Color("6d28d9", 0.38), border: new Color("a78bfa", 0.65), text: new Color("ffffff"), sub: new Color("ddd6fe") }, // 紫
  { bg: new Color("b45309", 0.38), border: new Color("fbbf24", 0.65), text: new Color("ffffff"), sub: new Color("fde68a") }, // 琥珀橙
  { bg: new Color("be185d", 0.38), border: new Color("f472b6", 0.65), text: new Color("ffffff"), sub: new Color("fbcfe8") }, // 玫瑰粉
  { bg: new Color("0e7490", 0.38), border: new Color("22d3ee", 0.65), text: new Color("ffffff"), sub: new Color("a5f3fc") }, // 湖水青
  { bg: new Color("4338ca", 0.38), border: new Color("818cf8", 0.65), text: new Color("ffffff"), sub: new Color("c7d2fe") }  // 靛藍
];

function getCourseColor(courseName) {
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = (hash * 31 + courseName.charCodeAt(i)) % COURSE_COLORS.length;
  }
  return COURSE_COLORS[Math.abs(hash)];
}

// =============================================================================
// 3. 節次字串解析輔助函式
// =============================================================================
function parseSlotGroups(slotStr) {
  if (!slotStr) return [];
  const clean = slotStr.replace(/\s+/g, '');
  const match = clean.match(/^([一二三四五六日])([\d,ABCDabcd]+)$/i);
  if (!match) return [];
  const weekday = match[1];
  let periodList = [];
  if (match[2].includes(',')) {
    periodList = match[2].split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  } else {
    const found = match[2].match(/10|[0-9A-Za-z]/g) || [];
    periodList = found.map(p => p.toUpperCase());
  }
  periodList = periodList.map(p => p.replace(/^0+([1-9])/, '$1'));

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

  return groups.map(g => ({
    weekday,
    periods: g,
    firstPeriod: g[0],
    lastPeriod: g[g.length - 1]
  }));
}

// 建立一週課表資料結構
function buildWeekSchedule(courses) {
  const schedule = { '一': [], '二': [], '三': [], '四': [], '五': [], '六': [], '日': [] };

  courses.forEach(c => {
    (c.timeSlots || []).forEach(slotStr => {
      const groups = parseSlotGroups(slotStr);
      groups.forEach(g => {
        const startDef = PERIOD_DEFS[g.firstPeriod];
        const endDef = PERIOD_DEFS[g.lastPeriod];
        if (!startDef || !endDef) return;

        schedule[g.weekday].push({
          name: c.name,
          instructor: c.instructor || '',
          location: (c.locations && c.locations.length) ? c.locations.join('、') : '依系所公告',
          firstPeriod: g.firstPeriod,
          lastPeriod: g.lastPeriod,
          periodsText: g.periods.length === 1 ? `第 ${g.firstPeriod} 節` : `第 ${g.firstPeriod}-${g.lastPeriod} 節`,
          startTimeText: startDef.time,
          endTimeText: endDef.end,
          startMin: startDef.startMin,
          endMin: endDef.endMin,
          isEnrolled: c.isEnrolled !== false,
          url: c.url || 'https://course.ntu.edu.tw'
        });
      });
    });
  });

  // 每一天依上課時間排序
  Object.keys(schedule).forEach(day => {
    schedule[day].sort((a, b) => a.startMin - b.startMin);
  });

  return schedule;
}

// =============================================================================
// 4. 小工具介面渲染器 (自適應 Medium / Large / ExtraLarge / Small)
// =============================================================================
async function createWidget() {
  const now = new Date();
  const currentDayOfWeek = WEEKDAYS_MAP[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const weekSchedule = buildWeekSchedule(USER_COURSES);
  const todayCourses = weekSchedule[currentDayOfWeek] || [];

  // 尋找當前課程或下一堂課
  let currentCourse = null;
  let nextCourse = null;
  for (const c of todayCourses) {
    if (currentMinutes >= c.startMin && currentMinutes <= c.endMin) {
      currentCourse = c;
      break;
    } else if (currentMinutes < c.startMin) {
      if (!nextCourse || c.startMin < nextCourse.startMin) {
        nextCourse = c;
      }
    }
  }

  // Siri 語音朗讀支援
  if (config.runsWithSiri) {
    if (currentCourse) {
      Speech.speak(`你現在正在上 ${currentCourse.name}，教室在 ${currentCourse.location}，預計 ${currentCourse.endTimeText} 下課。`);
    } else if (nextCourse) {
      Speech.speak(`你的下一堂課是 ${nextCourse.startTimeText} 的 ${nextCourse.name}，教室在 ${nextCourse.location}。`);
    } else if (todayCourses.length > 0) {
      Speech.speak(`你今天的課程已經全部上完了，放鬆一下吧！`);
    } else {
      Speech.speak(`今天沒有排定的課程，享受你的自由時光！`);
    }
    return;
  }

  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [THEME.bgStart, THEME.bgEnd];
  widget.backgroundGradient = gradient
  widget.setPadding(12, 14, 12, 14);

  // 判定尺寸模式 (支援 Large / ExtraLarge 週課表，以及 Medium 今日課表)
  const widgetFamily = config.widgetFamily || 'medium';

  if (widgetFamily === 'large' || widgetFamily === 'extraLarge') {
    // -------------------------------------------------------------------------
    // 【大尺寸 / iPad 週課表模式 (Weekly Grid)】
    // -------------------------------------------------------------------------
    renderWeeklyView(widget, weekSchedule, currentDayOfWeek, now);
  } else if (widgetFamily === 'small') {
    // -------------------------------------------------------------------------
    // 【小尺寸模式 (Small)】
    // -------------------------------------------------------------------------
    renderSmallView(widget, currentCourse, nextCourse, currentDayOfWeek, currentMinutes);
  } else {
    // -------------------------------------------------------------------------
    // 【中尺寸模式 (Medium)】(預設)
    // -------------------------------------------------------------------------
    renderMediumView(widget, todayCourses, currentCourse, nextCourse, currentDayOfWeek, currentMinutes);
  }

  return widget;
}

// -----------------------------------------------------------------------------
// 週課表檢視 (左側時間節次 + 頂部星期 2D 功課表矩陣)
// -----------------------------------------------------------------------------
function renderWeeklyView(widget, weekSchedule, currentDayOfWeek, now) {
  const headerStack = widget.addStack();
  headerStack.centerAlignContent();

  const titleText = headerStack.addText(I18N.weekTitle);
  titleText.textColor = THEME.accent;
  titleText.font = Font.boldSystemFont(13);

  headerStack.addSpacer();

  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dateBadge = headerStack.addText(USER_LANG === 'en' ? `${month}/${date} ${WEEKDAY_NAMES_EN[currentDayOfWeek] || currentDayOfWeek}` : `${month}/${date} 週${currentDayOfWeek}`);
  dateBadge.textColor = THEME.secondary;
  dateBadge.font = Font.mediumSystemFont(11.5);

  widget.addSpacer(6);

  // 1. 自動偵測課表涵蓋的節次範圍 (預設最少顯示 1~8 節 08:10~16:20)
  const allUsedPeriodIndices = [];
  Object.values(weekSchedule).forEach(dayList => {
    dayList.forEach(c => {
      const startIdx = PERIOD_ORDER.indexOf(c.firstPeriod);
      const endIdx = PERIOD_ORDER.indexOf(c.lastPeriod);
      if (startIdx !== -1 && endIdx !== -1) {
        for (let idx = startIdx; idx <= endIdx; idx++) {
          allUsedPeriodIndices.push(idx);
        }
      }
    });
  });

  let minPIdx = PERIOD_ORDER.indexOf('1');
  let maxPIdx = PERIOD_ORDER.indexOf('8');
  if (allUsedPeriodIndices.length > 0) {
    const dataMin = Math.min(...allUsedPeriodIndices);
    const dataMax = Math.max(...allUsedPeriodIndices);
    if (dataMin < minPIdx) minPIdx = dataMin;
    if (dataMax > maxPIdx) maxPIdx = dataMax;
  }
  const displayPeriods = PERIOD_ORDER.slice(minPIdx, maxPIdx + 1);

  // 2. 自適應計算每格高度與間距以撐滿小工具垂直空間
  const numPeriods = displayPeriods.length;
  let rowHeight = 30;
  let gap = 3;
  if (numPeriods <= 7) {
    rowHeight = 34;
    gap = 3;
  } else if (numPeriods === 8) {
    rowHeight = 30;
    gap = 3;
  } else if (numPeriods === 9) {
    rowHeight = 26;
    gap = 3;
  } else if (numPeriods === 10) {
    rowHeight = 23;
    gap = 2;
  } else {
    rowHeight = 20;
    gap = 2;
  }
  const headerRowHeight = 20;

  // 週末判斷 (若六日有課則延伸顯示，否則預設週一至週五以最大化單日寬度)
  const hasWeekendCourses = Boolean((weekSchedule['六'] && weekSchedule['六'].length > 0) || (weekSchedule['日'] && weekSchedule['日'].length > 0));
  const schoolDays = hasWeekendCourses ? ['一', '二', '三', '四', '五', '六', '日'] : ['一', '二', '三', '四', '五'];

  // 2D 矩陣容器 (水平排列各直欄)
  const matrixStack = widget.addStack();
  matrixStack.layoutHorizontally();
  matrixStack.spacing = gap;

  // ---------------------------------------------------------------------------
  // A. 時間節次欄 (最左側)
  // ---------------------------------------------------------------------------
  const timeCol = matrixStack.addStack();
  timeCol.layoutVertically();
  timeCol.size = new Size(26, 0);

  const timeHeaderCell = timeCol.addStack();
  timeHeaderCell.size = new Size(26, headerRowHeight);
  timeHeaderCell.centerAlignContent();
  const timeHeaderTxt = timeHeaderCell.addText(I18N.timeColHeader);
  timeHeaderTxt.font = Font.boldSystemFont(9.5);
  timeHeaderTxt.textColor = THEME.secondary;
  timeHeaderTxt.textOpacity = 0.6;

  timeCol.addSpacer(gap);

  for (let i = 0; i < displayPeriods.length; i++) {
    const p = displayPeriods[i];
    const def = PERIOD_DEFS[p] || { time: '' };
    const timeCell = timeCol.addStack();
    timeCell.layoutVertically();
    timeCell.size = new Size(26, rowHeight);
    timeCell.centerAlignContent();
    timeCell.cornerRadius = 4;
    timeCell.backgroundColor = new Color("ffffff", 0.03);

    const pLabel = timeCell.addText(p);
    pLabel.font = Font.boldSystemFont(9.5);
    pLabel.textColor = THEME.accentGlow;

    if (def.time && rowHeight >= 24) {
      const shortTime = def.time.replace(/^0/, '');
      const tLabel = timeCell.addText(shortTime);
      tLabel.font = Font.systemFont(7);
      tLabel.textColor = THEME.secondary;
      tLabel.textOpacity = 0.7;
    }

    if (i < displayPeriods.length - 1) {
      timeCol.addSpacer(gap);
    }
  }

  // ---------------------------------------------------------------------------
  // B. 星期欄 (週一至週五 功課表欄位)
  // ---------------------------------------------------------------------------
  schoolDays.forEach(day => {
    const isToday = (day === currentDayOfWeek);
    const dayCol = matrixStack.addStack();
    dayCol.layoutVertically();

    // 星期頂部標題格 (英文簡寫 MON/TUE/WED/THU/FRI)
    const dayHeaderCell = dayCol.addStack();
    dayHeaderCell.layoutHorizontally();
    dayHeaderCell.size = new Size(0, headerRowHeight);
    dayHeaderCell.centerAlignContent();
    dayHeaderCell.cornerRadius = 5;

    if (isToday) {
      dayHeaderCell.backgroundColor = THEME.todayBadge;
    } else {
      dayHeaderCell.backgroundColor = new Color("ffffff", 0.05);
    }

    dayHeaderCell.addSpacer();
    const enDay = WEEKDAY_NAMES_EN[day] || day;
    const dayLabel = dayHeaderCell.addText(enDay);
    dayLabel.font = Font.boldSystemFont(10.5);
    dayLabel.textColor = isToday ? THEME.primary : THEME.secondary;

    if (isToday) {
      dayHeaderCell.addSpacer(2);
      const dot = dayHeaderCell.addText("●");
      dot.font = Font.systemFont(6.5);
      dot.textColor = THEME.success;
    }
    dayHeaderCell.addSpacer();

    dayCol.addSpacer(gap);

    // 依節次排入課程卡片或空白網格
    const dayCourses = weekSchedule[day] || [];

    for (let i = 0; i < displayPeriods.length; i++) {
      const p = displayPeriods[i];
      const course = dayCourses.find(c => c.firstPeriod === p);

      if (course) {
        // 計算跨節跨度
        const covered = displayPeriods.filter(dp => {
          const dpIdx = PERIOD_ORDER.indexOf(dp);
          return dpIdx >= PERIOD_ORDER.indexOf(course.firstPeriod) && dpIdx <= PERIOD_ORDER.indexOf(course.lastPeriod);
        });
        const span = Math.max(1, covered.length);
        const cardHeight = span * rowHeight + (span - 1) * gap;

        const colorTheme = getCourseColor(course.name);

        const card = dayCol.addStack();
        card.layoutVertically();
        card.size = new Size(0, cardHeight);
        card.cornerRadius = 5;
        card.setPadding(3, 4, 3, 4);
        card.backgroundColor = colorTheme.bg;
        card.borderColor = colorTheme.border;
        card.borderWidth = 1;
        card.url = course.url;

        // 課程名稱
        const displayName = getCourseDisplayName(course);
        const nameTxt = card.addText(displayName);
        nameTxt.font = Font.boldSystemFont(span >= 2 ? 10 : 8.5);
        nameTxt.textColor = colorTheme.text;
        nameTxt.lineLimit = span >= 3 ? 3 : (span >= 2 ? 2 : 1);

        // 教室地點（自動換行以完整顯示「綜合教學館 701教室」等長名稱）
        if (course.location && span >= 2) {
          card.addSpacer(1);
          const locTxt = card.addText(`📍${course.location}`);
          locTxt.font = Font.systemFont(7.8);
          locTxt.textColor = colorTheme.sub;
          locTxt.lineLimit = 0;
        }

        // 跨 3 節以上顯示起訖節次資訊
        if (span >= 3) {
          card.addSpacer(1);
          const timeBadge = card.addText(`${course.firstPeriod}-${course.lastPeriod}${I18N.periodUnit}`);
          timeBadge.font = Font.systemFont(7.5);
          timeBadge.textColor = colorTheme.sub;
          timeBadge.textOpacity = 0.85;
        }

        // 跳過已跨越的節次
        i += (span - 1);
      } else {
        // 空白時段格 (維持功課表整齊對齊的網格線)
        const emptySlot = dayCol.addStack();
        emptySlot.size = new Size(0, rowHeight);
        emptySlot.cornerRadius = 4;
        emptySlot.backgroundColor = isToday ? new Color("3b82f6", 0.05) : new Color("ffffff", 0.02);
        emptySlot.borderColor = isToday ? new Color("3b82f6", 0.12) : new Color("2d3748", 0.25);
        emptySlot.borderWidth = 0.5;
      }

      if (i < displayPeriods.length - 1) {
        dayCol.addSpacer(gap);
      }
    }
  });
}

// -----------------------------------------------------------------------------
// 中尺寸檢視 (今日焦點 + 時間軸)
// -----------------------------------------------------------------------------
function renderMediumView(widget, todayCourses, currentCourse, nextCourse, currentDayOfWeek, currentMinutes) {
  const rootStack = widget.addStack();
  rootStack.layoutHorizontally();
  rootStack.spacing = 12;

  // 左側：目前狀態或下一堂課
  const leftStack = rootStack.addStack();
  leftStack.layoutVertically();
  leftStack.size = new Size(130, 0);

  const titleTxt = leftStack.addText(I18N.dayFocus(currentDayOfWeek));
  titleTxt.font = Font.mediumSystemFont(11.5);
  titleTxt.textColor = THEME.secondary;

  leftStack.addSpacer(4);

  const targetCourse = currentCourse || nextCourse;
  if (targetCourse) {
    const isNow = Boolean(currentCourse);
    const badge = leftStack.addText(isNow ? I18N.inClass : I18N.nextClass);
    badge.font = Font.boldSystemFont(11);
    badge.textColor = isNow ? THEME.warning : THEME.accentGlow;

    leftStack.addSpacer(2);

    const nameTxt = leftStack.addText(getCourseDisplayName(targetCourse));
    nameTxt.font = Font.boldSystemFont(14.5);
    nameTxt.textColor = THEME.primary;
    nameTxt.lineLimit = 2;

    leftStack.addSpacer(2);

    const locTxt = leftStack.addText(`📍 ${targetCourse.location}`);
    locTxt.font = Font.mediumSystemFont(11);
    locTxt.textColor = THEME.primary;
    locTxt.lineLimit = 1;

    const timeTxt = leftStack.addText(`⏰ ${targetCourse.startTimeText} - ${targetCourse.endTimeText}`);
    timeTxt.font = Font.systemFont(10.5);
    timeTxt.textColor = THEME.secondary;

    leftStack.addSpacer();
  } else if (todayCourses.length > 0) {
    const doneTxt = leftStack.addText(I18N.freeDayTitle);
    doneTxt.font = Font.boldSystemFont(14);
    doneTxt.textColor = THEME.success;

    const subTxt = leftStack.addText(I18N.noMoreToday);
    subTxt.font = Font.systemFont(11);
    subTxt.textColor = THEME.secondary;
    leftStack.addSpacer();
  } else {
    const freeTxt = leftStack.addText(I18N.freeDayTitle);
    freeTxt.font = Font.boldSystemFont(14.5);
    freeTxt.textColor = THEME.accent;

    const subTxt = leftStack.addText(I18N.noClassToday);
    subTxt.font = Font.systemFont(11);
    subTxt.textColor = THEME.secondary;
    leftStack.addSpacer();
  }

  // 分隔線
  const divider = rootStack.addStack();
  divider.backgroundColor = THEME.border;
  divider.size = new Size(1, 0);

  // 右側：今日時間軸列表
  const rightStack = rootStack.addStack();
  rightStack.layoutVertically();

  const timelineTitle = rightStack.addText(USER_LANG === 'en' ? "Today's Schedule" : "今日課程行程");
  timelineTitle.font = Font.boldSystemFont(12);
  timelineTitle.textColor = THEME.primary;

  rightStack.addSpacer(4);

  if (todayCourses.length === 0) {
    const emptyNotice = rightStack.addText(I18N.freeDaySub);
    emptyNotice.font = Font.systemFont(11);
    emptyNotice.textColor = THEME.secondary;
    rightStack.addSpacer();
  } else {
    todayCourses.slice(0, 3).forEach((c, idx) => {
      if (idx > 0) rightStack.addSpacer(4);

      const isCurrent = (currentCourse && currentCourse.name === c.name);
      const isPast = (currentMinutes > c.endMin);

      const row = rightStack.addStack();
      row.centerAlignContent();
      row.setPadding(3, 6, 3, 6);
      row.cornerRadius = 5;
      row.backgroundColor = isCurrent ? THEME.cardBgHighlight : (isPast ? new Color("ffffff", 0.02) : THEME.cardBg);

      const timeTag = row.addText(`${c.startTimeText}`);
      timeTag.font = Font.boldSystemFont(10.5);
      timeTag.textColor = isCurrent ? THEME.accentGlow : (isPast ? THEME.secondary : THEME.accent);
      timeTag.size = new Size(38, 0);

      const cName = row.addText(getCourseDisplayName(c));
      cName.font = Font.mediumSystemFont(11);
      cName.textColor = isPast ? THEME.secondary : THEME.primary;
      cName.lineLimit = 1;

      row.addSpacer();

      const cRoom = row.addText(c.location);
      cRoom.font = Font.systemFont(9.5);
      cRoom.textColor = THEME.secondary;
      cRoom.lineLimit = 1;
    });
    rightStack.addSpacer();
  }
}

// -----------------------------------------------------------------------------
// 小尺寸檢視 (Small)
// -----------------------------------------------------------------------------
function renderSmallView(widget, currentCourse, nextCourse, currentDayOfWeek, currentMinutes) {
  const titleTxt = widget.addText(I18N.smallHeader(currentDayOfWeek));
  titleTxt.font = Font.boldSystemFont(12);
  titleTxt.textColor = THEME.accent;

  widget.addSpacer(6);

  const target = currentCourse || nextCourse;
  if (target) {
    const isNow = Boolean(currentCourse);
    const statusTxt = widget.addText(isNow ? I18N.smallInClass : I18N.smallNext);
    statusTxt.font = Font.boldSystemFont(11);
    statusTxt.textColor = isNow ? THEME.warning : THEME.accentGlow;

    widget.addSpacer(2);

    const nameTxt = widget.addText(getCourseDisplayName(target));
    nameTxt.font = Font.boldSystemFont(15);
    nameTxt.textColor = THEME.primary;
    nameTxt.lineLimit = 2;

    widget.addSpacer(2);

    const locTxt = widget.addText(`📍 ${target.location}`);
    locTxt.font = Font.mediumSystemFont(11);
    locTxt.textColor = THEME.primary;
    locTxt.lineLimit = 1;

    const timeTxt = widget.addText(`⏰ ${target.startTimeText}`);
    timeTxt.font = Font.systemFont(10.5);
    timeTxt.textColor = THEME.secondary;
    widget.addSpacer();
  } else {
    const freeTxt = widget.addText(I18N.freeDayTitle);
    freeTxt.font = Font.boldSystemFont(15);
    freeTxt.textColor = THEME.success;

    const subTxt = widget.addText(I18N.freeDaySub);
    subTxt.font = Font.systemFont(11.5);
    subTxt.textColor = THEME.secondary;
    widget.addSpacer();
  }
}

// =============================================================================
// 5. 執行或在 Scriptable App 內預覽
// =============================================================================
const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // 在 App 內點擊執行時，依設備提供即時預覽
  if (Device.isPad()) {
    await widget.presentLarge();
  } else {
    await widget.presentMedium();
  }
}
Script.complete();
