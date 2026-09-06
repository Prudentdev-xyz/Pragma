# PRAGMA — Build Guide
> Stage 6 of 10 · Ordered task list from zero to demo-ready submission

---

## How to Use This Guide

- Work through tasks **in order** — each checkpoint builds on the last
- A working end-to-end flow exists at **Checkpoint 3** — that's your fallback demo state if time runs out
- Mark each task ✅ when done — don't move to the next block until the current one passes its test
- **Never add features after Checkpoint 4** — polish only from that point forward

---

## Pre-Build: Environment Setup
> Do this before writing a single line of app code.

### Task 0.1 — Install missing dependencies
```bash
cd /home/prudent/Documents/pragma

# State management
npm install zustand

# Wallet + Web3
npm install wagmi viem @tanstack/react-query

# DreamDEX SDK
npm install @somnia-chain/markets-sdk

# AI
npm install groq-sdk openai   # openai package works for OpenRouter too

# Database
npm install @supabase/supabase-js

# Telegram bot
npm install telegraf

# Utilities
npm install zod               # JSON schema validation for AI responses
```

**Test:** `npm run dev` — project boots at localhost:3000 with no errors. ✅

---

### Task 0.2 — Create `.env.local`
Create `/home/prudent/Documents/pragma/.env.local`:
```env
# DreamDEX (public — safe to expose)
NEXT_PUBLIC_DREAMDEX_REST_URL=https://stg.api.dreamdex.io/v0
NEXT_PUBLIC_DREAMDEX_WS_URL=wss://stg.api.dreamdex.io/v0/ws/public
NEXT_PUBLIC_DREAMDEX_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312

# AI Models
GROQ_API_KEY=                      # get free at console.groq.com
OPENROUTER_API_KEY=                # get free at openrouter.ai

# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # from supabase.com project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # from supabase.com project settings
SUPABASE_SERVICE_ROLE_KEY=         # from supabase.com project settings (server only)

# Telegram
TELEGRAM_BOT_TOKEN=                # from @BotFather on Telegram
TELEGRAM_CHAT_ID=                  # your personal chat ID

# Agent Wallet (never expose — server only, never NEXT_PUBLIC_)
AGENT_PRIVATE_KEY=                 # testnet wallet private key
AGENT_PUBLIC_KEY=                  # testnet wallet public address
```

**Test:** All keys are present. `AGENT_PRIVATE_KEY` has no `NEXT_PUBLIC_` prefix. ✅

---

### Task 0.3 — Wire Tailwind design tokens (Brand & Colour)
Edit `src/app/globals.css` — replace default styles with:
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500&display=swap');
@import "tailwindcss";

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

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
}
```

**Test:** page background is black, no white flash on load. ✅

---

## CHECKPOINT 1 — UI Shell
> Goal: A visually correct, navigable app with no broken pages.

---

### Task 1.1 — Root layout: fonts + providers
**File:** `src/app/layout.tsx`

- Import `Space Grotesk` + `Inter` from `next/font/google`
- Wrap children in a `<WagmiProvider>` + `<QueryClientProvider>` (Wagmi + TanStack Query)
- Set `<html>` dark background (`className="bg-[#000000]"`) to prevent white flash
- Add `<meta name="description">` for PRAGMA

```tsx
// src/app/layout.tsx — skeleton shape
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg)] text-[var(--text)]`}>
        <Providers>          {/* wagmi + query client */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Test:** app loads, no console errors, fonts render correctly. ✅

---

### Task 1.2 — Landing page (`/`)
**File:** `src/app/page.tsx`

Replace the default Next.js template with PRAGMA's landing page:
- Wordmark: `PRAGMA.` in Space Grotesk 700
- Tagline: `"Don't predict. Act."` in Inter muted
- One hero CTA button: `"Launch App"` → links to `/setup`
- Subtle animated background (CSS only — a slow‑pulsing blue radial glow at `#2563EB` 8% opacity)
- Footer: `"Built on Somnia Shannon Testnet · DreamDEX Event Contracts"`

**Test:** page renders, CTA navigates to `/setup`. ✅

---

### Task 1.3 — Setup page (`/setup`)
**File:** `src/app/setup/page.tsx`

Three‑step UI (no logic yet — just the layout):
1. **Connect Wallet** — button, placeholder for address display
2. **Select Strategy** — 3 cards: Conservative / Balanced / Aggressive, each showing position size %, stop-loss %, and market types
3. **Set Budget** — number input (tUSDC), "Activate Agent" button (disabled for now)

**Test:** all three steps visible, layout correct on desktop. ✅

---

### Task 1.4 — Dashboard page (`/dashboard`)
**File:** `src/app/dashboard/page.tsx`

Build the layout grid — empty panels with correct labels and borders, no live data yet:

```
┌─────────────────────────────────────────────────┐
│  PRAGMA.          [Agent: ACTIVE ●]   [Wallet]  │
├──────────────┬──────────────┬────────────────────┤
│  Total P&L   │  Open Pos.   │  Win Rate          │
│  +$0.00      │  0           │  0%                │
├──────────────┴──────────────┴────────────────────┤
│  P&L Chart (placeholder)                        │
├─────────────────────────┬───────────────────────┤
│  Open Positions         │  Agent Activity Log   │
│  (empty state)          │  (empty state)        │
├─────────────────────────┴───────────────────────┤
│  Trade History Table (empty state)              │
└─────────────────────────────────────────────────┘
```

**Test:** dashboard layout renders correctly at 1280px wide, no overflow. ✅

---

### Task 1.5 — Shared UI components
**Directory:** `src/components/ui/`

Build these four primitives — used everywhere:

| Component | File | Description |
|-----------|------|-------------|
| `Button`  | `button.tsx` | `variant: primary \| secondary \| ghost`, `size: sm \| md \| lg` |
| `Card`    | `card.tsx`   | `bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5` |
| `Badge`   | `badge.tsx`  | `variant: profit \| loss \| neutral \| active` — coloured pill |
| `StatTile`| `stat-tile.tsx` | Label + large number, optional `profit`/`loss` colour on value |

**Test:** storybook-style — temporarily render all four in `page.tsx` side-by-side and confirm visual output. Remove test render when done. ✅

---

**✅ CHECKPOINT 1 DONE — App shell is complete, styled, navigable.**

---

## CHECKPOINT 2 — Data Connections
> Goal: Real data flows into the UI. No trading yet.

---

### Task 2.1 — Wagmi config: Somnia Shannon Testnet
**File:** `src/lib/wagmi.ts`

```ts
import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

export const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Shannon Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [somniaShannon],
  transports: { [somniaShannon.id]: http() },
})
```

**Test:** `config` exports without error. ✅

---

### Task 2.2 — Wallet connect button
**File:** `src/components/wallet/ConnectButton.tsx`

- Use Wagmi's `useConnect` / `useAccount` / `useDisconnect`
- Shows: `"Connect Wallet"` when disconnected
- Shows: truncated address (`0x1234...abcd`) + `"Disconnect"` when connected
- On connect: prompt MetaMask to switch to chain ID 50312 (`wallet_switchEthereumChain`)

**Test:** connect MetaMask → address appears → disconnect → button resets. ✅

---

### Task 2.3 — tUSDC balance display
**File:** `src/components/wallet/BalanceDisplay.tsx`

- Use Wagmi's `useBalance` to read tUSDC token balance for connected wallet
  - tUSDC contract address: get from DreamDEX docs or starter template
- Display: `"Balance: 100.00 tUSDC"` under wallet address
- Use `font-variant-numeric: tabular-nums` on the number

**Test:** balance updates after wallet connect on Shannon Testnet. ✅

---

### Task 2.4 — DreamDEX REST client
**File:** `src/lib/dreamdex/client.ts`

```ts
// Thin wrapper around the REST API
export const DREAMDEX_REST = process.env.NEXT_PUBLIC_DREAMDEX_REST_URL

export async function fetchMarkets() {
  const res = await fetch(`${DREAMDEX_REST}/markets`)
  if (!res.ok) throw new Error(`DreamDEX markets fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchOrderBook(marketId: string) {
  const res = await fetch(`${DREAMDEX_REST}/orderbook/${marketId}`)
  if (!res.ok) throw new Error(`Order book fetch failed: ${res.status}`)
  return res.json()
}
```

**File:** `src/lib/dreamdex/markets.ts`
```ts
// Parse markets from REST response, separate spot vs event contracts
export function parseMarkets(raw: unknown[]) { ... }
export function isEventContract(market: Market): boolean { ... }
```

**Test:** `fetchMarkets()` in a browser console returns a non-empty array. ✅

---

### Task 2.5 — Next.js API route: `/api/markets`
**File:** `src/app/api/markets/route.ts`

```ts
import { fetchMarkets } from '@/lib/dreamdex/client'

export async function GET() {
  const markets = await fetchMarkets()
  return Response.json(markets)
}
```

**Test:** `curl http://localhost:3000/api/markets` returns market data. ✅

---

### Task 2.6 — Zustand stores
**File:** `src/store/agentStore.ts`
```ts
// Stores: isActive, strategy, budget, openPositions, dailyPnL, totalPnL
```

**File:** `src/store/tradeStore.ts`
```ts
// Stores: trades[], decisions[]
// Actions: addTrade(), addDecision(), clearAll()
```

**Test:** stores initialise with correct default values, actions update state. ✅

---

### Task 2.7 — Supabase client + schema
**File:** `src/lib/db/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Run the SQL schema from `docs/ARCHITECTURE.md` section 5 in the Supabase SQL editor to create all four tables:
- `users`
- `trades`
- `agent_state`
- `ai_decisions`

**File:** `src/lib/db/trades.ts`
```ts
export async function insertTrade(trade: TradeInsert) { ... }
export async function getTradesForUser(walletAddress: string) { ... }
export async function updateTradeOutcome(id: string, exitPrice: number, pnl: number) { ... }
```

**File:** `src/lib/db/agent.ts`
```ts
export async function upsertUser(walletAddress: string, strategy: string) { ... }
export async function getAgentState(walletAddress: string) { ... }
export async function updateAgentState(walletAddress: string, state: Partial<AgentState>) { ... }
```

**Test:** insert a test row via `insertTrade()`, confirm it appears in Supabase dashboard. ✅

---

### Task 2.8 — `useTrades` hook: live trade history
**File:** `src/hooks/useTrades.ts`

```ts
// 1. On mount: load trade history from Supabase for connected wallet
// 2. Subscribe to Supabase real-time channel on `trades` table
// 3. On new insert: add to Zustand tradeStore
// Returns: { trades, isLoading }
```

Wire `TradeHistory` component to this hook — table populates from Supabase. ✅

---

**✅ CHECKPOINT 2 DONE — Real market data loads. Wallet connects. Supabase wired.**

---

## CHECKPOINT 3 — The Agent (Core Flow Working)
> Goal: Agent executes at least one real trade end-to-end after "Activate Agent" is clicked.
> **This is the minimum viable demo state.**

---

### Task 3.1 — DreamDEX SDK initialisation
**File:** `src/lib/dreamdex/client.ts` (extend)

```ts
import { createClient } from '@somnia-chain/markets-sdk'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaShannon } from '@/lib/wagmi'

export function initSDK() {
  const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: somniaShannon,
    transport: http(process.env.NEXT_PUBLIC_DREAMDEX_RPC_URL),
  })
  return createClient({ walletClient })
}
```

**Test:** `initSDK()` returns a client without error. Call `client.loadMarkets()` — confirm markets return. ✅

---

### Task 3.2 — Strategy presets
**File:** `src/lib/strategy/presets.ts`

```ts
export const STRATEGIES = {
  conservative: {
    maxPositionPct: 0.05,    // 5% of budget per trade
    stopLossPct:   -0.10,    // exit at -10%
    takeProfitAt:  [2.0, 5.0],
    marketsAllowed: ['event_contract'],
    dailyLossLimitPct: 0.05,
  },
  balanced: {
    maxPositionPct: 0.10,
    stopLossPct:   -0.20,
    takeProfitAt:  [2.0, 5.0, 10.0],
    marketsAllowed: ['spot', 'event_contract'],
    dailyLossLimitPct: 0.10,
  },
  aggressive: {
    maxPositionPct: 0.15,
    stopLossPct:   -0.30,
    takeProfitAt:  [1.5, 3.0, 10.0],
    marketsAllowed: ['spot', 'event_contract'],
    dailyLossLimitPct: 0.15,
  },
} as const

export type StrategyKey = keyof typeof STRATEGIES
```

**Test:** import and log each preset — values match spec. ✅

---

### Task 3.3 — AI decision layer (Groq primary)
**File:** `src/lib/ai/prompts.ts`
```ts
export const TRADING_SYSTEM_PROMPT = `You are PRAGMA, an autonomous trading agent...
You always respond with valid JSON only. Never add explanation outside the JSON object.
Decision schema:
{
  "action": "BUY_EVENT_UP" | "BUY_EVENT_DOWN" | "BUY_SPOT" | "SELL_SPOT" | "HOLD" | "EXIT",
  "market": "<market_id or null>",
  "size": <number — tUSDC>,
  "entryPrice": <number or null>,
  "confidence": <0.0–1.0>,
  "rationale": "<1–2 sentences max>"
}`
```

**File:** `src/lib/ai/groq.ts`
```ts
import Groq from 'groq-sdk'
import { z } from 'zod'
import { TRADING_SYSTEM_PROMPT } from './prompts'

const DecisionSchema = z.object({
  action: z.enum(['BUY_EVENT_UP','BUY_EVENT_DOWN','BUY_SPOT','SELL_SPOT','HOLD','EXIT']),
  market: z.string().nullable(),
  size: z.number(),
  entryPrice: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
})

export type TradeDecision = z.infer<typeof DecisionSchema>

export async function getTradeDecision(marketContext: object): Promise<TradeDecision> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: TRADING_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(marketContext) },
    ],
    temperature: 0.2,   // low temp = more consistent JSON output
    max_tokens: 300,
  })
  const raw = completion.choices[0].message.content ?? ''
  return DecisionSchema.parse(JSON.parse(raw))
}
```

**File:** `src/lib/ai/openrouter.ts` — same shape as `groq.ts`, different base URL + model string. Acts as fallback when Groq throws.

**File:** `src/lib/ai/parser.ts`
```ts
// Wraps getTradeDecision — tries Groq first, falls back to OpenRouter on error
export async function decide(marketContext: object): Promise<TradeDecision> {
  try {
    return await getTradeDecision(marketContext)
  } catch {
    return await getTradeDecisionOpenRouter(marketContext)
  }
}
```

**Test:** call `decide()` with a sample market context object, confirm a valid `TradeDecision` returns. ✅

---

### Task 3.4 — Risk manager
**File:** `src/lib/strategy/risk.ts`

```ts
export function isOverDailyLossLimit(dailyPnL: number, budget: number, strategy: Strategy): boolean
export function isStopLoss(entryPrice: number, currentPrice: number, strategy: Strategy): boolean
export function isTakeProfit(entryPrice: number, currentPrice: number, strategy: Strategy): boolean
export function calcPositionSize(budget: number, strategy: Strategy): number
  // returns: Math.min(budget * strategy.maxPositionPct, budget * 0.15)
```

**Test:** unit-test each function with edge-case inputs (zero budget, exact threshold, negative PnL). ✅

---

### Task 3.5 — Trade execution
**File:** `src/lib/dreamdex/orders.ts`

```ts
import { initSDK } from './client'

// Place an event contract (Up/Down) position
export async function placeEventOrder(params: {
  marketId: string
  side: 'up' | 'down'
  size: number       // tUSDC
  price: number      // 0–1 probability
}): Promise<{ txHash: string; orderId: string }> {
  const client = initSDK()
  // Use SDK createOrder() — refer to @somnia-chain/markets-sdk docs
  const order = await client.createOrder({ ... })
  return { txHash: order.txHash, orderId: order.id }
}

// Place a spot buy/sell order
export async function placeSpotOrder(params: {
  marketId: string
  side: 'buy' | 'sell'
  size: number
  price: number
  type: 'limit' | 'ioc'
}): Promise<{ txHash: string; orderId: string }> { ... }

// Exit / cancel an open position
export async function exitPosition(orderId: string): Promise<{ txHash: string }> { ... }
```

**⚠️ De-risk step:** Test `placeEventOrder()` on Shannon Testnet with 1 tUSDC before wiring into the agent loop. Confirm tx appears on the explorer. ✅

---

### Task 3.6 — Settlement
**File:** `src/lib/dreamdex/settlement.ts`

```ts
// Poll for resolved markets every 60s
// When MarketResolved event detected → call claimPayout()
export async function claimSettlement(marketId: string, walletAddress: string): Promise<number>
  // returns amount of tUSDC claimed
```

**Test:** manually trigger `claimSettlement()` on a resolved market. ✅

---

### Task 3.7 — Agent engine (the main loop)
**File:** `src/lib/agent/engine.ts`

This is the heart of PRAGMA. It runs every 60 seconds.

```ts
export class AgentEngine {
  private running = false
  private intervalId: NodeJS.Timeout | null = null

  async start(walletAddress: string, strategy: StrategyKey, budget: number) {
    this.running = true
    await this.tick(walletAddress, strategy, budget)
    this.intervalId = setInterval(() => this.tick(...), 60_000)
  }

  pause()  { this.running = false }
  resume() { this.running = true  }
  stop()   { clearInterval(this.intervalId!); this.running = false }

  private async tick(walletAddress: string, strategy: StrategyKey, budget: number) {
    if (!this.running) return

    // 1. Load current agent state from Supabase
    const state = await getAgentState(walletAddress)

    // 2. Check daily loss limit — halt if exceeded
    if (isOverDailyLossLimit(state.dailyPnL, budget, STRATEGIES[strategy])) return

    // 3. Check open positions for stop-loss / take-profit triggers
    for (const pos of state.openPositions) {
      if (isStopLoss(pos.entryPrice, pos.currentPrice, STRATEGIES[strategy])) {
        await exitPosition(pos.orderId)
        await insertTrade({ ...pos, action: 'EXIT', pnl: calcPnL(pos) })
        await sendTelegramAlert(formatExitAlert(pos))
      }
    }

    // 4. Fetch market data
    const markets = await fetchMarkets()
    const context = buildMarketContext(markets, state, STRATEGIES[strategy])

    // 5. Ask AI for decision
    const decision = await decide(context)

    // 6. Log decision to Supabase + Zustand
    await insertDecision({ walletAddress, ...decision })

    // 7. Execute trade if confidence above threshold
    if (decision.confidence >= 0.65 && decision.action !== 'HOLD') {
      const result = decision.action.startsWith('BUY_EVENT')
        ? await placeEventOrder({ ... })
        : await placeSpotOrder({ ... })

      // 8. Save trade to Supabase
      await insertTrade({
        walletAddress,
        marketId: decision.market!,
        action: decision.action,
        size: decision.size,
        entryPrice: decision.entryPrice!,
        aiConfidence: decision.confidence,
        aiRationale: decision.rationale,
        txHash: result.txHash,
      })

      // 9. Send Telegram alert
      await sendTelegramAlert(formatTradeAlert(decision, result))
    }

    // 10. Update agent state in Supabase
    await updateAgentState(walletAddress, { lastTickAt: new Date() })
  }
}

export const agent = new AgentEngine()  // singleton
```

**Test:** call `agent.start(...)` manually in a test script, watch for one full tick to complete without errors. A trade should appear in Supabase. ✅

---

### Task 3.8 — API routes: agent control
**File:** `src/app/api/agent/start/route.ts`
```ts
export async function POST(req: Request) {
  const { walletAddress, strategy, budget } = await req.json()
  await upsertUser(walletAddress, strategy)
  agent.start(walletAddress, strategy, budget)
  return Response.json({ status: 'started' })
}
```

**File:** `src/app/api/agent/stop/route.ts`
```ts
export async function POST() {
  agent.pause()
  return Response.json({ status: 'paused' })
}
```

**File:** `src/app/api/agent/status/route.ts`
```ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get('wallet')!
  const state = await getAgentState(wallet)
  return Response.json(state)
}
```

**Test:** POST to `/api/agent/start` → agent begins ticking. POST to `/api/agent/stop` → agent halts. ✅

---

### Task 3.9 — "Activate Agent" button wired to API
**File:** `src/app/setup/page.tsx` (update)

- On "Activate Agent" click: POST to `/api/agent/start` with wallet, strategy, budget
- On success: `router.push('/dashboard')`
- Show loading state during request

**Test:** click "Activate Agent" → redirects to dashboard → agent ticks in background. ✅

---

**✅ CHECKPOINT 3 DONE — End-to-end flow works. Agent trades autonomously. This is your fallback demo state.**

---

## CHECKPOINT 4 — Live Dashboard
> Goal: Dashboard shows real data in real time.

---

### Task 4.1 — Live market data WebSocket hook
**File:** `src/hooks/useMarkets.ts`

```ts
// Connects to wss://stg.api.dreamdex.io/v0/ws/public
// Subscribes to: orderbook, trades, candles for active markets
// Implements: reconnect with exponential backoff (base 1s, max 30s)
// Updates: Zustand market store on every message
// Returns: { markets, isConnected, lastUpdate }
```

**Test:** hook connects, data updates appear in console every few seconds. ✅

---

### Task 4.2 — P&L stat tiles (live)
**File:** `src/components/dashboard/PnLStats.tsx`

Wire the `StatTile` components to Zustand `agentStore`:
- Total P&L — colour `profit` if positive, `loss` if negative
- Open Positions count
- Win Rate — `(closedWins / totalClosedTrades) * 100`%
- Daily P&L

**Test:** open a position manually → stat tiles update without page refresh. ✅

---

### Task 4.3 — Open positions panel (live)
**File:** `src/components/dashboard/PositionsPanel.tsx`

For each open position in `agentStore.openPositions`:
```
[Market ID]   [Side: UP/DOWN/BUY/SELL]   [Size]   [Entry]   [Current]   [Unrealised P&L]
```
- Unrealised P&L: green if positive, red if negative
- Empty state: `"No open positions"` with muted text

**Test:** agent opens a position → appears in panel immediately. ✅

---

### Task 4.4 — Trade history table (live)
**File:** `src/components/dashboard/TradeHistory.tsx`

Columns: `Time · Market · Action · Size · Entry · Exit · P&L · AI Rationale`

- Reads from `useTrades` hook (Supabase real-time)
- P&L column: green/red coloured number
- "AI Rationale" column: truncated to 60 chars, hover tooltip for full text
- Sortable by time (default: newest first)
- `font-variant-numeric: tabular-nums` on all number columns

**Test:** trade executes → row appears in table within 2 seconds. ✅

---

### Task 4.5 — Agent activity log (live)
**File:** `src/components/dashboard/AgentActivity.tsx`

Real-time feed of AI decisions — last 10 entries:
```
[HH:MM:SS]  [Market]  [Action]  [Confidence: 82%]  [Rationale text...]
```
- Newest decision at top
- `HOLD` decisions shown in muted text
- Executed decisions shown in full white

**Test:** agent tick fires → new decision appears at top of log. ✅

---

### Task 4.6 — Agent controls panel (live)
**File:** `src/components/dashboard/AgentControls.tsx`

```
Status: ● ACTIVE    [Pause]   [Stop]
Strategy: Balanced              Budget: 100 tUSDC
```
- Pulse animation on `●` when active (use CSS animation, not JS)
- "Pause" → POST `/api/agent/stop` → button text changes to "Resume"
- "Resume" → POST `/api/agent/start`
- "Stop" → POST `/api/agent/stop` + redirect to `/setup`

**Test:** pause → activity log stops updating → resume → log resumes. ✅

---

**✅ CHECKPOINT 4 DONE — Dashboard is live and reactive. Everything real-time.**

---

## CHECKPOINT 5 — Telegram Bot
> Goal: Trade alerts delivered. /status command works.

---

### Task 5.1 — Bot setup
**File:** `src/lib/telegram/bot.ts`

```ts
import { Telegraf } from 'telegraf'

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

bot.command('status', async (ctx) => {
  const state = await getAgentState(process.env.AGENT_PUBLIC_KEY!)
  await ctx.reply(formatStatusMessage(state))
})

bot.command('positions', async (ctx) => {
  const state = await getAgentState(process.env.AGENT_PUBLIC_KEY!)
  await ctx.reply(formatPositionsMessage(state.openPositions))
})

bot.command('pnl', async (ctx) => {
  const state = await getAgentState(process.env.AGENT_PUBLIC_KEY!)
  await ctx.reply(`📊 P&L\nToday: ${state.dailyPnL}\nTotal: ${state.totalPnL}`)
})

bot.command('pause',  async (ctx) => { agent.pause();  await ctx.reply('⏸ Agent paused.') })
bot.command('resume', async (ctx) => { agent.resume(); await ctx.reply('▶️ Agent resumed.') })
```

---

### Task 5.2 — Alert formatters
**File:** `src/lib/telegram/alerts.ts`

```ts
export function formatTradeAlert(decision: TradeDecision, result: { txHash: string }): string {
  return [
    `🤖 *PRAGMA Trade*`,
    `Action: ${decision.action}`,
    `Market: ${decision.market}`,
    `Size: ${decision.size} tUSDC`,
    `Entry: ${decision.entryPrice}`,
    `Confidence: ${(decision.confidence * 100).toFixed(0)}%`,
    `Reason: ${decision.rationale}`,
    `Tx: \`${result.txHash.slice(0, 10)}...\``,
  ].join('\n')
}

export function formatMorningSummary(state: AgentState, trades: Trade[]): string { ... }
```

---

### Task 5.3 — Bot webhook / polling API route
**File:** `src/app/api/telegram/route.ts`

```ts
// For local dev: long polling
// For production: webhook handler
export async function POST(req: Request) {
  const body = await req.json()
  await bot.handleUpdate(body)
  return new Response('ok')
}
```

Start polling in development:
```ts
// In agent engine start(), also trigger:
bot.launch()
```

**Test:** send `/status` to your bot on Telegram → formatted reply arrives within 2 seconds. ✅
**Test:** agent executes a trade → Telegram alert arrives. ✅

---

### Task 5.4 — Morning summary cron
**File:** `src/app/api/cron/morning-summary/route.ts`

```ts
// Trigger daily at 08:00 UTC via Vercel Cron (configure in vercel.json)
export async function GET() {
  const state = await getAgentState(process.env.AGENT_PUBLIC_KEY!)
  const trades = await getTradesForUser(process.env.AGENT_PUBLIC_KEY!)
  const summary = formatMorningSummary(state, trades)
  await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, summary)
  return new Response('ok')
}
```

**Test:** call the route manually → summary message arrives on Telegram. ✅

---

**✅ CHECKPOINT 5 DONE — Telegram fully integrated.**

---

## CHECKPOINT 6 — Polish & Demo Prep
> Goal: UI is judge-ready. Demo path is bulletproof.

---

### Task 6.1 — Framer Motion page transitions
Add subtle page-enter animations using Framer Motion:
- Landing → Setup: fade + slight upward slide (300ms)
- Setup → Dashboard: fade (200ms)
- Dashboard panels: staggered fade-in on mount (50ms per panel)

**Rule:** `prefers-reduced-motion` must disable all animations. ✅

---

### Task 6.2 — GSAP number counter on stat tiles
On P&L change: animate the number from old value to new value over 600ms using GSAP `gsap.to()`. Gives the dashboard a live trading terminal feel.

**Test:** P&L updates → number counts up/down smoothly. ✅

---

### Task 6.3 — Agent "pulse" indicator
The `● ACTIVE` status indicator on the dashboard header:
- Infinite CSS `box-shadow` pulse animation in `#2563EB`
- Stops pulsing (solid dot, muted colour) when agent is paused
- No JS needed — CSS `animation-play-state` toggle via a class

---

### Task 6.4 — Empty states on all panels
Every panel must have a thoughtful empty state — not a blank box:
- Open Positions: `"No active positions. Agent is scanning markets."`
- Trade History: `"No trades yet. Activate the agent to begin."`
- Activity Log: `"Waiting for first AI decision..."`

---

### Task 6.5 — Responsive check
Test the dashboard at:
- 1280px (desktop) — primary target
- 768px (tablet) — must be usable
- 375px (mobile) — must not break

Fix any overflow or clipping. ✅

---

### Task 6.6 — Health check route
**File:** `src/app/api/health/route.ts`
```ts
export async function GET() {
  const checks = {
    dreamdex: await pingDreamDEX(),     // fetch /markets, check 200
    supabase:  await pingSupabase(),    // select 1 from users
    groq:      await pingGroq(),        // short test completion
    telegram:  await pingTelegram(),    // getMe()
  }
  const healthy = Object.values(checks).every(Boolean)
  return Response.json(checks, { status: healthy ? 200 : 503 })
}
```

**Test:** `curl /api/health` → all four checks return `true`. ✅

---

### Task 6.7 — README
**File:** `/home/prudent/Documents/pragma/README.md` — replace the default with:

```md
# PRAGMA
> Autonomous AI Trading Agent for DreamDEX on Somnia Shannon Testnet
> "Don't predict. Act."

## What It Does
PRAGMA deploys an AI-powered autonomous agent that reads live DreamDEX markets,
analyses price action and event contract probabilities using Groq (Llama 3.3 70B),
and executes spot and prediction market trades without manual intervention.

## Quick Start
1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your keys
3. `npm install && npm run dev`
4. Open http://localhost:3000, connect wallet, activate agent

## Stack
Next.js 16 · TypeScript · Tailwind CSS · Wagmi/Viem · DreamDEX SDK
Groq (Llama 3.3 70B) · OpenRouter · Supabase · Telegraf · Framer Motion

## Network
Somnia Shannon Testnet · Chain ID 50312
Get STT gas tokens: https://t.me/+XHq0F0JXMyhmMzM0

## Environment Variables
See `.env.example` for all required variables.
```

---

### Task 6.8 — `.env.example` file
Copy `.env.local`, blank out all values, commit it:
```bash
cp .env.local .env.example
# then blank every value — leave the keys, remove the secrets
git add .env.example && git commit -m "add env example"
```

---

**✅ CHECKPOINT 6 DONE — Project is submission-ready.**

---

## CHECKPOINT 7 — Demo & Submission
> Goal: Recorded demo. Submitted on time.

---

### Task 7.1 — Demo path rehearsal
Run the exact 3-minute demo sequence 3 times from scratch before recording:

```
[1] Open dashboard at localhost:3000
[2] Connect MetaMask (Shannon Testnet, tUSDC balance visible)
[3] Select "Balanced" strategy
[4] Set budget: 50 tUSDC
[5] Click "Activate Agent"
[6] Watch agent discover markets → AI decision appears in activity log
[7] Trade executes → position appears in Open Positions panel
[8] Telegram alert arrives on phone (show screen)
[9] Trade reaches take-profit → closes → P&L updates → row in Trade History
[10] Show AI rationale in history table
```

**Test:** full sequence completes in under 3 minutes, zero crashes. ✅

---

### Task 7.2 — Record demo video
- Screen record at 1080p or higher
- Narrate each step live (no slides needed — show the app)
- Upload to Loom, YouTube (unlisted), or Google Drive
- Keep it to 2–3 minutes exactly

---

### Task 7.3 — Push final code to GitHub
```bash
git add -A
git commit -m "PRAGMA v1.0 — hackathon submission"
git push origin main
```

Confirm GitHub repo is **public** and the README renders correctly. ✅

---

### Task 7.4 — Submit
- Go to the hackathon submission form
- Submit: GitHub repo URL, demo video URL, team/solo info
- Do this **before** the September 8 deadline — not at the wire

---

**✅ CHECKPOINT 7 DONE — PRAGMA submitted.**

---

## Summary: Checkpoint Status Tracker

| Checkpoint | What It Means | Fallback Demo? |
|------------|---------------|----------------|
| ✅ 1 — UI Shell | App navigates, layouts correct | No |
| ✅ 2 — Data Connections | Real market data, wallet, Supabase | No |
| ✅ 3 — Agent Core | Full end-to-end trade executes | **YES** ← minimum demo |
| ✅ 4 — Live Dashboard | Real-time P&L, positions, history | Yes — strong demo |
| ✅ 5 — Telegram Bot | Alerts + commands working | Yes — full demo |
| ✅ 6 — Polish | Animations, responsive, README | Yes — judge-ready |
| ✅ 7 — Submission | Recorded, pushed, submitted | — |

---

## Key Contacts & Resources

| Resource | URL |
|----------|-----|
| DreamDEX Docs | https://docs.dreamdex.io/developers/event-contracts |
| Bot Kit (SDK examples) | https://github.com/somnia-chain/dreamdex-bot-kit |
| Starter Template | https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template |
| Get STT Tokens | https://t.me/+XHq0F0JXMyhmMzM0 |
| Groq Console (free) | https://console.groq.com |
| OpenRouter (free) | https://openrouter.ai |
| Supabase | https://supabase.com |

---

*Stage 6 complete. Next → Stage 7: Build / Development & Integration.*
