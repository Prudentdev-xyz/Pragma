# PRAGMA
> **Autonomous AI Trading Agent for DreamDEX on Somnia Shannon Testnet**  
> _"Don't predict. Act."_

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Network](https://img.shields.io/badge/Somnia_Shannon-Chain_50312-7928CA)](https://somnia.network/)
[![AI Engine](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange)](https://groq.com/)
[![Telegram](https://img.shields.io/badge/Telegram_Bot-@PragmaAgent_Bot-26A5E4?logo=telegram)](https://t.me/PragmaAgent_Bot)

---

## ⚡ Overview

**PRAGMA** is an autonomous trading agent designed specifically for **DreamDEX** on the **Somnia Shannon Testnet**. It bridges real-time on-chain prediction markets and decentralized spot markets with ultra-fast LLM reasoning.

Instead of human emotion or delayed manual trading, PRAGMA:
1. **Listens to Real-time Feeds:** Subscribes to DreamDEX public WebSockets and orderbooks for live prediction contracts and spot pairs.
2. **AI-Powered Probability Evaluation:** Feeds dynamic market contexts into Groq-hosted Llama-3.3-70B (with instant OpenRouter fallback) to generate actionable buy/sell signals with strict rationale.
3. **Rigorous Risk Engine:** Enforces daily loss limits, stop-loss triggers, take-profit limits, and maximum position sizing before any transaction is signed.
4. **On-Chain Settlement & Claims:** Tracks market resolution events and automatically redeems winnings on Somnia.
5. **Real-time Observability:** Features a Bloomberg-style dark terminal dashboard and a multi-subscriber Telegram Bot (**[@PragmaAgent_Bot](https://t.me/PragmaAgent_Bot)**) for live execution alerts and on-demand portfolio management.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript 5
- **Web3 & Wallet:** Wagmi v2, Viem, Somnia Shannon Testnet integration
- **DEX Engine:** DreamDEX SDK & Event Contracts
- **AI Models:** Groq (`llama-3.3-70b-versatile`) with OpenRouter fallback
- **Persistence & Realtime:** Supabase (PostgreSQL + Realtime replication)
- **Bot Operator:** Telegraf (Telegram Bot API) with interactive commands & subscriber broadcasting
- **Styling & UI:** Tailwind CSS, Framer Motion, Tabular-nums dark terminal styling

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-repo/pragma.git
cd pragma
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and populate your credentials:
```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_DREAMDEX_REST_URL` | DreamDEX API base (`https://stg.api.dreamdex.io/v0`) |
| `NEXT_PUBLIC_DREAMDEX_WS_URL` | DreamDEX Public WebSocket (`wss://stg.api.dreamdex.io/v0/ws/public`) |
| `GROQ_API_KEY` | Ultra-fast Groq inference key |
| `OPENROUTER_API_KEY` | Secondary fallback model key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase instance URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-side bypass key |
| `TELEGRAM_BOT_TOKEN` | Token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Default chat ID from [@userinfobot](https://t.me/userinfobot) |
| `AGENT_PRIVATE_KEY` | Operator wallet private key on Somnia Shannon Testnet |
| `AGENT_PUBLIC_KEY` | Matching public address |

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Telegram Bot Commands

Connect with **[@PragmaAgent_Bot](https://t.me/PragmaAgent_Bot)** on Telegram:

- `/status` — Live agent state, active risk posture, cycle counts, and recent log
- `/positions` — Open mark-to-market positions, entry prices, and current valuations
- `/pnl` — Today's and cumulative P&L breakdown
- `/pause` — Halts new trade executions instantly
- `/resume` — Resumes autonomous scanning loop
- `/subscribe` — Subscribes current chat/group to real-time trade execution alerts
- `/unsubscribe` — Mutes notifications
- `/help` — Displays command directory

---

## 🔍 Health Check & Diagnostics

PRAGMA provides an automated diagnostic endpoint for judges and operators:

```bash
curl http://localhost:3000/api/health
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-07T12:51:16.611Z",
  "checks": {
    "dreamdex": true,
    "supabase": true,
    "groq": true,
    "telegram": true
  }
}
```

---

## 🌐 Network Specifications

- **Network:** Somnia Shannon Testnet
- **Chain ID:** `50312`
- **Currency Symbol:** `STT`
- **RPC URL:** `https://dream-rpc.somnia.network`
- **Explorer:** `https://shannon-explorer.somnia.network`
- **Faucet:** [Somnia Community Faucet](https://t.me/+XHq0F0JXMyhmMzM0)

---

## 📄 License
MIT License. Built for the Somnia DreamDEX AI Hackathon 2026.
