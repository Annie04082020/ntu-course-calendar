[English Version](README_EN.md) | 繁體中文

# NTU Course Calendar (臺大課程日曆與跨平台課表系統)

國立臺灣大學（NTU）課程資訊擷取、iCalendar（.ics）行事曆匯出與跨平台桌面課表小工具解決方案。支援最新臺大課程網格式解析、16 週學期制排程、Google 地圖校園館舍步行導航、純本地上課提醒推播、iOS / iPadOS Scriptable 桌面小工具與 Android 原生桌面微件。

---

## 相關連結

- 最新版本下載頁面：[GitHub Releases (APK 與發布專區)](https://github.com/Annie04082020/ntu-course-calendar/releases)
- 線上工具體驗網址：[臺大課程日曆好朋友 (GitHub Pages)](https://annie04082020.github.io/ntu-course-calendar/)
- Android 專案原始碼：[android/ 目錄說明](android/README.md)
- iOS Scriptable 說明：[scriptable/ 目錄說明](scriptable/README.md)

---

## 核心架構與設計理念

### 1. 零帳密隱私架構 (Zero-Credential Privacy)
本專案所有功能均在使用者裝置端（瀏覽器或手機本地）完成運算。使用者無須輸入臺大單一入口帳號密碼，亦不經手任何身分憑證或 Cookie，杜絕校園系統改版導致的憑證失效與第三方資安風險。

### 2. 標準行事曆格式匯出 (iCalendar RFC 5545)
- 連續節次合併：支援臺大 0 至 10 節及 A 至 D 節次，連續節次自動合併為單一事件（例如第 2 至 4 節合併為 09:10 - 12:10）。
- 教室地點與課程摘要：自動解析課程實體教室，並透過瀏覽器同源請求提取課程大綱填入行事曆描述。
- 16 週學期排程：預設配合臺大 16 週學期制，支援自訂開學日期與排除未選上之候補課程。

### 3. Android 原生桌面微件 (Kotlin + Jetpack Compose Glance)
- 2D 週課表矩陣 (TimetableGlanceWidget)：左側緊湊時間軸、頂部星期欄、跨節課程卡片與當日高亮標記。
- 今日節次功課表 (TodayGlanceWidget)：動態標示「進行中」或「下一堂」課堂倒數，並於桌面直接提供館舍一鍵步行導航。
- 校園館舍地圖整合：內建臺大 40 餘棟主要教學與研究大樓經緯度，點擊直接呼叫 Google Maps 啟動步行導航。
- 純本地課前推播提醒：使用系統 AlarmManager 於課前（可自訂 5 或 10 分鐘前）提醒課程與教室，免伺服器且開機自動恢復排程。
- 中英雙語即時切換：App 與桌面小工具全面支援臺大官方英文課名與英文時程。
- Deep Link 一鍵同步：支援 `ntucourse://import` 協定，網頁端點擊即可直接將課表同步至 Android App。

### 4. iOS / iPadOS 桌面小工具 (Scriptable)
- 支援中尺寸、大尺寸與 iPad 特大尺寸佈局，提供 2D 週功課表、今日焦點時間軸與 Siri 語音查詢。

---

## 介面實機預覽 (UI Preview)

### Android 原生桌面微件與 App 介面

| Android 2D 週課表桌面微件 | 今日節次微件 (含即時導航與倒數) |
| :---: | :---: |
| <img src="./android_tool_look/2d_timetable.png" width="340" alt="Android 2D 週課表微件" /> | <img src="./android_tool_look/next_course.jpg" width="340" alt="今日節次微件" /> |

| App 內 2D 週功課表主畫面 | 上課提醒設定與課程清單 |
| :---: | :---: |
| <img src="./android_tool_look/app_timetable.png" width="340" alt="App 內 2D 週課表畫面" /> | <img src="./android_tool_look/app_set_reminder.png" width="340" alt="上課提醒設定與課程清單" /> |

### iOS / iPadOS Scriptable 桌面小工具介面

| 中尺寸微件 (4x2 今日焦點與時間軸) | 小尺寸 (2x2 下堂課) 與 迷你尺寸 (2x1 課堂條) |
| :---: | :---: |
| <img src="./ios_tool_look/2x4.jpg" width="340" alt="iOS 中尺寸微件" /> | <img src="./ios_tool_look/2x2.jpg" width="160" alt="iOS 小尺寸微件" /> &nbsp;&nbsp; <img src="./ios_tool_look/1x2.jpg" width="220" alt="iOS 迷你尺寸微件" /> |

---

## 使用說明

### 方式一：瀏覽器書籤小工具 (推薦方式)
1. 開啟 [臺大課程日曆好朋友](https://annie04082020.github.io/ntu-course-calendar/) 網頁。
2. 將「書籤小工具」按鈕拖曳至瀏覽器書籤列。
3. 前往 [臺大課程網選課結果頁面](https://course.ntu.edu.tw/result/adddrop2/table) 或預選頁面。
4. 點擊書籤列按鈕，即可自動抓取課程資料並選擇「同步至網頁」或「下載日曆 (.ics)」。

### 方式二：匯入 Google 日曆 / Apple 行事曆
1. 於網頁端下載 `.ics` 檔案。
2. 前往 Google 日曆「設定」>「匯入與匯出」，上傳檔案並選取目標日曆。
3. 若使用 Apple 裝置，直接開啟 `.ics` 檔案即可將課程批量新增至系統行事曆。

### 方式三：安裝 Android 原生小工具 App
1. 前往 [GitHub Releases](https://github.com/Annie04082020/ntu-course-calendar/releases) 下載最新版 `NTU-Course-Calendar-Widget.apk`。
2. 安裝後開啟 App，點擊網頁端的「一鍵喚起 Android App 同步」或手動貼上代碼匯入課表。
3. 回到手機桌面長按空白處，選擇「微件 / 小工具」，搜尋「臺大課表好朋友」即可將週課表或今日節次課表放置於桌面。
4. 進入 App 內的「課程清單與設定」可開啟上課前推播提醒（5 分鐘前 / 10 分鐘前）。

### 方式四：設定 iOS Scriptable 小工具
1. 於 App Store 下載安裝 Scriptable。
2. 在網頁端點選「iOS 小工具」，點擊「複製 Scriptable 腳本代碼」。
3. 開啟 Scriptable 新增腳本，貼上代碼並命名為「臺大課表」。
4. 回到桌面新增 Scriptable 小工具並選取該腳本。

---

## 專案目錄結構

```
ntu-course-calendar/
├── android/               # Android 原生小工具 App (Kotlin + Compose Glance)
│   ├── app/src/main/java/ # 主程式、館舍地圖、提醒排程與小工具
│   └── README.md          # Android 專案專屬說明文件
├── docs/                  # 文件與範例圖片
├── scriptable/            # iOS / iPadOS Scriptable 腳本模板與說明
│   └── README.md          # iOS 小工具專屬說明文件
├── bookmarklet.js         # 瀏覽器書籤小工具原始碼
├── bookmarklet_href.txt   # 壓縮後的 javascript: 書籤連結
├── generate_index.js      # 動態客戶端網頁建置腳本
├── index.html             # 課表檢視與匯出主網頁
├── style.css              # 響應式介面樣式表
├── README.md              # 繁體中文說明文件
└── README_EN.md           # 英文版說明文件
```

---

## 授權聲明

本專案採開源釋出，僅供國立臺灣大學師生學術交流與個人日程管理使用。所有課程與大綱資料版權歸國立臺灣大學及各授課教師所有。
