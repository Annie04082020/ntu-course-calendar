# 臺大課程網 → Google 日曆 ICS 匯出工具 (NTU Course to Calendar)

專為國立臺灣大學（NTU）學生設計的選課結果行事曆匯出工具。類似 `ntut-course` 與 `khojit`，但針對臺大課程網的新版介面進行完整優化。

---

## ✨ 核心特色

1. **一鍵書籤免安裝 (Bookmarklet)**
   - 將專屬書籤拖曳至瀏覽器書籤列，在已登入的臺大課程網選課結果頁面點擊一下即可啟動。
2. **完整台大節次對應與連續節次自動合併**
   - 自動對應臺大 0~10 節及 A~D 節標準時間（例如第 2~5 節自動合併為 `09:10 - 13:10`，不會產生零碎重疊的事件）。
3. **智慧教室與地點辨識**
   - 同時支援徽章教室（如「電二143」、「資103」）及備註欄位中的教室（如「綜合教學館701教室」、「新聞所302」）。
4. **自動抓取課程概述與大綱**
   - 透過瀏覽器同源請求（Same-origin Fetch），自動將課程網上的「課程概述 / 課程簡介」寫入行事曆事件的詳細描述（Description）中。
5. **台大 16 週新制與自訂開學日**
   - 預設 115-1 學期開學日：`2026-09-07`，預設週數：`16 週`，皆可在彈出介面中自由調整。
6. **智慧過濾未選上課程**
   - 自動識別並排除「未選上課程」區塊，僅匯出已選上的課程（亦可在彈窗中個別勾選）。
7. **標準 RFC 5545 iCalendar (.ics)**
   - 包含 `VTIMEZONE` (Asia/Taipei)、每週循環規則 `RRULE:FREQ=WEEKLY`、`UTF-8 with BOM` 編碼，相容 Google Calendar、Apple 日曆、Outlook 等。

---

## 🚀 使用方式

### 方式一：瀏覽器書籤小工具 (最推薦)
1. 用瀏覽器開啟專案目錄下的 [index.html](file:///d:/ntu_info_grabber/index.html)。
2. 將畫面上的「🎓 匯出臺大課表到行事曆」按鈕直接拖曳至瀏覽器的「書籤列」。
3. 前往 [臺大課程網選課結果頁面](https://course.ntu.edu.tw/result/prereg2/list)（初選一階、初選二階或最終結果皆可）。
4. 點擊書籤列的按鈕，即可彈出自訂視窗並一鍵下載 `.ics` 檔案！

### 方式二：開發者工具 Console 執行
在選課結果頁面按下 `F12` 打開開發者人員工具，切換至 `Console` 分頁，貼上 `bookmarklet_raw.js` 中的代碼並按下 Enter 即可啟動。

---

## 📅 如何匯入 Google 日曆？

1. 在電腦上打開 [Google 日曆 (calendar.google.com)](https://calendar.google.com)。
2. 點擊右上角「設定 ⚙」圖示 →「設定」。
3. 在左側選單點選「匯入與匯出」。
4. 點選「從電腦中選取檔案」，選取剛才下載的 `.ics` 檔案。
5. 選擇要匯入的日曆（建議在左側「其他日曆」點 `+` 新增一個名為「臺大課表」的專屬日曆，以方便日後一次管理或刪除）。
6. 點擊「匯入」，全部 16 週的課程便會整齊排入日曆中！

---

## 📂 專案檔案結構

- `index.html`：主說明與操作網頁（含書籤安裝、課表視覺化預覽、動態下載）
- `style.css`：現代質感深色 Glassmorphism 風格設計系統
- `bookmarklet.js`：書籤小工具完整原始碼（易讀開發版）
- `bookmarklet.min.js`：壓縮後的 `javascript:...` 專用書籤代碼
- `bookmarklet_raw.js`：適合貼在 DevTools Console 執行的純 JS 代碼
- `export_ics.js`：Node.js 版課表生成核心模組
- `generate_index.js`：課表展示頁面生成腳本
- `build_bookmarklet.js`：書籤建置與壓縮腳本

