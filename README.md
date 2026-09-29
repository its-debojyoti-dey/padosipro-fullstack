# PadosiPro Take-Home Assignment: Native Mobile App & Backend API

A production-grade native mobile application and backend API replicating the first customer journey of **[PadosiPro](https://app.padosipro.com/)**: account registration, crypto-secure email OTP verification, session-persisted login, first-login profile onboarding, task catalogue selection, and an assigned Lifestyle Manager dashboard.

---

## 🚀 Quick Start (Under 5 Minutes)

### Option A: Standard Local Run (Recommended for Reviewers)

```bash
# 1. Clone & Enter Backend
cd padosipro-fullstack/backend

# 2. Install dependencies & initialize database (SQLite zero-setup)
npm install
npx prisma db push
npm run db:seed

# 3. Start Backend API (runs on http://localhost:4000)
npm run dev
```

In a second terminal:
```bash
# 4. Enter Mobile Client
cd padosipro-fullstack/mobile

# 5. Install dependencies & start Expo
npm install
npx expo start
```
*Press `a` to open in Android Emulator, `w` for Web, or scan QR code with Expo Go on your mobile device.*

---

### Option B: Docker Compose (PostgreSQL)

```bash
cd padosipro-fullstack
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

## 📦 Building the Standalone Android APK

To compile the standalone APK file:

```bash
cd mobile

# Build standalone APK using EAS (configured in eas.json)
npx eas-cli build -p android --profile preview --local
```

Alternatively, run locally on a connected Android device or emulator:
```bash
npx expo run:android
```

The pre-configured `eas.json` specifies:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
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
