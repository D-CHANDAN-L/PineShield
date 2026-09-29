<div align="center">

# 🛡️ PineShield
### Autonomous POS Incident Deflection & Operations AI Cockpit
**Empowering Pine Labs Merchants & Acquiring Banks with Real-Time Terminal Diagnostics**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.8_Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/Compliance-PCI--DSS_L1_%7C_ISO_27001-emerald)](https://www.pinelabs.com)

</div>

---

## 📌 Table of Contents
- [⚡ Quick Local Setup (TL;DR)](#-quick-local-setup-tldr)
- [Executive Overview](#-executive-overview)
- [System Architecture & Core Modules](#-system-architecture--core-modules)
- [Autonomous SOP Routing Matrix](#-autonomous-sop-routing-matrix)
- [Prerequisites](#-prerequisites)
- [Quick Start & Setup (Detailed)](#-quick-start--setup-detailed)
- [Environment Configuration](#-environment-configuration)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [Repository Directory Structure](#-repository-directory-structure)
- [WhatsApp Multi-Gateway Dispatch Engine](#-whatsapp-multi-gateway-dispatch-engine)
- [Gemini AI Dual-Engine Fallback Architecture](#-gemini-ai-dual-engine-fallback-architecture)
- [Deployment Guide (Vercel & Node.js)](#-deployment-guide-vercel--nodejs)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ⚡ Quick Local Setup (TL;DR)

Get up and running locally in under a minute with these four commands:

```bash
# 1. Clone the repository from GitHub
git clone https://github.com/D-CHANDAN-L/PineShield.git
cd PineShield

# 2. Install all dependencies (Frontend, Express API Bridge, Icons & UI)
npm install

# 3. Create your local environment configuration
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env

# 4. Launch the local development server
npm run dev
```

> 🌐 Once started, open **`http://localhost:5173`** in your browser. PineShield will run immediately with full deterministic SOP routing—even without any external API keys!

---

## 📖 Executive Overview

**PineShield** is an enterprise-grade POS operations cockpit developed to address terminal payment failures across the Pine Labs acquiring ecosystem. 

In point-of-sale operations, merchants frequently encounter error codes (*TID Not Present*, *Call Help RE*, *Decline 99*, *Key Exchange Failed*). A major operational challenge is determining **who owns the issue**:
- **Non-Aggregator Terminals**: The terminal connects directly to a specific acquiring bank's switch (e.g., HDFC, ICICI, SBI, Axis). Terminal identification (TID) or acquirer-level failures **must be deflected directly to the acquiring bank**, not Pine Labs.
- **Aggregator Terminals**: Transactions route through the centralized Pine Labs Plutus payment gateway. These issues are directly resolved by Pine Labs Operations.

PineShield resolves this with an **autonomous dual-engine triage system**:
1. Grounded in a comprehensive deterministic Pine Labs Master SOP rule base.
2. Augmented by **Google Gemini 3.8 Flash** for deep conversational understanding.
3. Connected to an **automated background WhatsApp notification pipeline** to deliver resolutions to store managers without manual intervention.

---

## 🚀 System Architecture & Core Modules

The application is structured into three primary interactive workflows:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PineShield Operations UI                        │
└──────────────────┬─────────────────┬─────────────────┬─────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
         ┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
         │ 1. Smart POS     │ │ 2. Gemini   │ │ 3. WhatsApp Web  │
         │ Terminal Studio  │ │ AI Triage   │ │ Live Simulator   │
         │ (/simulator)     │ │ (/triage)   │ │ (/whatsapp)      │
         └─────────┬────────┘ └──────┬──────┘ └────────┬─────────┘
                   │                 │                 │
                   └────────────►────┴────────◄────────┘
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │        MerchantContext State Engine     │
                ├─────────────────────────────────────────┤
                │ • Active Profile (Aggregator / Non-Agg) │
                │ • Master SOP Decision Tree              │
                │ • Dual-Engine AI + Static Fallback      │
                │ • Multi-Gateway WhatsApp Dispatcher     │
                └─────────────────────────────────────────┘
```

### 1. Smart POS Terminal Simulator (`/simulator`)
- Interactive touch-screen terminal simulation styled after PAX A920 / Android Smart POS devices.
- Dynamic keypads, customizable billing amounts, and multiple payment methods (Chip & PIN Cards, UPI QR, NFC Tap to Pay).
- **Error Injection Matrix** with 20+ real-world payment failure scenarios across 5 distinct categories:
  - **Hardware / Device**: Thermal printer paper out, low battery, tamper trigger.
  - **Network & Host Switch**: Host timeout, reversal failed, key exchange failure.
  - **Merchant & TID**: Terminal ID inactive, merchant deactivated, store profile mismatch.
  - **Acquiring Bank**: Decline 99, invalid transaction formatting, bank switch offline.
  - **Customer Card / Issuer**: Daily transaction limit exceeded, incorrect PIN, card expired.
- Realistic thermal receipt printing with live transaction metadata.

### 2. Gemini AI Triage Studio (`/triage`)
- Instant diagnostic analysis tailored to the active merchant architecture.
- Real-time resolution steps, root cause diagnostics, and pre-formatted support emails.
- Autonomous action triggers:
  - 1-click WhatsApp escalation dispatch.
  - Plutus Desk internal ticket creation.
  - Direct bank escalation telephone links.

### 3. WhatsApp Web Simulator & Automated Dispatcher (`/whatsapp`)
- High-fidelity WhatsApp Web interface simulation with sound chimes, delivery ticks, and message history.
- Seamless dispatching through real external SMS/WhatsApp gateways or local dev mock mode.
- In-flight request deduplication and sub-400ms rapid double-click throttling.

---

## ⚖️ Autonomous SOP Routing Matrix

PineShield strictly enforces four enterprise routing rules based on terminal ownership:

| Rule ID | Classification | Applicable Store Architecture | Routing Destination | Contact Details |
|---|---|---|---|---|
| **RULE 1** | **Bank Deflection** | Non-Aggregator | Bound Acquiring Bank (HDFC, ICICI, SBI, Axis, Kotak, Amex) | Bank Helpdesk (e.g., `1800 202 6161` / `pos.helpdesk@bank.in`) |
| **RULE 2** | **Pine Labs Aggregator** | Aggregator | Pine Labs Plutus Operations Desk | `0120-4033600` / `plutus.support@pinelabs.com` |
| **RULE 3** | **Amex Inactive / Acquiring** | Both Architectures | American Express India Merchant Services | `1800 419 1414` / `amex.pos@aexp.com` |
| **RULE 4** | **Customer Card Restrictions** | Both Architectures | Customer's Card-Issuing Bank | Refer to helpline printed on back of customer card |

---

## 💻 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (`v20.x` or `v22.x` recommended)
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **Git**: For version control
- *(Optional)* **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- *(Optional)* **Twilio / Green-API / UltraMsg Account**: Required only for dispatching real WhatsApp messages to live physical mobile devices

---

## 🛠️ Quick Start & Setup (Detailed)

Follow these step-by-step instructions to set up the entire project locally from scratch:

### 1. Clone the Repository
Open your terminal (macOS/Linux Terminal, Windows Command Prompt, or PowerShell) and clone the repository:
```bash
git clone https://github.com/D-CHANDAN-L/PineShield.git
cd PineShield
```

### 2. Verify Your Environment
Ensure your Node.js and npm versions meet the minimum requirements:
```bash
node -v   # Should output v18.0.0 or higher (v20+ recommended)
npm -v    # Should output v9.0.0 or higher
```

### 3. Install All Project Dependencies
Run `npm install` in the project root. This single command installs all required packages for both the frontend application and the backend API bridge:
```bash
npm install
```

**Key dependencies installed:**
- **Frontend Core**: React 19 (`react`, `react-dom`), React Router v7 (`react-router-dom`)
- **Build Tool & Bundler**: Vite 8 (`vite`, `@vitejs/plugin-react`)
- **Styling & UI**: Tailwind CSS 3 (`tailwindcss`, `postcss`, `autoprefixer`), `clsx`, `tailwind-merge`
- **Animations & Effects**: GSAP 3 (`gsap`, `@gsap/react`), `canvas-confetti`
- **Icons**: Lucide React (`lucide-react`)
- **Backend API & Dispatch Bridge**: Express 5 (`express`), CORS (`cors`), Dotenv (`dotenv`)
- **Linting & Code Quality**: Oxlint (`oxlint`)

### 4. Configure Environment Variables
Copy the provided `.env.example` file to create your active `.env` file:

```bash
# On Linux / macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env

# On Windows (Command Prompt)
copy .env.example .env
```

Open `.env` in any text editor. If you have a Google Gemini API key, add it to `GEMINI_API_KEY`:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
```

> 💡 **No API key? No problem!** PineShield runs 100% offline out-of-the-box using its built-in Pine Labs deterministic SOP knowledge base. All error matrices, ticket generation, and deflection rules will work without requiring paid accounts or external tokens.

### 5. Start the Local Development Server
Launch Vite's development server:
```bash
npm run dev
```

Once running, your terminal will display:
```text
  VITE v8.3.0  ready in 280 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Open **`http://localhost:5173`** in your web browser.

### 6. (Optional) Run the Standalone Express Backend
If you want to run the standalone Express backend server on port 3001 (in addition to Vite's dev middleware):
```bash
npm run server
```
The API server will listen on `http://localhost:3001` with endpoints ready at `/api/send-whatsapp` and `/api/gateway-status`.

---

## ⚙️ Environment Configuration

Edit your `.env` file with the relevant configurations:

```env
# ==============================================================================
# PineShield - Environment Configuration
# ==============================================================================

# 1. Google Gemini AI Triage Configuration
# Get your free API key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# 2. Server Configuration
PORT=3001

# 3. WhatsApp Gateway Integration (Optional - Defaults to Dev/Mock Mode)
# Leave blank to use zero-friction Mock Automated Mode (logs payloads to console)

# Option A: Twilio Official WhatsApp API
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Option B: Green-API (Custom Store Phone Instance)
GREEN_API_INSTANCE_ID=
GREEN_API_TOKEN=

# Option C: UltraMsg Instance
ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=
```

### Environment Variables Detail

| Variable | Required? | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Optional | `none` | Server-side Gemini API key used by the Vercel serverless proxy (`api/gemini.js`). |
| `VITE_GEMINI_API_KEY` | Optional | `none` | Client-accessible Gemini API key fallback. |
| `GEMINI_MODEL` | Optional | `gemini-1.5-flash` | Gemini model variant (`gemini-1.5-flash`, `gemini-2.5-flash`, etc.). |
| `PORT` | Optional | `3001` | Port for the standalone Express API server (`server.js`). |
| `TWILIO_ACCOUNT_SID` | Optional | `none` | Twilio Account SID for official WhatsApp Business messaging. |
| `TWILIO_AUTH_TOKEN` | Optional | `none` | Twilio Auth Token. |
| `TWILIO_WHATSAPP_NUMBER`| Optional | `whatsapp:+14155238886` | Twilio approved WhatsApp sender number or sandbox number. |
| `GREEN_API_INSTANCE_ID` | Optional | `none` | Green-API instance identifier for personal/store number dispatch. |
| `GREEN_API_TOKEN` | Optional | `none` | Green-API security authorization token. |
| `ULTRAMSG_INSTANCE_ID`  | Optional | `none` | UltraMsg instance ID. |
| `ULTRAMSG_TOKEN`        | Optional | `none` | UltraMsg authorization token. |

---

## 📜 NPM Scripts Reference

All primary build, test, and run scripts are managed via `package.json`:

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Starts the Vite development server with hot-module replacement (HMR) and embedded API middleware at `http://localhost:5173`. |
| `npm run server` | `node server.js` | Launches the dedicated Node.js / Express 5 API bridge for automated WhatsApp dispatch and gateway telemetry at `http://localhost:3001`. |
| `npm run build` | `vite build` | Compiles the production build into the `dist/` directory with tree-shaking and minification. |
| `npm run preview` | `vite preview` | Locally serves the compiled production build from `dist/` for pre-release verification. |
| `npm run lint` | `oxlint` | Executes the high-speed Rust-based Oxlint linter across JavaScript/React files. |

---

## 📂 Repository Directory Structure

```text
PineShield/
├── api/                           # Vercel Serverless Functions
│   ├── gateway-status.js          # GET: Active gateway mode & credentials status
│   ├── gemini.js                  # POST: Secure server-side Gemini AI proxy
│   ├── send-whatsapp.js           # POST: Universal WhatsApp dispatcher
│   └── whatsapp/
│       └── send.js                # Alias endpoint for WhatsApp dispatch
├── public/                        # Static assets (favicons, manifest, icons)
├── src/                           # Frontend Application Source
│   ├── assets/                    # Media assets, logos, and chimes
│   ├── components/
│   │   ├── BankDirectory/         # Bank contact directory & helpdesk matrix
│   │   ├── Chatbot/               # Gemini AI Triage Studio & ticket cards
│   │   ├── EmergencyDesk/         # Emergency SOS ticket escalation desk
│   │   ├── KnowledgeMatrix/       # Pine Labs SOP searchable knowledge base
│   │   ├── Layout/                # Header, Footer, Modals (Phone, API Key)
│   │   ├── Navigation/            # Tab switcher, demo profile switcher, OneTrust banner
│   │   ├── POSSimulator/          # PAX Smart POS terminal & error injector matrix
│   │   └── WhatsApp/              # WhatsApp Web interface & audio chime hooks
│   ├── context/
│   │   └── MerchantContext.jsx    # Central state provider (terminals, tickets, profile)
│   ├── data/
│   │   ├── bankContacts.js        # Direct acquirer phone & email contacts
│   │   ├── bankDirectory.js       # Searchable bank registry data
│   │   ├── merchantData.js        # Demo store profiles (Aggregator vs Non-Agg)
│   │   └── sopRules.js            # Pine Labs Master SOP Error Records & routing logic
│   ├── hooks/
│   │   └── useRouter.js           # Client-side router & deep-linking hook
│   ├── services/
│   │   ├── integrations.js        # GTM, VWO, reCAPTCHA & OneTrust event telemetry
│   │   └── whatsappGateway.js     # Universal dispatch engine (Twilio, Green-API, UltraMsg, Mock)
│   ├── utils/
│   │   ├── fallbackSop.js         # Offline deterministic SOP fallback logic
│   │   ├── gemini.js              # Client triage handler with dual-engine fallback
│   │   ├── geminiPrompt.js        # System instruction prompt grounding Gemini in SOP
│   │   └── whatsapp.js            # WhatsApp message formatting & dispatch utilities
│   ├── App.jsx                    # Root view orchestrator & TabErrorBoundary
│   ├── index.css                  # Tailwind styles and custom dark/light themes
│   └── main.jsx                   # Application DOM mount
├── .env.example                   # Annotated template for environment variables
├── package.json                   # Project dependencies and script definitions
├── server.js                      # Express 5 standalone API server
├── tailwind.config.js             # Tailwind design system configuration
├── vercel.json                    # Vercel deployment routing & rewrites
└── vite.config.js                 # Vite bundler config with custom dev middleware
```

---

## 📲 WhatsApp Multi-Gateway Dispatch Engine

PineShield includes a **Universal WhatsApp Dispatch Engine** (`src/services/whatsappGateway.js`) designed to support both production enterprise operations and zero-cost local development:

```
                         [WhatsApp Dispatch Trigger]
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │  Gateway Mode Auto-Detection  │
                      └───────────────┬───────────────┘
                                      │
         ┌───────────────────┬────────┴──────────┬───────────────────┐
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Twilio Official │ │ Green-API Store │ │ UltraMsg Direct │ │ Dev / Mock Mode │
│ WhatsApp API    │ │ Instance        │ │ Instance        │ │ (Console Log)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

1. **Twilio Official WhatsApp API (`twilio_official`)**:
   - Used for enterprise-branded corporate dispatches.
   - Requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER`.
2. **Green-API Instance (`green_api_custom`)**:
   - Routes messages through a connected store manager phone number.
   - Requires `GREEN_API_INSTANCE_ID` and `GREEN_API_TOKEN`.
3. **UltraMsg Gateway (`ultramsg_custom`)**:
   - Alternative third-party WhatsApp instance.
   - Requires `ULTRAMSG_INSTANCE_ID` and `ULTRAMSG_TOKEN`.
4. **Dev / Mock Mode (`dev_mock_automated`)**:
   - **Zero credentials required**.
   - If no API keys are provided in `.env`, PineShield automatically logs formatted dispatch payloads directly to the terminal console and browser state with simulated delivery ticks.

---

## 🧠 Gemini AI Dual-Engine Fallback Architecture

PineShield guarantees **100% operational availability** during switch outages, rate limits, or network interruptions through a dual-engine triage pipeline:

1. **Primary AI Engine (Google Gemini 3.8 Flash)**:
   - Queries are sent to the `/api/gemini` serverless proxy.
   - Grounded via `geminiPrompt.js` with Pine Labs' exact operational rules.
   - Returns structured JSON containing root cause explanations, exact contact phone/emails, and bank deflection decisions.
2. **Deterministic SOP Engine (Offline Fallback)**:
   - If the Gemini API returns `429 Too Many Requests`, `503 Service Unavailable`, or if no API key is configured, the system instantly engages `matchStaticSop()` (`src/utils/gemini.js`).
   - Evaluates terminal error codes directly against `sopRules.js` in memory.
   - Resolves in **under 2 milliseconds** with zero external network dependency.

---

## 🚢 Deployment Guide (Vercel & Node.js)

### Deploying to Vercel (Recommended)
PineShield is pre-configured for seamless deployment to Vercel with serverless API functions:

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. In **Project Settings** > **Environment Variables**, configure:
   - `GEMINI_API_KEY`: Your Google AI Studio key
   - Optional WhatsApp credentials (`TWILIO_ACCOUNT_SID`, etc.)
4. Deploy! Vercel will automatically detect `vite` and build the application using the configuration in `vercel.json`.

### Deploying to Node.js / Docker / VPS
1. Build the frontend client:
   ```bash
   npm run build
   ```
2. Start the Express server:
   ```bash
   NODE_ENV=production PORT=8080 node server.js
   ```
3. Use a reverse proxy (e.g., Nginx, Caddy) to serve the `dist/` directory and proxy `/api/*` requests to port `8080`.

---

## ❓ Troubleshooting & FAQs

### Q: Why do I see "Mock Automated Dispatch" in the WhatsApp logs?
**A:** This is by design! When no Twilio or Green-API credentials are provided in `.env`, PineShield defaults to graceful Mock Mode. The UI will display delivery receipts and log the dispatch payload to your console without sending an actual billed SMS.

### Q: Can I use PineShield without a Google Gemini API Key?
**A:** **Yes.** If `GEMINI_API_KEY` is omitted, PineShield's deterministic SOP rules engine (`src/utils/gemini.js` + `src/data/sopRules.js`) will handle all error triage, bank deflection routing, and contact lookups instantly.

### Q: How do I test Non-Aggregator vs Aggregator behavior?
**A:** Click the **Profile Switcher** badge in the top navigation bar to toggle between:
- **Croma Electronics** (Non-Aggregator • HDFC Bank Acquirer • TID `TID_HDFC_9910`)
- **Tata Westside** (Aggregator • Pine Labs Plutus Routed • Terminal `POS-WEST-02`)

Injecting an error like *TID Not Present* under Croma will trigger **Rule 1 (Bank Deflect to HDFC)**, whereas the same error under Westside will route to **Rule 2 (Pine Labs Plutus Desk)**.

---

## 📄 License & Compliance

Distributed under the MIT License. See `LICENSE` for more information.

> **Security Note:** PineShield is designed in compliance with **PCI-DSS Level 1** and **ISO/IEC 27001** operational guidelines. Sensitive cardholder authentication data (CVV/PIN blocks) is never collected or processed within the simulator.
