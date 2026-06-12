# ✈️ Planora — AI-Powered Group Travel Planner

<p align="center">
  <img src="./assets/banner.png" alt="Planora Banner" width="100%" />
</p>

<p center align="center">
  <strong>Plan together. Decide faster. Travel smarter.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20(ES6+)-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/AI%20Core-Gemini%202.5%20Flash-violet?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## 🌍 Overview

Planning trips with a group is historically chaotic—bogged down by endless chat threads, fragmented budget spreadsheets, and conflicting destination itineraries.

**Planora** structuralizes group travel coordination into a unified, AI-driven collaborative ecosystem. It empowers groups to co-create trip scopes, align budgets, vote on tracks dynamically, and deploy hyper-personalized schedules instantly without conversational fatigue.

---

## 🔥 Key Core Systems

### 🤖 LLM-Driven Itinerary Engineering
* **Structured Generation:** Integrates **Gemini 2.5 Flash** using deterministic prompt matrices to generate complete multi-day itineraries parsed into reliable schemas.
* **Deterministic Fallbacks:** Implements structured JSON parsers coupled with algorithmic state-recovering fallbacks to insulate client clients from parsing variations.

### 👥 High-Fidelity Group Collaboration
* **Dynamic Voting Matrix:** Resolves cluster preference friction with weighted recommendation scores for destinations, lodging, and timelines.
* **State Persistence:** Preserves active workspace sessions across components utilizing persistent client-side storage layers for frictionless user navigation.

### 💰 Scalable Resource Planning
* **Proportional Allocation:** Computes estimated cost metrics against dynamic traveler sizing algorithms.
* **Granular Tracking:** Breaks down expenditures via an interactive dashboard displaying actual vs. estimated fiscal overviews.

---

## 🖼️ User Interface Preview

| Landing Interface | Workspace Dashboard |
|---|---|
| ![Landing](./assets/landing-page.png) | ![Dashboard](./assets/dashboard.png) |

| Operational Hub | Dynamic Review Matrix |
|---|---|
| ![Members](./assets/members.png) | ![Review](./assets/review-page.png) |

---

## 🛠️ Tech Stack & Architecture

### Production Architecture
* **Interface Layer:** Semantic HTML5, Modular CSS3 Custom Properties, Vanilla JavaScript (ES6+ App Context).
* **AI Orchestration Layer:** Gemini API SDK, Programmatic Structural JSON Handlers.
* **Client Data Pipeline:** Web Storage API (LocalStorage Event Buffering).

### Core Architecture Roadmap
* **Framework Layer:** React.js / Next.js (TypeScript Configuration).
* **Styles Vector:** Tailwind CSS Engine.
* **Service Ecosystem:** Node.js, Express.js micro-framework blocks running over PostgreSQL relations.

---

## 📂 Repository Blueprint

```text
Planora/
│
├── assets/           # Digital media models & interface branding components
├── css/              # Minimal layout systems & variable specifications
├── js/               # Core execution scripts & async API worker engines
├── pages/            # Structural workspace routing layout blocks
├── index.html        # Main client entry lifecycle file
├── README.md         # Documentation layout index
└── LICENSE           # MIT Specification
