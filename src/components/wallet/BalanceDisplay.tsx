'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { somniaTestnet } from '@/lib/wagmi';

// TODO: Verify tUSDC contract address on Shannon Testnet
// Common testnet USDC pattern — replace with actual DreamDEX tUSDC address
const TUSDC_ADDRESS = '0x6B8A1028aE64900A28841616C5d4747180A13a51' as `0x${string}`;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export function BalanceDisplay() {
  const { address, isConnected } = useAccount();

  const { data: rawBalance, isLoading } = useReadContract({
    address: TUSDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: somniaTestnet.id,
  });

  const { data: decimals } = useReadContract({
    address: TUSDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: somniaTestnet.id,
  });

  if (!isConnected || !address) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-sm text-[var(--text-muted)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
        Balance: —
      </div>
    );
  }

  const formatted = rawBalance && decimals
    ? parseFloat(formatUnits(rawBalance, decimals)).toFixed(2)
    : '0.00';

  return (
    <div className="text-sm text-[var(--text)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
      Balance: {formatted} tUSDC
    </div>
  );
}
