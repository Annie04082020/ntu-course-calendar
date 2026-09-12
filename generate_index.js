const fs = require('fs');

let bookmarkletHref = '';
try {
  bookmarkletHref = fs.readFileSync('bookmarklet_href.txt', 'utf8').trim();
} catch (e) {
  bookmarkletHref = 'javascript:void(0);';
}

let scriptableTemplate = '';
try {
  scriptableTemplate = fs.readFileSync('scriptable/template.js', 'utf8');
} catch (e) {
  scriptableTemplate = '// Error loading scriptable/template.js';
}

const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>臺大課程日曆好朋友 | NTU Course to Calendar</title>
  <meta name="description" content="專為臺大學生打造的現代課表視覺化與 Google 日曆一鍵匯出工具。">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="style.css?v=1.0.5">
</head>
<body>

  <div class="ambient-glow"></div>

  <div class="app-wrapper">
    <!-- Top App Navbar -->
    <header class="app-navbar">
      <div class="brand-section">
        <div class="brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="brand-title">
          <span id="app-brand-name">臺大課程日曆好朋友</span>
          <span class="mode-tag demo" id="app-mode-badge">示範預覽模式</span>
        </div>
      </div>

      <!-- Center Summary Pills -->
      <div class="nav-stats">
        <span class="stat-pill enrolled" id="stat-enrolled-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span id="stat-enrolled-text">已選上 0 門 · 0 學分</span>
        </span>
        <span class="stat-pill waitlist" id="stat-waitlist-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span id="stat-waitlist-text">待分發 0 門 · 0 學分</span>
        </span>
      </div>

      <!-- Nav Actions -->
      <div class="nav-actions">
        <!-- Language Switcher -->
        <div class="lang-switch-group" id="nav-lang-switcher">
          <button class="btn-lang-toggle active" id="btn-lang-zh">中文</button>
          <button class="btn-lang-toggle" id="btn-lang-en">EN</button>
        </div>

        <button class="btn-nav-action" id="btn-open-bm-modal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span id="nav-lbl-bm">書籤小工具</span>
        </button>
        <button class="btn-nav-action" id="btn-open-import-modal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          <span id="nav-lbl-import">代碼匯入</span>
        </button>
        <button class="btn-nav-action" id="btn-open-scriptable-modal" title="匯出至 iPhone / iPad 桌面小工具">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          <span id="nav-lbl-ios">iOS 小工具</span>
        </button>
        <button class="btn-nav-action" id="btn-open-android-modal" title="匯出至 Android 原生桌面小工具 App">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 16V8a7 7 0 0 1 14 0v8"/><line x1="8" y1="3" x2="6" y2="1"/><line x1="16" y1="3" x2="18" y2="1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><rect x="5" y="16" width="14" height="5" rx="1"/></svg>
          Android
        </button>
        <button class="btn-nav-action" id="btn-reset-data" title="清除個人課表或重新載入示範">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span id="btn-reset-text">清除/示範</span>
        </button>
        <button class="btn-nav-primary" id="btn-nav-quick-dl">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span id="nav-lbl-ics">匯出日曆 (.ics)</span>
        </button>
      </div>
    </header>

    <!-- Notice Banner for Missing English in legacy data -->
    <div id="missing-en-banner" style="display:none; margin:14px 24px 0 24px; padding:10px 18px; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:var(--radius-sm); color:#fbbf24; font-size:13px; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:280px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span id="banner-text"><strong>提醒：</strong>目前儲存的課表缺少官方英文資訊。請在臺大課程網使用新版「書籤小工具」，一鍵自動同步獲取正統雙語課名與簡介！</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button id="btn-banner-enrich" class="btn-nav-action" style="padding:4px 10px; font-size:12px; background:rgba(52,211,153,0.2); border-color:rgba(52,211,153,0.4); color:#34d399; font-weight:700; cursor:pointer;">✨ 一鍵補齊官方雙語</button>
        <button id="btn-banner-bm" class="btn-nav-action" style="padding:4px 10px; font-size:12px; background:rgba(245,158,11,0.2); border-color:rgba(245,158,11,0.4); color:#fbbf24;">取得新版書籤</button>
        <a href="https://course.ntu.edu.tw" target="_blank" style="padding:4px 10px; font-size:12px; background:#f59e0b; color:#000; border-radius:6px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">前往臺大課程網 ↗</a>
        <button id="btn-close-banner" style="background:transparent; border:none; color:#fbbf24; font-size:16px; cursor:pointer; padding:2px 6px; line-height:1; opacity:0.8;" title="關閉此提醒 (Dismiss)">✕</button>
      </div>
    </div>

    <!-- Main Workspace (Timetable Grid + Course Sidebar) -->
    <main class="app-main-grid">
      <!-- Left Column: Timetable Grid View -->
      <section class="timetable-card">
        <div class="timetable-toolbar">
          <div class="toolbar-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="toolbar-title-text">一週課表時間矩陣</span>
          </div>
          <div class="filter-pills">
            <button class="filter-pill active" id="f-all">全部</button>
            <button class="filter-pill" id="f-enrolled">僅已選上</button>
            <button class="filter-pill" id="f-waitlist">僅待分發</button>
          </div>
        </div>

        <div class="tt-matrix-wrapper">
          <div class="tt-matrix" id="tt-matrix">
            <!-- Grid content will be dynamically generated by JavaScript -->
          </div>
        </div>
      </section>

      <!-- Right Column: Course Sidebar & Bulk Export -->
      <aside class="sidebar-card">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span id="sidebar-title-text">課程清單</span>
          </div>
          <div class="bulk-actions">
            <button class="bulk-link" id="btn-sel-all">全選</button>
            <button class="bulk-link" id="btn-unsel-all">全不選</button>
            <button class="bulk-link" id="btn-sel-enrolled">僅已選上</button>
          </div>
        </div>

        <!-- Course List Container -->
        <div class="course-list-scroll" id="sidebar-course-list">
          <!-- Dynamically populated by JS -->
        </div>

        <!-- Sidebar Footer Action -->
        <div class="sidebar-footer">
          <div class="sidebar-summary">
            <span class="sel-count-label" id="sidebar-sel-label">已勾選 0 / 0 門課程</span>
            <span class="term-badge">RFC 5545 標準</span>
          </div>
          <button class="btn-primary-block" id="btn-sidebar-dl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span id="lbl-sidebar-dl">下載勾選課程行事曆 (.ics)</span>
          </button>
          <button class="btn-secondary-block" id="btn-sidebar-scriptable" style="margin-top:8px; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:9px 14px; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); border-radius:var(--radius-sm); color:#60a5fa; font-weight:600; font-size:13px; cursor:pointer; transition:all 0.2s;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <span id="lbl-sidebar-ios">產生 iOS / iPad 桌面小工具</span>
          </button>
          <button class="btn-secondary-block" id="btn-sidebar-android" style="margin-top:6px; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:9px 14px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-sm); color:#34d399; font-weight:600; font-size:13px; cursor:pointer; transition:all 0.2s;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 16V8a7 7 0 0 1 14 0v8"/><line x1="8" y1="3" x2="6" y2="1"/><line x1="16" y1="3" x2="18" y2="1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><rect x="5" y="16" width="14" height="5" rx="1"/></svg>
            <span id="lbl-sidebar-android">Android 原生小工具 App</span>
          </button>
        </div>
      </aside>
    </main>
  </div>

  <!-- Course Detail Modal -->
  <div class="modal-backdrop" id="modal-detail-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title" id="md-title">課程詳細資訊</div>
        <button class="modal-close" id="md-close" aria-label="關閉">✕</button>
      </div>
      <div class="modal-body" id="md-body">
        <!-- Injected via JS -->
      </div>
    </div>
  </div>

  <!-- Bookmarklet Installation Modal -->
  <div class="modal-backdrop" id="modal-bm-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">🎓 安裝「臺大課程日曆好朋友」書籤</div>
        <button class="modal-close" id="bm-close" aria-label="關閉">✕</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin-bottom: 16px;">
          請將下方按鈕<strong>直接拖曳至瀏覽器的「書籤列」</strong>。前往臺大選課結果頁面點擊一下，即可自動抓取課表並同步儲存到此頁面，還能一鍵匯出日曆！
        </p>

        <!-- Drag / Copy Actions Container -->
        <div class="bm-actions-container">
          <div class="bm-actions-row">
            <a class="btn-drag-bookmarklet" id="bm-drag-link" href="${bookmarkletHref}" onclick="event.preventDefault(); alert('請按住我「拖曳」至瀏覽器書籤列！若平時隱藏書籤列，可點擊右側「複製書籤代碼」！');">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              👆 拖曳至書籤列
            </a>
            <button class="btn-copy-bookmarklet" id="btn-copy-bm-code" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              📋 複製書籤代碼
            </button>
          </div>
          <span style="font-size: 12px; color: var(--text-muted); margin-top: 4px; text-align: center; line-height: 1.6;">
            💡 <strong>平時隱藏書籤列？</strong> 點選「複製書籤代碼」後，在選課結果頁按 <kbd style="background:#1e293b;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);color:#94a3b8">F12</kbd> 開啟 Console 貼上執行；或按 <kbd style="background:#1e293b;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);color:#94a3b8">Ctrl+D</kbd> 加任意網頁為書籤，點「編輯」將網址貼換為此代碼！
          </span>
        </div>

        <div style="margin-top: 24px;">
          <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">使用 3 步驟：</h4>
          <ol style="color: var(--text-secondary); font-size: 13px; line-height: 1.8; padding-left: 20px;">
            <li>將上方書籤按鈕拖曳至瀏覽器書籤列。</li>
            <li>登入並前往臺大課程網的 <a href="https://course.ntu.edu.tw/result/adddrop2/table" target="_blank" style="color: var(--accent-primary); text-decoration: underline;">課表結果 (/result/adddrop2/table)</a> 或 <a href="https://course.ntu.edu.tw/priority/table" target="_blank" style="color: var(--accent-primary); text-decoration: underline;">志願預選 (/priority/table)</a>。</li>
            <div cla ss="modal-body">
            <li>點擊書籤列的「臺大課程日曆好朋友」，系統將自動擷取課程資訊並補齊時間、學分與教室，提供<strong>「✨ 同步至網頁」</strong>與<strong>「下載日曆 (.ics)」</strong>！</li>
          </ol>
        </div>
      </div>
    </div>
  </div>

  <!-- Manual Import Modal -->
  <div class="modal-backdrop" id="modal-import-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">📋 貼上課表代碼匯入</div>
        <button class="modal-close" id="import-close" aria-label="關閉">✕</button>
      </div>
        <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6;">
          若您使用書籤小工具時點選了「📋 複製代碼」，請在下方貼上 JSON 課表代碼，即可將課表同步儲存在您的瀏覽器中：
        </p>

        <textarea class="import-textarea" id="import-code-area" placeholder="請在此貼上課表 JSON 代碼..."></textarea>
        <div class="import-help-text">
          💡 課表資料僅儲存於您目前的瀏覽器本地端 (LocalStorage)，不會上傳至任何雲端伺服器，隱私安全無虞。
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button class="filter-pill" id="btn-paste-clipboard">讀取剪貼簿貼上</button>
          <button class="btn-nav-primary" id="btn-submit-import">確認匯入</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Export to ICS Settings Modal -->
  <div class="modal-backdrop" id="modal-export-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">📅 匯出至 Google 日曆 (.ics)</div>
        <button class="modal-close" id="export-close" aria-label="關閉">✕</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin-bottom: 14px;">
          設定學期開學日與總週數，生成標準 iCalendar (.ics) 格式，可直接匯入至 Google 日曆、Apple 行事曆或 Outlook。
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
              開學日期 (週一)
            </label>
            <input type="date" id="exp-start-date" value="2026-09-07" style="width:100%; box-sizing:border-box; padding:9px 12px; background:rgba(255,255,255,0.06); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:var(--text-primary); font-family:inherit; font-size:13.5px;">
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
              總週數 (台大現制 16 週)
            </label>
            <input type="number" id="exp-weeks-count" value="16" min="1" max="25" style="width:100%; box-sizing:border-box; padding:9px 12px; background:rgba(255,255,255,0.06); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:var(--text-primary); font-family:inherit; font-size:13.5px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
              輸出語言版本 (Language)
            </label>
            <select id="exp-lang-select" style="width:100%; box-sizing:border-box; padding:9px 12px; background:rgba(255,255,255,0.06); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); color:var(--text-primary); font-family:inherit; font-size:13px; cursor:pointer;">
              <option value="zh" style="background:#1e293b; color:#fff;">繁體中文 (Chinese)</option>
              <option value="en" style="background:#1e293b; color:#fff;">English (NTU Official)</option>
              <option value="bilingual" style="background:#1e293b; color:#fff;">中英雙語 (Bilingual)</option>
            </select>
          </div>
          <div style="display:flex; align-items:center; padding-top:20px;">
            <input type="checkbox" id="exp-mark-waitlist" checked style="accent-color:var(--status-waitlist); cursor:pointer; width:16px; height:16px;">
            <label for="exp-mark-waitlist" style="font-size:12.5px; color:var(--text-secondary); cursor:pointer; margin-left:8px;">
              未選上標記 <strong style="color:var(--status-waitlist)">[候補]</strong>
            </label>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px 14px; margin-bottom:18px;">
          <div style="font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>即將匯出課程清單</span>
            <span id="exp-courses-count" style="color:var(--accent-primary)">已勾選 0 門課</span>
          </div>
          <div id="exp-courses-preview" style="max-height:160px; overflow-y:auto; display:flex; flex-direction:column; gap:6px; font-size:12.5px;">
            <!-- Injected via JS -->
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="filter-pill" id="btn-cancel-export">取消</button>
          <button class="btn-nav-primary" id="btn-confirm-export">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            確認下載日曆 (.ics)
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scriptable Widget Modal -->
  <div class="modal-backdrop" id="modal-scriptable-backdrop">
    <div class="modal-card" style="width: 620px; max-width: 95%;">
      <div class="modal-header">
        <div class="modal-title">📱 iOS / iPad 桌面課表小工具 (Scriptable)</div>
        <button class="modal-close" id="scriptable-close" aria-label="關閉">✕</button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
        <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">
          在 iPhone 與 iPad 桌面上即時查看課表！支援<strong>大尺寸/iPad 週課表矩陣</strong>與<strong>中尺寸今日時間軸</strong>自適應呈現，並支援 Siri 語音朗讀。
        </p>

        <!-- Step-by-step guidance pill cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 4px 0;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
            <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700; margin-bottom: 2px;">步驟 1</div>
            <div style="font-size: 12.5px; color: var(--text-primary); font-weight: 600;">安裝 Scriptable</div>
            <a href="https://apps.apple.com/app/scriptable/id1405459188" target="_blank" style="font-size: 11.5px; color: #60a5fa; text-decoration: underline; display: inline-block; margin-top: 4px;">前往 App Store 下載 ↗</a>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
            <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700; margin-bottom: 2px;">步驟 2</div>
            <div style="font-size: 12.5px; color: var(--text-primary); font-weight: 600;">複製下方專屬腳本</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">已自動載入您勾選的課表</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
            <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700; margin-bottom: 2px;">步驟 3</div>
            <div style="font-size: 12.5px; color: var(--text-primary); font-weight: 600;">桌面新增小工具</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">中尺寸/大尺寸皆可呈現</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; flex-wrap:wrap; gap:8px;">
          <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);" id="scriptable-courses-count">已收錄 0 門課程代碼</span>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <label for="scriptable-lang-select" style="font-size:12px; color:var(--text-secondary);">語言：</label>
              <select id="scriptable-lang-select" style="padding:3px 8px; font-size:12px; background:rgba(255,255,255,0.08); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); color:var(--text-primary); cursor:pointer;">
                <option value="zh" style="background:#1e293b; color:#fff;">繁體中文</option>
                <option value="en" style="background:#1e293b; color:#fff;">English</option>
                <option value="bilingual" style="background:#1e293b; color:#fff;">雙語</option>
              </select>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox" id="scriptable-include-waitlist" checked style="accent-color:var(--status-waitlist); cursor:pointer;">
              <label for="scriptable-include-waitlist" style="font-size:12px; color:var(--text-secondary); cursor:pointer;">包含候補</label>
            </div>
          </div>
        </div>

        <!-- Textarea with generated code -->
        <textarea id="scriptable-code-area" class="import-textarea" readonly style="height: 140px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; background: rgba(10, 15, 29, 0.85);"></textarea>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
          <button class="filter-pill" id="btn-cancel-scriptable">關閉</button>
          <button class="btn-nav-primary" id="btn-copy-scriptable-code" style="gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            一鍵複製 Scriptable 腳本代碼
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Android Widget Modal -->
  <div class="modal-backdrop" id="modal-android-backdrop">
    <div class="modal-card" style="max-width: 580px;">
      <div class="modal-header">
        <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2"><path d="M5 16V8a7 7 0 0 1 14 0v8"/><line x1="8" y1="3" x2="6" y2="1"/><line x1="16" y1="3" x2="18" y2="1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><rect x="5" y="16" width="14" height="5" rx="1"/></svg>
          🤖 Android 原生桌面小工具 App
        </div>
        <button class="modal-close" id="android-close" aria-label="關閉">✕</button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
        <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">
          專為 Android 手機與平板打造的原生課表小工具！支援<strong>2D 週課表矩陣（左側時間軸 + 跨節卡片）</strong>與<strong>今日焦點倒數</strong>，完全免安裝付費第三方軟體。
        </p>

        <!-- Step-by-step guidance pill cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 4px 0;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
            <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700; margin-bottom: 2px;">步驟 1</div>
            <div style="font-size: 12.5px; color: var(--text-primary); font-weight: 600;">安裝 Android App</div>
            <a href="https://github.com/Annie04082020/ntu-course-calendar/releases" target="_blank" style="font-size: 11.5px; color: #34d399; text-decoration: underline; display: inline-block; margin-top: 4px;">前往 GitHub Releases 下載 APK ↗</a>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
            <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700; margin-bottom: 2px;">步驟 2</div>
            <div style="font-size: 12.5px; color: var(--text-primary); font-weight: 600;">一鍵同步至 App</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">點擊下方按鈕直接喚起同步</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
            <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700; margin-bottom: 2px;">步驟 3</div>
            <div style="font-size: 12.5px; color: var(--text-primary); font-weight: 600;">桌面新增微件</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">搜尋「臺大課表好朋友」</div>
          </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 12px; color: #34d399; line-height: 1.5; display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 14px;">🌐</span>
          <span><strong>內建中英雙語支援：</strong>匯出的代碼同時完整收錄繁體中文與臺大官方英文課名。匯入 Android App 後，可隨時點擊右上角【🌐 中文 / 🌐 EN】按鈕，手機 App 與桌面小工具皆能自由切換語系！</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);" id="android-courses-count">已收錄 0 門課程代碼</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="android-include-waitlist" checked style="accent-color:var(--status-waitlist); cursor:pointer;">
            <label for="android-include-waitlist" style="font-size:12px; color:var(--text-secondary); cursor:pointer;">包含志願候補課程</label>
          </div>
        </div>

        <!-- Textarea with generated code for manual copy-paste -->
        <textarea id="android-code-area" class="import-textarea" readonly style="height: 110px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; background: rgba(10, 15, 29, 0.85);"></textarea>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; flex-wrap: wrap;">
          <button class="filter-pill" id="btn-cancel-android">關閉</button>
          <button class="filter-pill" id="btn-copy-android-code" style="gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            複製 JSON 代碼
          </button>
          <button class="btn-nav-primary" id="btn-launch-android-app" style="background:linear-gradient(135deg, #059669, #10b981); gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            🚀 一鍵喚起 Android App 同步
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating Toast Notification -->
  <div id="app-toast"></div>

  <script>
    // =========================================================================
    // 臺大標準節次與常數定義
    // =========================================================================
    const PERIOD_DEFS = {
      '0':  { p: '0',  time: '07:10-08:00', start: [7, 10],  end: [8, 0] },
      '1':  { p: '1',  time: '08:10-09:00', start: [8, 10],  end: [9, 0] },
      '2':  { p: '2',  time: '09:10-10:00', start: [9, 10],  end: [10, 0] },
      '3':  { p: '3',  time: '10:20-11:10', start: [10, 20], end: [11, 10] },
      '4':  { p: '4',  time: '11:20-12:10', start: [11, 20], end: [12, 10] },
      '5':  { p: '5',  time: '12:20-13:10', start: [12, 20], end: [13, 10] },
      '6':  { p: '6',  time: '13:20-14:10', start: [13, 20], end: [14, 10] },
      '7':  { p: '7',  time: '14:20-15:10', start: [14, 20], end: [15, 10] },
      '8':  { p: '8',  time: '15:30-16:20', start: [15, 30], end: [16, 20] },
      '9':  { p: '9',  time: '16:30-17:20', start: [16, 30], end: [17, 20] },
      '10': { p: '10', time: '17:30-18:20', start: [17, 30], end: [18, 20] },
      'A':  { p: 'A',  time: '18:25-19:15', start: [18, 25], end: [19, 15] },
      'B':  { p: 'B',  time: '19:20-20:10', start: [19, 20], end: [20, 10] },
      'C':  { p: 'C',  time: '20:15-21:05', start: [20, 15], end: [21, 5] },
      'D':  { p: 'D',  time: '21:10-22:00', start: [21, 10], end: [22, 0] }
    };

    const PERIOD_ORDER = ['0','1','2','3','4','5','6','7','8','9','10','A','B','C','D'];
    const WEEKDAY_COLS = { '一': 2, '二': 3, '三': 4, '四': 5, '五': 6, '六': 7, '日': 8 };
    const WEEKDAY_RRULE = { '一': 'MO', '二': 'TU', '三': 'WE', '四': 'TH', '五': 'FR', '六': 'SA', '日': 'SU' };
    const WEEKDAY_OFFSET = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };

    const COLOR_CLASSES = ['c-indigo', 'c-emerald', 'c-cyan', 'c-violet', 'c-rose', 'c-amber', 'c-blue'];

    // Scriptable iOS 小工具腳本模板
    const SCRIPTABLE_TEMPLATE = ${JSON.stringify(scriptableTemplate)};

    // 課名標題純淨化：移除課號與流水號
    function cleanCourseTitle(rawName, code, serial, identifier) {
      let name = (rawName || '').trim();
      if (!name) return '';

      const removeLiteral = (val) => {
        if (!val || typeof val !== 'string') return;
        const trimmed = val.trim();
        const esc = trimmed.replace(new RegExp('[.*+?^' + '\\\\$' + '{\\\\}()|[\\\\\\]\\\\\\\\]', 'g'), '\\\\$&');
        name = name.replace(new RegExp('^[\\\\(\\\\[（【]?\\\\s*' + esc + '\\\\s*[\\\\)\\\\]）】]?\\\\s*[-:：_—]?\\\\s*', 'gi'), '');
        name = name.replace(new RegExp('\\\\s*[\\\\(\\\\[（【]?\\\\s*' + esc + '\\\\s*[\\\\)\\\\]）】]?\\\\s*$', 'gi'), '');
        name = name.replace(new RegExp('[\\\\(\\\\[（【]\\\\s*' + esc + '\\\\s*[\\\\)\\\\]）】]', 'gi'), '');
        name = name.replace(new RegExp('\\\\b' + esc + '\\\\b', 'gi'), '');
      };

      removeLiteral(code);
      removeLiteral(serial);
      removeLiteral(identifier);

      // 去除常見課號格式 (如 EE5184, CSIE1210, EduTch5104)
      name = name.replace(/^[\\\\(\\\\[（【]?\\s*[A-Za-z]{2,8}\\s*\\d{3,5}\\s*[\\\\)\\\\]）】]?\\s*[-:：_—]?\\s*/g, '');
      name = name.replace(/\\s*[\\\\(\\\\[（【]\\s*[A-Za-z]{2,8}\\s*\\d{3,5}\\s*[\\\\)\\\\]）】]\\s*$/g, '');

      // 去除常見 4~6 碼流水號 (如 13707, 10359)
      name = name.replace(/^[\\\\(\\\\[（【]?\\s*\\d{4,6}\\s*[\\\\)\\\\]）】]?\\s*[-:：_—]?\\s*/g, '');
      name = name.replace(/\\s*[\\\\(\\\\[（【]\\s*\\d{4,6}\\s*[\\\\)\\\\]）】]\\s*$/g, '');

      name = name.replace(/\\s+/g, ' ').trim();
      return name || rawName.trim();
    }

    // =========================================================================
    // 示範通用課表資料 (不含任何真實個人資料)
    // =========================================================================
    const DEMO_COURSES = [
      {
        id: "demo-1",
        name: "微積分甲 (一)",
        nameEn: "CALCULUS (1)",
        isEnrolled: true,
        instructor: "齊震宇",
        instructorEn: "Chen-Yu Chi",
        locations: ["共同101"],
        timeSlots: ["一 3,4", "三 3,4"],
        code: "MATH4006",
        serial: "10001",
        identifier: "201 10110",
        credits: 4,
        remarks: "大一基礎數理核心課程。",
        remarksEn: "Freshman core mathematical foundation.",
        url: "https://course.ntu.edu.tw",
        description: "本課程為基礎微積分，涵蓋單變數函數極限、連續性、微分、定積分運算技巧及多元微積分初階。",
        descriptionEn: "This is a basic calculus course covering limits, continuity, differentiation, integration techniques, and an introduction to multivariable calculus."
      },
      {
        id: "demo-2",
        name: "普通物理學甲 (一)",
        nameEn: "GENERAL PHYSICS (1)",
        isEnrolled: true,
        instructor: "張寶棣",
        instructorEn: "Pao-Ti Chang",
        locations: ["普物館102"],
        timeSlots: ["二 2,3,4"],
        code: "PHYS1001",
        serial: "10002",
        identifier: "202 10210",
        credits: 3,
        remarks: "涵蓋古典牛頓力學、熱力學基礎。",
        remarksEn: "Covers classical mechanics and thermodynamics.",
        url: "https://course.ntu.edu.tw",
        description: "系統性講授牛頓運動定律、能量守恆、動量守恆、剛體轉動、流體與熱物理基礎現象與數學建模。",
        descriptionEn: "Systematic introduction to Newton's laws of motion, conservation of energy and momentum, rigid body rotation, fluids, and thermodynamics."
      },
      {
        id: "demo-3",
        name: "計算機程式設計",
        nameEn: "Computer Programming",
        isEnrolled: true,
        instructor: "鄭卜壬",
        instructorEn: "Pu-Jen Cheng",
        locations: ["資101"],
        timeSlots: ["四 6,7,8"],
        code: "CSIE1210",
        serial: "10003",
        identifier: "902 10310",
        credits: 3,
        remarks: "C / C++ 程式語言核心思維與實作。",
        remarksEn: "Core concepts and implementation in C/C++.",
        url: "https://course.ntu.edu.tw",
        description: "學習現代程式設計核心邏輯、變數型態、流程控制、指標與動態記憶體配置、結構體與演算法思維。",
        descriptionEn: "Introduction to programming fundamentals, control flow, pointers, dynamic memory allocation, and algorithmic thinking."
      },
      {
        id: "demo-4",
        name: "資料結構與演算法",
        nameEn: "Data Structures and Algorithms",
        isEnrolled: true,
        instructor: "呂學一",
        instructorEn: "Hsueh-I Lu",
        locations: ["博理101"],
        timeSlots: ["五 2,3,4"],
        code: "CSIE2112",
        serial: "10004",
        identifier: "902 20110",
        credits: 3,
        remarks: "核心資訊科學專業課程。",
        remarksEn: "Core computer science curriculum.",
        url: "https://course.ntu.edu.tw",
        description: "深入探討陣列、鏈結串列、堆疊、佇列、樹狀結構、圖形走訪、排序搜尋與時間複雜度分析。",
        descriptionEn: "In-depth exploration of arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, and complexity analysis."
      },
      {
        id: "demo-5",
        name: "大學英文 (一)",
        nameEn: "College English (1)",
        isEnrolled: true,
        instructor: "外籍教師群",
        instructorEn: "Faculty Group",
        locations: ["外教105"],
        timeSlots: ["三 6,7"],
        code: "DFLL1001",
        serial: "10005",
        identifier: "102 10510",
        credits: 2,
        remarks: "全英語授課與學術溝通表達。",
        remarksEn: "Taught in English. Academic presentation.",
        url: "https://course.ntu.edu.tw",
        description: "訓練大學生學術英文閱讀、論文結構摘要、口語簡報與批判性思考討論能力。",
        descriptionEn: "Training in academic reading, research summarization, oral presentation, and critical thinking."
      },
      {
        id: "demo-6",
        name: "體育 (健康體適能)",
        nameEn: "Physical Education: Health and Fitness",
        isEnrolled: true,
        instructor: "體育室教師",
        instructorEn: "PE Faculty",
        locations: ["綜合體育館"],
        timeSlots: ["二 6,7"],
        code: "PE1001",
        serial: "10006",
        identifier: "000 10610",
        credits: 1,
        remarks: "基礎核心體能與健康生活管理。",
        remarksEn: "Physical fitness and active lifestyle.",
        url: "https://course.ntu.edu.tw",
        description: "藉由多樣化運動訓練與有氧肌耐力教學，培養長期規律運動習慣與體能維護技巧。",
        descriptionEn: "Developing regular exercise habits and fitness through structured training routines."
      },
      {
        id: "demo-7",
        name: "機器學習導論",
        nameEn: "Introduction to Machine Learning",
        isEnrolled: false,
        instructor: "李宏毅",
        instructorEn: "Hung-yi Lee",
        locations: ["電二143"],
        timeSlots: ["一 7,8,9"],
        code: "EE5184",
        serial: "10007",
        identifier: "921 51840",
        credits: 3,
        remarks: "志願分發中 (候補第 3 順位)。",
        remarksEn: "Waitlist priority #3.",
        url: "https://course.ntu.edu.tw",
        description: "介紹機器學習、深度神經網路、自注意力機制、自然語言處理與生成式人工智慧核心概念。",
        descriptionEn: "Introduction to machine learning, deep neural networks, self-attention, NLP, and generative AI."
      }
    ];

    // =========================================================================
    // 全域狀態管理與臺大官方雙語字典
    // =========================================================================
    const OFFICIAL_COURSE_META = {
      '13707': { nameEn: 'Machine Learning', instructorEn: 'Tzu-Yu Liu' },
      '10359': { nameEn: 'Introduction to Biomedical Informatics', instructorEn: 'TSENG Y. JANE' },
      '22882': { nameEn: 'Seminar in MHI', instructorEn: 'FEI-MAN HSU' },
      '26409': { nameEn: 'Smart Medicine and Health Informatics', instructorEn: 'MEI-JU, CHEN' },
      '45228': { nameEn: 'Human Anatomy and Physiology', instructorEn: 'RUBY YUN-JU HUANG' },
      '13160': { nameEn: 'Biomedical Signal Investigation', instructorEn: 'WEN-CHAU WU' },
      '56815': { nameEn: 'Philosophy of Education', instructorEn: 'HSU,YU-PING' }
    };

    function enrichCoursesWithOfficialBilingual(courseList) {
      if (!Array.isArray(courseList)) return courseList;
      let enriched = false;
      courseList.forEach(c => {
        const meta = OFFICIAL_COURSE_META[c.serial];
        if (meta) {
          if (!c.nameEn || c.nameEn === c.name || c.nameEn.trim() === '') {
            c.nameEn = meta.nameEn;
            enriched = true;
          }
          if (!c.instructorEn && meta.instructorEn) {
            c.instructorEn = meta.instructorEn;
            enriched = true;
          }
        }
      });
      if (enriched && !isDemoMode) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(courseList));
        } catch (e) {}
      }
      return courseList;
    }

    let courses = [];
    let isDemoMode = false;
    let activeFilter = 'all'; // 'all' | 'enrolled' | 'waitlist'
    let selectedCourseIds = new Set();
    let currentLang = localStorage.getItem('ntu_lang') || 'zh'; // 'zh' | 'en'

    function getCourseDisplayName(course) {
      if (!course) return '';
      const cleanZh = cleanCourseTitle(course.name, course.code, course.serial, course.identifier);
      if (currentLang === 'en') {
        const meta = OFFICIAL_COURSE_META[course.serial] || {};
        const rawEn = course.nameEn || meta.nameEn;
        const cleanEn = rawEn ? cleanCourseTitle(rawEn, course.code, course.serial, course.identifier) : '';
        return cleanEn || cleanZh;
      }
      return cleanZh;
    }

    function getCourseInstructor(course) {
      if (!course) return '';
      const meta = OFFICIAL_COURSE_META[course.serial] || {};
      if (currentLang === 'en') {
        return course.instructorEn || meta.instructorEn || course.instructor || 'TBA';
      }
      return course.instructor || '依公告';
    }

    const STORAGE_KEY = 'ntu_course_calendar_custom_data';

    // 格式化解析節次連續區間
    function parseSlotGroups(slotStr) {
      if (!slotStr) return [];
      const clean = slotStr.replace(/\\s+/g, '');
      const match = clean.match(/^([一二三四五六日])([\\d,ABCDabcd]+)$/i);
      if (!match) return [];
      const weekday = match[1];
      let periodList = [];
      if (match[2].includes(',')) {
        periodList = match[2].split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
      } else {
        const found = match[2].match(/10|[0-9A-Za-z]/g) || [];
        periodList = found.map(p => p.toUpperCase());
      }
      // 防呆正規化：去除個位數補零 (例如 02 -> 2, 09 -> 9)，但保留 0 與 10
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

      return groups.map(group => {
        const firstP = group[0];
        const lastP = group[group.length - 1];
        const startDef = PERIOD_DEFS[firstP];
        const endDef = PERIOD_DEFS[lastP];
        return {
          weekday,
          periods: group,
          startRow: PERIOD_ORDER.indexOf(firstP) + 2,
          endRow: PERIOD_ORDER.indexOf(lastP) + 3,
          timeStr: (startDef && endDef) ? \`\${startDef.time.split('-')[0]} - \${endDef.time.split('-')[1]}\` : ''
        };
      });
    }

    // =========================================================================
    // 渲染課表矩陣與側邊欄
    // =========================================================================
    function renderApp() {
      const isEn = (currentLang === 'en');

      // 更新語系按鈕外觀
      const btnZh = document.getElementById('btn-lang-zh');
      const btnEn = document.getElementById('btn-lang-en');
      if (btnZh && btnEn) {
        btnZh.classList.toggle('active', !isEn);
        btnEn.classList.toggle('active', isEn);
      }

      // 更新頂部導覽列按鈕文字
      const navBm = document.getElementById('nav-lbl-bm');
      const navImport = document.getElementById('nav-lbl-import');
      const navIos = document.getElementById('nav-lbl-ios');
      const navReset = document.getElementById('btn-reset-text');
      const navIcs = document.getElementById('nav-lbl-ics');
      if (navBm) navBm.textContent = isEn ? 'Bookmarklet' : '書籤小工具';
      if (navImport) navImport.textContent = isEn ? 'Import Code' : '代碼匯入';
      if (navIos) navIos.textContent = isEn ? 'iOS Widget' : 'iOS 小工具';
      if (navReset) navReset.textContent = isEn ? 'Reset / Demo' : '清除/示範';
      if (navIcs) navIcs.textContent = isEn ? 'Export ICS' : '匯出日曆 (.ics)';

      const brandName = document.getElementById('app-brand-name');
      if (brandName) brandName.textContent = isEn ? 'NTU Course Schedule Buddy' : '臺大課程日曆好朋友';

      const tbTitle = document.getElementById('toolbar-title-text');
      if (tbTitle) tbTitle.textContent = isEn ? 'Weekly Timetable Matrix' : '一週課表時間矩陣';

      const sbTitle = document.getElementById('sidebar-title-text');
      if (sbTitle) sbTitle.textContent = isEn ? 'Course List' : '課程清單';

      const btnAll = document.getElementById('btn-sel-all');
      if (btnAll) btnAll.textContent = isEn ? 'All' : '全選';
      const btnNone = document.getElementById('btn-unsel-all');
      if (btnNone) btnNone.textContent = isEn ? 'None' : '全不選';
      const btnEnr = document.getElementById('btn-sel-enrolled');
      if (btnEnr) btnEnr.textContent = isEn ? 'Enrolled' : '僅已選上';

      const lblDl = document.getElementById('lbl-sidebar-dl');
      if (lblDl) lblDl.textContent = isEn ? 'Download Selected (.ics)' : '下載勾選課程行事曆 (.ics)';

      const lblIos = document.getElementById('lbl-sidebar-ios');
      if (lblIos) lblIos.textContent = isEn ? 'Generate iOS / iPad Widget' : '產生 iOS / iPad 桌面小工具';

      const lblAndroid = document.getElementById('lbl-sidebar-android');
      if (lblAndroid) lblAndroid.textContent = isEn ? 'Android Native Widget App' : 'Android 原生小工具 App';

      // 1. 更新頂部狀態標籤與統計數據
      const modeBadge = document.getElementById('app-mode-badge');
      if (isDemoMode) {
        modeBadge.className = 'mode-tag demo';
        modeBadge.textContent = isEn ? 'Demo Mode (Unsynced)' : '示範預覽模式 (尚未同步)';
      } else {
        modeBadge.className = 'mode-tag synced';
        modeBadge.textContent = isEn ? 'Personal Schedule 🟢' : '個人專屬課表 🟢';
      }

      const enrolledCourses = courses.filter(c => c.isEnrolled);
      const waitlistCourses = courses.filter(c => !c.isEnrolled);

      const enrolledCredits = enrolledCourses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
      const waitlistCredits = waitlistCourses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);

      document.getElementById('stat-enrolled-text').textContent = isEn 
        ? \`Enrolled: \${enrolledCourses.length} · \${enrolledCredits} Credits\`
        : \`已選上 \${enrolledCourses.length} 門 · \${enrolledCredits} 學分\`;
      document.getElementById('stat-waitlist-text').textContent = isEn
        ? \`Waitlist: \${waitlistCourses.length} · \${waitlistCredits} Credits\`
        : \`待分發 \${waitlistCourses.length} 門 · \${waitlistCredits} 學分\`;

      document.getElementById('f-all').textContent = isEn ? \`All (\${courses.length})\` : \`全部 (\${courses.length})\`;
      document.getElementById('f-enrolled').textContent = isEn ? \`Enrolled (\${enrolledCourses.length})\` : \`僅已選上 (\${enrolledCourses.length})\`;
      document.getElementById('f-waitlist').textContent = isEn ? \`Waitlist (\${waitlistCourses.length})\` : \`僅待分發 (\${waitlistCourses.length})\`;

      // 檢查是否缺乏英文資料並顯示提示橫幅
      const hasMissingEn = isEn && !isDemoMode && courses.length > 0 && courses.some(c => !c.nameEn || !c.nameEn.trim());
      const missingBanner = document.getElementById('missing-en-banner');
      if (missingBanner) {
        const isDismissed = sessionStorage.getItem('dismiss_missing_en_banner') === 'true';
        missingBanner.style.display = (hasMissingEn && !isDismissed) ? 'flex' : 'none';
        const bText = document.getElementById('banner-text');
        if (bText) {
          bText.innerHTML = isEn 
            ? '<strong>Notice:</strong> Your saved schedule was imported with an older version without official NTU English titles. Please click the updated Bookmarklet on NTU Course Online once to automatically sync complete bilingual data!'
            : '<strong>提醒：</strong>目前儲存的課表缺少官方英文資訊。請在臺大課程網使用新版「書籤小工具」，一鍵自動同步獲取正統雙語課名與簡介！';
        }
        const bBtn = document.getElementById('btn-banner-bm');
        if (bBtn) bBtn.textContent = isEn ? 'Get Bookmarklet' : '取得新版書籤';
      }

      // 2. 決定過濾後的課程
      let displayCourses = courses;
      if (activeFilter === 'enrolled') {
        displayCourses = courses.filter(c => c.isEnrolled);
      } else if (activeFilter === 'waitlist') {
        displayCourses = courses.filter(c => !c.isEnrolled);
      }

      // 3. 渲染課表矩陣
      renderMatrix(displayCourses);

      // 4. 渲染側邊欄清單
      renderSidebar();
    }

    function renderMatrix(displayCourses) {
      const matrixEl = document.getElementById('tt-matrix');
      matrixEl.innerHTML = '';
      const isEn = (currentLang === 'en');

      // 固定欄首與節次列 (預設 1~9 節，若有 0 節或 10, A~D 節則自動擴展)
      let minPeriodIdx = 1; // '1'
      let maxPeriodIdx = 9; // '9'

      // 偵測課程節次範圍
      courses.forEach(c => {
        (c.timeSlots || []).forEach(slotStr => {
          parseSlotGroups(slotStr).forEach(g => {
            g.periods.forEach(p => {
              const idx = PERIOD_ORDER.indexOf(p);
              if (idx !== -1) {
                if (idx < minPeriodIdx) minPeriodIdx = idx;
                if (idx > maxPeriodIdx) maxPeriodIdx = idx;
              }
            });
          });
        });
      });

      const activePeriods = PERIOD_ORDER.slice(minPeriodIdx, maxPeriodIdx + 1);

      // 動態設定精確網格行高，避免行動裝置或節次超出時發生破版錯位
      const isMobile = window.innerWidth <= 768;
      const headHeight = isMobile ? '28px' : '38px';
      const cellHeight = isMobile ? '48px' : '64px';
      matrixEl.style.gridTemplateRows = \`\${headHeight} repeat(\${activePeriods.length}, minmax(\${cellHeight}, auto))\`;

      // 欄首 Header
      const col1Label = isEn ? (isMobile ? 'Period' : 'Period / Time') : (isMobile ? '節次' : '節次 / 時間');
      const d1 = isEn ? 'MON' : '週一';
      const d2 = isEn ? 'TUE' : '週二';
      const d3 = isEn ? 'WED' : '週三';
      const d4 = isEn ? 'THU' : '週四';
      const d5 = isEn ? 'FRI' : '週五';

      const headerHTML = [
        \`<div class="tt-col-head tt-col-sticky" style="grid-column: 1; grid-row: 1;">\${col1Label}</div>\`,
        \`<div class="tt-col-head" style="grid-column: 2; grid-row: 1;">\${d1}</div>\`,
        \`<div class="tt-col-head" style="grid-column: 3; grid-row: 1;">\${d2}</div>\`,
        \`<div class="tt-col-head" style="grid-column: 4; grid-row: 1;">\${d3}</div>\`,
        \`<div class="tt-col-head" style="grid-column: 5; grid-row: 1;">\${d4}</div>\`,
        \`<div class="tt-col-head" style="grid-column: 6; grid-row: 1;">\${d5}</div>\`,
      ];
      matrixEl.insertAdjacentHTML('beforeend', headerHTML.join(''));

      // 節次列 Label
      activePeriods.forEach((p, idx) => {
        const def = PERIOD_DEFS[p];
        const row = idx + 2;
        const timeDisplay = isMobile ? def.time.split('-')[0] : def.time;
        const labelHTML = \`
          <div class="tt-row-label tt-col-sticky" style="grid-column: 1; grid-row: \${row};">
            <span class="p-num">\${def.p}</span>
            <span class="p-time">\${timeDisplay}</span>
          </div>
        \`;
        matrixEl.insertAdjacentHTML('beforeend', labelHTML);
      });

      // 背景空白格子
      for (let c = 2; c <= 6; c++) {
        for (let r = 2; r <= activePeriods.length + 1; r++) {
          matrixEl.insertAdjacentHTML('beforeend', \`<div class="tt-cell-empty" style="grid-column: \${c}; grid-row: \${r};"></div>\`);
        }
      }

      // 若完全無課程顯示空狀態
      if (displayCourses.length === 0) {
        matrixEl.insertAdjacentHTML('beforeend', \`
          <div class="empty-state-overlay">
            <div class="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="empty-state-title">\${courses.length === 0 ? (isEn ? 'No Course Data Synced' : '尚未同步您的課表') : (isEn ? 'No courses in this filter' : '在此篩選條件下沒有課程')}</div>
            <div class="empty-state-desc">
              \${courses.length === 0 
                ? (isEn ? 'Drag the Bookmarklet above to your bookmarks bar and visit NTU Course to sync your classes, or load the demo schedule to test.' : '請拖曳上方「書籤小工具」至書籤列，前往臺大課程網即可一鍵同步專屬課表！或者您可以點擊載入示範課表體驗功能。')
                : (isEn ? 'Switch filter tabs to view other courses.' : '請切換篩選條件查看其他選課狀態。')}
            </div>
            \${courses.length === 0 ? \`
              <div class="empty-state-actions">
                <button class="filter-pill active" onclick="loadDemoCourses()">👀 \${isEn ? 'Load Demo Schedule' : '載入示範課表'}</button>
                <button class="filter-pill" onclick="document.getElementById('btn-open-bm-modal').click()">📌 \${isEn ? 'Bookmarklet Guide' : '書籤安裝教學'}</button>
              </div>
            \` : ''}
          </div>
        \`);
        return;
      }

      // 注入課程色塊
      displayCourses.forEach((course, cIdx) => {
        const colorClass = COLOR_CLASSES[cIdx % COLOR_CLASSES.length];
        const slots = course.timeSlots || [];
        const displayName = getCourseDisplayName(course);
        const instructor = getCourseInstructor(course);

        slots.forEach(slotStr => {
          const groups = parseSlotGroups(slotStr);
          groups.forEach(g => {
            const col = WEEKDAY_COLS[g.weekday];
            if (!col || col > 6) return; // 僅週一至週五

            // 調整 row 相對位置
            const firstPIdx = PERIOD_ORDER.indexOf(g.periods[0]);
            const lastPIdx = PERIOD_ORDER.indexOf(g.periods[g.periods.length - 1]);
            if (firstPIdx === -1 || lastPIdx === -1) return;

            const gridStartRow = (firstPIdx - minPeriodIdx) + 2;
            const gridEndRow = (lastPIdx - minPeriodIdx) + 3;

            const isWaitlist = !course.isEnrolled;
            const waitlistBadge = isWaitlist ? (isEn ? '<span class="tt-b-status wait">Wait</span>' : '<span class="tt-b-status wait">待分發</span>') : '';
            const creditsText = isEn ? \`\${course.credits} Cr\` : \`\${course.credits} 學分\`;
            const locText = formatLocDisplay(course.locations && course.locations[0] ? course.locations[0] : (isEn ? 'TBA' : '依公告'));

            const blockHTML = \`
              <div class="tt-course-block \${colorClass} \${isWaitlist ? 'waitlist-card' : ''}" 
                   style="grid-column: \${col}; grid-row: \${gridStartRow} / \${gridEndRow};"
                   onclick="openCourseDetail('\${course.id}')">
                <div class="tt-b-top">
                  <span class="tt-b-name">\${escapeHtml(displayName)}</span>
                  \${waitlistBadge}
                </div>
                <div class="tt-b-bottom">
                  <span class="tt-b-meta">\${escapeHtml(instructor ? instructor + ' · ' : '')}\${creditsText}</span>
                  <span class="tt-b-loc">📍 \${escapeHtml(locText)}</span>
                  <span class="tt-b-meta">\${g.timeStr}</span>
                </div>
              </div>
            \`;
            matrixEl.insertAdjacentHTML('beforeend', blockHTML);
          });
        });
      });
    }

    function renderSidebar() {
      const listEl = document.getElementById('sidebar-course-list');
      listEl.innerHTML = '';
      const isEn = (currentLang === 'en');

      courses.forEach((c, idx) => {
        const isChecked = selectedCourseIds.has(c.id);
        const colorClass = COLOR_CLASSES[idx % COLOR_CLASSES.length];
        const displayName = getCourseDisplayName(c);
        const instructor = getCourseInstructor(c);
        const statusTag = c.isEnrolled 
          ? \`<span class="ci-status-tag enrolled">\${isEn ? 'Enrolled' : '已選上'}</span>\`
          : \`<span class="ci-status-tag wait">\${isEn ? 'Waitlist' : '待分發'}</span>\`;
        const creditsText = isEn ? \`\${c.credits} Credits\` : \`\${c.credits} 學分\`;

        const cardHTML = \`
          <div class="course-item \${isChecked ? 'selected' : ''}" data-id="\${c.id}">
            <div class="ci-left">
              <input type="checkbox" class="ci-check" data-id="\${c.id}" \${isChecked ? 'checked' : ''} />
            </div>
            <div class="ci-content" onclick="openCourseDetail('\${c.id}')">
              <div class="ci-row-1">
                <span class="ci-name">\${escapeHtml(displayName)}</span>
                \${statusTag}
              </div>
              <div class="ci-row-2">
                <span>⏰ \${escapeHtml((c.timeSlots || []).join('、'))}</span>
                <span>📍 \${escapeHtml((c.locations || []).join('、') || (isEn ? 'TBA' : '依公告'))}</span>
              </div>
              <div class="ci-row-3">
                <span class="ci-prof">\${escapeHtml(instructor)}</span>
                <span class="ci-meta-dim">#\${c.serial || c.code} · \${creditsText}</span>
              </div>
            </div>
          </div>
        \`;
        listEl.insertAdjacentHTML('beforeend', cardHTML);
      });

      // 監聽 Checkbox 事件
      listEl.querySelectorAll('.ci-check').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const id = e.target.dataset.id;
          if (e.target.checked) {
            selectedCourseIds.add(id);
          } else {
            selectedCourseIds.delete(id);
          }
          const item = e.target.closest('.course-item');
          if (item) item.classList.toggle('selected', e.target.checked);
          updateSidebarSelectionCount();
        });
      });

      updateSidebarSelectionCount();
    }

    function updateSidebarSelectionCount() {
      const label = document.getElementById('sidebar-sel-label');
      const isEn = (currentLang === 'en');
      label.textContent = isEn 
        ? \`Selected \${selectedCourseIds.size} / \${courses.length} courses\`
        : \`已勾選 \${selectedCourseIds.size} / \${courses.length} 門課程\`;
    }

    function formatLocDisplay(loc) {
      if (!loc) return currentLang === 'en' ? 'TBA' : '依公告';
      return String(loc)
        .replace(/^國立臺灣大學\\s*/, '')
        .replace(/^臺大\\s*/, '')
        .replace(/綜合教學館/, '綜教')
        .replace(/博雅教學館/, '博雅')
        .replace(/普通教學館/, '普通')
        .replace(/共同教學館/, '共同')
        .replace(/新生教學館/, '新生')
        .replace(/社會科學院大樓/, '社科院')
        .replace(/社會科學院/, '社科')
        .trim();
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // =========================================================================
    // 詳細資訊彈窗 (支援中英文 Tab 切換與官方簡介展示)
    // =========================================================================
    window.openCourseDetail = function(id) {
      const course = courses.find(c => String(c.id) === String(id));
      if (!course) return;

      const isEn = (currentLang === 'en');
      const displayName = getCourseDisplayName(course);
      document.getElementById('md-title').textContent = displayName;
      const body = document.getElementById('md-body');

      const instructor = getCourseInstructor(course);
      const creditsLabel = isEn ? ('Credits: ' + (course.credits || '0')) : ('學分數：' + (course.credits || '0') + ' 學分');
      const codeLabel = isEn ? ('Course No.: ' + (course.code || '')) : ('課號：' + (course.code || ''));
      const serialLabel = isEn ? ('Serial No.: #' + (course.serial || '')) : ('流水號：#' + (course.serial || ''));
      const statusTag = course.isEnrolled 
        ? (isEn ? '<span class="ci-status-tag enrolled">✅ Enrolled</span>' : '<span class="ci-status-tag enrolled">✅ 已選上課程</span>')
        : (isEn ? '<span class="ci-status-tag wait">⏳ Waitlist</span>' : '<span class="ci-status-tag wait">⏳ 志願候補 / 待分發</span>');

      const remarks = (isEn && course.remarksEn) ? course.remarksEn : (course.remarks || '');
      const desc = (isEn && course.descriptionEn) ? course.descriptionEn : (course.description || '');

      const zhUrl = course.url || 'https://course.ntu.edu.tw';
      const enUrl = zhUrl.includes('/en/courses/') ? zhUrl : zhUrl.replace('/courses/', '/en/courses/');

      body.innerHTML = \`
        <div class="md-badge-bar">
          \${statusTag}
          <span style="font-size:12px;color:var(--text-muted);font-weight:600">\${creditsLabel}</span>
          \${course.code ? \`<span style="font-size:12px;color:var(--text-muted)">\${escapeHtml(codeLabel)}</span>\` : ''}
          \${course.serial ? \`<span style="font-size:12px;color:var(--text-muted)">\${escapeHtml(serialLabel)}</span>\` : ''}
        </div>

        <div class="md-info-grid">
          <div class="md-field">
            <span class="md-label">\${isEn ? 'Instructor' : '授課教師'}</span>
            <span class="md-val">\${escapeHtml(instructor)}</span>
          </div>
          <div class="md-field">
            <span class="md-label">\${isEn ? 'Location' : '上課教室與地點'}</span>
            <span class="md-val">\${escapeHtml((course.locations || []).join('、') || (isEn ? 'TBA' : '依系所公告'))}</span>
          </div>
          <div class="md-field">
            <span class="md-label">\${isEn ? 'Time Slot' : '上課時間與節次'}</span>
            <span class="md-val">\${escapeHtml((course.timeSlots || []).join('、'))}</span>
          </div>
          <div class="md-field">
            <span class="md-label">\${isEn ? 'Course ID' : '課程識別碼'}</span>
            <span class="md-val">\${escapeHtml(course.identifier || (isEn ? 'None' : '無'))}</span>
          </div>
        </div>

        \${remarks ? \`
          <div class="md-desc-box" style="margin-top:14px;border-left:3px solid var(--accent-amber);">
            <div style="font-size:11.5px;font-weight:700;color:var(--accent-amber);margin-bottom:4px">\${isEn ? 'Notes & Restrictions' : '選課備註與限制'}</div>
            <div style="font-size:12.5px;line-height:1.5;color:var(--text-secondary)">\${escapeHtml(remarks)}</div>
          </div>
        \` : ''}

        <div class="md-desc-box" style="margin-top:14px">
          <div class="md-desc-title">\${isEn ? 'Course Syllabus (NTU Official)' : '課程概述與大綱 (NTU 官方簡介)'}</div>
          <div class="md-desc-text">\${escapeHtml(desc || (isEn ? 'No syllabus details available.' : '暫無課程大綱與簡介資訊。'))}</div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 14px; margin-top:14px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11.5px; font-weight:700; color:var(--accent-primary);">🌐 雙語對照 (Bilingual Names)</div>
          <div style="font-size:12.5px; color:var(--text-primary); display:flex; justify-content:space-between; gap:8px;">
            <span style="color:var(--text-secondary); white-space:nowrap;">中文課名：</span>
            <strong>\${escapeHtml(cleanCourseTitle(course.name, course.code, course.serial, course.identifier))}</strong>
          </div>
          <div style="font-size:12.5px; color:var(--text-primary); display:flex; justify-content:space-between; gap:8px;">
            <span style="color:var(--text-secondary); white-space:nowrap;">臺大官方英文：</span>
            <strong style="color:var(--accent-cyan)">\${escapeHtml(course.nameEn || OFFICIAL_COURSE_META[course.serial]?.nameEn || (isEn ? 'Not Set' : '未設定'))}</strong>
          </div>
        </div>

        <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <a href="\${escapeHtml(enUrl)}" target="_blank" style="color:var(--accent-cyan); font-size:12.5px; text-decoration:underline;">
            Open NTU English Page ↗
          </a>
          <a href="\${escapeHtml(zhUrl)}" target="_blank" style="color:var(--accent-primary); font-size:12.5px; text-decoration:underline;">
            在臺大課程網開啟本課程頁面 ↗
          </a>
        </div>
      \`;

      const modal = document.getElementById('modal-detail-backdrop');
      modal.classList.add('open');
      modal.classList.add('show');
    };

    // =========================================================================
    // RFC 5545 iCalendar (.ics) 純前端生成器
    // =========================================================================
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
      return lines.join('\\r\\n');
    }

    function exportToICS(selectedCourses, customStartDate, customWeeks, markWaitlist = true, lang = 'zh') {
      if (!selectedCourses || selectedCourses.length === 0) {
        alert('請至少勾選一門課程！');
        return;
      }

      const isEn = (lang === 'en');
      const isBi = (lang === 'bilingual');

      // 開學日：支援自訂或預設 2026-09-07 (台大 115-1 開學日)
      let semStart;
      if (customStartDate) {
        const [y, m, d] = customStartDate.split('-').map(Number);
        semStart = new Date(y, m - 1, d, 0, 0, 0);
      } else {
        semStart = new Date(2026, 8, 7, 0, 0, 0);
      }
      const totalWeeks = (customWeeks && customWeeks > 0) ? customWeeks : 16;

      const pad = (n) => String(n).padStart(2, '0');
      const formatICSDate = (d) => {
        return \`\${d.getFullYear()}\${pad(d.getMonth() + 1)}\${pad(d.getDate())}T\${pad(d.getHours())}\${pad(d.getMinutes())}\${pad(d.getSeconds())}\`;
      };
      const escapeICS = (str) => {
        if (!str) return '';
        const bs = String.fromCharCode(92);
        return String(str)
          .split(bs).join(bs + bs)
          .split(';').join(bs + ';')
          .split(',').join(bs + ',')
          .split(String.fromCharCode(13, 10)).join(bs + 'n')
          .split(String.fromCharCode(10)).join(bs + 'n');
      };

      const calName = isEn ? 'NTU Course Schedule 115-1' : (isBi ? '臺大課程表 NTU Schedule 115-1' : '臺大課程表 115-1');

      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NTU Course Calendar Buddy//' + (isEn ? 'EN' : 'ZH-TW'),
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        \`X-WR-CALNAME:\${calName}\`,
        'X-WR-TIMEZONE:Asia/Taipei',
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Taipei',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0800',
        'TZOFFSETTO:+0800',
        'TZNAME:CST',
        'END:STANDARD',
        'END:VTIMEZONE'
      ];

      selectedCourses.forEach(c => {
        const slots = c.timeSlots || [];
        slots.forEach(slotStr => {
          const groups = parseSlotGroups(slotStr);
          groups.forEach((g) => {
            const byDay = WEEKDAY_RRULE[g.weekday];
            const offset = WEEKDAY_OFFSET[g.weekday];
            if (!byDay || offset === undefined) return;

            const firstP = g.periods[0];
            const lastP = g.periods[g.periods.length - 1];
            const startDef = PERIOD_DEFS[firstP];
            const endDef = PERIOD_DEFS[lastP];
            if (!startDef || !endDef) return;

            // 計算第一週該星期幾的日期 (安全日曆相加，保證不遺漏第 1 週)
            const semDay = semStart.getDay(); // 0 is Sun, 1 is Mon
            let diff = offset - semDay;
            if (diff < 0) diff += 7;
            const eventDate = new Date(semStart);
            eventDate.setDate(eventDate.getDate() + diff);

            const dtStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), startDef.start[0], startDef.start[1], 0);
            const dtEnd = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), endDef.end[0], endDef.end[1], 0);

            // 標題純淨化：絕不包含課號與流水號
            const cleanZh = cleanCourseTitle(c.name, c.code, c.serial, c.identifier);
            const cleanEn = cleanCourseTitle(c.nameEn, c.code, c.serial, c.identifier) || cleanZh;

            let titleText = cleanZh;
            if (isEn) {
              titleText = cleanEn;
            } else if (isBi && c.nameEn && c.nameEn !== c.name) {
              titleText = \`\${cleanZh} (\${cleanEn})\`;
            }

            let waitPrefix = '';
            if (markWaitlist && !c.isEnrolled) {
              waitPrefix = isEn ? '[Waiting] ' : (isBi ? '[候補/Waiting] ' : '[候補] ');
            }
            const summary = waitPrefix + titleText;
            const location = (c.locations && c.locations.length > 0) ? c.locations.join('、') : (isEn ? 'TBA' : '依系所公告');

            const descParts = [];
            if (isEn) {
              descParts.push(!c.isEnrolled ? '⚠️ [Status]: Waiting list (Not Enrolled)' : '✅ [Status]: Enrolled');
              if (c.instructorEn || c.instructor) descParts.push('Instructor: ' + (c.instructorEn || c.instructor));
              if (c.code) descParts.push('Course No.: ' + c.code);
              if (c.serial) descParts.push('Serial No.: #' + c.serial);
              if (c.identifier) descParts.push('Course ID: ' + c.identifier);
              descParts.push('Classroom: ' + location);
              if (c.remarksEn || c.remarks) descParts.push('Notes: ' + (c.remarksEn || c.remarks));
              if (c.descriptionEn || c.description) descParts.push('\\n[Course Description]\\n' + (c.descriptionEn || c.description));
              const enUrl = (c.url && !c.url.includes('/en/courses/')) ? c.url.replace('/courses/', '/en/courses/') : (c.url || '');
              if (enUrl) descParts.push('\\nCourse URL: ' + enUrl);
            } else if (isBi) {
              descParts.push(!c.isEnrolled ? '⚠️【選課狀態 / Status】：志願候補 / Waiting list' : '✅【選課狀態 / Status】：已選上 / Enrolled');
              if (c.instructor) descParts.push('授課教師 / Instructor：' + c.instructor + (c.instructorEn ? \` (\${c.instructorEn})\` : ''));
              if (c.code) descParts.push('課號 / Course No.：' + c.code);
              if (c.serial) descParts.push('流水號 / Serial No.：#' + c.serial);
              if (c.identifier) descParts.push('課程識別碼 / Course ID：' + c.identifier);
              descParts.push('教室 / Location：' + location);
              if (c.remarks || c.remarksEn) descParts.push('備註 / Notes：' + (c.remarks || '') + (c.remarksEn ? \`\\n[Notes] \${c.remarksEn}\` : ''));
              if (c.description) descParts.push('\\n【課程概述】\\n' + c.description);
              if (c.descriptionEn) descParts.push('\\n【Course Description】\\n' + c.descriptionEn);
              if (c.url) descParts.push('\\n課程網址 / URL：' + c.url);
            } else {
              descParts.push(!c.isEnrolled ? '⚠️【選課狀態】：志願分發候補' : '✅【選課狀態】：已選上');
              if (c.instructor) descParts.push('授課教師：' + c.instructor);
              if (c.code) descParts.push('課號：' + c.code);
              if (c.serial) descParts.push('流水號：#' + c.serial);
              if (c.identifier) descParts.push('課程識別碼：' + c.identifier);
              descParts.push('教室：' + location);
              if (c.remarks) descParts.push('備註：' + c.remarks);
              if (c.description) descParts.push('\\n【課程概述】\\n' + c.description);
              if (c.url) descParts.push('\\n課程網址：' + c.url);
            }

            const uid = \`ntu-\${Date.now()}-\${Math.random().toString(36).slice(2, 9)}@course.ntu.edu.tw\`;

            lines.push('BEGIN:VEVENT');
            lines.push(foldLine(\`UID:\${uid}\`));
            lines.push(\`DTSTART;TZID=Asia/Taipei:\${formatICSDate(dtStart)}\`);
            lines.push(\`DTEND;TZID=Asia/Taipei:\${formatICSDate(dtEnd)}\`);
            lines.push(\`RRULE:FREQ=WEEKLY;BYDAY=\${byDay};COUNT=\${totalWeeks}\`);
            lines.push(foldLine(\`SUMMARY:\${escapeICS(summary)}\`));
            lines.push(foldLine(\`LOCATION:\${escapeICS(location)}\`));
            lines.push(foldLine(\`DESCRIPTION:\${escapeICS(descParts.join('\\n'))}\`));
            if (c.url) lines.push(foldLine(\`URL:\${c.url}\`));
            lines.push('STATUS:CONFIRMED');
            lines.push('END:VEVENT');
          });
        });
      });

      lines.push('END:VCALENDAR');
      const icsContent = lines.join('\\r\\n');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = \`NTU_Courses_\${new Date().toISOString().slice(0, 10)}.ics\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Export Modal & Download handlers
    function openExportModal() {
      const selected = courses.filter(c => selectedCourseIds.has(c.id));
      if (!selected || selected.length === 0) {
        alert('請先在左側勾選至少一門要匯出的課程！');
        return;
      }

      // 更新即將匯出的課程數量與預覽清單
      const countEl = document.getElementById('exp-courses-count');
      const previewEl = document.getElementById('exp-courses-preview');
      countEl.textContent = \`已勾選 \${selected.length} 門課\`;

      previewEl.innerHTML = selected.map(c => \`
        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; background:rgba(255,255,255,0.03); border-radius:4px;">
          <div style="display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            <span style="font-size:11px; padding:1px 5px; border-radius:3px; \${c.isEnrolled ? 'background:rgba(16,185,129,0.15); color:var(--accent-primary);' : 'background:rgba(245,158,11,0.15); color:var(--status-waitlist);'}">\${c.isEnrolled ? '正選' : '候補'}</span>
            <span style="font-weight:600; color:var(--text-primary);">\${escapeHtml(getCourseDisplayName(c))}</span>
            \${c.instructor ? \`<span style="color:var(--text-muted); font-size:11.5px;">(\${escapeHtml(getCourseInstructor(c))})</span>\` : ''}
          </div>
          <div style="color:var(--text-secondary); font-size:11.5px; font-variant-numeric:tabular-nums; white-space:nowrap; margin-left:8px;">
            \${escapeHtml((c.timeSlots || []).join(', ') || '無節次')}
          </div>
        </div>
      \`).join('');

      const modal = document.getElementById('modal-export-backdrop');
      modal.classList.add('open');
      modal.classList.add('show');
    }

    document.getElementById('btn-sidebar-dl').addEventListener('click', openExportModal);
    document.getElementById('btn-nav-quick-dl').addEventListener('click', openExportModal);

    document.getElementById('btn-confirm-export').addEventListener('click', () => {
      const selected = courses.filter(c => selectedCourseIds.has(c.id));
      const startDate = document.getElementById('exp-start-date').value;
      const weeks = parseInt(document.getElementById('exp-weeks-count').value, 10) || 16;
      const markWaitlist = document.getElementById('exp-mark-waitlist').checked;
      const lang = document.getElementById('exp-lang-select').value || 'zh';

      exportToICS(selected, startDate, weeks, markWaitlist, lang);

      const modal = document.getElementById('modal-export-backdrop');
      modal.classList.remove('open');
      modal.classList.remove('show');
    });

    document.getElementById('btn-cancel-export').addEventListener('click', () => {
      const modal = document.getElementById('modal-export-backdrop');
      modal.classList.remove('open');
      modal.classList.remove('show');
    });

    // Scriptable Widget Modal & Code Generator
    function generateScriptableCode(selectedCourses, includeWaitlist = true, lang = 'zh') {
      const targetCourses = includeWaitlist ? selectedCourses : selectedCourses.filter(c => c.isEnrolled);
      const cleanData = targetCourses.map(c => ({
        name: cleanCourseTitle(c.name, c.code, c.serial, c.identifier),
        nameEn: cleanCourseTitle(c.nameEn, c.code, c.serial, c.identifier) || cleanCourseTitle(c.name, c.code, c.serial, c.identifier),
        instructor: c.instructor || '',
        instructorEn: c.instructorEn || '',
        locations: c.locations || [],
        timeSlots: c.timeSlots || [],
        isEnrolled: c.isEnrolled !== false,
        url: c.url || 'https://course.ntu.edu.tw'
      }));
      const jsonStr = JSON.stringify(cleanData, null, 2);
      let tpl = SCRIPTABLE_TEMPLATE;

      // 替換語言標籤
      tpl = tpl.split('/* __USER_LANG__ */ "zh"').join(JSON.stringify(lang));

      const placeholder = '/* __USER_COURSES_JSON__ */ [';
      const startIdx = tpl.indexOf(placeholder);
      if (startIdx === -1) return tpl;
      const endIdx = tpl.indexOf('];', startIdx);
      if (endIdx === -1) return tpl;
      return tpl.slice(0, startIdx) + jsonStr + ';' + tpl.slice(endIdx + 2);
    }

    function openScriptableModal() {
      const selected = courses.filter(c => selectedCourseIds.has(c.id));
      if (!selected || selected.length === 0) {
        alert('請先在左側勾選至少一門要匯出至小工具的課程！');
        return;
      }
      const includeWaitlist = document.getElementById('scriptable-include-waitlist').checked;
      const lang = document.getElementById('scriptable-lang-select').value || 'zh';
      const code = generateScriptableCode(selected, includeWaitlist, lang);
      document.getElementById('scriptable-code-area').value = code;
      document.getElementById('scriptable-courses-count').textContent = \`已收錄 \${selected.length} 門課程代碼\`;

      const modal = document.getElementById('modal-scriptable-backdrop');
      modal.classList.add('open');
      modal.classList.add('show');
    }

    const refreshScriptableCode = () => {
      const selected = courses.filter(c => selectedCourseIds.has(c.id));
      const includeWaitlist = document.getElementById('scriptable-include-waitlist').checked;
      const lang = document.getElementById('scriptable-lang-select').value || 'zh';
      document.getElementById('scriptable-code-area').value = generateScriptableCode(selected, includeWaitlist, lang);
    };

    document.getElementById('scriptable-include-waitlist').addEventListener('change', refreshScriptableCode);
    document.getElementById('scriptable-lang-select').addEventListener('change', refreshScriptableCode);

    document.getElementById('btn-open-scriptable-modal').addEventListener('click', openScriptableModal);
    const sidebarScriptableBtn = document.getElementById('btn-sidebar-scriptable');
    if (sidebarScriptableBtn) sidebarScriptableBtn.addEventListener('click', openScriptableModal);

    document.getElementById('btn-copy-scriptable-code').addEventListener('click', async () => {
      const codeArea = document.getElementById('scriptable-code-area');
      const code = codeArea.value;
      const setSuccess = () => {
        const btn = document.getElementById('btn-copy-scriptable-code');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ✅ 已複製 Scriptable 代碼！';
        showToast('🎉 Scriptable 腳本已成功複製！請打開 Scriptable 貼上');
        setTimeout(() => { btn.innerHTML = origHTML; }, 2500);
      };

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(code);
          setSuccess();
          return;
        } catch (e) {}
      }
      codeArea.select();
      document.execCommand('copy');
      setSuccess();
    });

    document.getElementById('btn-cancel-scriptable').addEventListener('click', () => {
      const modal = document.getElementById('modal-scriptable-backdrop');
      modal.classList.remove('open');
      modal.classList.remove('show');
    });

    // Android App Widget Modal & Deep Link Generator
    function generateAndroidJson(selectedCourses, includeWaitlist = true) {
      const targetCourses = includeWaitlist ? selectedCourses : selectedCourses.filter(c => c.isEnrolled);
      const cleanData = targetCourses.map(c => {
        const meta = OFFICIAL_COURSE_META[c.serial] || {};
        const cleanZh = cleanCourseTitle(c.name, c.code, c.serial, c.identifier);
        let rawEn = c.nameEn;
        if (!rawEn || rawEn === c.name || rawEn.trim() === '') {
          rawEn = meta.nameEn || '';
        }
        const cleanEn = rawEn ? cleanCourseTitle(rawEn, c.code, c.serial, c.identifier) : cleanZh;

        let instructorEn = c.instructorEn;
        if (!instructorEn || instructorEn.trim() === '') {
          instructorEn = meta.instructorEn || '';
        }

        return {
          id: c.id,
          name: cleanZh,
          nameEn: cleanEn,
          code: c.code || '',
          serial: c.serial || '',
          identifier: c.identifier || '',
          credits: c.credits || '',
          instructor: c.instructor || '',
          instructorEn: instructorEn,
          locations: c.locations || [],
          timeSlots: c.timeSlots || [],
          isEnrolled: c.isEnrolled !== false,
          remarks: c.remarks || '',
          remarksEn: c.remarksEn || '',
          description: c.description || '',
          descriptionEn: c.descriptionEn || '',
          url: c.url || 'https://course.ntu.edu.tw'
        };
      });
      return JSON.stringify(cleanData, null, 2);
    }

    function openAndroidModal() {
      const selected = courses.filter(c => selectedCourseIds.has(c.id));
      if (!selected || selected.length === 0) {
        alert('請先在左側勾選至少一門要匯出至 Android 小工具的課程！');
        return;
      }
      const includeWaitlist = document.getElementById('android-include-waitlist').checked;
      const json = generateAndroidJson(selected, includeWaitlist);
      document.getElementById('android-code-area').value = json;
      document.getElementById('android-courses-count').textContent = \`已收錄 \${selected.length} 門課程代碼\`;

      const modal = document.getElementById('modal-android-backdrop');
      modal.classList.add('open');
      modal.classList.add('show');
    }

    document.getElementById('android-include-waitlist').addEventListener('change', () => {
      const selected = courses.filter(c => selectedCourseIds.has(c.id));
      const includeWaitlist = document.getElementById('android-include-waitlist').checked;
      document.getElementById('android-code-area').value = generateAndroidJson(selected, includeWaitlist);
    });

    document.getElementById('btn-open-android-modal').addEventListener('click', openAndroidModal);
    const sidebarAndroidBtn = document.getElementById('btn-sidebar-android');
    if (sidebarAndroidBtn) sidebarAndroidBtn.addEventListener('click', openAndroidModal);

    document.getElementById('btn-launch-android-app').addEventListener('click', () => {
      const json = document.getElementById('android-code-area').value;
      const deepLink = \`ntucourse://import?data=\${encodeURIComponent(json)}\`;
      window.location.href = deepLink;
      showToast('🚀 正在嘗試喚起 Android 課表好朋友 App...');
    });

    document.getElementById('btn-copy-android-code').addEventListener('click', async () => {
      const codeArea = document.getElementById('android-code-area');
      const code = codeArea.value;
      const setSuccess = () => {
        const btn = document.getElementById('btn-copy-android-code');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ✅ 已複製代碼！';
        showToast('🎉 Android 課表代碼已複製！請打開 App 貼上');
        setTimeout(() => { btn.innerHTML = origHTML; }, 2500);
      };

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(code);
          setSuccess();
          return;
        } catch (e) {}
      }
      codeArea.select();
      document.execCommand('copy');
      setSuccess();
    });

    document.getElementById('btn-cancel-android').addEventListener('click', () => {
      const modal = document.getElementById('modal-android-backdrop');
      modal.classList.remove('open');
      modal.classList.remove('show');
    });

    // =========================================================================
    // 資料儲存與示範模式管理
    // =========================================================================
    function showToast(msg) {
      const toast = document.getElementById('app-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    function loadDemoCourses() {
      courses = JSON.parse(JSON.stringify(DEMO_COURSES));
      isDemoMode = true;
      selectedCourseIds = new Set(courses.map(c => c.id));
      renderApp();
      showToast(currentLang === 'en' ? '👀 Demo schedule loaded!' : '👀 已載入通用示範課表！');
    }

    function saveUserCourses(newCourses) {
      if (!Array.isArray(newCourses) || newCourses.length === 0) {
        alert(currentLang === 'en' ? 'Course data format invalid or empty!' : '匯入的課表格式不正確或內容為空！');
        return false;
      }
      enrichCoursesWithOfficialBilingual(newCourses);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCourses));
      courses = newCourses;
      isDemoMode = false;
      selectedCourseIds = new Set(courses.map(c => c.id));
      renderApp();
      return true;
    }

    function clearUserData() {
      const msg = currentLang === 'en' 
        ? 'Are you sure you want to clear your saved schedule and restore the demo preview?' 
        : '確定要清除儲存在瀏覽器中的專屬課表並恢復為示範模式嗎？';
      if (confirm(msg)) {
        localStorage.removeItem(STORAGE_KEY);
        loadDemoCourses();
        showToast(currentLang === 'en' ? '🔄 Cleared custom courses, restored demo.' : '🔄 已清除個人課表，恢復為示範預覽。');
      }
    }

    // 檢查 URL Hash 是否有自動同步參數
    function checkUrlImport() {
      const hash = window.location.hash;
      if (!hash) return false;
      const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
      const params = new URLSearchParams(cleanHash);
      const importVal = params.get('import');
      const langVal = params.get('lang');

      if (langVal === 'en' || langVal === 'zh') {
        currentLang = langVal;
        localStorage.setItem('ntu_lang', langVal);
      }

      if (importVal) {
        try {
          const parsed = JSON.parse(importVal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            saveUserCourses(parsed);
            showToast(currentLang === 'en' ? '🎉 Schedule synced and saved successfully!' : '🎉 成功從書籤同步並儲存您的 115-1 課表！');
            history.replaceState(null, '', window.location.pathname + window.location.search);
            return true;
          }
        } catch (e) {
          console.error('Failed to parse URL import data:', e);
          showToast(currentLang === 'en' ? '⚠️ Sync data corrupted' : '⚠️ 網址同步資料格式有誤');
        }
      }
      return false;
    }

    // 初始化載入
    function initData() {
      if (checkUrlImport()) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          courses = JSON.parse(stored);
          isDemoMode = false;
          enrichCoursesWithOfficialBilingual(courses);
          selectedCourseIds = new Set(courses.map(c => c.id));
          renderApp();
          return;
        } catch (e) {
          console.error('Corrupted local storage data:', e);
        }
      }

      // 若無本地資料則載入示範課表
      loadDemoCourses();
    }

    // Filter Buttons
    ['all', 'enrolled', 'waitlist'].forEach(f => {
      const el = document.getElementById(\`f-\${f}\`);
      if (el) {
        el.addEventListener('click', (e) => {
          document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          activeFilter = f;
          renderMatrix(activeFilter === 'enrolled' ? courses.filter(c => c.isEnrolled) : (activeFilter === 'waitlist' ? courses.filter(c => !c.isEnrolled) : courses));
        });
      }
    });

    // Language Switcher Buttons
    const btnLangZh = document.getElementById('btn-lang-zh');
    if (btnLangZh) {
      btnLangZh.addEventListener('click', () => {
        currentLang = 'zh';
        localStorage.setItem('ntu_lang', 'zh');
        renderApp();
      });
    }
    const btnLangEn = document.getElementById('btn-lang-en');
    if (btnLangEn) {
      btnLangEn.addEventListener('click', () => {
        currentLang = 'en';
        localStorage.setItem('ntu_lang', 'en');
        renderApp();
      });
    }

    const btnBannerEnrich = document.getElementById('btn-banner-enrich');
    if (btnBannerEnrich) {
      btnBannerEnrich.addEventListener('click', () => {
        enrichCoursesWithOfficialBilingual(courses);
        renderApp();
        showToast(currentLang === 'en' ? '✨ Successfully enriched official NTU bilingual course details!' : '✨ 已成功補齊臺大官方雙語資訊！');
      });
    }

    const btnBannerBm = document.getElementById('btn-banner-bm');
    if (btnBannerBm) {
      btnBannerBm.addEventListener('click', () => {
        const modal = document.getElementById('modal-bm-backdrop');
        if (modal) {
          modal.classList.add('open');
          modal.classList.add('show');
        }
      });
    }

    const btnCloseBanner = document.getElementById('btn-close-banner');
    if (btnCloseBanner) {
      btnCloseBanner.addEventListener('click', () => {
        sessionStorage.setItem('dismiss_missing_en_banner', 'true');
        const banner = document.getElementById('missing-en-banner');
        if (banner) banner.style.display = 'none';
      });
    }

    // Bulk selection links in sidebar
    const btnSelAll = document.getElementById('btn-sel-all');
    if (btnSelAll) btnSelAll.addEventListener('click', () => {
      selectedCourseIds = new Set(courses.map(c => c.id));
      renderSidebar();
    });
    const btnUnselAll = document.getElementById('btn-unsel-all');
    if (btnUnselAll) btnUnselAll.addEventListener('click', () => {
      selectedCourseIds.clear();
      renderSidebar();
    });
    const btnSelEnrolled = document.getElementById('btn-sel-enrolled');
    if (btnSelEnrolled) btnSelEnrolled.addEventListener('click', () => {
      selectedCourseIds = new Set(courses.filter(c => c.isEnrolled).map(c => c.id));
      renderSidebar();
    });

    // Reset / Toggle demo
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (isDemoMode) {
        loadDemoCourses();
      } else {
        clearUserData();
      }
    });

    // Modals Handlers
    const bindModal = (openBtnId, modalId, closeBtnId) => {
      const modal = document.getElementById(modalId);
      const closeBtn = document.getElementById(closeBtnId);
      if (openBtnId) {
        const openBtn = document.getElementById(openBtnId);
        if (openBtn) openBtn.addEventListener('click', () => {
          modal.classList.add('open');
          modal.classList.add('show');
        });
      }
      if (closeBtn) closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        modal.classList.remove('show');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          modal.classList.remove('show');
        }
      });
    };

    bindModal('btn-open-bm-modal', 'modal-bm-backdrop', 'bm-close');
    bindModal('btn-open-import-modal', 'modal-import-backdrop', 'import-close');
    bindModal(null, 'modal-export-backdrop', 'export-close');
    bindModal(null, 'modal-scriptable-backdrop', 'scriptable-close');
    bindModal(null, 'modal-android-backdrop', 'android-close');
    bindModal(null, 'modal-detail-backdrop', 'md-close');

    // Manual Import submission
    document.getElementById('btn-submit-import').addEventListener('click', () => {
      const textarea = document.getElementById('import-code-area');
      const val = textarea.value.trim();
      if (!val) {
        alert('請先貼上課表代碼！');
        return;
      }
      try {
        const parsed = JSON.parse(val);
        if (saveUserCourses(parsed)) {
          textarea.value = '';
          const modal = document.getElementById('modal-import-backdrop');
          modal.classList.remove('open');
          modal.classList.remove('show');
          showToast('🎉 成功匯入並儲存您的課表！');
        }
      } catch (err) {
        alert('代碼格式錯誤，請確認貼上的是完整的 JSON 課表代碼！');
      }
    });

    // Paste from clipboard
    document.getElementById('btn-paste-clipboard').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('import-code-area').value = text;
          showToast('📋 已貼上剪貼簿內容');
        }
      } catch (e) {
        alert('瀏覽器不支援直接讀取剪貼簿，請使用 Ctrl+V 手動貼上！');
      }
    });

    // Copy bookmarklet code button
    document.getElementById('btn-copy-bm-code').addEventListener('click', async () => {
      const href = document.getElementById('bm-drag-link').getAttribute('href');
      const setSuccess = () => {
        const btn = document.getElementById('btn-copy-bm-code');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg> ✅ 已複製代碼！';
        showToast('🎉 書籤代碼已成功複製到剪貼簿！');
        setTimeout(() => { btn.innerHTML = origHTML; }, 2500);
      };

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(href);
          setSuccess();
          return;
        } catch (e) {}
      }

      // Robust fallback for file:// or non-HTTPS origins
      try {
        const textarea = document.createElement('textarea');
        textarea.value = href;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          setSuccess();
          return;
        }
      } catch (err) {}

      prompt('請手動複製下列書籤代碼：', href);
    });

    // 螢幕尺寸改變時自動調校課表尺寸與行高
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (typeof renderApp === 'function') renderApp();
      }, 150);
    });

    // 啟動應用
    initData();
  </script>
</body>
</html>
`;

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully generated dynamic, client-side index.html with localStorage & sync capabilities!');
