/// <reference types="../../../global" />
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import { GasTokenWrappedAddress } from '../../../models/token-models';
import {
  getMockNetwork,
  getMockPopulatedTransaction,
  mockTokenConfig,
  MOCK_TOKEN_6_DECIMALS,
} from '../../../test/mocks.test';
import {
  createGasEstimateStubs,
  restoreGasEstimateStubs,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  cacheTokenPricesForNetwork,
  resetTokenPriceCache,
  TokenPrice,
} from '../../tokens/token-price-cache';
import { createTransactionGasDetails } from '../calculate-transaction-gas';
import { getTokenFee } from '../calculate-token-fee';
import { getEstimateGasDetails, getMaximumGas } from '../gas-estimate';
import { initTokens } from '../../tokens/network-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN_ID = NetworkChainID.Ethereum;
const MOCK_GAS_TOKEN = GasTokenWrappedAddress.EthereumWETH;
const MOCK_TOKEN_ADDRESS = '0x001';

// 0.10 estimate (est * price), 0.12 ETH total (gas limit).
const MOCK_GAS_ESTIMATE = BigNumber.from('400000000000');
const MOCK_GAS_PRICE = BigNumber.from('250000');

describe('calculate-transaction-gas', () => {
  before(async () => {
    resetTokenPriceCache();
    mockTokenConfig(MOCK_CHAIN_ID, MOCK_TOKEN_ADDRESS);
    mockTokenConfig(MOCK_CHAIN_ID, MOCK_TOKEN_6_DECIMALS);
    await initTokens();
    configNetworks[MOCK_CHAIN_ID] = getMockNetwork();
    configNetworks[MOCK_CHAIN_ID].fees.slippageBuffer = 0.05;
    configNetworks[MOCK_CHAIN_ID].fees.profit = 0.05;
    initNetworkProviders();
    const tokenPrices: MapType<TokenPrice> = {
      [MOCK_GAS_TOKEN]: { price: 3250.0, updatedAt: Date.now() },
      [MOCK_TOKEN_ADDRESS]: { price: 1.0, updatedAt: Date.now() },
      [MOCK_TOKEN_6_DECIMALS]: { price: 1.0, updatedAt: Date.now() },
    };
    cacheTokenPricesForNetwork(MOCK_CHAIN_ID, tokenPrices);
  });

  afterEach(() => {
    restoreGasEstimateStubs();
  });

  after(() => {
    resetTokenPriceCache();
  });

  it('Should create gas details from token fee', () => {
    createGasEstimateStubs(MOCK_GAS_ESTIMATE, MOCK_GAS_PRICE);

    const tokenFee = BigNumber.from(429).mul(BigNumber.from(10).pow(18)); // $390 "USDC" (0.12 ETH) + 10% profit/buffer fee.
    const gasDetails = createTransactionGasDetails(
      MOCK_CHAIN_ID,
      MOCK_GAS_ESTIMATE,
      MOCK_TOKEN_ADDRESS,
      tokenFee,
    );

    expect(gasDetails.gasLimit.toString()).to.equal('480000000000');
    expect(gasDetails.gasPrice.toString()).to.equal('250000');
  });

  it('Should create gas details from token fee (6 decimals)', () => {
    createGasEstimateStubs(MOCK_GAS_ESTIMATE, MOCK_GAS_PRICE);

    const tokenFee = BigNumber.from(429).mul(BigNumber.from(10).pow(6)); // $390 "USDT" (0.12 ETH) + 10% profit/buffer fee.
    const gasDetails = createTransactionGasDetails(
      MOCK_CHAIN_ID,
      MOCK_GAS_ESTIMATE,
      MOCK_TOKEN_6_DECIMALS,
      tokenFee,
    );

    expect(gasDetails.gasLimit.toString()).to.equal('480000000000');
    expect(gasDetails.gasPrice.toString()).to.equal('250000');
  });

  it('[e2e] Should calculate token fee, then calculate equivalent gas fee', async () => {
    createGasEstimateStubs(MOCK_GAS_ESTIMATE, MOCK_GAS_PRICE);

    const populatedTransaction = getMockPopulatedTransaction();

    const estimateGasDetails = await getEstimateGasDetails(
      MOCK_CHAIN_ID,
      populatedTransaction,
    );
    const maximumGas = getMaximumGas(estimateGasDetails);
    const tokenFee = getTokenFee(MOCK_CHAIN_ID, maximumGas, MOCK_TOKEN_ADDRESS);
    const gasDetails = createTransactionGasDetails(
      MOCK_CHAIN_ID,
      MOCK_GAS_ESTIMATE,
      MOCK_TOKEN_ADDRESS,
      tokenFee,
    );

    expect(gasDetails.gasLimit.toString()).to.equal('480000000000');
    expect(gasDetails.gasPrice.toString()).to.equal('250000');
  });
}).timeout(10000);
