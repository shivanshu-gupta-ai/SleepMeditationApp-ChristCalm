# ChristCalm — Product Requirements Document (Updated)

## Vision

A Christian faith-based mental wellness mobile app that blends immediate calming support (like Rootd) with sacred, scripture-anchored meditation and prayer (like Abide). Emotion-first, Bible-grounded, and gently monetized. Designed to feel emotionally safe, reverent, and premium in both light and dark modes.

## Target User

People of faith (or exploring faith) experiencing anxiety, panic, grief, loneliness, spiritual overwhelm, or simply seeking daily peace through Scripture and simple practices.

---

## Core MVP Scope

### 1. Onboarding (11 steps)

- Warm welcome with mascot "Grace" (gentle brain holding Bible + cross)
- Name capture (optional)
- Emotional state + Faith journey stage
- Concerns multi-select
- When they most need peace
- Gentle insight moment ("Your current season")
- Desired support multi-select
- Scripture grounding moment
- Beautiful Personal Peace Covenant (commitment ritual)
- Preparing journey animation
- Honest “how the app works” (emotion-based meditations, SOS, devotional, prayer, journal) + optional first practices

**Paywall timing**: Shown softly **after user completes their first practice** on the home screen (value-first approach).

### 2. Authentication

- Email + password (JWT)
- Google OAuth (via Emergent)
- Token stored securely (expo-secure-store)

### 3. Home Dashboard

- Personalized greeting with name
- Horizontal emotion chips ("How are you feeling?")
- Prominent SOS panic-relief button (4-7-8 breathing)
- Today's Devotional card
- Quick access to AI Prayer Generator
- Streak / progress indicators (light)

### 4. Meditate Tab

- Scripture-guided meditations filterable by emotion
- Each meditation: cover image, Scripture reference, duration, premium indicator
- Full-screen player with soft abstract background, animated pulsing element, progress bar, and Scripture overlay

### 5. Prayer Library

- Categorized prayers (Morning, Evening, Anxiety, Gratitude, Healing)
- AI Prayer Generator (user inputs feeling → receives personalized Scripture-based prayer)
- Premium prayers gated behind soft paywall

### 6. Journal

- Simple text composer with mood tags
- List of past entries with soft dates
- Backed by MongoDB per user

### 7. Profile

- Avatar, name, email
- Stats: streak, minutes meditated, practices completed
- Manage subscription
- Sign out

### 8. SOS / Panic Screen

- 4-7-8 guided breathing with smooth pulsing animation
- Rotating Scripture verses
- Start/Pause + cycle counter

### 9. Paywall (RevenueCat)

- Monthly and Annual plans
- Feature checklist (unlimited meditations, AI prayers, premium library, offline access, etc.)
- Soft, invitational tone — no aggressive urgency or fake discounts
- RevenueCat SDK for subscription management and entitlements

---

## Design System (Consistent Theming)

**Full support for Light + Dark modes**

- **Light Theme**: `#F9F7F1` background, clean and airy
- **Dark Theme**: `#0F1115` background, sleek and premium
- Semantic color tokens defined in `design_guidelines.json` and `colors.md`
- Typography: Outfit (headings), Figtree (body), Cormorant Garamond (scripture)
- Generous spacing and rounded-3xl cards for emotional safety
- Mascot "Grace" used consistently during onboarding

See `design_guidelines.json` for complete component, layout, motion, and media guidelines.

---

## Tech Stack

- **Frontend**: Expo SDK 54, expo-router, expo-audio, expo-web-browser, expo-secure-store, @react-native-async-storage/async-storage, framer-motion (web), Tailwind + theme provider
- **Backend**: FastAPI, MongoDB (motor), JWT (pyjwt), bcrypt
- **AI**: OpenAI GPT via Emergent Universal LLM Key (personalized prayers)
- **Payments**: RevenueCat (recommended for production) + Stripe as backend
- **Theming**: Tailwind dark variant + semantic tokens from `design_guidelines.json`

---

## Data Model (MongoDB)

- `users`: id, name, email, password_hash, is_premium, faith_journey, concerns[], onboarding_data, streak, minutes_meditated, practices_completed
- `mood_logs`, `journal_entries`, `ai_prayers`, `meditation_sessions`, `subscriptions`

---

## API Endpoints (Key)

- Auth: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/onboarding`
- Core: `/api/emotions`, `/api/meditations`, `/api/prayers`, `/api/devotional/today`
- AI: `/api/ai/prayer`
- Payments: RevenueCat webhooks + entitlement checks
- Journal & Mood: Standard CRUD per user

---

## Monetization Strategy (Updated)

- **Freemium model**
- Core meditations and basic prayers free
- Premium unlocks: unlimited content, AI Prayer Generator, premium library, offline downloads, priority features
- **Paywall trigger**: After user completes first practice (value-first)
- Use **RevenueCat** for subscription management, entitlements, and cross-platform consistency
- Pricing example: $9.99/mo or $59.99/yr (annual highlighted respectfully)
- Tone: Warm, invitational, and transparent — never pushy

---

## Non-MVP / Future

- Push notifications (daily verse, streak reminders)
- Offline audio downloads
- Community prayer requests
- Advanced analytics and insights
- Native iOS/Android builds with full RevenueCat features

---

## Key Principles

- Every screen must feel emotionally safe and calming
- Scripture is always treated with reverence (Cormorant Garamond)
- Personalization is deep but gentle
- Monetization is value-first and respectful
- Design system is consistent across light and dark themes
- No fear, guilt, shock, or aggressive sales tactics

---

**This PRD is now aligned with the latest `design_guidelines.json`, `colors.md`, and `onboarding.md` (v3).**

All files use the same semantic tokens, mascot ("Grace"), and design philosophy.
