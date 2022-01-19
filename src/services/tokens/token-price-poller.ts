import configDefaults from '../../config/config-defaults';
import {
  configTokenPricesGetter,
  TokenPricesGetter,
} from '../../config/config-token-price-getter';
import { delay } from '../../util/promise-utils';
import { allNetworkChainIDs } from '../chains/network-chain-ids';
import { allTokenAddressesForNetwork } from './network-tokens';
import {
  cacheTokenPricesForNetwork,
  TokenAddressesToPrice,
} from './token-price-cache';

const pullAndCacheCurrentPricesForAllNetworks = async (
  tokenPricesGetter: TokenPricesGetter,
): Promise<void> => {
  const networkPromises: Promise<TokenAddressesToPrice>[] = [];

  const chainIDs = allNetworkChainIDs();
  chainIDs.forEach((chainID) => {
    const tokenAddresses = allTokenAddressesForNetwork(chainID);
    networkPromises.push(tokenPricesGetter(chainID, tokenAddresses));
  });

  const networkTokenPrices = await Promise.all(networkPromises);
  chainIDs.forEach((chainID, index) => {
    const tokenPrices = networkTokenPrices[index];
    cacheTokenPricesForNetwork(chainID, tokenPrices);
  });
};

const pollPrices = async (tokenPricesGetter: TokenPricesGetter) => {
  pullAndCacheCurrentPricesForAllNetworks(tokenPricesGetter);
  await delay(configDefaults.tokenPriceRefreshDelayInMS);
  pollPrices(tokenPricesGetter);
};

export const initPricePoller = () => {
  pollPrices(configTokenPricesGetter);
};