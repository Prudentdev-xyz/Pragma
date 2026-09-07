'use client';

import { useState } from 'react';
import { useConnect } from 'wagmi';
import { X, Wallet } from 'lucide-react';

const WALLET_META: Record<string, { name: string; icon: string }> = {
  metaMask: { name: 'MetaMask', icon: '🦊' },
  metaMaskSDK: { name: 'MetaMask', icon: '🦊' },
  'io.metamask': { name: 'MetaMask', icon: '🦊' },
  zerion: { name: 'Zerion', icon: '🔷' },
  'io.zerion.wallet': { name: 'Zerion', icon: '🔷' },
  phantom: { name: 'Phantom', icon: '👻' },
  'app.phantom': { name: 'Phantom', icon: '👻' },
  rabby: { name: 'Rabby Wallet', icon: '🐰' },
  'io.rabby': { name: 'Rabby Wallet', icon: '🐰' },
  coinbaseWalletSDK: { name: 'Coinbase Wallet', icon: '🔵' },
  coinbaseWallet: { name: 'Coinbase Wallet', icon: '🔵' },
  injected: { name: 'Browser Wallet', icon: '💼' },
};

export function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { connectors, connectAsync, isPending } = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  if (!open) return null;

  // Process connectors: prioritize EIP-6963 discovered wallets, then deduplicate
  const seen = new Set<string>();
  const displayConnectors = connectors
    .filter((connector) => {
      // Skip the generic fallback "Injected" if named wallets are available
      if (connector.id === 'injected' && connectors.length > 1) {
        const hasSpecific = connectors.some((c) => c.id !== 'injected');
        if (hasSpecific) return false;
      }
      return true;
    })
    .filter((connector) => {
      const meta = WALLET_META[connector.id] || WALLET_META[connector.type] || {
        name: connector.name,
      };
      const key = (connector.name || meta.name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  async function handleSelect(connector: (typeof connectors)[number]) {
    try {
      await connectAsync({ connector });
      onClose();
    } catch (error) {
      console.error('Wallet connection error:', error);
      // Don't close modal on error — let user try another wallet
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-[var(--accent)]" />
            <span className="text-lg font-semibold text-[var(--text)]">
              Connect a Wallet
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1 rounded-lg hover:bg-[var(--bg)]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-4">
          Select your preferred wallet to connect to Somnia Shannon Testnet.
        </p>

        {/* Connectors List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {displayConnectors.map((connector) => {
            const meta = WALLET_META[connector.id] ||
              WALLET_META[connector.type] || {
                name: connector.name,
                icon: '💼',
              };

            return (
              <button
                key={connector.uid || connector.id}
                onClick={() => handleSelect(connector)}
                disabled={isPending}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--bg-card)] transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="text-sm font-medium">{meta.name}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">Connect →</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-5 text-[11px] text-[var(--text-muted)] text-center">
          Non-custodial connection · Funds stay in your wallet
        </p>
      </div>
    </div>
  );
}
