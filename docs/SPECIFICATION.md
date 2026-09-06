# PRAGMA - Product Specification and Architecture Document

> Autonomous AI Trading Agent for DreamDEX Prediction and Spot Markets on Somnia

---

## 1. Problem Statement

Prediction markets and on-chain trading remain inaccessible to non-technical users due to complex interfaces, manual order execution, constant market monitoring requirements, and the inability to process real-time data at the speed required for profitable entry and exit. There is currently no one-click solution that deploys an intelligent agent to autonomously trade both spot markets and binary event contracts on DreamDEX while providing full transparency and control to the user.

---

## 2. Core User and Core Use Case

- **Core User:** Crypto-curious individuals, casual traders, and DeFi enthusiasts who want exposure to prediction markets and on-chain spot trading but lack the time, skill, or confidence to trade manually on order books. They are comfortable connecting a wallet but need an abstraction layer that handles strategy execution, risk management, and position monitoring autonomously.

- **Core Use Case:**
  1. A user visits the PRAGMA dashboard and connects their EVM wallet to the Somnia Shannon Testnet.
  2. They select a risk profile (conservative, balanced, or aggressive) and set a trading budget in tUSDC.
  3. They click "Activate Agent" and the autonomous trading engine begins.
  4. The agent reads live market data from DreamDEX via WebSocket and REST streams, analyses probability mispricings and price movements using an AI model, and executes trades across spot markets and event contract (Up/Down) positions.
  5. All activity is visible in real-time on the dashboard with full trade history, P&L tracking, and AI reasoning logs. Telegram alerts notify the user of every trade execution and provide a morning summary of overnight activity.

---

## 3. System Architecture and Flow

```
                                USER
                                  |
                    (1) Connect Wallet / Set Budget / Activate
                                  |
                                  v
                    +---------------------------+
                    | PRAGMA Dashboard (Next.js) |
                    |  - Wallet Connection       |
                    |  - Strategy Selector       |
                    |  - Live P&L Display        |
                    |  - Trade History           |
                    |  - Agent Activity Log      |
                    +-------------+-------------+
                                  |
                    (2) Agent Engine Reads Markets
                                  |
                                  v
                    +---------------------------+
                    | DreamDEX Shannon Testnet   |
                    |                           |
                    | [REST API]                |
                    |  -> Market Discovery       |
                    |  -> Order Book Snapshot    |
                    |                           |
                    | [WebSocket Stream]         |
                    |  -> Live Trades/Candles    |
                    |  -> Probability Shifts     |
                    +-------------+-------------+
                                  |
                    (3) AI Decision Layer
                                  |
                                  v
                    +---------------------------+
                    | Groq API (Llama 3.3 70B)  |
                    |  -> Market Analysis        |
                    |  -> Trade Decision         |
                    |  -> Risk Assessment        |
                    |                           |
                    | OpenRouter (Fallback)      |
                    |  -> Secondary Analysis     |
                    +-------------+-------------+
                                  |
                    (4) Execute Trade on DreamDEX
                                  |
                                  v
                    +---------------------------+
                    | DreamDEX SDK (Viem)        |
                    |  - Spot: placeOrder()      |
                    |  - Event: createOrder()    |
                    |  - Settle: claimPayout()   |
                    |  - Risk: stopLoss/TP exec  |
                    +-------------+-------------+
                                  |
                    (5) Notify + Store
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
          +-----------------+        +------------------+
          | Telegram Bot    |        | Supabase         |
          | - Trade Alerts  |        | - Trade History  |
          | - Morning Brief |        | - Agent State    |
          | - /status cmds  |        | - User Profiles  |
          +-----------------+        +------------------+
```

---

## 4. In-Scope MVP Features (Shipped for September 5-6)

### 4.1 Trading Agent Engine (Agent Core)

1. **DreamDEX Connection:**
   - Connect to Shannon Testnet via `@somnia-chain/markets-sdk`.
   - Authenticate using agent wallet private key.
   - Maintain persistent WebSocket connection for real-time market data.

2. **Market Discovery and Analysis:**
   - Fetch available spot markets via `loadMarkets()` and filter with `isBinaryMarket()`.
   - Stream live order book data via SDK WebSocket watches.
   - Read candle data for price action analysis.
   - Identify markets with the highest probability of mispricing or directional movement.

3. **Trade Execution:**
   - Spot Trading: Execute buy/sell orders via `createOrder()` with configurable order types (limit, IOC).
   - Event Contracts: Open Up/Down positions on binary prediction markets using SDK order placement.
   - Position sizing calculated as a percentage of available budget based on risk profile.

4. **Risk Management Engine:**
   - Stop-Loss: Automatically exit positions that drop below a configurable threshold (default -20%).
   - Take-Profit: Execute staged exits at configurable profit levels (default: 30% at 2x, 30% at 5x, remaining as moon bag).
   - Daily Loss Limit: Cease trading for the day if cumulative losses exceed the configured threshold (default: 10% of budget).
   - Maximum Position Size: No single position exceeds 15% of total budget.

5. **Settlement and Redemption:**
   - Monitor market expiry events via on-chain logs.
   - Automatically mint/merge/redeem winning positions via SDK settlement functions.
   - Claim payouts and update available balance.

### 4.2 AI Decision Layer

1. **Primary Model (Groq - Llama 3.3 70B):**
   - Receives structured market data as context (order book depth, price action, probability, volume).
   - Outputs a JSON decision object: action (BUY_SELL_UP, BUY_SELL_DOWN, HOLD, EXIT), market identifier, position size, entry price, and a natural-language rationale.
   - Sub-second inference latency for time-sensitive decisions.

2. **Secondary Model (OpenRouter - Free Tier):**
   - Activates when Groq rate limits are hit or when a lower-confidence decision requires second opinion.
   - Provides deeper market context analysis for strategic positioning.

3. **Decision Log:**
   - Every AI decision is stored with full reasoning, market context at time of decision, and outcome.
   - Last 10 decisions displayed in the dashboard Agent Activity Log.

### 4.3 Personal Dashboard (Frontend)

1. **Wallet Connection:**
   - EVM wallet connect via MetaMask or compatible provider.
   - Display connected address, network status, and tUSDC balance.

2. **Strategy Selector:**
   - Conservative: Low position sizing, tight stop-losses, event contracts only.
   - Balanced: Medium position sizing, moderate stop-losses, spot and event contracts.
   - Aggressive: Maximum position sizing, wider stop-losses, high-frequency trading, spot and event contracts.

3. **Live P&L Display:**
   - Total portfolio P&L (all-time and 24h).
   - Per-position P&L with entry price, current value, and unrealised gain/loss.
   - Win rate percentage.

4. **Trade History:**
   - Sortable and filterable table of all executed trades.
   - Columns: timestamp, market, action, size, entry price, exit price, P&L, AI rationale.

5. **Agent Activity Log:**
   - Real-time feed of AI decision-making process.
   - Each entry shows: timestamp, market analysed, decision made, rationale, confidence level.

6. **Agent Controls:**
   - Start / Pause / Resume buttons.
   - Budget adjustment interface.
   - Risk profile switcher.

### 4.4 Telegram Bot Integration

1. **Trade Alerts:**
   - Instant notification on every trade execution (entry and exit).
   - Format: action, market, size, price, current P&L.

2. **Morning Summary:**
   - Daily recap of overnight activity: trades executed, P&L movement, current positions, agent confidence.

3. **Manual Commands:**
   - /status - Current agent state and uptime.
   - /positions - List of all open positions.
   - /pnl - Current profit and loss summary.
   - /pause - Pause the agent.
   - /resume - Resume the agent.

### 4.5 Infrastructure

1. **Database (Supabase):**
   - User profiles (wallet address, preferences, strategy selection).
   - Trade history table (full audit trail of every execution).
   - Agent state persistence (current positions, budget, risk parameters).
   - AI decision log (rationale, context, outcome).

2. **State Management (Zustand):**
   - Client-side reactive state for dashboard components.
   - Real-time updates from WebSocket streams without page refresh.

3. **Responsive Design:**
   - Desktop-first with full mobile support.
   - Tailwind CSS for utility-first styling.

---

## 5. Out-of-Scope Features (Post-Hackathon Roadmap)

| Feature | Narrative (Why It Comes Next) |
| :--- | :--- |
| Multi-User Leaderboard | Global agent ranking by P&L creates competition and virality. Requires a user base first, then leaderboard drives growth. |
| Copy Trading | Users subscribe to and mirror the trades of top-ranked agents. Democratizes alpha from the best-performing strategies. |
| Custom Strategy Builder | Visual drag-and-drop interface for users to configure their own trading strategies beyond the three presets. Turns PRAGMA into a strategy platform. |
| Cross-Chain Trading | Support for trading on Solana, Starknet, and EVM chains beyond Somnia. Requires intent-based clearing infrastructure. |
| Agent-to-Agent Communication | Multiple PRAGMA agents sharing market intelligence and coordinating positions. Multi-agent orchestration for emergent market behaviour. |
| Mainnet Deployment | Production deployment on Somnia Mainnet with real capital. Requires security audits, insurance mechanisms, and regulatory review. |
| Mobile Application | Native iOS and Android apps with push notifications. Extends reach beyond the browser-based dashboard. |
| Social Features | Public agent profiles, strategy sharing, community-driven strategy curation. Transforms PRAGMA from a tool into a network. |

---

## 6. Success Criteria ("What Does 'It Works' Look Like at Demo Time?")

At submission time, the following flow will execute live in under 3 minutes for the demo video:

```
[1. Open PRAGMA Dashboard] ---> [2. Connect Wallet to Shannon Testnet]
                                          |
                                          v
[3. Select 'Balanced' Strategy] ---> [4. Click 'Activate Agent']
                                          |
                                          v
[5. Agent Reads DreamDEX Markets] ---> [6. AI Analyses + Decides to Buy ETH UP]
                                          |
                                          v
[7. Trade Executes On-Chain] ---> [8. Dashboard Updates: Position + P&L Live]
                                          |
                                          v
[9. Telegram Alert Received] ---> [10. Agent Exits at Take-Profit]
                                          |
                                          v
[11. Dashboard Shows Final P&L] ---> [12. Trade History + AI Rationale Visible]
```

| Criteria | Definition of Done |
| :--- | :--- |
| Wallet Connection | User connects an EVM wallet. Dashboard recognises the address, network, and tUSDC balance. |
| Market Data Flow | Dashboard displays live DreamDEX market data — spot prices and event contract probabilities update in real-time. |
| Agent Autonomy | Agent places at least one spot trade and one event contract position without any manual intervention after activation. |
| Risk Enforcement | Agent respects stop-loss, take-profit, and daily loss limit rules. No position exceeds maximum size. |
| Trade Settlement | At least one event contract position settles and winning payout is claimed automatically. |
| Trade History | All executed trades appear in the dashboard with timestamps, outcomes, and AI rationale. |
| Telegram Delivery | User receives at least one real-time trade alert via Telegram and one morning summary. |
| AI Reasoning | Dashboard displays the last 10 AI decisions with full reasoning, market context, and confidence levels. |
| UI Quality | Dashboard is visually polished, responsive, and a judge can navigate it without explanation. |
| Repository Quality | Clean GitHub repository with readable README, setup instructions, and environment variable documentation. |
| Demo Recording | 2-3 minute video showing the complete flow from wallet connection through autonomous trading to final P&L. |

---

## 7. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Framework | Next.js 15, TypeScript | Application shell and pages |
| Styling | Tailwind CSS | Utility-first responsive design |
| Animations | Framer Motion, GSAP | UI transitions and micro-interactions |
| State Management | Zustand | Client-side reactive state |
| Blockchain SDK | @somnia-chain/markets-sdk | DreamDEX market interaction |
| Wallet | Viem | EVM wallet connection and transaction handling |
| AI Primary | Groq API (Llama 3.3 70B) | Fast autonomous trading decisions |
| AI Fallback | OpenRouter (free models) | Secondary analysis and fallback |
| Database | Supabase | User data, trade history, agent state |
| Telegram | Telegraf | Bot alerts and command interface |
| Chain | Somnia Shannon Testnet | Chain ID 50312 |
| Collateral | tUSDC | Prediction market collateral |
| Gas | STT | Testnet gas token |

---

## 8. Environment Variables

```
# DreamDEX Connection
NEXT_PUBLIC_DREAMDEX_REST_URL=https://stg.api.dreamdex.io/v0
NEXT_PUBLIC_DREAMDEX_WS_URL=wss://stg.api.dreamdex.io/v0/ws/public
NEXT_PUBLIC_DREAMDEX_RPC_URL=https://dream-rpc.somnia.network
NEXT_PUBLIC_CHAIN_ID=50312

# AI Models
GROQ_API_KEY=
OPENROUTER_API_KEY=

# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Agent Wallet
AGENT_PRIVATE_KEY=
AGENT_PUBLIC_KEY=
```

---

## 9. Risk Factors and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| DreamDEX SDK documentation gaps | Cannot integrate specific API endpoints | Fallback to raw contract calls via Viem using the starter template contract interfaces. |
| AI model free-tier rate limits | Agent blocked from making decisions | Cache previous decisions locally. Batch market reads. Use Groq for speed-critical paths, OpenRouter for analysis. |
| Shannon Testnet instability | Demo fails during submission recording | Record demo during low-traffic hours (early morning UTC). Maintain local mock data as fallback for UI demonstration. |
| Scope creep | MVP not finished by September 6 | Strict adherence to this specification. No new features added after September 5. Polish only. |
| Single-builder bandwidth | Not enough hours for full stack | Prioritise agent engine and core dashboard. Telegram integration and animation polish are secondary if time is short. |
| Supabase setup complexity | Database delays the frontend work | Use local Zustand persistence as initial data layer. Migrate to Supabase only if time permits. |

---

## 11. Non-Goals

The following are explicitly not part of PRAGMA version 1.0:

- **Profitability guarantee.** PRAGMA is a hackathon demonstration, not a licensed financial product.
- **Real money trading.** All operations are on DreamDEX Shannon Testnet using test tokens only.
- **Regulatory compliance.** No licensed financial advice, managed fund operations, or securities offerings.
- **Uptime guarantees.** No SLA, no redundancy, single-server operation for demonstration purposes.
- **User authentication system.** Wallet connection serves as the identity layer. No email, password, or OAuth.
- **Cross-chain interoperability.** Somnia-only for this hackathon.

---

*End of Specification.*
