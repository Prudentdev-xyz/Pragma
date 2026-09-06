# PRAGMA - System Architecture and Complete User Flow

---

## 1. Full-Stack Topology

```
========================================================================================
                              PRAGMA FULL-STACK TOPOLOGY
========================================================================================

    [ BROWSER CLIENT ]
    Next.js 15 (App Router) + TypeScript + Tailwind CSS + Wagmi / Viem
           |
           |-- 1. Dashboard Reads (Trade History, P&L, Agent State)
           |          |
           |          v
           |   [ SUPABASE (PostgreSQL) ]
           |   - User Profiles
           |   - Trade History
           |   - Agent State & Configuration
           |   - AI Decision Log
           |
           |-- 2. Real-Time Market Data (WebSocket)
           |          |
           |          v
           |   [ DREAMDEX SHANNON TESTNET ]
           |   - WebSocket: wss://stg.api.dreamdex.io/v0/ws/public
           |   - REST: https://stg.api.dreamdex.io/v0
           |   - RPC: https://dream-rpc.somnia.network
           |
           |-- 3. Direct On-Chain Transactions (Trade / Settle / Claim)
                                        |
                                        v
                        +-------------------------------+
                        |  SOMNIA SHANNON TESTNET (L1)  |
                        |  Chain ID: 50312              |
                        |                               |
                        |  +-------------------------+  |
                        |  |   Spot Markets (CLOB)    |  |
                        |  |   - Order Placement      |  |
                        |  |   - Order Cancellation   |  |
                        |  |   - Fill Matching        |  |
                        |  +-----------+-------------+  |
                        |              |                 |
                        |  +-----------v-------------+  |
                        |  |  Event Contract Markets  |  |
                        |  |   - Up/Down Positions    |  |
                        |  |   - Settlement Claims    |  |
                        |  |   - Payout Redemption    |  |
                        |  +-------------------------+  |
                        +-------------------------------+


    [ AGENT ENGINE (Backend - Runs on Server) ]
           |
           |-- Reads DreamDEX markets via SDK
           |-- Sends decisions to Groq API (AI brain)
           |-- Executes trades via Viem + SDK
           |-- Writes state to Supabase
           |-- Sends alerts via Telegram Bot API
```

---

## 2. Complete End-to-End User Flow

```
========================================================================================
                       END-TO-END PRAGMA LIFECYCLE FLOW
========================================================================================

  PHASE 1: WALLET CONNECTION & SETUP
  -----------------------------------
  [ User Opens PRAGMA Dashboard ]
       |
       +--> 1. Clicks "Connect Wallet"
       |      --> Wagmi/Viem detects MetaMask or compatible EVM wallet
       |      --> Wallet connects to Somnia Shannon Testnet (Chain ID 50312)
       |      --> Dashboard displays: wallet address, tUSDC balance, STT balance
       |
       +--> 2. Selects Risk Profile
       |      --> Conservative: 5% position size, -10% stop-loss, event contracts only
       |      --> Balanced: 10% position size, -20% stop-loss, spot + event contracts
       |      --> Aggressive: 15% position size, -30% stop-loss, high-frequency, spot + event
       |
       +--> 3. Sets Trading Budget
       |      --> User allocates tUSDC from wallet to agent
       |      --> Budget stored in Supabase with wallet address
       |
       +--> 4. Clicks "Activate Agent"
              --> Agent engine spins up for this wallet
              --> WebSocket connection to DreamDEX opens
              --> AI decision loop begins


  PHASE 2: MARKET DISCOVERY & ANALYSIS
  -------------------------------------
  [ PRAGMA Agent Engine ]
       |
       +--> Step A: Fetch Live Markets
       |      --> loadMarkets() via @somnia-chain/markets-sdk
       |      --> Filter: isBinaryMarket() for event contracts
       |      --> Identify spot markets with active order books
       |
       +--> Step B: Stream Real-Time Data
       |      --> WebSocket: order book depth updates
       |      --> WebSocket: trade feed (recent fills)
       |      --> WebSocket: candle data (price action)
       |
       +--> Step C: Aggregate Market Context
              --> Compile: current odds, volume, spread, price momentum
              --> Format as structured JSON for AI consumption


  PHASE 3: AI DECISION MAKING
  ----------------------------
  [ Groq API - Llama 3.3 70B ]
       |
       +--> Receives structured market context:
       |      {
       |        "markets": [
       |          {
       |            "id": "BTC-65K-FRI",
       |            "type": "event_contract",
       |            "currentOdds": 0.67,
       |            "volume24h": 12500,
       |            "spread": 0.03,
       |            "priceMomentum": "bullish"
       |          },
       |          ...
       |        ],
       |        "portfolio": {
       |          "budget": 100,
       |          "openPositions": 2,
       |          "dailyPnL": +5.30,
       |          "dailyLossLimit": 10
       |        },
       |        "rules": {
       |          "maxPositionSize": 0.10,
       |          "stopLoss": -0.20,
       |          "takeProfit": [2.0, 5.0, 10.0]
       |        }
       |      }
       |
       +--> AI Returns Decision:
              {
                "action": "BUY_EVENT_UP",
                "market": "BTC-65K-FRI",
                "size": 10,
                "entryPrice": 0.67,
                "confidence": 0.82,
                "rationale": "BTC showing bullish momentum.
                             Current odds underprice the
                             probability based on recent
                             price action and volume surge."
              }


  PHASE 4: TRADE EXECUTION
  -------------------------
  [ PRAGMA Agent Engine - Viem + SDK ]
       |
       +--> If Action is EVENT CONTRACT:
       |      --> createOrder() via SDK
       |      --> Order type: IOC (Immediate or Cancel)
       |      --> Side: BUY, Position: UP
       |      --> Size: 10 tUSDC at 0.67
       |      --> Transaction sent to Shannon Testnet
       |      --> Order matched on DreamDEX CLOB
       |      --> Position confirmed on-chain
       |
       +--> If Action is SPOT TRADE:
       |      --> createOrder() via SDK
       |      --> Buy or Sell based on AI decision
       |      --> Limit order at specified price
       |      --> Wait for fill or timeout
       |
       +--> If Action is EXIT:
              --> Check open positions for stop-loss / take-profit triggers
              --> Execute sell order to close position
              --> Claim settlement if market has resolved


  PHASE 5: STATE PERSISTENCE & NOTIFICATION
  ------------------------------------------
  [ Supabase + Telegram ]
       |
       +--> 1. Write Trade to Supabase
       |      --> market, action, size, price, timestamp, rationale
       |      --> Update agent state: positions, balance, daily P&L
       |
       +--> 2. Send Telegram Alert
       |      --> Format: trade details + current portfolio status
       |      --> Example: "BUY BTC-65K-FRI UP | 10 tUSDC @ 0.67 | Confidence: 82% | P&L today: +5.30"
       |
       +--> 3. Update Dashboard (Real-Time)
              --> WebSocket subscription to Supabase changes
              --> Trade history row appears instantly
              --> P&L chart updates
              --> Agent activity log shows new decision


  PHASE 6: SETTLEMENT & REDEMPTION
  --------------------------------
  [ Market Expiry on DreamDEX ]
       |
       +--> 1. Agent monitors market expiry via on-chain event logs
       |      --> MarketResolved event emitted
       |      --> Winning outcome determined
       |
       +--> 2. Agent claims winning positions
       |      --> mergePositions() if needed
       |      --> claimPayout() to redeem winning shares
       |      --> tUSDC credited to agent wallet
       |
       +--> 3. Dashboard and Telegram notified
              --> "MARKET RESOLVED: BTC-65K-FRI | Outcome: UP | Won: +8.3 tUSDC"
              --> Trade history updated with final P&L


  PHASE 7: CONTINUOUS LOOP
  -------------------------
  [ Agent Runs Every 60 Seconds ]
       |
       +--> Check open positions for exit triggers
       +--> Fetch latest market data
       +--> AI evaluates new opportunities
       +--> Execute trades if confidence > threshold
       +--> Update state and notify
       +--> Repeat until user pauses or budget depleted
```

---

## 3. Detailed Tech Stack Breakdown

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend Framework | Next.js 15 + React + TypeScript | Application shell with App Router, server components, and API routes. |
| Styling | Tailwind CSS | Utility-first responsive design with custom design tokens. |
| Animations | Framer Motion + GSAP | Page transitions, micro-interactions, and dashboard data animations. |
| Web3 Client | Wagmi v2 + Viem + TanStack Query | Type-safe wallet connection, contract reads/writes, and event listeners. |
| State Management | Zustand | Client-side reactive state for dashboard components without prop drilling. |
| Blockchain SDK | @somnia-chain/markets-sdk | Primary interface for DreamDEX spot and event contract interaction. |
| AI Primary | Groq API (Llama 3.3 70B Versatile) | Sub-second inference for real-time trading decisions. Free tier. |
| AI Fallback | OpenRouter (Free Models) | Secondary analysis and fallback when Groq rate limits are hit. |
| Database | Supabase (PostgreSQL) | Cloud-hosted relational database for user data, trade history, and agent state. |
| Telegram Bot | Telegraf | Real-time trade alerts, morning summaries, and manual override commands. |
| Blockchain | Somnia Shannon Testnet | EVM-compatible Layer 1. Chain ID 50312. |
| Collateral | tUSDC | Testnet stablecoin for event contract positions. |
| Gas Token | STT | Testnet gas for transaction fees. |

---

## 4. Data Flow Diagram

```
========================================================================================
                              PRAGMA DATA FLOW
========================================================================================

    INPUTS                    PROCESSING                 OUTPUTS
    ------                    ----------                 -------

    DreamDEX Market Data  ---> Agent Engine       ---> Dashboard UI
    (REST + WebSocket)         (TypeScript)            (P&L, Positions, History)

    AI Model Response    ---> Decision Parser     ---> Telegram Alerts
    (Groq / OpenRouter)        (JSON validation)       (Trade notifications)

    User Wallet Txns     ---> Viem / SDK          ---> On-Chain State
    (Trade execution)          (Transaction builder)    (DreamDEX contracts)

    On-Chain Events      ---> Event Listener      ---> Supabase
    (MarketResolved,           (Viem watcher)          (Persistent storage)
     OrderFilled)

    User Preferences     ---> Strategy Engine     ---> Risk Manager
    (Risk profile,             (Position sizing,       (Stop-loss, TP,
     budget)                    allocation)             daily limits)
```

---

## 5. Database Schema (Supabase / PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  TEXT UNIQUE NOT NULL,
  strategy        TEXT NOT NULL DEFAULT 'balanced',  -- conservative, balanced, aggressive
  budget          DECIMAL(18,6) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trades table
CREATE TABLE trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  market_id       TEXT NOT NULL,
  market_type     TEXT NOT NULL,  -- 'spot' or 'event_contract'
  action          TEXT NOT NULL,  -- 'BUY', 'SELL', 'BUY_UP', 'BUY_DOWN', 'EXIT'
  side            TEXT,           -- 'up', 'down', 'buy', 'sell'
  size            DECIMAL(18,6) NOT NULL,
  entry_price     DECIMAL(18,6),
  exit_price      DECIMAL(18,6),
  pnl             DECIMAL(18,6),
  status          TEXT NOT NULL DEFAULT 'open',  -- open, closed, settled
  ai_confidence   DECIMAL(5,4),
  ai_rationale    TEXT,
  tx_hash         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  closed_at       TIMESTAMPTZ
);

-- Agent state table
CREATE TABLE agent_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  budget          DECIMAL(18,6) NOT NULL,
  daily_pnl       DECIMAL(18,6) DEFAULT 0,
  total_pnl       DECIMAL(18,6) DEFAULT 0,
  open_positions  JSONB DEFAULT '[]',
  trades_today    INTEGER DEFAULT 0,
  is_paused       BOOLEAN DEFAULT false,
  last_trade_at   TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- AI decisions log
CREATE TABLE ai_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  market_id       TEXT NOT NULL,
  action          TEXT NOT NULL,
  confidence      DECIMAL(5,4),
  rationale       TEXT,
  market_context  JSONB,
  outcome         TEXT,  -- 'executed', 'skipped', 'rejected'
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. API Routes (Next.js App Router)

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| /api/markets | GET | Fetch active DreamDEX markets (spot + event contracts) with current odds and volume. |
| /api/markets/[id] | GET | Detailed view of a single market with order book depth and recent trades. |
| /api/agent/start | POST | Activate the trading agent for a connected wallet. Initialises budget and strategy. |
| /api/agent/stop | POST | Pause the trading agent. No new trades executed. Open positions held. |
| /api/agent/status | GET | Current agent state: uptime, daily P&L, open positions, last decision. |
| /api/trades | GET | Full trade history for the connected wallet. Supports pagination and filtering. |
| /api/trades/[id] | GET | Individual trade details with AI rationale and market context at time of execution. |
| /api/decisions | GET | Last 10 AI decisions with reasoning, confidence, and market context. |
| /api/health | GET | System health check: DreamDEX connection, AI model availability, database connectivity. |

---

## 7. Risky / Unknown Technical Pieces (De-Risk First)

The following items are identified as high-risk and must be validated before any other development begins.

### 7.1 DreamDEX SDK - Event Contract Order Placement

| Detail | Value |
| :--- | :--- |
| Risk | SDK documentation may not clearly show how to place event contract orders vs spot orders. |
| Impact | Core feature (prediction market trading) fails if this cannot be integrated. |
| Action | Read SDK source code directly. Test order placement on Shannon Testnet within the first 2 hours of build. |
| Fallback | Use raw contract calls via Viem with the ABIs from the starter template. |

### 7.2 AI Model Decision Consistency

| Detail | Value |
| :--- | :--- |
| Risk | Free-tier AI models may return inconsistent or malformed JSON decisions. |
| Impact | Agent places incorrect trades or fails to execute due to parsing errors. |
| Action | Implement strict JSON schema validation. Test with 20+ sample market contexts before integration. |
| Fallback | Hardcoded strategy rules as a baseline if AI output is unreliable. |

### 7.3 Somnia Testnet Stability

| Detail | Value |
| :--- | :--- |
| Risk | Shannon Testnet may have downtime, slow block times, or RPC instability. |
| Impact | Demo fails during recording or submission review. |
| Action | Test RPC responsiveness before building. Identify backup RPC endpoints. |
| Fallback | Record demo during confirmed low-traffic window. Maintain mock transaction data for UI demonstration. |

### 7.4 WebSocket Connection Persistence

| Detail | Value |
| :--- | :--- |
| Risk | DreamDEX WebSocket may drop connections or have rate limits. |
| Impact | Agent misses market data and makes stale decisions. |
| Action | Implement reconnection logic with exponential backoff. Test connection stability over 30+ minutes. |
| Fallback | Fall back to REST polling at 5-second intervals if WebSocket is unreliable. |

### 7.5 Telegram Bot Rate Limits

| Detail | Value |
| :--- | :--- |
| Risk | Telegram Bot API has rate limits on message sending. |
| Impact | Alerts are delayed or dropped during high-frequency trading. |
| Action | Implement message queue with rate limiting. Batch non-urgent notifications. |
| Fallback | Morning summary only if real-time alerts hit limits. |

---

## 8. Component Architecture (Next.js App Router)

```
pragma/src/
  app/
    layout.tsx              -- Root layout, providers, fonts
    page.tsx                -- Landing page
    dashboard/
      page.tsx              -- Main dashboard view
    setup/
      page.tsx              -- Wallet connect + strategy setup

  components/
    ui/                     -- Shared UI primitives (buttons, cards, inputs)
    dashboard/
      PnLChart.tsx          -- Real-time profit/loss chart
      PositionsPanel.tsx    -- Active positions display
      TradeHistory.tsx      -- Completed trades table
      AgentActivity.tsx     -- AI decision log feed
      AgentControls.tsx     -- Start/pause/resume buttons
    wallet/
      ConnectButton.tsx     -- Wallet connection component
      BalanceDisplay.tsx    -- tUSDC and STT balance

  lib/
    dreamdex/
      client.ts             -- DreamDEX SDK initialisation
      markets.ts            -- Market discovery and data fetching
      orders.ts             -- Trade execution functions
      settlement.ts         -- Position settlement and redemption
    ai/
      groq.ts               -- Groq API integration
      openrouter.ts         -- OpenRouter fallback
      prompts.ts            -- System prompts for trading decisions
      parser.ts             -- AI response validation
    telegram/
      bot.ts                -- Telegraf bot setup
      alerts.ts             -- Trade alert formatting
      commands.ts           -- /status, /pause, /resume handlers
    db/
      supabase.ts           -- Supabase client initialisation
      trades.ts             -- Trade CRUD operations
      agent.ts              -- Agent state management
    strategy/
      risk.ts               -- Stop-loss, take-profit, daily limit logic
      sizing.ts             -- Position size calculation
      presets.ts            -- Conservative, balanced, aggressive configs

  hooks/
    useWallet.ts            -- Wallet connection and balance
    useAgent.ts             -- Agent state and controls
    useTrades.ts            -- Trade history subscription
    useMarkets.ts           -- Live market data via WebSocket

  store/
    agentStore.ts           -- Zustand store for agent state
    tradeStore.ts           -- Zustand store for trade history
```

---

*End of Architecture Document.*
