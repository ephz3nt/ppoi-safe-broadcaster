import { isDefined } from '@railgun-community/shared-models';
import { BroadcasterChain } from '../../../models/chain-models';
import { delay, promiseTimeout } from '../../../util/promise-utils';
import { tokenForAddress } from '../../tokens/network-tokens';
import { TokenPrice, TokenPriceUpdater } from '../../tokens/token-price-cache';
import {
  ZeroXApiEndpoint,
  getZeroXData,
  getStablecoinReferenceSymbol,
} from './0x-fetch';

import debug from 'debug';

const dbg = debug('broadcaster:0xPrice');

// The current limit for the Free Tier of our APIs is approximately 1 Requests Per Second (RPS) and 200K API calls per month globally.
// https://0x.org/docs/0x-swap-api/advanced-topics/rate-limiting
let ZERO_X_PRICE_LOOKUP_DELAY = 1500;

const refreshLocks: NumMapType<NumMapType<boolean>> = {};

export type ZeroXPriceData = {
  price: string;
};

export type ZeroXPriceParams = {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
};

export const overrideZeroXPriceLookupDelay_TEST_ONLY = (
  overrideDelay: number,
) => {
  ZERO_X_PRICE_LOOKUP_DELAY = overrideDelay;
};

type ZeroXFormattedPriceData = {
  price: number;
};

const zeroXPriceLookupByAddress = async (
  chain: BroadcasterChain,
  tokenAddress: string,
): Promise<Optional<ZeroXFormattedPriceData>> => {
  try {
    const { decimals, symbol } = tokenForAddress(chain, tokenAddress);

    // TODO: This depends on DAI being stable at $1.
    // As we've seen, this isn't the safest methodology.
    // However, if the price of DAI drops, the broadcasted fees can only increase,
    // so for this use case, it is not harmful.

    const stablecoinSymbol = getStablecoinReferenceSymbol(chain);
    if (symbol === stablecoinSymbol) {
      return { price: 1 };
    }
    const sellAmount = (10n ** decimals).toString(10);
    const params: ZeroXPriceParams = {
      sellToken: tokenAddress,
      buyToken: stablecoinSymbol,
      sellAmount, // 1 token
    };
    const { price } = await getZeroXData<ZeroXPriceData>(
      ZeroXApiEndpoint.PriceLookup,
      chain,
      params,
    );
    return {
      price: parseFloat(price),
    };
  } catch (err) {
    return undefined;
  }
};

export const zeroXUpdatePricesByAddresses = async (
  chain: BroadcasterChain,
  tokenAddresses: string[],
  updater: TokenPriceUpdater,
): Promise<void> => {
  refreshLocks[chain.type] ??= {};
  if (refreshLocks[chain.type][chain.id]) {
    // Continue refreshing 0x prices.
    return;
  }
  refreshLocks[chain.type][chain.id] = true;
  dbg(`Starting chain ${chain.type}:${chain.id}`);

  for (const tokenAddress of tokenAddresses) {
    // eslint-disable-next-line no-await-in-loop
    await promiseTimeout(
      zeroXPriceLookupByAddress(chain, tokenAddress),
      10 * 1000,
    )
      .then((zeroXPriceData) => {
        if (zeroXPriceData) {
          const tokenPrice: TokenPrice = {
            price: zeroXPriceData.price,
            updatedAt: Date.now(),
          };
          updater(tokenAddress, tokenPrice);
        }
      })
      .catch((err: Error) => {
        if (isDefined(err) && err.message.includes('Timed out')) {
          dbg(
            `Token ${tokenAddress} timed out on chain ${chain.type}:${chain.id}`,
          );
        }
      });

    // eslint-disable-next-line no-await-in-loop
    await delay(ZERO_X_PRICE_LOOKUP_DELAY);
  }
  dbg(`Ended chain ${chain.type}:${chain.id}`);
  await delay(ZERO_X_PRICE_LOOKUP_DELAY);

  refreshLocks[chain.type][chain.id] = false;
};
