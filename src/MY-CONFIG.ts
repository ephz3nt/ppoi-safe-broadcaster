/*
 * Configure your overrides for default settings and networks here.
 */

import { DebugLevel } from './models/debug-models';
import { NetworkChainID } from './server/config/config-chains';
import configDefaults from './server/config/config-defaults';
import configNetworks from './server/config/config-networks';
import configTokens from './server/config/config-tokens';
import { ChainType, FallbackProviderJsonConfig } from '@railgun-community/shared-models';
import { parseUnits } from 'ethers';
import { AddressToTokenMap } from './models/config-models';
import { GAS_TOKEN_DECIMALS } from './models/token-models';
import { TokenAddressArbitrum, TokenAddressBSC, TokenAddressPolygonPOS } from './server/config/config-token-addresses';

// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW

// HELPER FUNCTIONS
/**
 * Converts a number value to a token value.
 * @param value The number value to convert.
 * @returns The token value.
 */
const tokenValue = (value: number) => {
  return parseUnits(String(value), GAS_TOKEN_DECIMALS);
};

/**
 * Sets the maximum spend percentage for a specific network. This is the maximum percentage of the
 * expected gas token balance recieved that will be spent on a single transaction.
 * @param chainId - The chain ID of the network.
 * @param value - The maximum spend percentage value to set.
 */
const setMaxSpendPercentageForNetwork = (
  chainId: NetworkChainID,
  value: number,
) => {
  configNetworks[ChainType.EVM][chainId].topUp.maxSpendPercentage = value;
}

/**
 * Sets the amount to unshield for top-up on a specific network.
 *
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the top-up unshield amount.
 */
const setTopUpUnshieldAmountForNetwork = (
  chainId: NetworkChainID,
  value: number,
) => {
  configNetworks[ChainType.EVM][chainId].topUp.swapThresholdIntoGasToken = tokenValue(value);
}

/**
 * Sets the threshold to begin attempting top-up for a specific network.
 *
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the top-up begin threshold.
 */
const setTopUpBeginThresholdForNetwork = (
  chainId: NetworkChainID,
  value: number
) => {
  configNetworks[ChainType.EVM][chainId].topUp.minimumGasBalanceForTopup = tokenValue(value);
}

/**
 * Sets the minimum availability balance for a specific network.
 *
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the minimum availability balance.
 */
const setMinAvailabilityBalanceForNetwork = (
  chainId: NetworkChainID,
  value: number,
) => {
  configNetworks[ChainType.EVM][chainId].gasToken.minBalanceForAvailability = value;
}

/**
 * Enables or disables native token accumulation for a specific network.
 * @param chainId - The chain ID of the network.
 * @param value - The value indicating whether native token accumulation should be enabled or disabled.
 */
const setNativeTokenAccumulationForNetwork = (
  chainId: NetworkChainID,
  value: boolean,
) => {
  configNetworks[ChainType.EVM][chainId].topUp.accumulateNativeToken = value;
}

/**
 * Sets the fallback provider configuration for a specific network chain ID.
 * @param chainId - The network chain ID.
 * @param config - The fallback provider JSON configuration.
 */
const setFallbackProviderConfigForNetworkEVM = (
  chainId: NetworkChainID,
  config: FallbackProviderJsonConfig,
) => {
  configNetworks[ChainType.EVM][chainId].fallbackProviderConfig = config;
}

/**
 * Sets the tokens for a specific network on the EVM chain.
 * @param chainId - The ID of the network chain.
 * @param tokens - The mapping of addresses to tokens.
 */
const setTokensForNetworkEVM = (
  chainId: NetworkChainID,
  tokens: AddressToTokenMap,
) => {
  configTokens[ChainType.EVM][chainId] = tokens;
}

/**
 * Sets the fees for a specific network in the EVM chain.
 * @param chainId - The ID of the network chain.
 * @param fees - The fees to be set for the network.
 */
const setFeesForNetworkEVM = (
  chainId: NetworkChainID,
  fees: any
) => {
  configNetworks[ChainType.EVM][chainId].fees = fees;
}

/**
 * Sets the top-up chains in the configuration.
 * @param chains - An array of NetworkChainID representing the top-up chains.
 */
const setTopUpOnChains = (chains: NetworkChainID[]) => {
  configDefaults.topUps.topUpChains = chains;
}

/**
 * Sets the tokens that should not be swapped.
 *
 * @param tokens - An array of tokens that should not be swapped.
 */
const setDontSwapTokens = (tokens: string[]) => {
  configDefaults.topUps.shouldNotSwap = tokens;
}

/**
 * Sets the retry gas buffer for a specific network.
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the retry gas buffer.
 */
const setRetryGasBufferForNetwork = (
  chainId: NetworkChainID,
  value: string,
) => {
  configNetworks[ChainType.EVM][chainId].retryGasBuffer = parseUnits(value, 'gwei');
}

/**
 * Enables the top-up feature.
 */
const enableTopUp = () => {
  configDefaults.topUps.shouldTopUp = true;
}

const createFallbackProviderConfig = (chainId: number, url: string[]) => {
  const providers = url.map((url, index) => {
    const weights = index > 0 ? {
      priority: 3,
      weight: 3,
      maxLogsPerBatch: 2
    } : {
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 5
    };

    return {
      provider: url,
      sallTimeout: 2500,
      ...weights
    };
  });
  return {
    chainId,
    providers
  };
}

// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW

// MARK: - myConfigOverrides()
export const myConfigOverrides = () => {
  // Use these indices to configure HD wallets from the same mnemonic.
  // Each individual wallet needs gas funds, but they reuse the same RAILGUN wallet.
  configDefaults.wallet.hdWallets = [
    {
      index: 0,
      priority: 1,
    },
  ];

  // Set other configs, for example:
  //
  configDefaults.debug.logLevel = DebugLevel.WarningsErrors;
  //
  // REQUIRED FOR Running on EVM Networks with POI enabled.
  // configDefaults.poi.nodeURL = ['FQDN of your POI node'];

  configDefaults.networks.EVM = [
    NetworkChainID.Ethereum,          // requires poi-node configured, setup & set
    NetworkChainID.BNBChain,
    NetworkChainID.PolygonPOS,
    //NetworkChainID.PolygonMumbai,        // may require better rpc configuration, see example below (RPCs are not updated, please choose your own.)
    NetworkChainID.Arbitrum,
  ];

  // Example custom provider config for Polygon Mumbai
  const polygonMumbaiConfig = createFallbackProviderConfig(
    80001,
    [
      'https://polygon-mumbai-bor-rpc.publicnode.com',
      'https://polygon-testnet.public.blastapi.io',
    ],
  );
  setFallbackProviderConfigForNetworkEVM(NetworkChainID.PolygonMumbai, polygonMumbaiConfig);

  // Manually Set tokens for network, for example:
  // configTokens[ChainType.EVM][NetworkChainID.Ethereum] = {
  //   // this keeps current tokens and adds a new one
  //   ...configTokens[ChainType.EVM][NetworkChainID.Ethereum], // or comment out this line to replace all tokens on that network.
  //   'NEW_0x_token_address': {
  //     symbol: 'NEW_TOKEN1',
  //   },
  // };


  // Enable topup on running networks.
  // enableTopUp(); // UNCOMMENT TO ENABLE TOP-UP

  // Select networks to run top-up on.
  setTopUpOnChains([
    NetworkChainID.BNBChain,
    NetworkChainID.PolygonPOS,
    NetworkChainID.Arbitrum,
  ]);

  // set max spend percentage (0.01 = 1%)
  setMaxSpendPercentageForNetwork(NetworkChainID.BNBChain, 0.08);
  setMaxSpendPercentageForNetwork(NetworkChainID.PolygonPOS, 0.077);
  setMaxSpendPercentageForNetwork(NetworkChainID.Arbitrum, 0.16);

  // set native token accumulation
  setNativeTokenAccumulationForNetwork(NetworkChainID.BNBChain, true);
  setNativeTokenAccumulationForNetwork(NetworkChainID.PolygonPOS, true);
  setNativeTokenAccumulationForNetwork(NetworkChainID.Arbitrum, true);

  // min availability balance
  setMinAvailabilityBalanceForNetwork(NetworkChainID.BNBChain, 0.01);
  setMinAvailabilityBalanceForNetwork(NetworkChainID.PolygonPOS, 1);
  setMinAvailabilityBalanceForNetwork(NetworkChainID.Arbitrum, 0.01);

  // topup amount to unshield
  setTopUpUnshieldAmountForNetwork(NetworkChainID.BNBChain, 0.12);
  setTopUpUnshieldAmountForNetwork(NetworkChainID.PolygonPOS, 20);
  setTopUpUnshieldAmountForNetwork(NetworkChainID.Arbitrum, 0.12);

  // start top up when balance less than this.
  setTopUpBeginThresholdForNetwork(NetworkChainID.BNBChain, 0.01);
  setTopUpBeginThresholdForNetwork(NetworkChainID.PolygonPOS, 3);
  setTopUpBeginThresholdForNetwork(NetworkChainID.Arbitrum, 0.01);
};
