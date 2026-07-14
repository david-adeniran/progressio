# Progressio

A personal goal tracker — any type of goal, fully private per user, deployable to Vercel.

## Stack

- React + Vite
- Firebase Auth (email/password login)
- Firestore (per-user private goal storage)
- React Router v6
- CSS Modules (no UI framework)

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd goaltrack
npm install
```

### 2. Create a Firebase project

1. Go to [firebase.google.com](https://firebase.google.com) and create a new project.
2. In the Firebase Console, go to **Build → Authentication** and enable **Email/Password**.
3. Go to **Build → Firestore Database** and create a database (start in production mode).
4. Go to **Project Settings → Your apps → Web app** and register a new web app.
5. Copy the config values.

### 3. Set up Firestore security rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures each user can only read and write their own goals.

### 4. Add environment variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values from step 2.

### 5. Run locally

```bash
npm run dev
```

---

## Deploy to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
3. In the Vercel project settings, go to **Environment Variables** and add all six `VITE_FIREBASE_*` variables from your `.env` file.
4. Deploy. Vercel auto-detects Vite — no extra config needed.

> **Important:** Do not commit your `.env` file to GitHub. It's already in `.gitignore`.

---

## Features

- Sign up / sign in with email and password
- Create goals in 8 categories: Fitness, Finance, Learning, Career, Health, Travel, Personal, Custom
- Each goal has a title, description, target, deadline, and optional monthly limit
- Log progress updates with notes — full history on the goal detail page
- Progress ring and bar visualisations
- Filter goals by category on the dashboard
- Edit and delete goals
- Fully private — each user sees only their own goals
