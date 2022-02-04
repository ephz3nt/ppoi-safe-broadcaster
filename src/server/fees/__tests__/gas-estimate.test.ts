/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chain-ids';
import { estimateMaximumGas } from '../gas-estimate';
import {
  getMockNetwork,
  getMockPopulatedTransaction,
} from '../../../test/mocks.test';
import {
  createGasEstimateStubs,
  restoreGasEstimateStubs,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { BigNumber } from 'ethers';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('gas-estimate', () => {
  before(() => {
    configNetworks[NetworkChainID.Ethereum] = getMockNetwork();
    initNetworkProviders();
  });

  afterEach(() => {
    restoreGasEstimateStubs();
  });

  it('Should calculate maximum gas based on gas estimate', async () => {
    const gasEstimate = BigNumber.from(1000);
    const gasPrice = BigNumber.from(100);
    createGasEstimateStubs(gasEstimate, gasPrice);

    const maximumGas = await estimateMaximumGas(
      NetworkChainID.Ethereum,
      getMockPopulatedTransaction(),
    );

    // (Gas estimate + 20%) * gas price.
    expect(maximumGas.toNumber()).to.equal(120000);
  });
}).timeout(10000);