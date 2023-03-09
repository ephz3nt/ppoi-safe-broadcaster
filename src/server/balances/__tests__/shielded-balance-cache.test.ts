import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chains';
import {
  getPrivateTokenBalanceCache,
  updateShieldedBalances,
} from '../shielded-balance-cache';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { BigNumber } from '@ethersproject/bignumber';
import { startEngine } from '../../engine/engine-init';
import { ChainType } from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = {
  type: ChainType.EVM,
  id: NetworkChainID.Ethereum,
};

const MOCK_TOKEN_AMOUNT = BigNumber.from('1000000000000000000000');

describe('shielded-balance-cache', () => {
  before(async () => {
    startEngine();
    await setupSingleTestWallet();
  });

  it('Should find no shielded token balances', () => {
    expect(getPrivateTokenBalanceCache(MOCK_CHAIN)).to.deep.equal([]);
  });

  it.skip('Should pull shielded token balance of live wallet', async () => {
    await updateShieldedBalances(MOCK_CHAIN, false);
    const mockBalance =
      getPrivateTokenBalanceCache(MOCK_CHAIN)[0].tokenAmount.amount;
    expect(mockBalance.toBigInt()).to.equal(MOCK_TOKEN_AMOUNT.toBigInt());
  });
}).timeout(30000);
