# OT Builder Pro — AI Context & Technical Specifications

This document provides a comprehensive overview of **OT Builder Pro**, explaining its architecture, domain rules, codebase conventions, and data schemas to help AI coding assistants understand and work on the project efficiently.

---

## 1. Project Overview & Tech Stack
**OT Builder Pro** is a client-side, private, responsive web application designed for Thai office workers to calculate their Overtime (OT) pay. 

- **Frontend Tech Stack**: Vanilla HTML5, Vanilla JavaScript (ES6+), and Vanilla CSS (Dark glassmorphism theme).
- **No Build Step**: The project runs directly in the browser (static site). Avoid introducing Node/npm build pipelines unless explicitly requested.
- **External Dependencies (CDN)**:
  - **Flatpickr**: For date-range selecting and time pickers.
  - **SortableJS**: For dragging and reordering OT items.
  - **DiceBear API**: Generates user profile avatars dynamically based on styles (Notionists, Lorelei, Avataaars, Bottts).
- **Privacy First**: All user profile data and OT calculation records are saved **locally** in the browser's `localStorage`. No server backend or external tracking is present.

---

## 2. Codebase Structure
```
OT-Calculator/
├── css/
│   └── styles.css      # Core styles, variables, transitions, and glassmorphic designs.
├── js/
│   ├── config.js       # App configuration, domain constants, holidays, and text strings.
│   └── app.js          # Core logic: state management, math formulas, UI template rendering.
├── index.html          # Main HTML page linking to flatpickr, sortable, and internal files.
├── test.js             # Standalone test/draft file (not used by index.html).
└── context.md          # [This File] Architecture & AI reference guide.
```

---

## 3. Domain Logic & OT Calculations

OT Builder Pro strictly adheres to standard Thai labor practices and specific company policies for calculations:

### 3.1 Time Definitions
- **Standard Work Hours**: `08:30` to `16:30` (represented as `8.5` to `16.5` in decimal hours).
- **Lunch Break**: `12:00` to `13:00` (represented as `12.0` to `13.0` in decimal hours). This 1-hour break is deducted from standard hours.
- **Standard Working Time per Day**: `7 hours` (calculated as `16.5 - 8.5 - 1.0` lunch hour).

### 3.2 Rates & Formulas
- **Days Per Month (Constant)**: `30` (used for salary to hourly conversions).
- **Hourly Wage Formula**: 
  $$\text{Hourly Wage} = \frac{\text{Monthly Salary}}{30 \text{ days} \times 7 \text{ hours}}$$
- **Daily Wage Formula**: 
  $$\text{Daily Wage} = \text{Hourly Wage} \times 7$$
- **Overtime Multipliers**:
  - **Workdays (WD) OT**: **x1.5** for any hours worked outside standard hours (before 08:30 or after 16:30).
  - **Holidays (HD) Standard**: **x1.0** for working within standard hours (08:30 to 16:30, excluding lunch 12:00–13:00).
  - **Holidays (HD) OT**: **x3.0** for working outside standard hours (before 08:30 or after 16:30).

### 3.3 Overtime Calculation Engine (`calcH` in `app.js`)
To calculate working hours and cost per day:
1. Input start time and end time as strings (e.g. `"17:00"`).
2. Convert time strings to decimal hours (`toHour(time)`).
3. If end time is less than or equal to start time, add `24` hours (supporting overnight OT shifts).
4. Iterate from start hour to end hour in steps of `0.5` hours:
   - For **Workdays (WD)**: Skip standard hours (`8.5` to `16.5`). All other hours accumulate as `h15` (1.5x rate).
   - For **Holidays (HD)**: 
     - If hour is within standard hours (`8.5` to `16.5`) and not lunch (`12.0` to `13.0`), accumulate as `h1` (1.0x rate).
     - Otherwise, accumulate as `h3` (3.0x rate).
5. Money calculations are rounded to 2 decimal places using `calMoney()`.

---

## 4. Data Schemas & Local Storage

### 4.1 Profile Management
Stored under the localStorage key defined in `APP_CONFIG.STORAGE_KEYS.PROFILES` (value: `"otUserProfiles_v3"`).
Each profile object in the array has the following structure:
```typescript
interface UserProfile {
  name: string;        // Profile name (unique)
  pin: string | null;  // Optional 6-digit numeric PIN for lock screen
  color: string;       // HEX color theme (e.g., "#60a5fa")
  avatar: string;      // DiceBear seed (string)
  avatarStyle: string; // DiceBear style ID (e.g. "avataaars")
  avatarType: string;  // "dicebear" | "initials" | "emoji"
  emoji: string;       // Chosen emoji if avatarType is "emoji"
  isGuest?: boolean;   // Marks the auto-generated Guest profile
}
```

### 4.2 Active User State
- `"otCurrentUser"`: Stored string representing the active username.
- `"otGuestStartTime"`: Timestamp when Guest session started. Guest profiles automatically expire after 1 hour (`APP_CONFIG.GUEST_EXPIRY_MS` = 3,600,000 ms), clearing all Guest data.
- **Global Unlock PIN**: `964799` (configured as `MASTER_PIN` in `config.js` to unlock any profile).

### 4.3 OT Calculations Data
Calculations are stored per user under `otData_<username>` (e.g., `otData_John`).
The JSON structure is:
```typescript
interface OTData {
  salary: string;      // User monthly salary base (as string representation)
  items: Array<{
    dateRange: string; // Date range from Flatpickr (e.g. "2026-07-20 to 2026-07-24")
    chkWd: boolean;    // Include workday calculations
    chkHd: boolean;    // Include holiday calculations
    startWd: string;   // Weekday start time (e.g., "17:00")
    endWd: string;     // Weekday end time (e.g., "21:00")
    startHd: string;   // Holiday start time (e.g., "08:30")
    endHd: string;     // Holiday end time (e.g., "16:30")
    name: string;      // Item title / comment
    datasetEdited?: string; // Flag "1" if user typed a custom title manually
  }>
}
```

---

## 5. Development Guidelines & Conventions

When modifying the codebase, respect the following rules:

- **Localization**: All user-facing text must be in **Thai** or utilize keys defined in the `APP_CONFIG.TEXT` object in `js/config.js`. Avoid hardcoding Thai strings inside `app.js` UI builders; add them to `APP_CONFIG.TEXT` instead.
- **Responsive glassmorphic UI**: Ensure CSS changes align with the dark glassmorphic design theme using:
  - Custom scrollbars.
  - Transparent overlay panels with `backdrop-filter: blur()`.
  - CSS variables for colors, margins, and responsiveness.
- **Math Rounding**: Keep money results precise by using `calMoney(value)` which rounds to 2 decimal places. Do not use random rounding functions.
- **Date Handling**: Thai Buddhist Era (B.E.) offsets (+543 years) are applied when displaying dates in Thai (`formatThaiDate`). Use Gregorian dates (`YYYY-MM-DD`) internally for `flatpickr` and holiday mappings.
- **Holidays**: Public holidays are defined per calendar year. The current list in `config.js` is for B.E. 2569 / 2026. If a new calendar year is introduced, add it under `APP_CONFIG` in `config.js`.
