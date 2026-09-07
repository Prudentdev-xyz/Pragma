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

// Register separate connectors for each major wallet
// This makes them appear as individual options in the wallet modal
export const config = createConfig({
  chains: [somniaTestnet],
  connectors: [
    injected({
      target: 'metaMask',
      unstable_shimAsyncInject: 2000,
    }),
    injected({
      target: 'zerion',
      unstable_shimAsyncInject: 2000,
    }),
    injected({
      target: 'phantom',
      unstable_shimAsyncInject: 2000,
    }),
    injected({
      target: 'rabby',
      unstable_shimAsyncInject: 2000,
    }),
    coinbaseWallet({ appName: 'PRAGMA' }),
    injected(), // Fallback for any other injected wallet
  ],
  transports: {
    [somniaTestnet.id]: http(),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});