import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 1,
  providers: [
    {
      provider: 'https://eth.merkle.io',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://1rpc.io/eth',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://rpc.flashbots.net',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://ethereum-rpc.publicnode.com',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://eth.llamarpc.com',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://cloudflare-eth.com/',
      priority: 3,
      weight: 1,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
  ],
};

export default config;
