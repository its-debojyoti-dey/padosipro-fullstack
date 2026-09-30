# PadosiPro Take-Home Assignment: Native Mobile App & Backend API

A production-grade native mobile application and backend API replicating the first customer journey of **[PadosiPro](https://app.padosipro.com/)**: account registration, crypto-secure email OTP verification, session-persisted login, first-login profile onboarding, task catalogue selection, and an assigned Lifestyle Manager dashboard.

---

## 🌐 Live Production Links & Instant Review (< 1 Minute)

For the quickest review without running any local servers:
- **Live Cloud Backend API:** [`https://padosipro-backend.onrender.com/api/v1`](https://padosipro-backend.onrender.com/api/v1)
- **Health Check Endpoint:** [`https://padosipro-backend.onrender.com/api/v1/health`](https://padosipro-backend.onrender.com/api/v1/health) *(Returns `{"status":"ok","service":"padosipro-backend"}`)*
- **Managed Cloud Database:** Render Managed PostgreSQL (`padosipro_db`)
- **Direct Standalone APK:** [Download `padosipro.apk` (GitHub Release v1.0.0)](https://github.com/its-debojyoti-dey/padosipro-fullstack/releases/tag/v1.0.0)  
  *(The pre-compiled APK is hardwired to the live cloud backend — install on any Android phone or emulator and test immediately).*

---

## 🚀 Running Locally (< 5 Minutes)

### Option A: Local Mobile Client with Live Cloud Backend (Recommended)
You can run the frontend locally while connecting directly to the live cloud backend:
```bash
cd mobile
npm install
npx expo start
```
*Press `w` to open in your browser, `a` for Android Emulator, or scan the QR code with Expo Go.*

---

### Option B: Full Local Stack (Backend + Mobile)

In Terminal 1 (Backend):
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```
*Runs backend on `http://localhost:4000`.*

In Terminal 2 (Mobile Client):
```bash
cd mobile
npm install
# Point to local backend
npx expo start
```

---

### Option C: Docker Compose (PostgreSQL)

```bash
docker compose up --build
```
*Starts containerized Node.js API and PostgreSQL database on port 4000 and 5432.*

---

## 🧪 Running Automated Tests

A comprehensive automated test suite (Jest + Supertest) tests the critical security and business logic:

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **OTP Generation & Hashing**: Verifies cryptographically secure 6-digit generation and SHA-256 hash storage.
- **30-Second Cooldown**: Confirms HTTP 429 rate-limiting on premature OTP resend attempts.
- **5-Attempt Lockout**: Verifies that 5 wrong attempts permanently invalidate the OTP.
- **OTP Expiration**: Validates rejection after the 10-minute expiry window.
- **Single-Use Enforcement**: Verified codes cannot be re-used.
- **Auth Guard**: Unverified accounts are strictly blocked from logging in with error code `EMAIL_NOT_VERIFIED`.
- **Profile Validation**: Enforces valid Indian 10-digit mobile numbers (`+91`) and optional business names.

---

## 📱 Mobile Application Architecture (Part B)

Built with **React Native / Expo SDK 52 (TypeScript)** with **100% Native UI elements** and **zero WebViews**, faithful to the design tokens and layout of [app.padosipro.com](https://app.padosipro.com/):

- **Palette**: Primary Forest Green (`#155C49`), Cream Canvas (`#FAFAF7`), Mint Accent (`#E8F8F3`), Dark Charcoal text (`#202425`).
- **Icons**: Feather vector icons (`@expo/vector-icons`).
- **Screens**:
  1. `RegisterScreen`: Inline RFC 5322 email and password strength validation.
  2. `VerifyOtpScreen`: 6-box numeric OTP entry, 30s live countdown resend timer, attempt counter.
  3. `LoginScreen`: Returning user login; unverified accounts automatically redirect to OTP screen.
  4. `FirstLoginProfileScreen`: Gated first-login onboarding (Full Name, Indian 10-digit mobile number, address, optional business name).
  5. `TaskSelectionScreen`: Categorized task catalogue seeded with 30+ authentic PadosiPro tasks, live search, category chips, multi-select checkboxes, and sticky confirmation bar.
  6. `HomeScreen`: Assigned Lifestyle Manager banner (*"Ravi Kumar is assigned"*), active task list with status chips, "+ Add More Tasks" action, and top profile sheet with Logout.
  7. **Network Resilience**: Dedicated loading spinners, error banners with "Try Again" retry handlers, and empty states on all screens.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | HTTP port for backend API |
| `DATABASE_URL` | `"file:./dev.db"` | SQLite database path or PostgreSQL connection URI |
| `JWT_SECRET` | `"padosipro_super_secret_jwt_key_2026_production_grade"` | Signing secret for JWT access tokens |
| `JWT_EXPIRES_IN` | `"7d"` | Access token lifespan |
| `OTP_EXPIRY_MINUTES` | `10` | OTP validity window in minutes |
| `OTP_MAX_ATTEMPTS` | `5` | Maximum incorrect OTP guesses before invalidation |
| `OTP_COOLDOWN_SECONDS`| `30` | Minimum wait duration before requesting new OTP |
| `SMTP_HOST` | `"smtp.ethereal.email"` | SMTP mail server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | `""` | SMTP username |
| `SMTP_PASS` | `""` | SMTP password |
| `LOG_OTP_TO_CONSOLE` | `true` | **Logs 6-digit OTP to terminal stdout for instant reviewer testing** |

---

## 📦 Standalone Android APK

### 1. Direct Pre-built APK
The standalone installable APK is pre-compiled and ready for instant sideloading:
- **Local File:** [`padosipro.apk`](./padosipro.apk) (~120 MB standalone binary)
- Installs directly onto any Android phone or emulator (no developer tools required).

### 2. Automated Cloud CI/CD (GitHub Actions)
This repository includes an automated GitHub Actions pipeline [`.github/workflows/build-apk.yml`](./.github/workflows/build-apk.yml) that builds and exports the standalone Android APK on every push:
- **Build Status:** Verified passing on Ubuntu runner with OpenJDK 17 & Android SDK.
- **Workflow Runs:** Available under the repository's **Actions** tab with direct downloadable APK artifacts.

### 3. Compiling Locally
To compile locally using Gradle or Expo:
```bash
cd mobile/android
./gradlew assembleDebug
# Compiled APK output: mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔍 How to Review & Test the Full Flow

1. Start the backend (`npm run dev` in `backend/`).
2. Start the mobile app (`npx expo start` in `mobile/`).
3. On the mobile screen:
   - Click **Create an account**. Enter an email (e.g. `test@padosipro.com`) and password (`Password123!`).
   - You will see the **Verify OTP** screen. Check your **backend terminal console** where the OTP is printed in a clean box:
     ```
     =========================================
     [PadosiPro OTP Service]
     To: test@padosipro.com
     Verification Code: 582419
     Valid for: 10 minutes
     =========================================
     ```
   - Enter the 6-digit code.
   - Upon verification, log in.
   - You will immediately see the **First-Login Profile** screen. Enter your Name, 10-digit Indian Mobile Number, and Address.
   - Next, pick tasks on the **Task Selection** screen (e.g. *AC Servicing*, *Grocery Restocking*, *Doctor Appointment*).
   - Click **Confirm Selection**.
   - You arrive at your **Home Dashboard** displaying your assigned Lifestyle Manager (*Ravi Kumar*) and your active tasks!
   - Restart the app: your session is persisted securely via `expo-secure-store`. Click **Log Out** to test session termination.
