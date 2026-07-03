# ChristCalm — Product Requirements Document

## Vision
A Christian faith-based mental wellness mobile app that blends the immediate calming of **Rootd** (panic-attack SOS) with the sacred, guided meditation experience of **Abide** (Bible + prayer + meditation). Emotion-first, scripture-anchored, gently monetized.

## Target user
People of faith (or exploring it) who experience anxiety, panic, grief, loneliness, or spiritual overwhelm, and want a private, Bible-grounded companion for daily peace.

## Core MVP scope

### 1. Onboarding (5 steps)
- Welcome / Christ-anchored tagline (Matthew 11:28)
- Name capture
- Faith journey stage (seeking / new / growing / deeply rooted)
- Concerns picker (anxiety, panic, stress, sleep, grief, loneliness, purpose, gratitude)
- Ready state → account creation

### 2. JWT Auth (email + password)
- Sign up (name, email, 6+ char password)
- Sign in
- Token persisted via `expo-secure-store` (30-day expiry)

### 3. Home dashboard
- Contextual greeting + name + upgrade / premium badge
- Prominent **SOS panic-relief** card (gradient, always accessible)
- **How are you feeling?** — horizontal scroll of 9 emotion chips (Anxious, Fearful, Sad, Overwhelmed, Lonely, Grateful, Joyful, Hopeful, Peaceful) — tapping logs mood and jumps into Meditate filtered by emotion
- Today's Devotional (rotated daily, scripture + reflection)
- AI Personal Prayer entry point

### 4. Meditate tab
- Filterable list of scripture-guided meditations by emotion
- Each meditation: cover image, scripture reference + verse, duration, premium tag
- Player screen: blurred cover background, animated pulsing art, audio playback (expo-audio), scripture overlay, progress + play/pause, session-complete tracking

### 5. Prayer library
- Categorized (Morning, Evening, Anxiety, Gratitude, Healing)
- Tap to expand full prayer
- Premium prayers gate → paywall
- **AI Prayer Generator** CTA — takes user's feeling + optional context, returns a scripture-anchored personal prayer via GPT-5.2 (Emergent Universal LLM Key)

### 6. Journal
- Composer with mood tag + free-text
- List of past entries
- Backed by MongoDB per user

### 7. Profile
- Avatar (initial), name, email
- Stats: streak, minutes meditated, sessions completed
- Manage subscription (paywall), SOS shortcut, AI prayer, sign out

### 8. Panic / SOS Screen
- 4-7-8 guided breathing (Animated.View scale loop)
- Rotating scripture verses
- Start / Pause controls, cycle counter

### 9. Paywall (Stripe subscription)
- Monthly $9.99 / Annual $59.99 (annual highlighted, "SAVE 50%")
- Feature checklist (unlimited meditations, AI prayers, premium library, audio, priority SOS, ad-free)
- Stripe Checkout Session opened via `expo-web-browser`
- Auto-verify on return via `AppState` → marks user as premium
- No RevenueCat SDK in MVP (Stripe direct — a native iOS build could layer RC on top later)

## Tech Stack
- **Frontend:** Expo SDK 54, expo-router (file-based), expo-audio, expo-web-browser, expo-linear-gradient, react-native-safe-area-context, @react-native-async-storage/async-storage, expo-secure-store
- **Backend:** FastAPI, MongoDB (motor async), JWT (pyjwt), bcrypt, stripe SDK, emergentintegrations (GPT-5.2)
- **AI:** OpenAI GPT-5.2 via Emergent Universal LLM Key (personal prayer generation)
- **Payments:** Stripe subscriptions in hosted checkout mode (test key `sk_test_emergent` from pod env)

## Data model (MongoDB)
- `users` — id, name, email, password_hash, is_premium, faith_journey, concerns[], streak, minutes_meditated, prayers_completed
- `mood_logs` — id, user_id, emotion, note, created_at
- `journal_entries` — id, user_id, mood, content, created_at
- `ai_prayers` — id, user_id, feeling, context, prayer, created_at
- `subscriptions` — user_id, email, plan, stripe_customer_id, stripe_subscription_id, status, checkout_session_id, updated_at

## API endpoints
- `POST /api/auth/signup`, `POST /api/auth/signin`, `GET /api/auth/me`, `POST /api/auth/onboarding`
- `GET /api/emotions`, `GET /api/meditations?emotion=`, `GET /api/meditations/{id}`, `POST /api/meditations/complete`
- `GET /api/prayers?category=`, `GET /api/devotional/today`
- `POST /api/mood/log`, `GET /api/mood/history`
- `POST /api/journal`, `GET /api/journal`
- `POST /api/ai/prayer`, `GET /api/ai/prayers/history`
- `POST /api/stripe/checkout`, `GET /api/stripe/verify/{session_id}`, `GET /api/subscription/status`

## Monetization
- Freemium: 5 core meditations + core prayers free, AI prayer generator gated by soft limit (currently no limit — future)
- Premium unlocks 5 more meditations + healing/premium prayers + unlimited AI prayers
- $9.99/mo or $59.99/yr via Stripe Checkout

## Future / not in MVP
- Native RevenueCat integration (requires dev build)
- Push notifications (needs deployed build + Firebase key)
- Streak reminders / daily-verse notifications
- Community / prayer requests
- Audio download for offline use
