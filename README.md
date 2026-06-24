# Wallet by Araf

A personal finance web app with Google Sign-In and real-time cloud sync via Firebase.

## Features

- 📊 Dashboard with income, expense & balance overview
- 💸 Transaction tracking (income, expense, transfer, lent/borrowed)
- 🤝 Debt/lent money tracker with partial repayment support
- 🏠 Family Expenses module
- 📈 Reports & charts
- ☁️ Cloud sync via Firebase Firestore — access your data from any device
- 🔐 Google Sign-In authentication

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Google Sign-In**: Authentication → Sign-in method → Google → Enable
3. Enable **Firestore Database**: Firestore Database → Create database (start in test mode or use the rule below)
4. Register a **Web App**: Project Settings → Your Apps → Add app → Web

### 2. Add Firebase Config

Open `index.html` and find this block near the top:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace the values with your actual Firebase project credentials.

### 3. Firestore Security Rules

In Firebase Console → Firestore → Rules, set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vaultData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains, add your GitHub Pages domain:

```
yourusername.github.io
```

## Deploy to GitHub Pages

1. Upload this repo to GitHub
2. Go to Settings → Pages → Source → Deploy from branch → `main` → `/ (root)`
3. Your app will be live at `https://yourusername.github.io/your-repo-name/`

## Local Usage

Just open `index.html` in a browser. No build step needed — it's a single HTML file.

> **Note:** Google Sign-In won't work on `file://` — use a local server or GitHub Pages.
> Quick local server: `npx serve .` or `python -m http.server`
