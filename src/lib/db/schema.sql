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
