English Version | [繁體中文](README.md)

# NTU Course Calendar (Course Grabber, Calendar Sync & Cross-Platform Widgets)

A comprehensive solution for National Taiwan University (NTU) course information extraction, RFC 5545 iCalendar (.ics) export, and cross-platform desktop widgets. Designed with zero-credential privacy, 16-week semester schedule alignment, Google Maps campus building walking navigation, native battery-friendly class reminders, iOS / iPadOS Scriptable widgets, and native Android home screen widgets built with Jetpack Compose Glance.

---

## Quick Links

- Latest Releases: [GitHub Releases (APK & Release Assets)](https://github.com/Annie04082020/ntu-course-calendar/releases)
- Web Application: [NTU Course Calendar Web App (GitHub Pages)](https://annie04082020.github.io/ntu-course-calendar/)
- Android Source Code: [android/ Directory Documentation](android/README.md)
- iOS Scriptable Setup: [scriptable/ Directory Documentation](scriptable/README.md)

---

## Core Architecture and Design Philosophy

### 1. Zero-Credential Privacy
All computations and parsing run strictly client-side within the user's browser or local Android sandbox. The tool requires no login credentials, SSO sessions, or security tokens, completely avoiding security liabilities, tracking, or breakage caused by university portal policy changes.

### 2. Standard iCalendar Export (RFC 5545)
- Period Interval Merging: Full support for standard NTU periods 0 through 10 and night periods A through D. Consecutive class periods are automatically combined into single calendar events (e.g., Periods 2 to 4 are merged into 09:10 - 12:10).
- Classroom Identification: Automatically extracts physical classroom locations from course badges and notes.
- Syllabus Extraction: Fetches course descriptions and syllabi via browser same-origin requests, embedding them into calendar event descriptions.
- 16-Week Semester Schedule: Pre-configured for NTU's 16-week academic calendar with customizable start dates and exclusion options for waitlisted courses.

### 3. Android Native Companion App and Glance Widgets
- 2D Weekly Timetable Grid (TimetableGlanceWidget): Compact vertical period timeline, horizontal weekday header, proportional multi-period course spans, and active day indicators.
- Today's Agenda Widget (TodayGlanceWidget): Real-time course status indicators showing active courses and upcoming countdowns, plus a direct one-tap walking navigation button on the widget.
- NTU Campus Map and Navigation: Built-in geographic coordinates for over 40 primary NTU lecture halls and departmental buildings. Tapping navigation directly launches Google Maps in walking mode (`travelmode=walking`).
- Purely Local Class Reminders: Scheduled using Android's native AlarmManager for 5 or 10 minutes prior to each class. Completely serverless, zero background battery drain, and automatically restored upon system reboot (`BOOT_COMPLETED`).
- Instant Bilingual Switching: Seamlessly switches between Traditional Chinese and official NTU English course titles and schedules.
- Seamless Deep Link Sync: Supports `ntucourse://import`, allowing one-click synchronization from the web client to the native Android app.

### 4. iOS / iPadOS Desktop Widgets (Scriptable)
- Supports Medium, Large, and Extra Large (iPad) layouts, offering a 2D weekly timetable, today's focus timeline, and Siri voice integration.

---

## Interface and Widget Previews

### Android Native Widgets and In-App Interface

| Android 2D Weekly Timetable Widget | Today's Schedule Widget (Live Navigation & Countdown) |
| :---: | :---: |
| <img src="./android_tool_look/2d_timetable.png" width="340" alt="Android 2D Timetable Widget" /> | <img src="./android_tool_look/next_course.jpg" width="340" alt="Today's Schedule Widget" /> |

| In-App 2D Weekly Schedule View | Class Reminders & Course List |
| :---: | :---: |
| <img src="./android_tool_look/app_timetable.png" width="340" alt="In-App 2D Schedule View" /> | <img src="./android_tool_look/app_set_reminder.png" width="340" alt="Reminders and Course List" /> |

### iOS / iPadOS Scriptable Widgets

| Medium Widget (4x2 Today's Focus & Timeline) | Small (2x2 Next Class) & Mini (2x1 Class Bar) |
| :---: | :---: |
| <img src="./ios_tool_look/2x4.jpg" width="340" alt="iOS Medium Widget" /> | <img src="./ios_tool_look/2x2.jpg" width="160" alt="iOS Small Widget" /> &nbsp;&nbsp; <img src="./ios_tool_look/1x2.jpg" width="220" alt="iOS Mini Widget" /> |

---

## User Guide

### Method 1: Browser Bookmarklet (Recommended)
1. Open the [NTU Course Calendar](https://annie04082020.github.io/ntu-course-calendar/) web page.
2. Drag the "Bookmarklet" button to your browser's bookmarks bar.
3. Navigate to your [NTU Course Selection Results](https://course.ntu.edu.tw/result/adddrop2/table) or pre-registration page.
4. Click the bookmarklet button to extract course records, then choose "Sync to Web" or "Download Calendar (.ics)".

### Method 2: Import into Google Calendar or Apple Calendar
1. Download the `.ics` file from the web client.
2. For Google Calendar: Go to Settings > Import & Export, upload the file, and assign it to a target calendar (creating a dedicated "NTU Schedule" calendar is recommended).
3. For Apple Calendar: Open the `.ics` file directly on macOS or iOS to batch-add all lectures to the system calendar.

### Method 3: Install Android Native Widget App
1. Download `NTU-Course-Calendar-Widget.apk` from [GitHub Releases](https://github.com/Annie04082020/ntu-course-calendar/releases).
2. Install and launch the application on your Android device.
3. Synchronize courses via the web app's one-click deep link or manually paste the exported JSON payload.
4. Long-press an empty area on your home screen, open Widgets, search for "NTU Calendar", and add either the 2D weekly matrix or today's agenda widget.
5. In the app's Course List & Settings tab, enable class start notifications (choose between 5 minutes before, 10 minutes before, or off).

### Method 4: Setup iOS Scriptable Widget
1. Install Scriptable from the Apple App Store.
2. On the web app, select "iOS Widget" and click "Copy Scriptable Code".
3. Open Scriptable, tap "+" to create a new script, paste the code, and name it "NTU Course".
4. Return to the home screen, enter wiggle mode, add a Scriptable widget, and configure it to run the "NTU Course" script.

---

## Repository Structure

```
ntu-course-calendar/
├── android/               # Android native widget app (Kotlin + Jetpack Compose Glance)
│   ├── app/src/main/java/ # Core logic, building catalog, reminder manager, widgets
│   └── README.md          # Dedicated Android documentation
├── docs/                  # Documentation assets and screenshots
├── scriptable/            # iOS / iPadOS Scriptable widget template
│   └── README.md          # Dedicated Scriptable documentation
├── bookmarklet.js         # Browser bookmarklet source code
├── bookmarklet_href.txt   # Minified javascript: URI bookmarklet
├── generate_index.js      # Client-side dynamic build script
├── index.html             # Main course viewing and export web application
├── style.css              # Responsive design system stylesheet
├── README.md              # Traditional Chinese documentation
└── README_EN.md           # English documentation
```

---

## License and Disclaimer

This project is open-source and intended solely for academic organization and schedule management by students and faculty of National Taiwan University. All course titles and syllabi remain the intellectual property of National Taiwan University and the respective course instructors.
