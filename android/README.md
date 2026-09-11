# 臺大課表 Android 原生小工具 App (NTU Course Widget for Android)

本專案為國立臺灣大學（NTU）學生打造之 **Android 原生桌面課表小工具 App**，採用 **Kotlin + Jetpack Compose + Jetpack Compose Glance** 開發，完全不需要購買或安裝第三方付費軟體（如 KWGT Pro），直接安裝 APK 即可於桌面使用。

---

## 相關連結

- **最新 APK 下載專區**：[GitHub Releases (版本發布列表)](https://github.com/Annie04082020/ntu-course-calendar/releases)
- **線上課表代碼產生器**：[臺大課程日曆好朋友 (GitHub Pages)](https://annie04082020.github.io/ntu-course-calendar/)

---

## 功能規格

### 1. 2D 週課表矩陣小工具 (TimetableGlanceWidget)
- **左側時間節次欄**：極窄 28dp 設計，顯示節次代碼（1 至 8）與開課時間簡寫，為右側課表格子提供最大版面。
- **頂部星期欄**：英文簡寫標籤（MON 至 FRI），當日動態切換為深藍色發光底色與啟用點指示。
- **精確跨節對齊**：依每門課的實際起訖節次垂直跨行延展，未排課時段以整齊底格對齊。
- **彩色卡片與資訊**：課程依名稱雜湊產生專屬色彩主題與邊框，標註教室地點（📍）與點擊開啟詳情。

### 2. 今日焦點與時間軸小工具 (TodayGlanceWidget)
- **即時狀態**：即時掌握目前上課狀態或下一堂課教室、起訖時間與倒數。
- **今日行程**：右側以時間軸形式列出今日剩餘課程清單。

### 3. 與網頁端無縫連動 (Deep Link)
- 支援通訊協定：`ntucourse://import?data=...`。
- 於 [臺大課程日曆好朋友](https://annie04082020.github.io/ntu-course-calendar/) 網頁點擊「一鍵喚起 Android App 同步」，即可直接將課表資料匯入本 App。
- 同時支援於 App 內手動貼上 JSON 代碼匯入。

### 4. 資料安全與隱私
- 課表資料僅儲存於裝置本機的 SharedPreferences / DataStore，無任何雲端上傳或追蹤代碼。

---

## 下載與安裝指南

1. 前往 [GitHub Releases](https://github.com/Annie04082020/ntu-course-calendar/releases) 下載最新版 `NTU-Course-Calendar-Widget.apk`。
2. 於 Android 裝置上開啟檔案進行安裝（若系統提示未知的應用程式來源，請選擇允許安裝）。
3. 開啟 App，可透過網頁同步或手動貼上代碼匯入課表。
4. 回到 Android 桌面，長按空白處進入小工具／微件清單，搜尋「臺大課表好朋友」，選擇所需尺寸並拖曳至桌面。

---

## 建置與自動發布流程

### 開發環境需求
- **開發工具**：Android Studio Ladybug (2024.2) 或更新版本
- **JDK**：Java Development Kit 17
- **目標 SDK**：Android SDK 35 (最低相容 Android 8.0 / API 26)

### 本地手動編譯
```bash
cd android
./gradlew assembleRelease
```
編譯後之 APK 檔案將產生於 `app/build/outputs/apk/release/app-release.apk`。

### 獨立版本自動發布機制 (GitHub Actions)
專案配置了獨立的 GitHub Actions 工作流程（`.github/workflows/android-release.yml`）。推送帶有 `android-v` 前綴的 Git Tag 時，系統將自動啟動雲端編譯並建立獨立的 Android Release：
```bash
git tag android-v1.0.0
git push origin android-v1.0.0
```
完成後即可於 GitHub Releases 頁面下載最新編譯之 APK 檔案。
