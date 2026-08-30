# 🌱 Unique Fulbari Nursery : AI-Powered Customer Support System

[![Live Website](https://img.shields.io/badge/Visit-Site-green?style=for-the-badge&logo=vercel)](https://unique-fulbari-nursery-whrc.vercel.app)


A full-stack React web application for **Unique Fulbari Nursery** (Nepal) that pairs a public nursery website with an AI-powered admin dashboard — automating customer support, classifying inquiry urgency, and generating actionable business insights in real time.

## 🌐 Live Website
[https://unique-fulbari-nursery-whrc.vercel.app](https://unique-fulbari-nursery-whrc.vercel.app)


---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Dashboard & Routes](#dashboard--routes)
- [How It Works](#how-it-works)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Overview

Small nursery businesses often struggle to respond to customer inquiries quickly, identify urgent issues, and turn customer feedback into business decisions. This project solves that by pairing a clean public website with an AI-powered admin dashboard.

**Public site** — customers browse products, services, and a gallery, submit inquiries via a contact form, and chat with **Fulbari AI**, a context-aware plant assistant.

**Admin dashboard** — the nursery owner sees all submitted messages in real time, with automatic AI urgency classification (High / Medium / Low), AI-generated reply suggestions, and on-demand business advice generated from live customer data.

---

## Features

### 🌐 Public Website
- Hero section with nursery branding and call-to-action
- Product gallery — roses, marigolds, dahlias, seasonal flowers, pots, manure, and gardening tools
- Services section — plant sales, manure supply, gardening consultation, Nepal-wide delivery
- **Smart contact form** — name, phone, email, categorised subject dropdown, and message; submissions persisted directly to Firebase Firestore
- **Fulbari AI chatbot** — floating widget powered by the Groq API, context-restricted to nursery topics, with quick-suggestion chips and automatic retry logic on rate limits

### 📊 Admin Dashboard `/dashboard`
- Live KPI strip: total messages, high / medium / low urgency counts, resolved and pending
- Quick-access navigation to all sub-pages
- **AI Business Advisor** — on demand, builds a rich summary of all customer messages and returns 6 numbered, specific, actionable business suggestions via Groq
- Recent inquiries quick-view with urgency colour coding

### 📬 Contact Messages `/messages`
- Real-time Firestore listener; messages sorted newest-first
- Sidebar with tab filters: **All · High · Medium · Low · Done**
- Full-text search across name, email, subject, and message body
- Automatic background AI classification queue — each unclassified message is sent to Groq (`llama3-8b-8192`) and receives an urgency label plus a suggested reply
- Detail panel with sender info, message body, AI suggested reply, one-click copy, and a pre-filled `mailto:` link
- Mark as done / delete actions persisted to Firestore

### Other Dashboard Pages
- **Urgency Detection** `/urgency` — dedicated view for high-priority messages
- **Business Insights** `/insights` — AI-generated trend analysis from aggregated customer data
- **Statistics** `/statistics` — customer inquiry KPIs and business metrics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7 |
| UI Components | MUI (Material UI) v9, Emotion |
| Build Tool | Vite 8 |
| Database | Firebase Firestore (real-time) |
| AI Chatbot | Groq API — `openai/gpt-oss-20b` |
| AI Classification & Insights | Groq API — `llama3-8b-8192` |
| Linting | OXLint |
| Deployment | Vite build + `_redirects` (Netlify / Render) |

---

## Project Structure

```
unique-fulbari-ai/
├── public/
├── src/
│   ├── assets/                  # Images (hero, flowers, etc.)
│   ├── components/
│   │   ├── ChatBot.jsx          # Floating AI chatbot widget (Groq)
│   │   ├── Contact.jsx          # Contact form → Firestore
│   │   ├── Footer.jsx
│   │   ├── Gallery.jsx
│   │   ├── Hero.jsx
│   │   ├── Product.jsx
│   │   ├── Services.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx    # Admin dashboard + AI Business Advisor
│   │       ├── Messages.jsx     # Inbox with AI classification queue
│   │       ├── Insights.jsx     # AI-generated business insights
│   │       ├── Statistics.jsx   # KPI statistics
│   │       └── Urgency.jsx      # High-priority message filter
│   ├── firebase.js              # Firestore initialisation
│   ├── App.jsx                  # Router + page layout
│   └── main.jsx
├── .env.local                   # API keys (not committed)
├── index.html
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with Firestore enabled
- A [Groq API key](https://console.groq.com/)

### Installation

```bash
git clone https://github.com/your-username/unique-fulbari-ai.git
cd unique-fulbari-ai
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Groq (chatbot, message classification, and business insights)
VITE_DASHBOARD_API_KEY=your_groq_api_key
```

> **Never commit `.env.local` to version control.** It is already listed in `.gitignore`.

---

## Dashboard & Routes

| Route | Description |
|---|---|
| `/` | Public nursery website (Home) |
| `/dashboard` | Admin dashboard with KPIs and AI advisor |
| `/messages` | Full inbox with AI classification and detail view |
| `/urgency` | Filtered view of high-priority messages |
| `/insights` | AI business insights |
| `/statistics` | Customer and sales statistics |

---

## How It Works

### Contact Form → Firestore
When a visitor submits the contact form, the payload (name, email, phone, subject, message, ISO timestamp) is written directly to the `contactMessages` Firestore collection via `addDoc`.

### AI Classification Queue
`Messages.jsx` attaches a real-time `onSnapshot` listener. Any message without an `urgency` field is added to an in-memory queue. A serial processor picks one message at a time, sends it to Groq (`llama3-8b-8192`), and writes the returned `urgency` (High / Medium / Low) and `reply` back to Firestore. HTTP 429 responses trigger a 10-second back-off before retrying.

### Fulbari AI Chatbot
The floating chatbot widget calls the Groq API with a fixed system prompt restricting answers to nursery-relevant topics (plants, manure, soil, gardening, Nepal delivery). Off-topic questions receive a polite redirect to the nursery's contact details. Up to 3 automatic retries handle rate-limit and server errors.

### AI Business Advisor
Clicking **Generate Advice** on the dashboard builds a structured text summary from all Firestore messages — urgency breakdown, sentiment counts, top keywords, complaint and delivery-issue counts, bulk-order queries, repeated FAQ-style messages, and last-7-day highlights — then sends it to Groq, requesting 6 specific, numbered business suggestions.

---

## Future Improvements

- [ ] Admin authentication (Firebase Auth)
- [ ] Firestore security rules + user roles
- [ ] Email notifications on new high-urgency messages
- [ ] Analytics charts (urgency trend over time, message volume)
- [ ] Inventory management module
- [ ] Multi-language support (Nepali / English)
- [ ] PWA / mobile app wrapper

---

## Author

**Unique Dhakal**

> Built with the assistance of **IBM Bob** — used throughout the project for architecture planning, implementation, and debugging.

---

## License

This project is for educational and portfolio purposes. Contact the author for commercial use.
