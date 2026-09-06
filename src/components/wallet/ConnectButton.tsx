'use client';

import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { somniaTestnet } from '@/lib/wagmi';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Switch to Somnia Shannon Testnet if connected to wrong chain
  useEffect(() => {
    if (isConnected && chain?.id !== somniaTestnet.id && switchChain) {
      switchChain({ chainId: somniaTestnet.id });
    }
  }, [isConnected, chain, switchChain]);

  function handleConnect() {
    const injectedConnector = connectors.find((c) => c.id === 'injected') || connectors[0];
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium font-mono text-[var(--text)]">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button variant="primary" size="md" onClick={handleConnect}>
      Connect Wallet
    </Button>
  );
}
