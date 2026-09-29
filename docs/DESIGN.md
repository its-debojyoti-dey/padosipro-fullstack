# PadosiPro Full-Stack Architecture & Design Decisions

**Author**: Debojyoti Dey  
**Date**: September 2026  
**Assignment**: Full-Stack Developer Take-Home Assignment  

---

## 1. High-Level Architecture

The solution replicates the core journey of **[app.padosipro.com](https://app.padosipro.com/)** through a decoupled, type-safe full-stack architecture:

- **Mobile Client**: React Native with Expo SDK 52 (TypeScript). 100% native UI elements (`View`, `Text`, `FlatList`, `TextInput`, `Pressable`) with **zero WebViews**. Styled after PadosiPro’s design system: Forest Green (`#155C49`), Cream Canvas (`#FAFAF7`), and Feather icons.
- **Backend API**: Node.js + Express (TypeScript) layered architecture (`routes` $\rightarrow$ `middleware` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `prisma/db`).
- **Data Persistence**: Prisma ORM with dual-engine flexibility: SQLite by default for instant zero-dependency local runs, and PostgreSQL via Docker Compose for production parity.

---

## 2. Key Architectural Decisions & Trade-Offs

### 2.1 OTP Security: SHA-256 Hashing vs. Plaintext
- **Decision**: The backend never stores the raw 6-digit OTP. Only `crypto.createHash('sha256').update(otp).digest('hex')` is persisted in the `OtpCode` table.
- **Trade-off**: Slightly higher CPU cycle cost on verify, but guarantees that even in the event of an unauthorized database dump, active OTPs cannot be intercepted or replayed.
- **Rate-Limiting & Lockout**: Enforces a strict 30-second resend cooldown per user to prevent SMS/email bombardment, a 10-minute expiry window, and invalidation upon reaching 5 incorrect attempts.

### 2.2 Password Security: Argon2id vs. bcrypt
- **Decision**: Implemented `argon2id` (`argon2.argon2id`) for password hashing.
- **Trade-off**: Argon2 requires native binaries (handled via prebuilt bindings), but provides state-of-the-art resistance against GPU/ASIC cracking by balancing memory and time cost ($64\text{ MB}$, $3\text{ iterations}$).

### 2.3 Database Strategy: SQLite Default + Dockerized PostgreSQL
- **Decision**: Configured SQLite as the out-of-the-box database engine with an identical Prisma schema mapped to PostgreSQL in `docker-compose.yml`.
- **Trade-off**: SQLite provides zero friction for reviewers (no Docker daemon or port conflict needed to inspect and run tests in under 5 minutes). PostgreSQL is containerized for production parity.

### 2.4 Profile Schema: Why "Business Name" is Optional
- **Decision**: `UserProfile.businessName` is optional in the database and UI.
- **Rationale**: PadosiPro is fundamentally a lifestyle management concierge for everyday households (handling groceries, elder companion visits, appliance repairs, maid onboarding, travel bookings). Forcing individual homeowners or working professionals to input a "Business Name" introduces high onboarding friction and signup drop-off. However, because PadosiPro also supports corporate concierge and office admin tasks, making the field optional with an explicit helper text allows businesses to provide their entity name for GST billing without penalizing individual users.

### 2.5 Auth & Session Management: JWT with SecureStore
- **Decision**: JWT access tokens are signed on login and persisted on the mobile device using `expo-secure-store` (hardware-backed Android Keystore / iOS Keychain).
- **Trade-off**: Stateless JWTs avoid frequent DB lookups during high API throughput. Session persistence ensures returning users never face redundant login prompts after closing the app.

---

## 3. What Was Left Out (Scope Boundaries)

1. **In-App Real-Time Chat**: Rather than building a partial WebSocket chat, the app models the assigned Lifestyle Manager through a dedicated status card (*"Ravi Kumar is assigned"*), matching the current initial onboarding journey.
2. **Payment Gateway Integration**: Payment gateways (e.g. Razorpay/Stripe) were omitted as billing at PadosiPro happens post-task execution via direct manager billing.
3. **Multi-Factor SMS Auth**: Kept strictly to Email OTP as specified in the assignment brief.

---

## 4. What I Would Build With Another Week

1. **WebSocket / Socket.io Concierge Chat**: Real-time two-way messaging between the customer and their assigned Lifestyle Manager (Ravi) with attachment sharing (receipts, photos of repairs, flight tickets).
2. **Push Notifications**: Automated Expo Push Notifications (FCM/APNs) when a Lifestyle Manager updates task status (e.g. *"AC servicing completed"*, *"Medicine picked up"*).
3. **Offline Caching with WatermelonDB / React Query**: Full offline-first optimistic task bookmarking with background sync upon network reconnection.
4. **Lifestyle Manager Admin Dashboard**: A Next.js/Tailwind web portal for managers to view assigned tasks, update milestones, and upload proof of work.
