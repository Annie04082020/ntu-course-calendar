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
    instructor: "齊震宇",
    locations: ["共同101"],
    timeSlots: ["一 3,4", "三 3,4"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "普通物理學甲 (一)",
    instructor: "張寶棣",
    locations: ["普物館102"],
    timeSlots: ["二 2,3,4"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "計算機程式設計",
    instructor: "鄭卜壬",
    locations: ["資101"],
    timeSlots: ["四 6,7,8"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "資料結構與演算法",
    instructor: "呂學一",
    locations: ["博理101"],
    timeSlots: ["五 2,3,4"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  },
  {
    name: "機器學習",
    instructor: "李宏毅",
    locations: ["電二143"],
    timeSlots: ["一 7,8,9"],
    isEnrolled: true,
    url: "https://course.ntu.edu.tw"
  }
];

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
// 週課表檢視 (週一至週五 5 欄)
// -----------------------------------------------------------------------------
function renderWeeklyView(widget, weekSchedule, currentDayOfWeek, now) {
  const headerStack = widget.addStack();
  headerStack.centerAlignContent();

  const titleText = headerStack.addText("📅 臺大週課表");
  titleText.textColor = THEME.accent;
  titleText.font = Font.boldSystemFont(14);

  headerStack.addSpacer();

  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dateBadge = headerStack.addText(`${month}/${date} 週${currentDayOfWeek}`);
  dateBadge.textColor = THEME.secondary;
  dateBadge.font = Font.mediumSystemFont(12);

  widget.addSpacer(8);

  const gridStack = widget.addStack();
  gridStack.layoutHorizontally();
  gridStack.spacing = 6;

  const schoolDays = ['一', '二', '三', '四', '五'];

  schoolDays.forEach(day => {
    const col = gridStack.addStack();
    col.layoutVertically();
    col.cornerRadius = 8;
    col.setPadding(6, 6, 6, 6);

    const isToday = (day === currentDayOfWeek);
    col.backgroundColor = isToday ? THEME.cardBgHighlight : THEME.cardBg;

    // 欄位標題 (例如：週一)
    const dayTitleStack = col.addStack();
    dayTitleStack.centerAlignContent();
    const dayText = dayTitleStack.addText(`週${day}`);
    dayText.font = Font.boldSystemFont(12);
    dayText.textColor = isToday ? THEME.accentGlow : THEME.primary;
    if (isToday) {
      dayTitleStack.addSpacer(2);
      const dot = dayTitleStack.addText("●");
      dot.font = Font.systemFont(8);
      dot.textColor = THEME.success;
    }

    col.addSpacer(4);

    const dayCourses = weekSchedule[day] || [];
    if (dayCourses.length === 0) {
      const emptyText = col.addText("無課");
      emptyText.font = Font.systemFont(10);
      emptyText.textColor = THEME.secondary;
      emptyText.textOpacity = 0.5;
      col.addSpacer();
    } else {
      dayCourses.slice(0, 5).forEach((c, idx) => {
        if (idx > 0) col.addSpacer(3);

        const card = col.addStack();
        card.layoutVertically();
        card.setPadding(3, 4, 3, 4);
        card.cornerRadius = 4;
        card.backgroundColor = isToday ? new Color("3b82f6", 0.2) : new Color("ffffff", 0.05);

        const nameTxt = card.addText(c.name);
        nameTxt.font = Font.boldSystemFont(10.5);
        nameTxt.textColor = THEME.primary;
        nameTxt.lineLimit = 1;

        const timeTxt = card.addText(`${c.firstPeriod}-${c.lastPeriod}節`);
        timeTxt.font = Font.systemFont(9);
        timeTxt.textColor = THEME.accent;

        const locTxt = card.addText(c.location);
        locTxt.font = Font.systemFont(8.5);
        locTxt.textColor = THEME.secondary;
        locTxt.lineLimit = 1;
      });
      col.addSpacer();
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

  const titleTxt = leftStack.addText(`週${currentDayOfWeek} · 課表焦點`);
  titleTxt.font = Font.mediumSystemFont(11.5);
  titleTxt.textColor = THEME.secondary;

  leftStack.addSpacer(4);

  const targetCourse = currentCourse || nextCourse;
  if (targetCourse) {
    const isNow = Boolean(currentCourse);
    const badge = leftStack.addText(isNow ? "📍 目前上課中" : "⏳ 下一堂課程");
    badge.font = Font.boldSystemFont(11);
    badge.textColor = isNow ? THEME.warning : THEME.accentGlow;

    leftStack.addSpacer(2);

    const nameTxt = leftStack.addText(targetCourse.name);
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
    const doneTxt = leftStack.addText("🎉 今日課程");
    doneTxt.font = Font.boldSystemFont(14);
    doneTxt.textColor = THEME.success;

    const subTxt = leftStack.addText("已全部結束！好好放鬆休息。");
    subTxt.font = Font.systemFont(11);
    subTxt.textColor = THEME.secondary;
    leftStack.addSpacer();
  } else {
    const freeTxt = leftStack.addText("☕ 今日無課");
    freeTxt.font = Font.boldSystemFont(14.5);
    freeTxt.textColor = THEME.accent;

    const subTxt = leftStack.addText("今天沒有排定課堂，自由充實的一天！");
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

  const timelineTitle = rightStack.addText("今日課程行程");
  timelineTitle.font = Font.boldSystemFont(12);
  timelineTitle.textColor = THEME.primary;

  rightStack.addSpacer(4);

  if (todayCourses.length === 0) {
    const emptyNotice = rightStack.addText("好好享受放假時光～");
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

      const cName = row.addText(c.name);
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
  const titleTxt = widget.addText(`臺大課表 · 週${currentDayOfWeek}`);
  titleTxt.font = Font.boldSystemFont(12);
  titleTxt.textColor = THEME.accent;

  widget.addSpacer(6);

  const target = currentCourse || nextCourse;
  if (target) {
    const isNow = Boolean(currentCourse);
    const statusTxt = widget.addText(isNow ? "📍 上課中" : "⏳ 下一堂");
    statusTxt.font = Font.boldSystemFont(11);
    statusTxt.textColor = isNow ? THEME.warning : THEME.accentGlow;

    widget.addSpacer(2);

    const nameTxt = widget.addText(target.name);
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
    const freeTxt = widget.addText("🎉 今日無課");
    freeTxt.font = Font.boldSystemFont(15);
    freeTxt.textColor = THEME.success;

    const subTxt = widget.addText("好好放鬆休息！");
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
