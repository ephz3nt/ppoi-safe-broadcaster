import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 137,
  providers: [
    {
      provider: 'https://polygon-bor-rpc.publicnode.com',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 1, // Supports up to 10, but at 1 ethers handles getLogs differently, and this seems to be more stable.
      stallTimeout: 2500,
    },
    {
      provider: 'https://polygon.llamarpc.com',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
