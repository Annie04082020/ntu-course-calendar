# 臺大課表 Android 原生小工具 App (NTU Course Widget for Android)

專為臺大學生打造的 **Android 原生桌面課表小工具 App**，採用現代 **Kotlin + Jetpack Compose + Jetpack Compose Glance** 開發，完全不需要付費購買第三方小工具 App（如 KWGT Pro），直接安裝即可享用！

---

## 🌟 特色亮點

- **2D 週課表矩陣小工具 (Weekly Timetable Grid)**：
  - **左側時間節次欄**：極窄設計（節次代碼 `1`~`8` + 開課時間簡寫），為課表格子爭取最大空間。
  - **頂部星期欄**：英文簡寫標籤（`MON`~`FRI`），今日自動換上藍色發光膠囊與綠色啟用點 `●`。
  - **精確跨節對齊**：課程根據實際起訖節次動態延展卡片高度，空白時段呈現整齊網格線。
  - **彩色磨砂卡片**：各課程依名稱自動搭配不同色彩主題與邊框。
- **今日焦點與時間軸小工具 (Today Focus 4x2)**：
  - 即時顯示目前上課中 / 下一堂課倒數、教室地點與下課時間。
  - 右側列出今日課表時間軸。
- **與網頁端一鍵連動**：
  - 支援 Deep Link 協定 `ntucourse://import?data=...`。
  - 在 [臺大課程日曆好朋友](https://annie04082020.github.io/ntu-course-calendar/) 網頁上點擊「🚀 一鍵同步至 Android App」即可無縫同步。
  - 亦支援手動複製貼上 JSON 課表代碼。
- **純本地無雲端儲存**：課表資料僅儲存在使用者的本機端，無隱私外洩疑慮。

---

## 📲 下載與安裝

1. 至本專案的 [GitHub Releases](https://github.com/Annie04082020/ntu-course-calendar/releases) 頁面下載最新版 `NTU-Course-Calendar-Widget.apk`。
2. 在 Android 裝置上點擊安裝（若提示未知的來源，請選擇允許）。
3. 開啟 App 檢查或同步課表。
4. 回到 Android 手機 / 平板桌面，長按空白處 ➔ 選擇「微件 / 小工具」➔ 搜尋「臺大課表好朋友」➔ 拖曳至桌面即可！

---

## 🛠️ 開發與編譯

- **系統需求**：Android Studio Ladybug 或更新版本、JDK 17+、Android SDK 35。
- **最低支援版本**：Android 8.0 (API 26) 以上。
- **手動編譯 Release APK**：
  ```bash
  cd android
  ./gradlew assembleRelease
  ```
  編譯後的 APK 將位於 `app/build/outputs/apk/release/app-release.apk`。

- **自動發布 Release**：
  建立並推送帶有 `android-v` 前綴的 Git Tag（例如 `android-v1.0.0`），GitHub Actions 將會自動編譯並在 Releases 頁面獨立建立 Android 發布版本：
  ```bash
  git tag android-v1.0.0
  git push origin android-v1.0.0
  ```
