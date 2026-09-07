import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { Chain } from 'viem';

export const somniaTestnet: Chain = defineChain({
  id: 50312, // 0xc488
  name: 'Somnia Shannon Testnet',
  nativeCurrency: {
    name: 'Somnia Testnet Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
  testnet: true,
});

// Injected connector with EIP-6963 discovery handles Zerion, MetaMask, Rabby, Phantom, etc.
export const config = createConfig({
  chains: [somniaTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'PRAGMA' }),
  ],
  transports: {
    [somniaTestnet.id]: http(),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});