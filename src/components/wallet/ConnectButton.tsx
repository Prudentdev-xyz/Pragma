'use client';

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { somniaTestnet } from '@/lib/wagmi';
import { WalletModal } from './WalletModal';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showModal, setShowModal] = useState(false);

  // Switch to Somnia Shannon Testnet if connected to wrong chain
  useEffect(() => {
    if (isConnected && chain?.id !== somniaTestnet.id && switchChain) {
      switchChain({ chainId: somniaTestnet.id });
    }
  }, [isConnected, chain, switchChain]);

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
    <>
      <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
        Connect Wallet
      </Button>
      <WalletModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
