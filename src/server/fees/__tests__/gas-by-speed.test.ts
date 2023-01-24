import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { EVMGasType } from '@railgun-community/shared-models';
import { GasHistoryPercentile } from '../../../models/gas-models';
import { getGasDetailsForSpeed } from '../gas-by-speed';
import { NetworkChainID } from '../../config/config-chains';
import { RelayerChain } from '../../../models/chain-models';
import { ChainType } from '@railgun-community/engine';

chai.use(chaiAsPromised);
const { expect } = chai;

const chain: RelayerChain = {
  type: ChainType.EVM,
  id: NetworkChainID.PolygonPOS,
};

describe('gas-by-speed', () => {
  it('Should get gas speeds from live BlockNative API - Type0', async () => {
    await Promise.all(
      Object.values(GasHistoryPercentile)
        .filter((v) => !Number.isNaN(Number(v)))
        .map(async (percentile) => {
          const gasDetails = await getGasDetailsForSpeed(
            EVMGasType.Type0,
            chain,
            percentile as GasHistoryPercentile,
          );
          if (gasDetails.evmGasType !== EVMGasType.Type0) {
            throw new Error('Incorrect gas type');
          }
          expect(gasDetails.gasPrice.toNumber()).to.be.greaterThan(
            1_000_000_000,
          );
          expect(gasDetails.gasPrice.toNumber()).to.be.lessThan(
            2_500_000_000_000,
          );
        }),
    );
  });

  it('Should get gas speeds from live BlockNative API - Type2', async () => {
    await Promise.all(
      Object.values(GasHistoryPercentile)
        .filter((v) => !Number.isNaN(Number(v)))
        .map(async (percentile) => {
          const gasDetails = await getGasDetailsForSpeed(
            EVMGasType.Type2,
            chain,
            percentile as GasHistoryPercentile,
          );
          if (gasDetails.evmGasType !== EVMGasType.Type2) {
            throw new Error('Incorrect gas type');
          }
          expect(gasDetails.maxFeePerGas.toNumber()).to.be.greaterThan(
            1_000_000_000,
          );
          expect(gasDetails.maxFeePerGas.toNumber()).to.be.lessThan(
            2_500_000_000_000,
          );
          expect(gasDetails.maxPriorityFeePerGas.toNumber()).to.be.greaterThan(
            1_000_000_000,
          );
          expect(gasDetails.maxPriorityFeePerGas.toNumber()).to.be.lessThan(
            2_500_000_000_000,
          );
        }),
    );
  });
});