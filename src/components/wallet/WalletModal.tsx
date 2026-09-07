'use client';

import { useState } from 'react';
import { useConnect } from 'wagmi';
import { X, Wallet, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

const WALLET_META: Record<
  string,
  { name: string; icon: string; downloadUrl?: string }
> = {
  'io.zerion.wallet': {
    name: 'Zerion',
    icon: '🔷',
    downloadUrl: 'https://zerion.io/download',
  },
  zerion: {
    name: 'Zerion',
    icon: '🔷',
    downloadUrl: 'https://zerion.io/download',
  },
  'io.metamask': {
    name: 'MetaMask',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download/',
  },
  metaMaskSDK: {
    name: 'MetaMask',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download/',
  },
  metaMask: {
    name: 'MetaMask',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download/',
  },
  'io.rabby': {
    name: 'Rabby Wallet',
    icon: '🐰',
    downloadUrl: 'https://rabby.io',
  },
  rabby: {
    name: 'Rabby Wallet',
    icon: '🐰',
    downloadUrl: 'https://rabby.io',
  },
  'app.phantom': {
    name: 'Phantom',
    icon: '👻',
    downloadUrl: 'https://phantom.app',
  },
  phantom: {
    name: 'Phantom',
    icon: '👻',
    downloadUrl: 'https://phantom.app',
  },
  'com.coinbase.wallet': {
    name: 'Coinbase Wallet',
    icon: '🔵',
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  coinbaseWallet: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  coinbaseWalletSDK: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  injected: {
    name: 'Browser Wallet',
    icon: '💼',
  },
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedWalletUrl, setFailedWalletUrl] = useState<string | null>(null);

  if (!open) return null;

  // Sort connectors: prioritize EIP-6963 discovered wallets (RDNS format like io.zerion.wallet)
  const sortedConnectors = [...connectors].sort((a, b) => {
    const aIsEip = a.id.includes('.') ? 1 : 0;
    const bIsEip = b.id.includes('.') ? 1 : 0;
    return bIsEip - aIsEip;
  });

  // Filter out redundant generic 'injected' fallback when named wallets are discovered
  const hasSpecificWallets = sortedConnectors.some(
    (c) => c.id !== 'injected' && c.id !== 'coinbaseWallet',
  );

  const seen = new Set<string>();
  const displayConnectors = sortedConnectors
    .filter((connector) => {
      if (connector.id === 'injected' && hasSpecificWallets) {
        return false;
      }
      return true;
    })
    .filter((connector) => {
      const meta =
        WALLET_META[connector.id] ||
        WALLET_META[connector.type] || {
          name: connector.name,
        };
      const key = (connector.name || meta.name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  async function handleSelect(connector: (typeof connectors)[number]) {
    setErrorMessage(null);
    setFailedWalletUrl(null);
    setConnectingId(connector.uid || connector.id);

    const meta =
      WALLET_META[connector.id] ||
      WALLET_META[connector.type] || {
        name: connector.name,
        downloadUrl: undefined,
      };

    try {
      await connectAsync({ connector });
      onClose();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      const isNotFound =
        error?.name === 'ProviderNotFoundError' ||
        error?.message?.includes('Provider not found') ||
        error?.message?.includes('provider not found');

      if (isNotFound) {
        setErrorMessage(
          `${meta.name || connector.name} extension was not detected or is inactive. Make sure the extension is installed and enabled in your browser.`,
        );
        if (meta.downloadUrl) {
          setFailedWalletUrl(meta.downloadUrl);
        }
      } else if (error?.name === 'UserRejectedRequestError') {
        setErrorMessage('Connection request was cancelled in your wallet.');
      } else {
        setErrorMessage(error?.message || 'Failed to connect. Please try again.');
      }
    } finally {
      setConnectingId(null);
    }
  }

  function handleClose() {
    setErrorMessage(null);
    setFailedWalletUrl(null);
    setConnectingId(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleClose}
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
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1 rounded-lg hover:bg-[var(--bg)]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-4">
          Select your preferred wallet to connect to Somnia Shannon Testnet.
        </p>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--loss)] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {failedWalletUrl && (
              <a
                href={failedWalletUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline font-medium pl-6"
              >
                Install extension <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Connectors List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {displayConnectors.length === 0 ? (
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-center">
              <p className="text-xs text-[var(--text-muted)] mb-3">
                No web3 wallet detected in this browser.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-[var(--accent)]">
                <a
                  href="https://zerion.io/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  Install Zerion <ExternalLink size={12} />
                </a>
                <span className="text-[var(--border)]">|</span>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  Install MetaMask <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            displayConnectors.map((connector) => {
              const meta =
                WALLET_META[connector.id] ||
                WALLET_META[connector.type] || {
                  name: connector.name,
                  icon: '💼',
                };
              const isThisConnecting = connectingId === (connector.uid || connector.id);

              return (
                <button
                  key={connector.uid || connector.id}
                  onClick={() => handleSelect(connector)}
                  disabled={isPending}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--bg-card)] transition-all text-left disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {connector.icon && connector.icon.startsWith('data:') ? (
                      <img
                        src={connector.icon}
                        alt={connector.name}
                        className="w-6 h-6 rounded-md object-contain"
                      />
                    ) : (
                      <span className="text-2xl">{meta.icon}</span>
                    )}
                    <span className="text-sm font-medium">
                      {meta.name || connector.name}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    {isThisConnecting ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
                        Connecting…
                      </>
                    ) : (
                      'Connect →'
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <p className="mt-5 text-[11px] text-[var(--text-muted)] text-center">
          Non-custodial connection · Funds stay in your wallet
        </p>
      </div>
    </div>
  );
}
