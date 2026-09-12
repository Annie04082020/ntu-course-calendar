/**
 * NTU 課程 → Google Calendar ICS 匯出工具
 * 專為國立臺灣大學 (NTU) 學生打造
 * 
 * 支援平臺：
 * 【臺大課程網 (course.ntu.edu.tw)】：
 *    - 加退選課表 (course.ntu.edu.tw/result/adddrop2/table)
 *    - 志願預選課表 (course.ntu.edu.tw/priority/table)
 *    - 初選結果課表 (course.ntu.edu.tw/result/prereg2/table)
 *    - 選課結果清單 (course.ntu.edu.tw/result/adddrop2/list, /prereg2/list)
 *    - 自動讀取課程介紹詳細頁面，精確補齊教師、教室、時間、學分與大綱
 *    - 自動刪除多時段與預選重複出現的課程
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

    // 去除常見課號格式 (如 EE5184, CSIE1210, EduTch5104)
    name = name.replace(/^[\\(\\[（【]?\s*[A-Za-z]{2,8}\s*\d{3,5}\s*[\\)\\]）】]?\s*[-:：_—]?\s*/g, '');
    name = name.replace(/\s*[\\(\\[（【]\s*[A-Za-z]{2,8}\s*\d{3,5}\s*[\\)\\]）】]\s*$/g, '');

    // 去除常見 4~6 碼流水號 (如 13707, 10359)
    name = name.replace(/^[\\(\\[（【]?\s*\d{4,6}\s*[\\)\\]）】]?\s*[-:：_—]?\s*/g, '');
    name = name.replace(/\s*[\\(\\[（【]\s*\d{4,6}\s*[\\)\\]）】]\s*$/g, '');

    name = name.replace(/\s+/g, ' ').trim();
    return name || rawName.trim();
  }

  function generateUID() {
    return 'ntu-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '@course.ntu.edu.tw';
  }

  function generateICS(courses, semesterStart, totalWeeks, markWaitlist = true, lang = 'zh') {
    const isEn = (lang === 'en');
    const isBi = (lang === 'bilingual');

    const calTitle = isEn ? 'NTU Course Schedule 115-1' : (isBi ? '臺大課程表 NTU Schedule 115-1' : '臺大課程表 115-1');
    const prodId = isEn ? '-//NTU Course Calendar Exporter//EN' : '-//NTU Course Calendar Exporter//ZH-TW';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:' + prodId,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:' + calTitle,
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

          const summaryText = (markWaitlist && course.isEnrolled === false ? waitlistTag : '') + eventName;

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
            if (course.locations && course.locations.length) descParts.push('教室：' + course.locations.join('、'));
            if (course.remarks) descParts.push('備註：' + course.remarks);
            if (course.description) descParts.push('\n【課程概述】\n' + course.description);
            descParts.push('\n課程網址：' + course.url);
          }

          const locationText = course.locations.join('、') || (isEn ? 'TBA' : '依系所公告');

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

  // ── 3. 臺大課程網解析器 (course.ntu.edu.tw) ─────────────────────────
  function parseCourseNtuDoc(doc) {
    const courses = [];
    const seenSerials = new Set();
    const seenHrefs = new Set();
    const seenNames = new Set();

    // 尋找所有導向課程介紹頁面的連結 (如 /courses/115-1/13707 或包含 /courses/ 的 a 標籤)
    const courseLinks = Array.from(doc.querySelectorAll('a[href*="/courses/"]'));

    const unselectedHeader = Array.from(doc.querySelectorAll('*')).find(el => 
      el.children.length === 0 && (el.textContent.trim().startsWith('未選上') || el.textContent.trim().startsWith('未中籤'))
    );

    for (const a of courseLinks) {
      let href = a.getAttribute('href') || '';
      if (!href) continue;
      const cleanHref = href.split('?')[0].split('#')[0];
      const serialMatch = cleanHref.match(/\/courses\/[^\/]+\/(\d+)/);
      const serial = serialMatch ? serialMatch[1] : '';

      // 去重檢查（依據使用者需求：預選課表自動刪除重複出現的課程）
      if (serial && seenSerials.has(serial)) continue;
      if (!serial && seenHrefs.has(cleanHref)) continue;

      let courseName = (a.innerText || a.textContent || '').trim();
      // 若包含換行（如卡片內有其他文字），取第一行做為課名
      if (courseName.includes('\n')) {
        courseName = courseName.split('\n')[0].trim();
      }
      courseName = cleanCourseTitle(courseName, '', serial);
      if (!courseName || courseName.length > 60) continue;
      if (seenNames.has(courseName) && !serial) continue;

      if (serial) seenSerials.add(serial);
      seenHrefs.add(cleanHref);
      seenNames.add(courseName);

      let isEnrolled = true;
      if (unselectedHeader && (unselectedHeader.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        isEnrolled = false;
      }

      const fullUrl = href.startsWith('http') ? href : 'https://course.ntu.edu.tw' + href;

      courses.push({
        id: 'c_' + (serial || Math.random().toString(36).slice(2, 7)),
        name: courseName,
        nameEn: '',
        isEnrolled,
        url: fullUrl,
        instructor: '',
        instructorEn: '',
        credits: 0,
        timeSlots: [],
        locations: [],
        serial: serial,
        code: '',
        identifier: '',
        remarks: '',
        remarksEn: '',
        description: '',
        descriptionEn: '',
      });
    }

    return courses;
  }

  // ── 4. 系統入口檢查 ──────────────────────────────────────────────────
  async function resolveCourses() {
    if (!location.hostname.includes('course.ntu.edu.tw')) {
      alert('【臺大課程日曆好朋友】\n請在「臺大課程網 (course.ntu.edu.tw)」登入後點擊此書籤！\n支援頁面包含：\n- 選課結果課表 (/result/adddrop2/table 或 /result/prereg2/table)\n- 志願預選課表 (/priority/table)\n- 選課結果清單 (/result/adddrop2/list 等)');
      return null;
    }

    const courses = parseCourseNtuDoc(document);
    if (courses.length > 0) {
      let sourceName = '臺大課程網 · 課表';
      if (location.pathname.includes('priority')) {
        sourceName = '臺大課程網 · 志願預選課表';
      } else if (location.pathname.includes('result')) {
        sourceName = '臺大課程網 · 選課結果';
      }
      return { courses, source: sourceName };
    }

    alert('未在當前頁面偵測到課程！\n請確認您在臺大課程網的課表或結果頁面：\nhttps://course.ntu.edu.tw/result/adddrop2/table\n或 https://course.ntu.edu.tw/priority/table');
    return null;
  }

  // ── 5. 同源獲取課程介紹詳細資訊 (雙語直接並行抓取，保證零機器翻譯) ────
  async function fetchCourseDetails(courses, onProgress, onCourseUpdated) {
    if (!location.hostname.includes('course.ntu.edu.tw')) return;
    let completed = 0;

    const fetchOne = async (course) => {
      if (!course.url) {
        completed++;
        onProgress(completed, courses.length);
        return;
      }
      try {
        const isCurrentlyEn = course.url.includes('/en/courses/');
        const zhUrl = isCurrentlyEn ? course.url.replace('/en/courses/', '/courses/') : course.url;
        const enUrl = isCurrentlyEn ? course.url : course.url.replace('/courses/', '/en/courses/');

        // 並行同源抓取中文版與官方英文版網頁
        const [resZh, resEn] = await Promise.allSettled([
          fetch(zhUrl),
          fetch(enUrl)
        ]);

        let html = '';
        let text = '';
        if (resZh.status === 'fulfilled' && resZh.value.ok) {
          html = await resZh.value.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          text = doc.body.innerText || '';
        }

        let htmlEn = '';
        let textEn = '';
        if (resEn.status === 'fulfilled' && resEn.value.ok) {
          htmlEn = await resEn.value.text();
          const docEn = new DOMParser().parseFromString(htmlEn, 'text/html');
          textEn = docEn.body.innerText || '';
        }

        // 以抓取成功的內容為主 (若中文失敗則退回英文)
        const mainHtml = html || htmlEn;
        const mainText = text || textEn;

        // ---------------------------------------------------------------------
        // 1. 解析官方英文版 (100% NTU 官方原汁原味)
        // ---------------------------------------------------------------------
        if (htmlEn) {
          // 官方英文課名 (支援 <title> 與 <h1> 標籤)
          const tmEn = htmlEn.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (tmEn) {
            const rawTitle = tmEn[1].split('｜')[0].split('|')[0].replace(/[-–—]\s*(?:NTU|National Taiwan University).*$/i, '').trim();
            if (rawTitle) {
              course.nameEn = cleanCourseTitle(rawTitle, course.code, course.serial, course.identifier);
            }
          }
          if (!course.nameEn) {
            const h1Match = htmlEn.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (h1Match) {
              const rawH1 = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (rawH1) {
                course.nameEn = cleanCourseTitle(rawH1, course.code, course.serial, course.identifier);
              }
            }
          }

          // 官方英文教師姓名
          const enTeachers = [];
          const mEnTeachers = htmlEn.matchAll(/lucide-user-round[\s\S]*?<div[^>]*class="[^"]*overflow-hidden[^"]*"[^>]*>([^<]+)<\/div>/g);
          for (const mt of mEnTeachers) {
            if (mt[1] && mt[1].trim()) enTeachers.push(mt[1].trim());
          }
          if (enTeachers.length === 0) {
            const mEnTeachers2 = htmlEn.matchAll(/([^\s><]+)\s*(?:Search courses offered by this instructor|搜尋教師開設的課程)/gi);
            for (const mt of mEnTeachers2) {
              if (mt[1] && mt[1].trim()) enTeachers.push(mt[1].trim());
            }
          }
          if (enTeachers.length > 0) {
            course.instructorEn = [...new Set(enTeachers)].join(', ');
          }

          // 官方英文備註 (Notes)
          const mEnRemarks = htmlEn.match(/(?:Notes|Remarks)[\s\S]*?<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                             htmlEn.match(/(?:Notes|Remarks)[\s\S]*?<p[^>]*class="[^"]*"[^>]*>([^<]+)<\/p>/i);
          if (mEnRemarks) {
            course.remarksEn = mEnRemarks[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          }

          // 官方英文課程簡介與大綱 (Course Description)
          const mEnDesc = htmlEn.match(/(?:Course Description|Course Overview|Description)[\s\S]*?<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (mEnDesc) {
            course.descriptionEn = mEnDesc[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
          }
        }

        // ---------------------------------------------------------------------
        // 2. 解析中文版 (或通用資訊)
        // ---------------------------------------------------------------------
        if (html) {
          // 官方中文課名 (優先支援 <title>，確保即使在英文版網頁執行也能獲取正確中文課名)
          const tmZh = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (tmZh) {
            const rawTitleZh = tmZh[1].split('｜')[0].split('|')[0].replace(/[-–—]\s*(?:臺大課程網|國立臺灣大學).*$/i, '').trim();
            if (rawTitleZh) {
              course.name = cleanCourseTitle(rawTitleZh, course.code, course.serial, course.identifier);
            }
          }
          if (!course.name) {
            const h1ZhMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (h1ZhMatch) {
              const rawH1Zh = h1ZhMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (rawH1Zh) {
                course.name = cleanCourseTitle(rawH1Zh, course.code, course.serial, course.identifier);
              }
            }
          }
        }

        if (mainHtml) {
          // 授課教師 (支援多位教授、Lucide 圖標、搜尋連結與文字關鍵字)
          const teacherMatches = [];
          const mTeachers = (html || htmlEn).matchAll(/lucide-user-round[\s\S]*?<div[^>]*class="[^"]*overflow-hidden[^"]*"[^>]*>([^<]+)<\/div>/g);
          for (const mt of mTeachers) {
            if (mt[1] && mt[1].trim()) teacherMatches.push(mt[1].trim());
          }
          if (teacherMatches.length === 0 && html) {
            const mTeachers2 = html.matchAll(/([^\s><]+)\s*搜尋教師開設的課程/g);
            for (const mt of mTeachers2) {
              if (mt[1] && mt[1].trim()) teacherMatches.push(mt[1].trim());
            }
          }
          if (teacherMatches.length === 0 && text) {
            const teacherMatch = text.match(/授課教師[：:\s]*([^\n\r]+)/);
            if (teacherMatch) teacherMatches.push(teacherMatch[1].trim().split(/[\s,，]+/)[0]);
          }
          if (teacherMatches.length > 0) {
            course.instructor = [...new Set(teacherMatches)].join('、');
          }

          // 教室與地點
          const mMap = mainHtml.match(/lucide-map-pin[\s\S]*?<p[^>]*class="[^"]*text-balance[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/) ||
                     mainHtml.match(/lucide-map-pin[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
          if (mMap && mMap[1].trim()) {
            const loc = mMap[1].trim();
            if (!loc.includes('未定') && !loc.includes('依系所')) course.locations = [loc];
          } else {
            const mMap2 = mainHtml.match(/maps\/search\/\?api=1&amp;query=[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
            if (mMap2 && mMap2[1].trim()) {
              const loc = mMap2[1].trim();
              if (!loc.includes('未定') && !loc.includes('依系所')) course.locations = [loc];
            } else if (text) {
              const locMatch = text.match(/(?:上課教室|教室|地點)[：:\s]*([^\n\r,，。]+)/);
              if (locMatch) {
                const loc = locMatch[1].trim();
                if (loc && !loc.includes('未定') && !loc.includes('依系所')) course.locations = [loc];
              }
            }
          }

          // 上課時間與節次 (以課程介紹頁的時鐘圖標資訊為準)
          const timeRegex = /lucide-clock[\s\S]*?<\/svg>\s*([一二三四五六日]\s*(?:10|[0-9A-Da-d])(?:[,，\s]*(?:10|[0-9A-Da-d]))*)/g;
          const foundSlots = [];
          let tm;
          while ((tm = timeRegex.exec(mainHtml)) !== null) {
            foundSlots.push(tm[1].replace(/\s+/g, ' ').trim());
          }
          if (foundSlots.length === 0 && text) {
            const timeRegex2 = /(?:上課時間|時間)[：:\s]*([一二三四五六日]\s*(?:10|[0-9A-Da-d])(?:[,，\s]*(?:10|[0-9A-Da-d]))*)/g;
            let tm2;
            while ((tm2 = timeRegex2.exec(text)) !== null) {
              foundSlots.push(tm2[1].replace(/\s+/g, ' ').trim());
            }
          }
          if (foundSlots.length > 0) {
            course.timeSlots = [...new Set(foundSlots)];
          }

          // 學分
          const mCredits = mainHtml.match(/lucide-hand-coins[\s\S]*?<\/svg>\s*(\d+(?:\.\d+)?)\s*(?:學分|Credit|Credits)/i);
          if (mCredits) {
            course.credits = parseFloat(mCredits[1]);
          } else if (text) {
            const credMatch = text.match(/(\d+(?:\.\d+)?)\s*學分/);
            if (credMatch) course.credits = parseFloat(credMatch[1]);
          }

          // 流水號、課號、課程識別碼
          const mSerial = mainHtml.match(/(?:流水號|Serial No\.?)[\s\S]*?<p[^>]*class="[^"]*select-all[^"]*"[^>]*>([^<]+)<\/p>/i);
          if (mSerial) course.serial = mSerial[1].trim();
          const mCode = mainHtml.match(/(?:課號|Course No\.?)[\s\S]*?<p[^>]*class="[^"]*select-all[^"]*"[^>]*>([^<]+)<\/p>/i);
          if (mCode) course.code = mCode[1].trim();
          const mId = mainHtml.match(/(?:課程識別碼|Course ID)[\s\S]*?<p[^>]*class="[^"]*select-all[^"]*"[^>]*>([^<]+)<\/p>/i);
          if (mId) course.identifier = mId[1].trim();

          // 中文備註
          let remarksText = '';
          const mRemarks = html.match(/備註[\s\S]*?<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/) ||
                           html.match(/備註[\s\S]*?<p[^>]*class="[^"]*"[^>]*>([^<]+)<\/p>/);
          if (mRemarks) {
            remarksText = mRemarks[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          } else if (text) {
            const mTextRemarks = text.match(/備註[：:\s]*([\s\S]*?)(?:課程概述|課程大綱|評量方式|$)/);
            if (mTextRemarks && mTextRemarks[1].trim()) {
              remarksText = mTextRemarks[1].replace(/\s+/g, ' ').trim().slice(0, 300);
            }
          }
          if (remarksText) course.remarks = remarksText;

          // 中文課程概述
          const descMatch = html.match(/課程概述[\s\S]*?<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/);
          if (descMatch) {
            course.description = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
          } else if (text) {
            const match = text.match(/課程概述[：:\s]*([\s\S]*?)(?:課程目標|課程大綱|評量方式|指定閱讀|$)/);
            if (match && match[1].trim()) course.description = match[1].trim().slice(0, 400);
          }

          // 地點備用語法解析
          if (!course.locations.length || course.locations.every(l => l.includes('洽系所') || l.includes('公告') || l.includes('未定'))) {
            const candidateTexts = [remarksText, course.description, text, textEn];
            for (const src of candidateTexts) {
              if (!src) continue;

              const explicitLocMatch = src.match(/(?:上課地點|授課地點|上課教室|實體教室|上課位於|教室為|上課在|地點位於|地點)[：:\s]*(?:為|在|於)?\s*([^\n\r,，。；;]{2,25})/);
              if (explicitLocMatch) {
                let locCandidate = explicitLocMatch[1].replace(/^[為在於]\s*/, '').trim();
                if (!locCandidate.includes('未定') && !locCandidate.includes('洽系所') && !locCandidate.includes('依學校') && !locCandidate.includes('時間')) {
                  course.locations = [locCandidate];
                  break;
                }
              }

              const bldgMatch = src.match(/([台臺基醫護生公管工電資文法社博理思新綜研卓越農海獸食水][A-Za-z0-9\u4e00-\u9fa5]{0,8}(?:館|樓|大樓|講堂|教室|所|中心|分館)?\s*(?:[A-Za-z0-9\-]{2,6}(?:講堂|教室|室|演講廳|會議室|討論室)?|(?:\d+|[一二三四五六七八九十]+)樓(?:[^\s,，。；;]{0,8}(?:講堂|教室|室|演講廳|會議室|討論室))?))/);
              if (bldgMatch) {
                const locCandidate = bldgMatch[1].replace(/\s+/g, ' ').trim();
                if (locCandidate.length >= 3 && !locCandidate.includes('未定') && !locCandidate.includes('學分') && !locCandidate.includes('學生') && !locCandidate.includes('週') && !locCandidate.includes('星期')) {
                  course.locations = [locCandidate];
                  break;
                }
              }
            }
          }

          if (onCourseUpdated) onCourseUpdated(course);
        }
      } catch (e) {
        // silent
      }
      completed++;
      onProgress(completed, courses.length);
    };

    // 平行非同步獲取所有選中課程詳細介紹
    await Promise.all(courses.map(c => fetchOne(c)));
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
      .ntu-link-btn {
        margin-left: auto; font-size: 11.5px; color: #4f46e5; text-decoration: none;
        background: #eef2ff; padding: 2px 8px; border-radius: 6px; font-weight: 600;
        transition: all 0.15s; display: inline-flex; align-items: center; gap: 4px;
      }
      .ntu-link-btn:hover { background: #e0e7ff; text-decoration: underline; color: #3730a3; }
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
              <span class="ntu-desc-status" id="ntu-desc-status">⏳ 正在同步課程詳細中...</span>
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
              <label for="ntu-opt-mark" style="cursor:pointer">未選上志願課程標題加上 <strong>[候補/Waitlist]</strong> 標記</label>
            </div>
            <div class="ntu-opt-bar" style="margin-top:10px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <span class="ntu-label" style="margin-bottom:0; font-weight:700; color:#334155;">🌐 日曆與輸出語言：</span>
              <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600;">
                <input type="radio" name="ntu-export-lang" value="zh" checked style="accent-color:#4f46e5; cursor:pointer;" /> 繁體中文
              </label>
              <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600;">
                <input type="radio" name="ntu-export-lang" value="en" style="accent-color:#4f46e5; cursor:pointer;" /> English (NTU)
              </label>
              <label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600;">
                <input type="radio" name="ntu-export-lang" value="bilingual" style="accent-color:#4f46e5; cursor:pointer;" /> 雙語 (Bilingual)
              </label>
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
                    ${c.url ? `<a href="${c.url}" target="_blank" onclick="event.stopPropagation();" class="ntu-link-btn" title="查看課程介紹與大綱">🔗 課程介紹</a>` : ''}
                  </div>
                  <div class="ntu-item-meta">
                    <span>⏰ ${c.timeSlots && c.timeSlots.length ? c.timeSlots.join('、') : '時間同步中...'}</span>
                    ${c.locations && c.locations.length ? `<span class="ntu-loc-tag">📍 ${c.locations.join('、')}</span>` : '<span style="color:#94a3b8">📍 依系所公告</span>'}
                    ${c.credits ? `<span style="color:#4f46e5;font-weight:600;font-size:11.5px">${c.credits} 學分</span>` : ''}
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
                    ${c.url ? `<a href="${c.url}" target="_blank" onclick="event.stopPropagation();" class="ntu-link-btn" title="查看課程介紹與大綱">🔗 課程介紹</a>` : ''}
                  </div>
                  <div class="ntu-item-meta">
                    <span>⏰ ${c.timeSlots && c.timeSlots.length ? c.timeSlots.join('、') : '時間同步中...'}</span>
                    ${c.locations && c.locations.length ? `<span class="ntu-loc-tag">📍 ${c.locations.join('、')}</span>` : '<span style="color:#94a3b8">📍 依系所公告</span>'}
                    ${c.credits ? `<span style="color:#4f46e5;font-weight:600;font-size:11.5px">${c.credits} 學分</span>` : ''}
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
            <button class="ntu-btn-accent" id="ntu-copy-scriptable" title="直接產生並複製 iOS Scriptable 小工具程式碼（已注入所選語言）">📱 複製 iOS 小工具</button>
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

    const getChosenLang = () => {
      const checked = overlay.querySelector('input[name="ntu-export-lang"]:checked');
      return checked ? checked.value : 'zh';
    };

    const getDisplayCourseName = (c, lang) => {
      if (lang === 'en' && c.nameEn) return c.nameEn;
      if (lang === 'bilingual' && c.nameEn && c.nameEn !== c.name) return `${c.nameEn} ${c.name}`;
      return c.name;
    };

    const getDisplayTeacherName = (c, lang) => {
      if (lang === 'en' && c.instructorEn) return c.instructorEn;
      if (lang === 'bilingual' && c.instructorEn && c.instructorEn !== c.instructor) {
        return c.instructor ? `${c.instructor} (${c.instructorEn})` : c.instructorEn;
      }
      return c.instructor || '';
    };

    const refreshOverlayDisplay = () => {
      const lang = getChosenLang();
      courses.forEach(c => {
        const item = overlay.querySelector(`.ntu-item[data-id="${c.id}"]`);
        if (!item) return;
        const nameEl = item.querySelector('.ntu-item-name');
        if (nameEl) nameEl.textContent = getDisplayCourseName(c, lang);
        const teacherEl = item.querySelector('.ntu-item-teacher');
        if (teacherEl) teacherEl.textContent = getDisplayTeacherName(c, lang);
      });
    };

    overlay.querySelectorAll('input[name="ntu-export-lang"]').forEach(radio => {
      radio.addEventListener('change', refreshOverlayDisplay);
    });

    // 動態即時更新彈窗中的課程卡片
    function updateOverlayItem(course) {
      const item = overlay.querySelector(`.ntu-item[data-id="${course.id}"]`);
      if (!item) return;

      const lang = getChosenLang();
      const nameEl = item.querySelector('.ntu-item-name');
      if (nameEl) nameEl.textContent = getDisplayCourseName(course, lang);

      const dispTeacher = getDisplayTeacherName(course, lang);
      if (dispTeacher) {
        let teacherEl = item.querySelector('.ntu-item-teacher');
        if (teacherEl) {
          teacherEl.textContent = dispTeacher;
        } else {
          const topDiv = item.querySelector('.ntu-item-top');
          if (topDiv) {
            teacherEl = document.createElement('span');
            teacherEl.className = 'ntu-item-teacher';
            teacherEl.textContent = dispTeacher;
            const linkBtn = topDiv.querySelector('.ntu-link-btn');
            if (linkBtn) topDiv.insertBefore(teacherEl, linkBtn);
            else topDiv.appendChild(teacherEl);
          }
        }
      }

      const metaEl = item.querySelector('.ntu-item-meta');
      if (metaEl) {
        const timeStr = (course.timeSlots && course.timeSlots.length) ? course.timeSlots.join('、') : '時間未定';
        const locStr = (course.locations && course.locations.length) ? `<span class="ntu-loc-tag">📍 ${course.locations.join('、')}</span>` : '<span style="color:#94a3b8">📍 依系所公告</span>';
        const credStr = course.credits ? `<span style="color:#4f46e5;font-weight:600;font-size:11.5px">${course.credits} 學分</span>` : '';
        const serialStr = course.serial ? `<span style="color:#94a3b8;font-size:11.5px">#${course.serial}</span>` : '';
        metaEl.innerHTML = `<span>⏰ ${timeStr}</span> ${locStr} ${credStr} ${serialStr}`;
      }
    }

    const updateCount = () => {
      const selectedCount = overlay.querySelectorAll('.ntu-checkbox:checked').length;
      document.getElementById('ntu-count-label').textContent = `已選擇 ${selectedCount} / ${courses.length} 堂課`;
    };

    overlay.querySelectorAll('.ntu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'A') return;
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
        nameEn: c.nameEn || '',
        isEnrolled: c.isEnrolled,
        instructor: c.instructor || '',
        instructorEn: c.instructorEn || '',
        locations: c.locations || [],
        timeSlots: c.timeSlots || [],
        code: c.code || '',
        serial: c.serial || '',
        identifier: c.identifier || '',
        credits: c.credits || 0,
        remarks: c.remarks || '',
        remarksEn: c.remarksEn || '',
        url: c.url || '',
        description: c.description || '',
        descriptionEn: c.descriptionEn || ''
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

    document.getElementById('ntu-copy-scriptable').addEventListener('click', async () => {
      const list = getSelectedCoursesData();
      if (list.length === 0) {
        alert('請至少勾選一門課程！');
        return;
      }
      const lang = getChosenLang();
      const btn = document.getElementById('ntu-copy-scriptable');
      const orig = btn.textContent;
      btn.textContent = '⏳ 產生腳本中...';
      try {
        const res = await fetch('https://annie04082020.github.io/ntu-course-calendar/scriptable/template.js');
        if (!res.ok) throw new Error('無法載入小工具範本');
        let scriptCode = await res.text();
        scriptCode = scriptCode.replace(/\/\* __USER_COURSES_JSON__ \*\/[\s\S]*?\];/, `/* __USER_COURSES_JSON__ */ ${JSON.stringify(list, null, 2)};`);
        scriptCode = scriptCode.replace(/\/\* __USER_LANG__ \*\/ "zh"/, `/* __USER_LANG__ */ "${lang}"`);
        await navigator.clipboard.writeText(scriptCode);
        btn.textContent = '✅ 已複製 iOS 腳本！';
        const langName = (lang === 'en' ? 'English (NTU)' : (lang === 'bilingual' ? '雙語 (Bilingual)' : '繁體中文'));
        alert(`【iOS 桌面小工具代碼已成功複製！】\n\n已為您注入當前課表，並自動設定為【${langName}】模式。\n請打開 iPhone/iPad 的「Scriptable」App，新增腳本並直接貼上即可使用！`);
        setTimeout(() => { btn.textContent = orig; }, 3000);
      } catch (err) {
        btn.textContent = orig;
        const jsonStr = JSON.stringify(list);
        let targetUrl = 'https://annie04082020.github.io/ntu-course-calendar/';
        const encoded = encodeURIComponent(jsonStr);
        window.open(targetUrl + '#scriptable=' + encoded + '&lang=' + lang, '_blank');
      }
    });

    document.getElementById('ntu-sync-web').addEventListener('click', async () => {
      const list = getSelectedCoursesData();
      if (list.length === 0) {
        alert('請至少勾選一門課程！');
        return;
      }
      const lang = getChosenLang();
      const jsonStr = JSON.stringify(list);
      try {
        await navigator.clipboard.writeText(jsonStr);
      } catch (e) {}

      let targetUrl = 'https://annie04082020.github.io/ntu-course-calendar/';
      const encoded = encodeURIComponent(jsonStr);
      window.open(targetUrl + '#import=' + encoded + '&lang=' + lang, '_blank');
    });

    document.getElementById('ntu-download').addEventListener('click', () => {
      const startStr = document.getElementById('ntu-start').value;
      const weeks = parseInt(document.getElementById('ntu-weeks').value, 10);
      const markWaitlist = document.getElementById('ntu-opt-mark').checked;
      const lang = getChosenLang();

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
      const ics = generateICS(selected, semStart, weeks, markWaitlist, lang);

      const blob = new Blob(['\uFEFF' + ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (lang === 'en' ? `NTU_Course_Schedule_115-1.ics` : `臺大課程表_115-1.ics`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      close();
    });

    if (location.hostname.includes('course.ntu.edu.tw')) {
      const statusLabel = document.getElementById('ntu-desc-status');
      statusLabel.textContent = '⏳ 同步課程資訊中...';
      fetchCourseDetails(courses, (done, total) => {
        if (statusLabel) {
          statusLabel.textContent = done === total ? '✨ 詳細資料已同步' : `⏳ 同步中 (${done}/${total})`;
        }
      }, updateOverlayItem);
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
