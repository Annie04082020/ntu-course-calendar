/**
 * NTU 課程 → Google Calendar ICS 匯出工具
 * 專為國立臺灣大學 (NTU) 學生打造
 * 
 * 支援平臺：
 * 1. 【臺大網路選課系統 (正選/加退選)】：
 *    - 時間表頁面 (coursetake2/coutake/cou-sched)
 *    - 選課記錄頁面 (coursetake2/coutake/mainscr)
 *    - 支援自動背景非同步獲取完整教室、教師、流水號與課程代碼
 * 2. 【臺大課程網 (預選/初選結果)】：
 *    - 初選結果列表 (course.ntu.edu.tw/result/prereg2/list)
 *    - 初選結果課表 (course.ntu.edu.tw/result/prereg2/table)
 * 
 * 核心功能：
 * - 自動區分「已選上課程」與「待分發/候補志願課程」
 * - 支援手動自由勾選欲匯出的課程，未選上課程可加上 [候補] 標記
 * - 完整台大 16 節次對照 (包含 0~10 節及 A~D 夜間節次)
 * - 智慧連續節次合併 (例如 三 2,3,4,5 合併為 09:10-13:10)
 * - 預設 115-1 開學日 2026/09/07，台大新制 16 週
 * - 一鍵產出標準 RFC 5545 .ics 檔案，支援 Google / Apple / Outlook 日曆
 */

(async function () {
  'use strict';

  // ── 臺大標準節次時間對照表 ─────────────────────────────────────────────
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

  // ── 1. 連續節次合併 ──────────────────────────────────────────────────
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

  // ── 2. ICS 檔案格式化 ────────────────────────────────────────────────
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
    if (str.length <= 75) return str;
    const parts = [str.slice(0, 75)];
    let i = 75;
    while (i < str.length) {
      parts.push(' ' + str.slice(i, i + 74));
      i += 74;
    }
    return parts.join('\r\n');
  }

  function escapeICS(str) {
    return (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function generateUID() {
    return 'ntu-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '@course.ntu.edu.tw';
  }

  function generateICS(courses, semesterStart, totalWeeks, markWaitlist = true) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NTU Course Calendar Exporter//ZH-TW',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:臺大課程表 115-1',
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

          const descParts = [];
          if (course.isEnrolled === false) {
            descParts.push('⚠️【選課狀態】：志願排隊中（未選上）');
          } else {
            descParts.push('✅【選課狀態】：已選上');
          }
          if (course.instructor) descParts.push('授課教師：' + course.instructor);
          if (course.code) descParts.push('課號：' + course.code);
          if (course.serial) descParts.push('流水號：' + course.serial);
          if (course.identifier) descParts.push('課程識別碼：' + course.identifier);
          if (course.locations.length) descParts.push('教室：' + course.locations.join('、'));
          if (course.remarks) descParts.push('備註：' + course.remarks);
          if (course.description) descParts.push('\n【課程概述】\n' + course.description);
          descParts.push('\n課程網址：' + course.url);

          const locationText = course.locations.join('、') || '依系所公告';
          const summaryText = (markWaitlist && course.isEnrolled === false ? '[候補] ' : '') + course.name;

          lines.push(
            'BEGIN:VEVENT',
            foldLine('UID:' + generateUID()),
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

  // ── 3. 解析器 A：臺大網路選課系統 (mainscr 選課記錄) ───────────────────
  function parseMainscrTimeLoc(timeLocStr) {
    const timeSlots = [];
    const locations = [];
    const regex = /([一二三四五六日])\s*([0-9ABCDabcd]+)(?:\s*\(([^)]+)\))?/g;
    let m;
    while ((m = regex.exec(timeLocStr)) !== null) {
      const weekday = m[1];
      const rawPeriods = m[2];
      const loc = m[3] ? m[3].trim() : '';
      const periods = rawPeriods.match(/10|[0-9A-Za-z]/g) || [];
      if (periods.length > 0) {
        timeSlots.push(weekday + ' ' + periods.join(','));
      }
      if (loc && !locations.includes(loc)) {
        locations.push(loc);
      }
    }
    return { timeSlots, locations };
  }

  function parseMainscrDoc(doc) {
    const courses = [];
    const trs = Array.from(doc.querySelectorAll('table tr'));
    
    for (const tr of trs) {
      const tds = Array.from(tr.querySelectorAll('td'));
      if (tds.length < 8) continue;

      const statusText = tds[0].textContent.trim();
      const serial = tds[1].textContent.trim();
      const codeIdText = tds[2].textContent.trim();
      const name = tds[3].textContent.trim();
      const section = tds[4].textContent.trim();
      const credits = tds[5].textContent.trim();
      const instructor = tds[6].textContent.trim();
      const timeLoc = tds[7].textContent.trim();

      // 檢查是否為標題列
      if (statusText === '狀態' || !serial.match(/^\d+$/) || !name) continue;

      const isEnrolled = statusText.includes('已選上');
      const { timeSlots, locations } = parseMainscrTimeLoc(timeLoc);
      const codeParts = codeIdText.split(/\s+/);
      const code = codeParts[0] || '';
      const identifier = codeParts.slice(1).join(' ') || '';

      courses.push({
        id: 'c_' + serial,
        name,
        isEnrolled,
        instructor,
        serial,
        code,
        identifier,
        timeSlots,
        locations,
        remarks: (section ? '班次: ' + section + '；' : '') + (credits ? credits + ' 學分' : ''),
        url: `https://course.ntu.edu.tw/courses/115-1/${serial}`,
        description: '',
      });
    }

    return courses;
  }

  // ── 4. 解析器 B：臺大選課系統 (cou-sched 時間表備用網格解析) ────────────
  function parseCouSchedDoc(doc) {
    const coursesMap = new Map();
    const table = doc.querySelector('table');
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return [];

    const weekdays = ['一', '二', '三', '四', '五', '六'];

    for (let r = 1; r < rows.length; r++) {
      const tr = rows[r];
      const cells = Array.from(tr.querySelectorAll('td, th'));
      if (cells.length < 2) continue;

      const periodCellText = cells[0].textContent.trim();
      const periodMatch = periodCellText.match(/(?:^|\D)(10|[0-9A-D])(?:\D|$)/i);
      if (!periodMatch) continue;
      const period = periodMatch[1].toUpperCase();

      for (let c = 1; c < Math.min(cells.length, 7); c++) {
        const weekday = weekdays[c - 1];
        const cell = cells[c];
        const text = cell.textContent.trim();
        if (!text) continue;

        // 判斷是否待分發
        const isWaitlist = cell.innerHTML.includes('待分發') || cell.className.includes('wait') || (cell.getAttribute('style') && cell.getAttribute('style').includes('green'));
        const isEnrolled = !isWaitlist;

        const courseName = text.replace(/[\n\r]+/g, ' ').trim();
        if (!coursesMap.has(courseName)) {
          coursesMap.set(courseName, {
            id: 'sched_' + Math.random().toString(36).slice(2, 7),
            name: courseName,
            isEnrolled,
            instructor: '',
            serial: '',
            code: '',
            identifier: '',
            timeSlots: [],
            locations: [],
            remarks: '',
            url: 'https://course.ntu.edu.tw',
            description: '',
            _slots: {}
          });
        }
        const item = coursesMap.get(courseName);
        if (!item._slots[weekday]) item._slots[weekday] = [];
        if (!item._slots[weekday].includes(period)) item._slots[weekday].push(period);
      }
    }

    const courses = Array.from(coursesMap.values()).map(c => {
      const timeSlots = [];
      for (const [w, plist] of Object.entries(c._slots)) {
        timeSlots.push(`${w} ${plist.join(',')}`);
      }
      c.timeSlots = timeSlots;
      delete c._slots;
      return c;
    });

    return courses;
  }

  // ── 5. 解析器 C：臺大課程網 (course.ntu.edu.tw) ─────────────────────────
  function parseCourseNtuDoc(doc) {
    const courses = [];
    const seen = new Set();
    const courseLinks = Array.from(doc.querySelectorAll('a[href*="/courses/"]'));

    const unselectedHeader = Array.from(doc.querySelectorAll('*')).find(el => 
      el.children.length === 0 && el.textContent.trim().startsWith('未選上課程')
    );

    for (const a of courseLinks) {
      const href = a.getAttribute('href') || '';
      if (seen.has(href)) continue;
      seen.add(href);

      const courseName = a.textContent.trim();
      if (!courseName) continue;

      let card = a.closest('tr, li, article, [class*="card"], [class*="item"]');
      if (!card) {
        card = a;
        for (let i = 0; i < 6; i++) {
          if (!card.parentElement || card.parentElement === doc.body) break;
          if (card.parentElement.querySelectorAll('a[href*="/courses/"]').length > 1) break;
          card = card.parentElement;
        }
      }

      let isEnrolled = true;
      if (unselectedHeader && (unselectedHeader.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        isEnrolled = false;
      }

      const cardText = card.innerText || '';

      // 精確匹配節次 (10 或 0~9, A~D，絕不誤配 07, 14 等日期數字)
      const timePattern = /([一二三四五六日])\s*((?:10|[0-9A-Da-d])(?:[,，]\s*(?:10|[0-9A-Da-d]))*)/g;
      const timeSlots = [];
      let tm;
      while ((tm = timePattern.exec(cardText)) !== null) {
        timeSlots.push(tm[1] + ' ' + tm[2].replace(/[，\s]/g, ','));
      }

      const locations = [];
      const badges = Array.from(card.querySelectorAll('div, span'))
        .map(el => el.textContent.trim())
        .filter(t => t.length > 0 && t.length < 25);

      for (const t of badges) {
        if (/^[普博資電工管文法醫社外音體綜新研思]\S*\d{2,4}/.test(t) || /^[A-Za-z0-9\u4e00-\u9fa5]+(?:館|樓|所|大樓)\d*/.test(t)) {
          if (!locations.includes(t) && !t.includes('學分') && !t.includes('選上') && !t.includes('人') && !t.includes('班')) {
            locations.push(t);
          }
        }
      }

      const locRegex = /(?:上課地點|上課教室|教室)[：:\s]*([^\s,，。\n\r]+)/g;
      let lm;
      while ((lm = locRegex.exec(cardText)) !== null) {
        const loc = lm[1].replace(/[。，,]/g, '').trim();
        if (loc && !locations.includes(loc)) locations.push(loc);
      }

      let instructor = '';
      const instBadge = badges.find(b => /^[\u4e00-\u9fa5]{2,4}$/.test(b) && !['已選上','未選上','英文授課','領域專長','全英語','必修','選修'].includes(b));
      if (instBadge) {
        instructor = instBadge;
      } else {
        const instMatch = cardText.match(/授課教師[：:\s]*([^\n\r]+)/);
        if (instMatch) instructor = instMatch[1].trim();
      }

      const serialUrlMatch = href.match(/\/courses\/[^\/]+\/(\d+)/);
      const serialMatch = cardText.match(/流水號\s*[:：]?\s*(\d+)/);
      const codeMatch = cardText.match(/課號\s*[:：]?\s*([A-Za-z0-9]+)/);
      const idMatch = cardText.match(/課程識別碼\s*[:：]?\s*([A-Za-z0-9\s]+)/);
      const creditMatch = cardText.match(/(\d+(?:\.\d+)?)\s*學分/);

      const remarks = [];
      const remarkLines = cardText.split('\n').map(s => s.trim()).filter(Boolean);
      for (const line of remarkLines) {
        if (line.includes('授課') || line.includes('本課程') || line.includes('限') || line.includes('備註')) {
          if (!remarks.includes(line) && line.length < 80) remarks.push(line);
        }
      }

      const finalSerial = (serialUrlMatch ? serialUrlMatch[1] : (serialMatch ? serialMatch[1] : ''));

      courses.push({
        id: 'c_' + (finalSerial || Math.random().toString(36).slice(2, 7)),
        name: courseName,
        isEnrolled,
        url: href.startsWith('http') ? href : 'https://course.ntu.edu.tw' + href,
        instructor,
        credits: creditMatch ? parseFloat(creditMatch[1]) : 0,
        timeSlots: [...new Set(timeSlots)],
        locations: [...new Set(locations)],
        serial: finalSerial,
        code: codeMatch ? codeMatch[1] : '',
        identifier: idMatch ? idMatch[1].trim() : '',
        remarks: remarks.slice(0, 3).join('；'),
        description: '',
      });
    }

    return courses;
  }

  // ── 6. 跨系統整合異步解析 ─────────────────────────────────────────────
  async function resolveCourses() {
    const isAca = location.hostname.includes('aca.ntu.edu.tw') || location.pathname.includes('coursetake2');
    const isCourseNtu = location.hostname.includes('course.ntu.edu.tw');

    if (!isAca && !isCourseNtu) {
      alert('【臺大課程匯出工具】\n請在「臺大網路選課系統 (aca.ntu.edu.tw)」或「臺大課程網 (course.ntu.edu.tw)」登入後點擊此書籤！');
      return null;
    }

    // 模式 A：在正式網路選課系統
    if (isAca) {
      // 1. 若目前正在選課記錄 (mainscr)
      if (location.pathname.includes('mainscr') || document.querySelector('table')?.textContent.includes('流水號')) {
        const list = parseMainscrDoc(document);
        if (list.length > 0) return { courses: list, source: '臺大正式選課系統 · 選課記錄' };
      }

      // 2. 若目前在時間表 (cou-sched) 或其他選課系統子頁面，優先嘗試同源 fetch mainscr
      try {
        const search = location.search;
        let mainscrUrl = '';
        if (location.pathname.includes('cou-sched')) {
          mainscrUrl = location.href.replace('cou-sched', 'mainscr');
        } else {
          mainscrUrl = new URL('../coutake/mainscr' + search, location.href).href;
        }

        const res = await fetch(mainscrUrl);
        if (res.ok) {
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const list = parseMainscrDoc(doc);
          if (list.length > 0) {
            return { courses: list, source: '臺大正式選課系統 · 時間表同步' };
          }
        }
      } catch (err) {
        console.warn('Fetch mainscr error:', err);
      }

      // 3. Fallback: 直接解析 cou-sched 網格
      const gridList = parseCouSchedDoc(document);
      if (gridList.length > 0) {
        return { courses: gridList, source: '臺大正式選課系統 · 時間表網格' };
      }

      alert('未能在選課系統中偵測到課表。請確認您已點選上方導覽列的「時間表」或「選課記錄」！');
      return null;
    }

    // 模式 B：在課程網 (course.ntu.edu.tw)
    const ntuList = parseCourseNtuDoc(document);
    if (ntuList.length > 0) {
      return { courses: ntuList, source: '臺大課程網 · 選課結果' };
    }

    alert('未在課程網中偵測到課程。請確認您在「選課結果」列表頁面 (https://course.ntu.edu.tw/result/prereg2/list)！');
    return null;
  }

  // ── 7. 背景抓取課程概述與詳細資訊 (同源 course.ntu.edu.tw) ────────────────────────
  async function fetchCourseDescriptions(courses, onProgress) {
    if (!location.hostname.includes('course.ntu.edu.tw')) return;
    let completed = 0;
    for (const course of courses) {
      if (!course.url) {
        completed++;
        onProgress(completed, courses.length);
        continue;
      }
      try {
        const res = await fetch(course.url);
        if (res.ok) {
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const text = doc.body.innerText || '';

          // 1. 課程概述
          const match = text.match(/課程概述[：:\s]*([\s\S]*?)(?:課程目標|課程大綱|評量方式|指定閱讀|$)/);
          if (match && match[1].trim()) {
            course.description = match[1].trim().slice(0, 400);
          }

          // 2. 補充教師 (若清單頁未抓到)
          if (!course.instructor) {
            const teacherMatch = text.match(/授課教師[：:\s]*([^\n\r]+)/);
            if (teacherMatch) course.instructor = teacherMatch[1].trim().split(/[\s,，]+/)[0];
          }

          // 3. 補充學分 (若為 0 或未抓到)
          if (!course.credits || course.credits === 0) {
            const credMatch = text.match(/(\d+(?:\.\d+)?)\s*學分/);
            if (credMatch) course.credits = parseFloat(credMatch[1]);
          }

          // 4. 補充教室
          if (!course.locations || course.locations.length === 0) {
            const locMatch = text.match(/(?:上課教室|教室|地點)[：:\s]*([^\n\r,，。]+)/);
            if (locMatch) {
              const loc = locMatch[1].trim();
              if (loc && !loc.includes('未定') && !loc.includes('依系所')) course.locations = [loc];
            }
          }

          // 5. 補充時間節次 (若原本未抓到或節次有疑慮)
          if (!course.timeSlots || course.timeSlots.length === 0) {
            const tp = /([一二三四五六日])\s*((?:10|[0-9A-Da-d])(?:[,，]\s*(?:10|[0-9A-Da-d]))*)/g;
            const foundSlots = [];
            let tm;
            while ((tm = tp.exec(text)) !== null) {
              foundSlots.push(tm[1] + ' ' + tm[2].replace(/[，\s]/g, ','));
            }
            if (foundSlots.length > 0) {
              course.timeSlots = [...new Set(foundSlots)];
            }
          }
        }
      } catch (e) {
        // silent
      }
      completed++;
      onProgress(completed, courses.length);
    }
  }

  // ── 8. 顯示彈出視窗 ──────────────────────────────────────────────────
  function showOverlay(courses, sourceName) {
    const existing = document.getElementById('ntu-ics-overlay');
    if (existing) existing.remove();

    const enrolledList = courses.filter(c => c.isEnrolled);
    const unselectedList = courses.filter(c => !c.isEnrolled);

    const style = document.createElement('style');
    style.id = 'ntu-ics-style';
    style.textContent = `
      #ntu-ics-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 999999; display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
        color: #1e293b;
      }
      #ntu-ics-backdrop {
        position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(6px);
      }
      #ntu-ics-modal {
        position: relative; width: 620px; max-width: 92vw; max-height: 90vh;
        background: #ffffff; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
        display: flex; flex-direction: column; overflow: hidden;
        animation: ntuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes ntuFadeIn {
        from { opacity: 0; transform: scale(0.96) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      #ntu-ics-header {
        padding: 18px 22px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: #ffffff; display: flex; justify-content: space-between; align-items: center;
      }
      #ntu-ics-title {
        font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px;
      }
      #ntu-ics-close {
        background: rgba(255, 255, 255, 0.2); border: none; color: #fff;
        width: 30px; height: 30px; border-radius: 50%; font-size: 16px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      #ntu-ics-close:hover { background: rgba(255, 255, 255, 0.35); }
      #ntu-ics-body {
        padding: 18px 22px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px;
      }
      .ntu-box {
        background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;
      }
      .ntu-box-title {
        font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px;
        display: flex; justify-content: space-between; align-items: center;
      }
      .ntu-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .ntu-label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px; display: block; }
      .ntu-input {
        width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1;
        border-radius: 8px; font-size: 13.5px; background: #ffffff; color: #1e293b;
      }
      .ntu-opt-bar {
        display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #334155;
      }
      .ntu-sect-header {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 14px; font-weight: 700; margin-bottom: 8px;
      }
      .ntu-btn-link {
        background: none; border: none; color: #4f46e5; font-size: 12px; font-weight: 600;
        cursor: pointer; padding: 2px 6px;
      }
      .ntu-btn-link:hover { text-decoration: underline; }
      .ntu-course-list {
        display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;
      }
      .ntu-item {
        background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
        padding: 10px 12px; cursor: pointer; transition: all 0.15s;
      }
      .ntu-item:hover { border-color: #94a3b8; background: #f1f5f9; }
      .ntu-item.active { border-color: #6366f1; background: #eef2ff; }
      .ntu-item.unselected-card.active { border-color: #f59e0b; background: #fffbeb; }
      .ntu-item-top {
        display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
      }
      .ntu-checkbox { cursor: pointer; accent-color: #4f46e5; width: 16px; height: 16px; }
      .ntu-item.unselected-card .ntu-checkbox { accent-color: #f59e0b; }
      .ntu-item-name { font-size: 14px; font-weight: 700; color: #0f172a; flex: 1; }
      .ntu-tag-enrolled {
        background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700;
        padding: 2px 6px; border-radius: 4px;
      }
      .ntu-tag-wait {
        background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700;
        padding: 2px 6px; border-radius: 4px;
      }
      .ntu-item-teacher { font-size: 12px; color: #64748b; font-weight: 500; }
      .ntu-item-meta {
        font-size: 12px; color: #64748b; display: flex; gap: 12px; align-items: center;
      }
      .ntu-loc-tag {
        background: #e2e8f0; color: #334155; padding: 1px 6px; border-radius: 4px; font-weight: 600;
      }
      #ntu-footer {
        padding: 14px 22px; background: #f8fafc; border-top: 1px solid #e2e8f0;
        display: flex; justify-content: space-between; align-items: center;
      }
      .ntu-btn-sec {
        padding: 9px 16px; border-radius: 10px; border: 1px solid #cbd5e1;
        background: #ffffff; color: #475569; font-size: 13.5px; font-weight: 600; cursor: pointer;
      }
      .ntu-btn-sec:hover { background: #f1f5f9; }
      .ntu-btn-primary {
        padding: 9px 20px; border-radius: 10px; border: none;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: #ffffff; font-size: 13.5px; font-weight: 700;
        cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35); transition: all 0.15s;
      }
      .ntu-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
      .ntu-btn-accent {
        padding: 9px 15px; border-radius: 10px; border: 1px solid #c7d2fe;
        background: #eef2ff; color: #4338ca; font-size: 13px; font-weight: 700;
        cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
        transition: all 0.15s;
      }
      .ntu-btn-accent:hover { background: #e0e7ff; color: #3730a3; border-color: #a5b4fc; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'ntu-ics-overlay';
    overlay.innerHTML = `
      <div id="ntu-ics-backdrop"></div>
      <div id="ntu-ics-modal">
        <div id="ntu-ics-header">
          <div id="ntu-ics-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            匯出至 Google 日曆 (NTU ICS)
          </div>
          <button id="ntu-ics-close" aria-label="關閉">✕</button>
        </div>

        <div id="ntu-ics-body">
          <div class="ntu-box">
            <div class="ntu-box-title">
              <span>📅 學期設定 · <small style="color:#4f46e5;font-weight:600">${sourceName}</small></span>
              <span class="ntu-desc-status" id="ntu-desc-status">⚡ 課表就緒</span>
            </div>
            <div class="ntu-grid-2">
              <div>
                <label class="ntu-label">開學日期 (週一)</label>
                <input type="date" id="ntu-start" class="ntu-input" value="2026-09-07" />
              </div>
              <div>
                <label class="ntu-label">總週數 (台大現制 16 週)</label>
                <input type="number" id="ntu-weeks" class="ntu-input" value="16" min="1" max="20" />
              </div>
            </div>
            <div class="ntu-opt-bar" style="margin-top:10px;">
              <input type="checkbox" id="ntu-opt-mark" checked style="accent-color:#f59e0b;cursor:pointer" />
              <label for="ntu-opt-mark" style="cursor:pointer">未選上志願課程標題加上 <strong>[候補]</strong> 標記</label>
            </div>
          </div>

          <!-- Section 1: Enrolled Courses -->
          <div>
            <div class="ntu-sect-header" style="color:#15803d">
              <span>🎓 已選上課程 (${enrolledList.length} 堂)</span>
              <div>
                <button class="ntu-btn-link" id="btn-sel-all-enrolled">全選</button>
                <button class="ntu-btn-link" id="btn-unsel-enrolled">取消全選</button>
              </div>
            </div>
            <div class="ntu-course-list">
              ${enrolledList.map((c, i) => `
                <div class="ntu-item active" data-id="${c.id}">
                  <div class="ntu-item-top">
                    <input type="checkbox" class="ntu-checkbox" data-id="${c.id}" checked />
                    <span class="ntu-item-name">${c.name}</span>
                    <span class="ntu-tag-enrolled">已選上</span>
                    ${c.instructor ? `<span class="ntu-item-teacher">${c.instructor}</span>` : ''}
                  </div>
                  <div class="ntu-item-meta">
                    <span>⏰ ${c.timeSlots.join(', ')}</span>
                    ${c.locations.length ? `<span class="ntu-loc-tag">📍 ${c.locations.join('、')}</span>` : '<span style="color:#94a3b8">📍 依系所公告</span>'}
                    ${c.serial ? `<span style="color:#94a3b8;font-size:11.5px">#${c.serial}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Unselected Candidate Courses -->
          ${unselectedList.length > 0 ? `
          <div>
            <div class="ntu-sect-header" style="color:#b45309">
              <span>⏳ 志願排課中 / 未選上課程 (${unselectedList.length} 堂)</span>
              <div>
                <button class="ntu-btn-link" id="btn-sel-all-unselected" style="color:#b45309">全選加入排課</button>
                <button class="ntu-btn-link" id="btn-unsel-unselected" style="color:#b45309">全部不選</button>
              </div>
            </div>
            <div class="ntu-course-list">
              ${unselectedList.map((c, i) => `
                <div class="ntu-item unselected-card active" data-id="${c.id}">
                  <div class="ntu-item-top">
                    <input type="checkbox" class="ntu-checkbox" data-id="${c.id}" checked />
                    <span class="ntu-item-name">${c.name}</span>
                    <span class="ntu-tag-wait">待分發</span>
                    ${c.instructor ? `<span class="ntu-item-teacher">${c.instructor}</span>` : ''}
                  </div>
                  <div class="ntu-item-meta">
                    <span>⏰ ${c.timeSlots.join(', ')}</span>
                    ${c.locations.length ? `<span class="ntu-loc-tag">📍 ${c.locations.join('、')}</span>` : '<span style="color:#94a3b8">📍 依系所公告</span>'}
                    ${c.serial ? `<span style="color:#94a3b8;font-size:11.5px">#${c.serial}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>

        <div id="ntu-footer" style="flex-wrap:wrap;gap:10px">
          <span style="font-size:13px;color:#64748b" id="ntu-count-label">已選擇 ${courses.length} / ${courses.length} 堂課</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <button class="ntu-btn-sec" id="ntu-cancel">關閉</button>
            <button class="ntu-btn-sec" id="ntu-copy-code" title="複製課表代碼，可在課表好朋友網頁貼上匯入">📋 複製代碼</button>
            <button class="ntu-btn-accent" id="ntu-sync-web" title="同步至課表好朋友網頁儀表板">✨ 同步至網頁</button>
            <button class="ntu-btn-primary" id="ntu-download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              下載日曆 (.ics)
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const updateCount = () => {
      const selectedCount = overlay.querySelectorAll('.ntu-checkbox:checked').length;
      document.getElementById('ntu-count-label').textContent = `已選擇 ${selectedCount} / ${courses.length} 堂課`;
    };

    overlay.querySelectorAll('.ntu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const chk = item.querySelector('.ntu-checkbox');
        chk.checked = !chk.checked;
        item.classList.toggle('active', chk.checked);
        updateCount();
      });
      const chk = item.querySelector('.ntu-checkbox');
      chk.addEventListener('change', () => {
        item.classList.toggle('active', chk.checked);
        updateCount();
      });
    });

    const bindBulk = (btnId, isEnrolledFilter, checkState) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', () => {
        courses.filter(c => c.isEnrolled === isEnrolledFilter).forEach(c => {
          const item = overlay.querySelector(`.ntu-item[data-id="${c.id}"]`);
          if (item) {
            const chk = item.querySelector('.ntu-checkbox');
            chk.checked = checkState;
            item.classList.toggle('active', checkState);
          }
        });
        updateCount();
      });
    };

    bindBulk('btn-sel-all-enrolled', true, true);
    bindBulk('btn-unsel-enrolled', true, false);
    bindBulk('btn-sel-all-unselected', false, true);
    bindBulk('btn-unsel-unselected', false, false);

    const close = () => { overlay.remove(); style.remove(); };
    document.getElementById('ntu-ics-close').addEventListener('click', close);
    document.getElementById('ntu-cancel').addEventListener('click', close);
    document.getElementById('ntu-ics-backdrop').addEventListener('click', close);

    const getSelectedCoursesData = () => {
      const checkedBoxes = overlay.querySelectorAll('.ntu-checkbox:checked');
      const selectedIds = new Set(Array.from(checkedBoxes).map(b => b.dataset.id));
      const selected = courses.filter(c => selectedIds.has(c.id));
      return selected.map(c => ({
        id: c.id,
        name: c.name,
        isEnrolled: c.isEnrolled,
        instructor: c.instructor || '',
        locations: c.locations || [],
        timeSlots: c.timeSlots || [],
        code: c.code || '',
        serial: c.serial || '',
        identifier: c.identifier || '',
        credits: c.credits || 0,
        remarks: c.remarks || '',
        url: c.url || '',
        description: c.description || ''
      }));
    };

    document.getElementById('ntu-copy-code').addEventListener('click', async () => {
      const list = getSelectedCoursesData();
      if (list.length === 0) {
        alert('請至少勾選一門課程！');
        return;
      }
      const jsonStr = JSON.stringify(list);
      try {
        await navigator.clipboard.writeText(jsonStr);
        const btn = document.getElementById('ntu-copy-code');
        const orig = btn.textContent;
        btn.textContent = '✅ 已複製！';
        setTimeout(() => { btn.textContent = orig; }, 2500);
      } catch (err) {
        prompt('請複製下列課表代碼：', jsonStr);
      }
    });

    document.getElementById('ntu-sync-web').addEventListener('click', async () => {
      const list = getSelectedCoursesData();
      if (list.length === 0) {
        alert('請至少勾選一門課程！');
        return;
      }
      const jsonStr = JSON.stringify(list);
      try {
        await navigator.clipboard.writeText(jsonStr);
      } catch (e) {}

      let targetUrl = 'https://annie04082020.github.io/ntu-course-calendar/';
      const encoded = encodeURIComponent(jsonStr);
      window.open(targetUrl + '#import=' + encoded, '_blank');
    });

    document.getElementById('ntu-download').addEventListener('click', () => {
      const startStr = document.getElementById('ntu-start').value;
      const weeks = parseInt(document.getElementById('ntu-weeks').value, 10);
      const markWaitlist = document.getElementById('ntu-opt-mark').checked;

      if (!startStr || isNaN(weeks) || weeks < 1) {
        alert('請填寫正確的開學日與週數！');
        return;
      }

      const checkedBoxes = overlay.querySelectorAll('.ntu-checkbox:checked');
      const selectedIds = new Set(Array.from(checkedBoxes).map(b => b.dataset.id));
      const selected = courses.filter(c => selectedIds.has(c.id));

      if (selected.length === 0) {
        alert('請至少勾選一堂課程！');
        return;
      }

      const [y, m, d] = startStr.split('-').map(Number);
      const semStart = new Date(y, m - 1, d, 0, 0, 0);
      const ics = generateICS(selected, semStart, weeks, markWaitlist);

      const blob = new Blob(['\uFEFF' + ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `臺大課程表_115-1.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      close();
    });

    if (location.hostname.includes('course.ntu.edu.tw')) {
      const statusLabel = document.getElementById('ntu-desc-status');
      statusLabel.textContent = '⏳ 抓取大綱中...';
      fetchCourseDescriptions(courses, (done, total) => {
        if (statusLabel) {
          statusLabel.textContent = done === total ? '✨ 大綱已包含' : `⏳ 載入大綱 (${done}/${total})`;
        }
      });
    }
  }

  // ── 9. 主程式進入點 ──────────────────────────────────────────────────
  try {
    const result = await resolveCourses();
    if (result && result.courses && result.courses.length > 0) {
      showOverlay(result.courses, result.source);
    }
  } catch (err) {
    console.error('NTU Course Grabber Error:', err);
    alert('執行發生錯誤：' + err.message);
  }
})();
