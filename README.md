# 3Minutos - Frontend App (React Native/Expo)

Welcome to the frontend repository for **3Minutos**, a mobile application designed to deliver personalized, 3-minute news digests to users. Built with React Native and Expo, this app allows users to select their favorite news topics, set a delivery time, and read or listen to their AI-curated daily summaries.

🔗 This project uses a separate API. [Click here to view the Backend code](https://github.com/lucotuco/3Minutos-back)
---

## 🚀 Key Features

* **Onboarding Flow:** Smooth initial setup where users provide their name, select exactly 3 news categories, and choose their preferred delivery time.
* **Personalized Digest:** A clean, uncluttered interface displaying the top 3 news items of the day, tailored to the user's selected topics.
* **Audio Playback:** Integration with `expo-av` to play the AI-generated audio version of the daily digest directly within the app.
* **Daily Agenda Integration:** Uses `expo-calendar` to sync and display the user's upcoming events for the day right above their news feed.
* **Reading History:** A dedicated tab to review previously read articles and their summaries.
* **Push Notifications:** Reminds users when their fresh digest is ready, utilizing `expo-notifications`.
* **Analytics:** Integrated with PostHog to track user engagement (e.g., article read times, audio playback stats).

---

## 🛠️ Tech Stack

* **Framework:** React Native with Expo (Managed Workflow)
* **Routing:** Expo Router (File-based routing)
* **Data Fetching:** React Query (`@tanstack/react-query`)
* **State & Storage:** React Context API, Async Storage
* **Key Expo Libraries:** `expo-av` (Audio), `expo-calendar` (Agenda), `expo-notifications` (Push), `expo-haptics` (Feedback)

---

## 📂 Project Structure

```text
lucotuco-3minutosfront/
├── app/                      # Expo Router screens
│   ├── index.tsx             # Entry point (redirects to onboarding or tabs)
│   ├── onboarding.tsx        # Initial setup screen
│   └── (tabs)/               # Main tabbed interface
│       ├── _layout.tsx       # Tab navigation configuration
│       ├── index.tsx         # Today's Digest screen
│       ├── history.tsx       # Past articles screen
│       └── profile.tsx       # User settings and preferences
├── components/               # Reusable UI components
│   ├── DigestCard.tsx        # Renders an individual news item
│   ├── DailyAgendaStrip.tsx  # Shows upcoming calendar events and weather
│   ├── TopicPicker.tsx       # Modal for selecting news categories
│   ├── TimePickerField.tsx   # Cross-platform time picker
│   └── ...
├── constants/                # Configuration and static data
│   ├── categories.ts         # Available news topics and icons
│   ├── colors.ts             # Theme color definitions
│   └── efemerides.ts         # Daily historical events/holidays
├── context/                  # Global state management
│   └── UserContext.tsx       # Manages user session and push tokens
└── services/                 # API and external integrations
    ├── api.ts                # Backend API client
    ├── calendar.ts           # Expo Calendar integration logic
    ├── notifications.ts      # Push notification setup
    └── session.ts            # Local storage for auth tokens
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [Expo CLI](https://docs.expo.dev/more/expo-cli/) (`npm install -g eas-cli`)
* Expo Go app on your physical device, or an iOS Simulator / Android Emulator.

### 2. Installation
Clone the repository and install the dependencies:
```bash
cd lucotuco-3minutosfront
npm install
```

### 3. Environment Variables
To connect to the backend, set the API URL. In development, Expo EAS configuration (`eas.json`) handles this, but you can also define it locally:
```env
EXPO_PUBLIC_API_URL=https://threeminutos-backend.onrender.com
```

### 4. Running the App
Start the Expo development server:
```bash
npm start
# or
npx expo start
```
From the terminal prompt, you can press `i` to open the iOS simulator, `a` for the Android emulator, or scan the QR code with the Expo Go app on your phone.

---

## 🎨 Theming & Styling
The app utilizes a custom color palette defined in `constants/colors.ts` and consumed via the `useColors()` hook. It uses the `Inter` font family loaded via `@expo-google-fonts/inter`.

---

## 📄 License
*Private / Proprietary* - All rights reserved.
