import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import configNetworks from '../../config/config-networks';
import { NetworkFeeSettings } from '../../models/network-models';
import { GasTokenConfig, Token } from '../../models/token-models';
import { getTransactionTokens } from '../tokens/network-tokens';
import {
  getTransactionTokenPrices,
  TokenPrice,
} from '../tokens/token-price-cache';
import { deserializePopulatedTransaction } from '../transactions/populated-transaction';
import { estimateMaximumGas } from './gas-estimate';
import { cacheFeeForTransaction } from './transaction-fee-cache';

export const calculateTransactionFee = async (
  chainID: NetworkChainID,
  serializedTransaction: string,
  tokenAddress: string,
): Promise<BigNumber> => {
  const networkConfig = configNetworks[chainID];
  const { token, gasToken } = getTransactionTokens(chainID, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chainID,
    token,
    gasToken,
  );

  const precision = configDefaults.transactionFeePrecision;
  const roundedRatio = getRoundedTokenToGasPriceRatio(
    tokenPrice,
    gasTokenPrice,
    networkConfig.fees,
    precision,
  );
  const decimalRatio = getTransactionTokenToGasDecimalRatio(token, gasToken);

  const populatedTransaction = deserializePopulatedTransaction(
    serializedTransaction,
  );
  const maximumGas = await estimateMaximumGas(chainID, populatedTransaction);

  const maximumGasFeeForToken = maximumGas
    .mul(roundedRatio)
    .div(decimalRatio)
    .div(BigNumber.from(precision));

  cacheFeeForTransaction(
    serializedTransaction,
    tokenAddress,
    maximumGasFeeForToken,
  );

  return BigNumber.from(maximumGasFeeForToken);
};

export const getRoundedTokenToGasPriceRatio = (
  tokenPrice: TokenPrice,
  gasTokenPrice: TokenPrice,
  fees: NetworkFeeSettings,
  precision: number,
): BigNumber => {
  const priceRatio = gasTokenPrice.price / tokenPrice.price;
  const slippage = priceRatio * fees.slippageBuffer;
  const profit = priceRatio * fees.slippageBuffer;
  const totalFeeRatio = priceRatio + slippage + profit;
  const ratioMinimum = configDefaults.transactionFeeRatioMinimum;

  const ratio = totalFeeRatio * precision;
  if (ratio < ratioMinimum) {
    throw new Error(
      `Price ratio between token (${tokenPrice.price}) and gas token (${gasTokenPrice.price})
      is not precise enough to provide an accurate fee.`,
    );
  }

  const roundedRatio = BigNumber.from(Math.round(ratio));
  return roundedRatio;
};

export const getTransactionTokenToGasDecimalRatio = (
  token: Token,
  gasToken: GasTokenConfig,
): BigNumber => {
  const decimalDifference = gasToken.decimals - token.decimals;
  return BigNumber.from(10).pow(BigNumber.from(decimalDifference));
};
