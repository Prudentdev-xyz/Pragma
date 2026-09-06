# PRAGMA.
**Don't predict. Act.**

> Autonomous AI Trading Agent — Complete Reference

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [System Architecture](#system-architecture)
- [End-to-End User Flow](#end-to-end-user-flow)
- [Data Flow Diagram](#data-flow-diagram)
- [Brand & Colour System](#brand--colour-system)
- [Tech Stack](#tech-stack)
- [Build Sequence](#build-sequence)
- [Environment Variables](#environment-variables)

---

## Problem Statement

> Why PRAGMA exists

Prediction markets and on-chain trading remain **inaccessible to non-technical users** due to:

- Complex interfaces requiring manual order execution
- Constant market monitoring (24/7 attention required)
- Inability to process real-time data at profitable speeds
- No one-click solution for autonomous trading

**Result:** Casual traders miss opportunities, make emotional decisions, and lack the time/skill to compete with sophisticated traders.

---

## Solution

> One-click autonomous AI trading agent

### What PRAGMA Does

PRAGMA is an **autonomous AI trading agent** that executes trades on DreamDEX (Somnia blockchain) without human intervention after a single "Activate Agent" click.

**Core Features:**

- `Event Contracts` — Binary Up/Down prediction markets (e.g. "Will BTC hit $65K by Friday?")
- `Spot Markets` — CLOB order book trading (ETH/USDC, BTC/USDC, etc.)
- `AI Decision Engine` — Groq API (Llama 3.3 70B) analyzes markets and decides trades in sub-second
- `Risk Management` — Stop-loss (-20%), take-profit (staged exits), daily loss limits
- `Live Dashboard` — Real-time P&L, positions, trade history, AI reasoning logs
- `Telegram Alerts` — Instant trade notifications + morning summaries + manual commands

### Core User

Crypto-curious individuals, casual traders, DeFi enthusiasts who want exposure to prediction markets but lack time/skill to trade manually. Comfortable connecting a wallet, need abstraction for strategy execution.

### Success Metric

**3-minute demo flow:** Connect wallet → Pick strategy → Activate agent → Agent reads markets → AI decides → Trade executes → Dashboard updates live → Telegram alert received → Position shows profit.

---

## System Architecture

> Full-stack topology

```
┌─────────────────────────────────────────────────────┐
│           USER (Browser)                            │
│  Next.js 15 Dashboard + Wallet Connection           │
└──────────────────┬──────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌───────────┐  ┌──────────────┐
│Supabase│  │  DreamDEX │  │  Agent Engine│
│(trades,│  │ WebSocket │  │ (TypeScript) │
│ state) │  │   + REST  │  │              │
└────────┘  └───────────┘  └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐    ┌─────────┐   ┌─────────┐
              │Groq API │    │DreamDEX │   │Telegram │
              │(AI brain│    │   SDK   │   │   Bot   │
              │ Llama)  │    │(execute)│   │(alerts) │
              └─────────┘    └─────────┘   └─────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Somnia Shannon Testnet   │
                    │ Chain ID: 50312          │
                    │ - Event Contract Markets │
                    │ - Spot Markets (CLOB)    │
                    └──────────────────────────┘
```

### Key Components

**Frontend (Next.js 15):** Dashboard UI, wallet connection, real-time updates via WebSocket subscriptions

**Agent Engine (Node.js server):** Runs every 60s, reads markets, asks AI for decision, executes trades, writes to Supabase, sends Telegram alerts

**Database (Supabase):** PostgreSQL tables for users, trades, agent_state, ai_decisions — with real-time subscriptions

**AI Layer:** Groq primary (sub-second), OpenRouter fallback (when rate limited)

**Blockchain:** Somnia Shannon Testnet — tUSDC collateral, STT gas, DreamDEX markets

---

## End-to-End User Flow

> 7 phases from wallet connection to payout

### Phase 1: Wallet Connection & Setup

1. User opens PRAGMA dashboard
2. Clicks "Connect Wallet" → MetaMask/Zerion connects to Somnia Shannon Testnet
3. Dashboard displays: wallet address, tUSDC balance, STT balance
4. User selects risk profile:
   - **Conservative:** 5% position size, -10% stop-loss, event contracts only
   - **Balanced:** 10% position size, -20% stop-loss, spot + event
   - **Aggressive:** 15% position size, -30% stop-loss, high-frequency
5. User sets trading budget (e.g. 50 tUSDC)
6. Clicks "Activate Agent" → engine starts

---

### Phase 2: Market Discovery & Analysis

**Agent engine (every 60 seconds):**

1. Fetch live markets via `loadMarkets()` from DreamDEX SDK
2. Filter: `isBinaryMarket()` for event contracts + spot markets with active order books
3. Stream real-time data via WebSocket: order book depth, trade feed, candles
4. Aggregate context: current odds, volume, spread, price momentum
5. Format as structured JSON for AI consumption

---

### Phase 3: AI Decision Making

**Input sent to Groq API (Llama 3.3 70B):**

```json
{
  "markets": [
    {
      "id": "BTC-65K-FRI",
      "type": "event_contract",
      "currentOdds": 0.67,
      "volume24h": 12500,
      "priceMomentum": "bullish"
    }
  ],
  "portfolio": {
    "budget": 50,
    "openPositions": 0,
    "dailyPnL": 0
  },
  "rules": {
    "maxPositionSize": 0.10,
    "stopLoss": -0.20,
    "takeProfit": [2.0, 5.0]
  }
}
```

**AI returns decision:**

```json
{
  "action": "BUY_EVENT_UP",
  "market": "BTC-65K-FRI",
  "size": 5,
  "entryPrice": 0.67,
  "confidence": 0.82,
  "rationale": "BTC showing bullish momentum..."
}
```

---

### Phase 4: Trade Execution

**Agent executes via DreamDEX SDK:**

```ts
await createOrder({
  market: "BTC-65K-FRI",
  side: "BUY",
  position: "UP",
  size: 5,  // 5 tUSDC
  price: 0.67
})
```

Transaction sent → Confirmed on Somnia → Position opened ✅

---

### Phase 5: State Persistence & Notification

1. **Write to Supabase:** Insert trade row (market, action, size, price, rationale) + update agent_state
2. **Send Telegram alert:** "🟢 TRADE EXECUTED | BUY BTC-65K-FRI UP | 5 tUSDC @ 0.67 | Confidence: 82%"
3. **Dashboard updates live:** WebSocket subscription triggers — trade history row appears, P&L chart updates, agent activity log shows new decision

---

### Phase 6: Settlement & Redemption

**When market expires:**

1. Agent monitors `MarketResolved` event via on-chain logs
2. Winning outcome determined (e.g. UP wins)
3. Agent claims: `mergePositions()` if needed → `claimPayout()`
4. tUSDC credited to agent wallet
5. Telegram: "🎉 MARKET RESOLVED | BTC-65K-FRI: UP WON | Profit: +$2.46 (+49% ROI)"
6. Dashboard: trade history updated with final P&L

---

### Phase 7: Continuous Loop

**Agent runs every 60 seconds until paused:**

- Check open positions for stop-loss / take-profit triggers
- Fetch latest market data
- AI evaluates new opportunities
- Execute trades if confidence > threshold
- Update state and notify
- Repeat ∞

---

## Data Flow Diagram

> How information moves through PRAGMA

```
┌─────────────────┐
│  DreamDEX API   │  WebSocket: live order book, trades, candles
│  (REST + WS)    │  REST: market discovery, historical data
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│           Agent Engine (TypeScript)              │
│  - Market reader: fetch + filter markets         │
│  - Decision requester: sends context to AI       │
│  - Trade executor: DreamDEX SDK → blockchain     │
│  - State writer: Supabase insert/update          │
│  - Alerter: Telegram bot send message            │
└──┬────────────┬─────────────┬──────────────┬────┘
   │            │             │              │
   ▼            ▼             ▼              ▼
┌──────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
│Groq  │  │Supabase │  │DreamDEX  │  │Telegram  │
│ API  │  │(Postgres│  │SDK→Chain │  │Bot API   │
│      │  │ + RT)   │  │          │  │          │
└──────┘  └────┬────┘  └────┬─────┘  └────┬─────┘
               │            │             │
               ▼            │             │
         ┌─────────────┐   │             │
         │  Dashboard  │◄──┘             │
         │  (Next.js)  │◄────────────────┘
         │  - P&L live │
         │  - Positions│
         │  - History  │
         │  - Activity │
         └─────────────┘
```

### Data Types & Sources

**Market Data (DreamDEX → Agent):** Order book depth, trade feed, candle data, probability shifts

**AI Decisions (Groq → Agent):** JSON: action, market, size, confidence, rationale

**Trade State (Agent → Supabase):** Trade rows, agent_state updates, ai_decisions log

**Notifications (Agent → Telegram):** Trade alerts, position updates, morning summaries

**Live Updates (Supabase → Dashboard):** WebSocket subscriptions push new trades, P&L changes

---

## Brand & Colour System

> 3 colours. Dual theme. Precision design.

### Brand Identity

- **Name:** PRAGMA
- **Tagline:** "Don't predict. Act."
- **Visual Tone:** Precision · Autonomous · Sharp
- **Voice:** Factual, confident, minimal. No hedging. Exact numbers. Short copy. Transparent logs.

---

### Core Palette (3 colours)

| Name          | Hex       | Role            |
|---------------|-----------|-----------------|
| Black         | `#000000` | Background      |
| Electric Blue | `#2563EB` | Accent / CTA    |
| White         | `#FFFFFF` | Text / Light BG |

### Supporting Shades

| Name         | Hex       | Role                    |
|--------------|-----------|-------------------------|
| Card Dark    | `#0A0A0A` | Card background (dark)  |
| Card Light   | `#F5F5F5` | Card background (light) |
| Border Dark  | `#1A1A1A` | Borders (dark theme)    |
| Border Light | `#E5E5E5` | Borders (light theme)   |
| Muted Text   | `#6B7280` | Secondary text          |
| Blue Hover   | `#1D4ED8` | Interactive hover state |

### Functional Colours (data only)

| Name         | Hex       | Role            |
|--------------|-----------|-----------------|
| Profit Green | `#22C55E` | Positive P&L    |
| Loss Red     | `#EF4444` | Negative P&L    |

---

### Typography

**Display / Headings:** Space Grotesk 700 (Google Fonts)

**Body / Data / UI:** Inter 400 / 500 (Google Fonts)

**Type Scale:**

| Token       | Size  | Font               | Usage                    |
|-------------|-------|--------------------|--------------------------|
| `display`   | 48px  | Space Grotesk 700  | Hero / landing           |
| `heading-lg`| 32px  | Space Grotesk 700  | Page titles              |
| `heading-md`| 24px  | Space Grotesk 700  | Section titles           |
| `heading-sm`| 18px  | Inter 500          | Card titles              |
| `body`      | 16px  | Inter 400          | Paragraphs               |
| `label`     | 13px  | Inter 500 uppercase| UI labels                |
| `mono-data` | 14px  | Inter 500 tabular  | P&L, prices              |

---

### CSS Custom Properties (`globals.css`)

```css
:root {
  --bg:           #000000;
  --bg-card:      #0A0A0A;
  --border:       #1A1A1A;
  --text:         #FFFFFF;
  --text-muted:   #6B7280;
  --accent:       #2563EB;
  --accent-hover: #1D4ED8;
  --profit:       #22C55E;
  --loss:         #EF4444;
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg:         #FFFFFF;
    --bg-card:    #F5F5F5;
    --border:     #E5E5E5;
    --text:       #000000;
  }
}

:root[data-theme="light"] {
  --bg:         #FFFFFF;
  --bg-card:    #F5F5F5;
  --border:     #E5E5E5;
  --text:       #000000;
}
```

---

### Usage Rules

1. **Blue is the only interactive colour.** Every button, link, toggle uses `#2563EB`.
2. **Never use blue for decorative text.** Blue = interactive only.
3. **Green and red are data, not brand.** P&L rows and status badges only.
4. **Blue stays the same in both themes.** Background and text flip — blue is the anchor.
5. **One blue hero per view.** Don't stack multiple blue elements competing for attention.

---

## Tech Stack

> Every dependency and its role

| Layer      | Technology                  | Purpose                                          |
|------------|-----------------------------|--------------------------------------------------|
| Framework  | Next.js 15 + TypeScript     | App Router, server components, API routes        |
| Styling    | Tailwind CSS v4             | Utility-first responsive design                  |
| Animations | Framer Motion + GSAP        | Page transitions, micro-interactions, counters   |
| State      | Zustand                     | Client-side reactive state (agent + trades)      |
| Web3       | Wagmi v2 + Viem             | Wallet connection, contract reads/writes         |
| DreamDEX   | @somnia-chain/markets-sdk   | Market data, order placement, settlement         |
| AI Primary | Groq API (Llama 3.3 70B)   | Sub-second trading decisions                     |
| AI Fallback| OpenRouter (free models)    | Secondary analysis when Groq rate limits         |
| Database   | Supabase (PostgreSQL)       | User data, trades, agent state, real-time subs   |
| Telegram   | Telegraf                    | Bot alerts and commands                          |
| Validation | Zod                         | AI response schema validation                    |
| Blockchain | Somnia Shannon Testnet      | Chain ID 50312, EVM-compatible L1                |
| Collateral | tUSDC                       | Testnet stablecoin for trading                   |
| Gas        | STT                         | Testnet gas token                                |

---

## Build Sequence

> 7 checkpoints from setup to submission

### `Checkpoint 0` — Pre-Build: Environment Setup  ✅ COMPLETE

- **0.1** Install dependencies (zustand, wagmi, viem, SDK, groq-sdk, openai, supabase, telegraf, zod)
- **0.2** Create `.env.local` with all API keys
- **0.3** Wire Tailwind design tokens in `globals.css`

---

### `Checkpoint 1` — UI Shell

- **1.1** Root layout — fonts, providers, global structure
- **1.2** Landing page — PRAGMA hero, tagline, CTA
- **1.3** Setup page — wallet connect + strategy selector + budget input
- **1.4** Dashboard page — layout grid (stats, positions, history, activity)
- **1.5** Shared components — Button, Card, Badge, StatTile

**Goal:** Visible skeleton, all pages exist and navigate

---

### `Checkpoint 2` — Data Connections

- **2.1** Wagmi config — Somnia Shannon chain
- **2.2** Wallet connect button — MetaMask/Zerion
- **2.3** tUSDC balance display
- **2.4** DreamDEX REST client
- **2.5** API route `/api/markets`
- **2.6** Zustand stores (agentStore, tradeStore)
- **2.7** Supabase client + schema (users, trades, agent_state, ai_decisions)
- **2.8** `useTrades` hook with real-time subscriptions

**Goal:** Dashboard reads live data but agent doesn't trade yet

---

### `Checkpoint 3` — Agent Core — ⚠️ MINIMUM VIABLE DEMO

- **3.1** DreamDEX SDK initialization
- **3.2** Strategy presets (conservative/balanced/aggressive)
- **3.3** AI decision layer (Groq API + Zod validation)
- **3.4** Risk manager (stop-loss, take-profit, daily limits)
- **3.5** Trade execution (`placeEventOrder`, `placeSpotOrder`)
- **3.6** Settlement (`claimPayout`, `mergePositions`)
- **3.7** Agent engine main loop (60s tick)
- **3.8** API routes (`/api/agent/start`, `/stop`, `/status`)
- **3.9** "Activate Agent" button wired

**Goal:** 🔴 **WORKING END-TO-END DEMO** — agent reads markets → AI decides → trade executes → Supabase updated. This is the fallback if time runs short.

---

### `Checkpoint 4` — Live Dashboard

- **4.1** WebSocket market data hook
- **4.2** Live P&L stat tiles
- **4.3** Open positions panel
- **4.4** Trade history table (real-time updates)
- **4.5** Agent activity log (last 10 AI decisions)
- **4.6** Agent controls (pause / resume)

**Goal:** Dashboard shows everything live as agent trades

---

### `Checkpoint 5` — Telegram Bot

- **5.1** Bot setup + commands (`/status`, `/positions`, `/pnl`, `/pause`, `/resume`)
- **5.2** Alert formatters (trade execution, position update, market resolved)
- **5.3** Webhook/polling API route
- **5.4** Morning summary cron job

**Goal:** User gets instant Telegram alerts for every trade

---

### `Checkpoint 6` — Polish

- **6.1** Framer Motion page transitions
- **6.2** GSAP number counters (P&L animations)
- **6.3** Agent pulse indicator
- **6.4** Empty states (no trades yet, no positions)
- **6.5** Responsive check (mobile + tablet)
- **6.6** Health check route (`/api/health`)
- **6.7** README update
- **6.8** `.env.example` file

**Goal:** Judge-ready quality

---

### `Checkpoint 7` — Demo & Submission

- **7.1** Demo path rehearsal (3-minute flow)
- **7.2** Record demo video
- **7.3** Push to GitHub
- **7.4** Submit before Sep 8 deadline

**Deadline: 🔴 Sep 8, 2026**

---

## Environment Variables

> Complete `.env.local` reference

```bash
# DreamDEX (public — safe to expose)
NEXT_PUBLIC_DREAMDEX_REST_URL=https://stg.api.dreamdex.io/v0
NEXT_PUBLIC_DREAMDEX_WS_URL=wss://stg.api.dreamdex.io/v0/ws/public
NEXT_PUBLIC_DREAMDEX_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312

# AI Models (server only)
GROQ_API_KEY=                      # console.groq.com
OPENROUTER_API_KEY=                # openrouter.ai

# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # project settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # project settings → API
SUPABASE_SERVICE_ROLE_KEY=         # project settings → API (server only)

# Telegram
TELEGRAM_BOT_TOKEN=                # @BotFather → /newbot
TELEGRAM_CHAT_ID=                  # @userinfobot → id field

# Agent Wallet (server only — NEVER NEXT_PUBLIC_)
AGENT_PRIVATE_KEY=                 # testnet wallet private key
AGENT_PUBLIC_KEY=                  # testnet wallet public address
```

### Where to Get Keys

- **Groq API:** [console.groq.com](https://console.groq.com) → API Keys → Create key (free tier)
- **OpenRouter:** [openrouter.ai](https://openrouter.ai) → Keys → Create key (free tier)
- **Supabase:** [supabase.com](https://supabase.com) → New Project → Settings → API (3 keys)
- **Telegram Bot:** Message `@BotFather` on Telegram → `/newbot` → copy token
- **Telegram Chat ID:** Message `@userinfobot` → copy `Id` field
- **Agent Wallet:** Create fresh wallet in MetaMask/Zerion → export private key (**NEVER your main wallet**)
- **Fund Agent Wallet:** [faucet.somnia.network](https://faucet.somnia.network) → request STT (gas) + get tUSDC from DreamDEX testnet UI
