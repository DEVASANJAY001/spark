Here's a comprehensive prompt you can use to build this Tinder clone:

---

## Full Prompt: Tinder Clone in React Native (Web + Mobile)

---

### Project Overview

Build a cross-platform dating app called **"Spark"** (or your preferred name) using **React Native with Expo** (targeting both web and mobile), **Firebase** for authentication and backend, and **React Navigation** for routing. The app replicates the full Tinder onboarding and swiping flow shown in the uploaded screens.

---

### Tech Stack

- **React Native + Expo** (SDK 50+) — runs on iOS, Android, and Web
- **Firebase Auth** — Email/OTP, Phone/OTP, Google Sign-In
- **Cloud Firestore** — user profile storage
- **Firebase Storage** — photo uploads
- **React Navigation v6** — stack + tab navigation
- **Expo Image Picker** — photo selection
- **Reanimated 2 + Gesture Handler** — swipe card animations

---

### App Architecture & Navigation Structure

```
App
├── AuthStack (unauthenticated)
│   ├── Screen 1: LandingScreen
│   ├── Screen 2a: PhoneAuthScreen
│   ├── Screen 2b: EmailAuthScreen
│   └── Screen 3: OTPVerificationScreen
│
├── OnboardingStack (authenticated but profile incomplete)
│   ├── Screen 4: HouseRulesScreen
│   ├── Screen 5: FirstNameScreen
│   ├── Screen 6: BirthdayScreen
│   ├── Screen 7: GenderScreen
│   ├── Screen 8: SexualOrientationScreen
│   ├── Screen 9: InterestedInScreen
│   ├── Screen 10: DistancePreferenceScreen
│   ├── Screen 11: RelationshipGoalScreen
│   ├── Screen 12: SchoolScreen (skippable)
│   ├── Screen 13: LifestyleHabitsScreen
│   ├── Screen 14: PersonalityTraitsScreen
│   ├── Screen 15: InterestsScreen
│   ├── Screen 16: PhotoUploadScreen
│   └── Screen 17: BioAndPromptsScreen
│
└── MainTabNavigator (profile complete)
    ├── Tab 1: SwipeScreen (Tinder card stack)
    ├── Tab 2: ExploreScreen
    ├── Tab 3: LikesScreen
    ├── Tab 4: ChatScreen
    └── Tab 5: ProfileScreen
```

---

### Screen-by-Screen Specification

#### Screen 1 — LandingScreen
- Full-screen gradient background (pink → red/orange, `#FF4458` → `#FF6B81`)
- Centered **tinder** logo (flame icon + wordmark) in white
- Bottom section with legal text: "By tapping 'Continue' you agree to our Terms. Learn how we process your data in our Privacy Policy and Cookies Policy."
- Three white pill buttons (with icons): **Continue with Google**, **Continue with Phone Number**, **Continue with Email**
- Pink text link below: **Trouble signing in?**
- **Navigation**: Google → Firebase Google Sign-In flow → OnboardingStack or MainTab. Phone → PhoneAuthScreen. Email → EmailAuthScreen.

#### Screen 2a — PhoneAuthScreen
- Dark background (`#1a1a1a`)
- Back arrow top-left
- Title: **"Can we get your number?"**
- Country code picker (`IN +91` default with dropdown) + phone number text input (underline style)
- Body text explaining SMS consent
- Disabled grey pill **Next** button (enables when 10 digits entered)
- **Firebase**: `signInWithPhoneNumber(auth, '+91XXXXXXXXXX')`

#### Screen 2b — EmailAuthScreen
- Dark background
- Back arrow
- Title: **"What's your email?"**
- Single underline email input
- Helper text: "We'll send you a code to verify your email..."
- Disabled **Next** button at bottom

#### Screen 3 — OTPVerificationScreen
- Dark background
- Back arrow
- Title: **"Enter your code"**
- Subtitle showing masked email/phone (e.g., `devasanjay.w79@gmail.com`)
- 6-box OTP input (each box is an underline field, auto-advances on digit entry)
- **Resend via email/SMS** link in blue
- **NEXT** button at bottom (disabled until all 6 digits entered)
- **Firebase**: Confirm OTP with `confirmationResult.confirm(code)`

#### Screen 4 — HouseRulesScreen
- Dark background, X button top-left
- Tinder flame icon
- Title: **"Welcome to Tinder."**
- Subtitle: "Please follow these House Rules."
- 4 rules with bold heading + description: Be yourself / Stay safe / Play it cool / Be proactive
- White pill **I agree** button at bottom
- **Navigation**: Proceeds to FirstNameScreen

#### Screen 5 — FirstNameScreen
- Progress bar at top (step 1 of ~13)
- Title: **"What's your first name?"**
- Underline text input (auto-populated from auth display name if available)
- Helper: "This is how it'll appear on your profile. Can't change it later."
- White pill **Next** button
- **Firestore**: Save `firstName` to `users/{uid}`

#### Screen 6 — BirthdayScreen
- Progress bar (step 2)
- Title: **"Your b-day?"**
- MM/DD/YYYY segmented input (each segment is a 1–2 char field)
- Helper: "Your profile shows your age, not your birth date."
- Disabled **Next** button (enables when valid date entered, must be 18+)
- **Firestore**: Save `dateOfBirth`, computed `age`

#### Screen 7 — GenderScreen
- Progress bar (step 3)
- Title: **"What's your gender?"**
- Helper text about showing profile to right people
- Three selectable bordered pill options: **Man / Woman / Beyond Binary** (tap to select, highlights border)
- Checkbox at bottom: "Show gender on profile"
- **Learn how Tinder uses this info** link
- **Firestore**: Save `gender`, `showGender`

#### Screen 8 — SexualOrientationScreen
- Progress bar (step 4)
- **Skip** button top-right
- Title: **"What's your sexual orientation?"**
- Helper: "Select all that describe you..."
- 8 selectable bordered cards with title + description: Straight / Gay / Lesbian / Bisexual / Asexual / Demisexual / Pansexual / Queer
- Checkbox: "Show sexual orientation on profile"
- **Firestore**: Save `sexualOrientation[]`, `showOrientation`

#### Screen 9 — InterestedInScreen
- Progress bar (step 5)
- Back arrow
- Title: **"Who are you interested in seeing?"**
- 4 selectable bordered options: **Men / Women / Beyond Binary / Everyone**
- **Learn how Tinder uses this info** link
- **Firestore**: Save `interestedIn[]`

#### Screen 10 — DistancePreferenceScreen
- Title: **"Your distance preference?"**
- Helper text about slider
- Label **Distance Preference** + current value (e.g., **50 Mi**) on right
- Horizontal slider with pink/red thumb, full-width track
- Helper: "You can change preferences later in Settings"
- White pill **Next** button
- **Firestore**: Save `maxDistance`

#### Screen 11 — RelationshipGoalScreen
- Title: **"What are you looking for?"**
- Subtitle: "All good if it changes..."
- 2×3 grid of selectable emoji cards: Long-term partner / Long-term, open to short / Short-term, open to long / Short-term fun / New friends / Still figuring it out
- **Firestore**: Save `lookingFor`

#### Screen 12 — SchoolScreen
- **Skip** button top-right
- Title: **"If school's your thing..."**
- Underline text input: "Enter school name"
- Helper: "This is how it'll appear on your profile."
- **Firestore**: Save `school` (optional)

#### Screen 13 — LifestyleHabitsScreen
- **Skip** button top-right
- Title: **"Let's talk lifestyle habits, {firstName}"**
- 4 sections with chip-select (multi-select tags): How often do you drink? / How often do you smoke? / Do you workout? / Do you have any pets?
- Bottom counter button: **Next 0/4**
- **Firestore**: Save `lifestyle: { drinking, smoking, workout, pets }`

#### Screen 14 — PersonalityTraitsScreen
- **Skip** button top-right
- Title: **"What else makes you—you?"**
- 4 chip-select sections: Communication style / How do you receive love? / Education level / Zodiac sign
- Bottom counter: **Next 0/4**
- **Firestore**: Save `personality: { communicationStyle, loveLanguage, education, zodiac }`

#### Screen 15 — InterestsScreen
- **Skip** button top-right
- Title: **"What are you into?"**
- Helper: "Add up to 10 interests..."
- Categorized chip list (scrollable): Creativity / Fan favorites / Food and drink / Gaming / Going out (with "Show more" expand per category)
- Bottom counter: **Next 0/10**
- **Firestore**: Save `interests[]`

#### Screen 16 — PhotoUploadScreen
- Title: **"Add your recent pics"**
- Helper: "Upload 2 photos to start. Add 4 or more to make your profile stand out."
- 2×3 grid of dashed-border upload slots with `+` button
- Tap a slot → `expo-image-picker` → upload to Firebase Storage
- Disabled **Next** until ≥2 photos uploaded
- **Firestore**: Save `photoURLs[]`

#### Screen 17 — BioAndPromptsScreen
- **Skip** button top-right
- Title: **"Share more about yourself"**
- Two dashed-border cards with `+` button: **About me** (bio text input) / **Select a prompt** (choose from list, then answer)
- Bottom tip: "Adding a short intro about you could lead to 25% more matches" (25% in red/pink)
- On Next: Mark profile as `complete: true` in Firestore → Navigate to MainTabNavigator

#### Screen 18 — SwipeScreen (Main)
- Top bar: "Learning your type — Send 20 more Likes to get started"
- Card stack showing one profile at a time with:
  - Full-screen profile photo
  - Name, age, verified badge (✓)
  - Lifestyle badges (drinking, smoking, workout, pets, communication, time together, education, zodiac)
  - Swipe left (X) = dislike, swipe right (heart) = like
  - Two action buttons: red X, green heart
- Bottom tab bar: Swipe / Explore / Likes / Chat / Profile
- **Reanimated 2**: Swipe gesture with rotation and opacity, fling detection for left/right
- **Firestore**: Write to `likes/{uid}/likedBy/{targetUid}` or `passes/`; check for mutual like → create match

---

### Firebase Data Model (Firestore)

```
users/
  {uid}/
    firstName: string
    dateOfBirth: timestamp
    age: number
    gender: string
    showGender: boolean
    sexualOrientation: string[]
    showOrientation: boolean
    interestedIn: string[]
    maxDistance: number
    lookingFor: string
    school: string
    lifestyle: { drinking, smoking, workout, pets }
    personality: { communicationStyle, loveLanguage, education, zodiac }
    interests: string[]
    photoURLs: string[]
    bio: string
    prompts: [{ question, answer }]
    location: GeoPoint
    complete: boolean
    createdAt: timestamp

matches/
  {matchId}/
    users: [uid1, uid2]
    createdAt: timestamp

messages/
  {matchId}/messages/
    {messageId}/
      senderId, text, timestamp
```

---

### Key Implementation Notes

- **Auth gate**: Use `onAuthStateChanged` + Firestore `complete` field to route between AuthStack → OnboardingStack → MainTab
- **Progress bar**: Track current step index in OnboardingStack; compute `(step/totalSteps) * 100%` width
- **Chip selection**: Reusable `<ChipSelector>` component supporting single and multi-select modes
- **Swipe cards**: Use `react-native-deck-swiper` or build with Reanimated 2 `useAnimatedGestureHandler` for smooth native feel on both mobile and web
- **Web compatibility**: Use `Platform.OS === 'web'` guards for any native-only APIs; use `expo-image-picker` with web support enabled
- **Firebase Storage rules**: Allow authenticated users to write to `users/{uid}/photos/`
- **Firestore Security Rules**: Users can only read/write their own document; match documents readable by both participants

---

This prompt gives you complete coverage of all 20 screens, the full Firebase data model, navigation architecture, and component patterns. Hand it to your dev team or use it as your implementation spec.The diagram above maps the complete navigation architecture. Here's a quick summary of what to hand off:

**What the prompt covers:**
- All 18 screens with exact UI specs (inputs, buttons, validation rules, skip conditions)
- Firebase data model with full Firestore schema and collection structure
- Navigation routing logic — how auth state and the `complete` flag gate access to each stack
- Swipe card implementation hints (Reanimated 2 gesture handler)
- Web compatibility notes for Expo

**Key things to clarify with your team before starting:**
- Whether to use `react-native-deck-swiper` (faster to ship) or a custom Reanimated 2 swipe implementation (more control)
- Miles vs kilometers for distance (the screens show "Mi")
- Whether you want real-time chat via Firestore `onSnapshot` listeners or a third-party like Stream Chat