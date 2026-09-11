# NTU Course Calendar (臺大課程日曆與桌面小工具系統)

國立臺灣大學（NTU）課程資訊擷取、Google 日曆（.ics）匯出與跨平台桌面課表小工具解決方案。支援最新臺大課程網格式解析、16 週學期制排程、iOS / iPadOS Scriptable 桌面小工具與 Android 原生桌面微件。

---

## 最新發布版本 (Releases)

- **最新版本下載頁面**：[GitHub Releases (APK 與小工具發布專區)](https://github.com/Annie04082020/ntu-course-calendar/releases)
- **線上工具體驗網址**：[臺大課程日曆好朋友 (GitHub Pages)](https://annie04082020.github.io/ntu-course-calendar/)

手機使用者可直接進入上方 Releases 頁面下載最新版 `NTU-Course-Calendar-Widget.apk`。

---

## 系統功能架構

### 1. 行事曆標準格式匯出 (iCalendar RFC 5545)
- **節次區間合併**：支援臺大標準 0 至 10 節及 A 至 D 節次，連續節次自動合併為單一事件（例如第 2 至 5 節自動合併為 09:10 - 13:10）。
- **教學大樓與教室辨識**：解析實體教室徽章代碼及備註說明中的地點。
- **課程大綱自動擷取**：透過瀏覽器同源請求（Same-origin Fetch）自動提取課程概述並填入日曆描述欄位。
- **16 週學期與開學日排程**：預設 115-1 學期開學日為 2026-09-07，總週數 16 週，支援自訂開學日與排除未選上課程。

### 2. iOS / iPadOS 桌面小工具 (Scriptable)
- **2D 週課表矩陣 (Large / Extra Large)**：左側緊湊時間節次軸搭配頂部星期欄，支援課程實際跨節高度延展、自動折行完整顯示長教室名稱（如綜合教學館）、空白時段微光格線與當日高亮標記。
- **今日焦點時間軸 (Medium)**：即時顯示目前上課狀態或下一堂課倒數及教室。
- **Siri 語音互動**：支援透過 Siri 查詢今日課程狀態。

### 3. Android 原生桌面微件 (Kotlin + Jetpack Compose Glance)
- **免付費獨立微件**：使用 Google 官方 Jetpack Compose Glance 框架開發，無須依賴 KWGT Pro 等付費第三方工具。
- **Deep Link 一鍵同步**：支援 `ntucourse://import` 協定，在網頁端點擊即可直接喚起 App 並同步課表資料。
- **CI/CD 自動建置**：透過 GitHub Actions 於發布版本時自動編譯並簽署 Release APK。

---

## 桌面小工具執行範例 (UI Preview - Tool Look)

- **中尺寸微件 (4x2 今日課程與節次時間)**：
  ![中尺寸小工具範例](./ios_tool_look/2x4.jpg)

- **小尺寸微件 (2x2 精簡下堂課)**：
  ![小尺寸小工具範例](./ios_tool_look/2x2.jpg)

- **迷你尺寸微件 (2x1 即時課堂資訊)**：
  ![迷你小工具範例](./ios_tool_look/1x2.jpg)

---

## 使用說明

### 方式一：瀏覽器書籤小工具 (推薦)
1. 開啟 [臺大課程日曆好朋友](https://annie04082020.github.io/ntu-course-calendar/) 網頁。
2. 將「書籤小工具」按鈕拖曳至瀏覽器書籤列。
3. 前往 [臺大課程網選課結果頁面](https://course.ntu.edu.tw/result/adddrop2/table) 或志願預選頁面。
4. 點擊書籤列的按鈕，即可一鍵提取課程資料並選擇「同步至網頁」或「下載日曆 (.ics)」。

### 方式二：匯入 Google 日曆
1. 前往 [Google 日曆](https://calendar.google.com/)。
2. 進入「設定」>「匯入與匯出」。
3. 點選「從電腦中選取檔案」，選擇下載之 `.ics` 檔案。
4. 選擇目標日曆（建議建立名為「臺大課表」之專屬日曆以便管理），點擊匯入。

### 方式三：安裝 Android 桌面微件
1. 前往 [GitHub Releases](https://github.com/Annie04082020/ntu-course-calendar/releases) 下載 `NTU-Course-Calendar-Widget.apk`。
2. 在 Android 裝置上安裝並開啟 App。
3. 可點擊網頁上的「一鍵喚起 Android App 同步」或手動貼上 JSON 代碼。
4. 於桌面長按空白處，進入微件選單搜尋「臺大課表好朋友」並新增至桌面。

---

## 專案結構

```
ntu-course-calendar/
├── android/               # Android 原生小工具 App 專案 (Kotlin + Compose Glance)
├── docs/                  # 文件與小工具介面範例圖片
├── scriptable/            # iOS / iPadOS Scriptable 腳本模板與說明
├── bookmarklet.js         # 瀏覽器書籤小工具原始碼
├── bookmarklet_href.txt   # 壓縮後的 javascript: 書籤連結
├── generate_index.js      # 動態客戶端網頁建置腳本
├── index.html             # 課表檢視與匯出主網頁
├── style.css              # 響應式介面設計系統樣式表
└── README.md              # 專案說明文件
```
