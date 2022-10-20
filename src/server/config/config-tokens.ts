import { NetworkTokensConfig } from '../../models/config-models';
import {
  TokenAddressGoerli,
  TokenAddressPolygonMumbai,
} from './config-token-addresses';
import {
  STABLES_ETH,
  STABLES_BSC,
  STABLES_POLY,
  BLUECHIP_ETH,
  REN_TOKENS_ETH,
  BLUECHIP_BSC,
  BLUECHIP_POLY,
} from './config-token-sets';
import { NetworkChainID } from './config-chains';
import { ChainType } from '@railgun-community/engine/dist/models/engine-types';

/**
 *
 * The token defaults, like all other configs, can be appended safely
 * in MY-CONFIG, using the following syntax:
 *
 *  configTokens[ChainType.EVM][NetworkChainID.Ethereum]['0x_token_address'] = {
 *    symbol: 'TOKEN1',
 *  };
 *
 */

const tokensConfig: NetworkTokensConfig = {
  [ChainType.EVM]: {
    [NetworkChainID.Ethereum]: {
      ...STABLES_ETH,
      ...BLUECHIP_ETH,
      ...REN_TOKENS_ETH,
    },
    [NetworkChainID.EthereumGoerli]: {
      [TokenAddressGoerli.WETH]: {
        symbol: 'WETH',
      },
      [TokenAddressGoerli.DAI]: {
        symbol: 'DAI',
      },
    },
    [NetworkChainID.BNBChain]: {
      ...BLUECHIP_BSC,
      ...STABLES_BSC,
    },
    [NetworkChainID.PolygonPOS]: {
      ...STABLES_POLY,
      ...BLUECHIP_POLY,
    },
    [NetworkChainID.PolygonMumbai]: {
      [TokenAddressPolygonMumbai.WMATIC]: {
        symbol: 'WMATIC',
      },
    },
    [NetworkChainID.Hardhat]: {
      '0x5FbDB2315678afecb367f032d93F642f64180aa3': {
        symbol: 'TESTERC20',
      },
    },
  },
};

export default tokensConfig;
