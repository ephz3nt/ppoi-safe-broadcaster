import { NetworkTokensConfig } from '../models/config-models';
import { NetworkChainID } from './config-chain-ids';

enum TokenAddressEth {
  WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7',
}
enum TokenAddressRopsten {
  WETH = '0xc778417e063141139fce010982780140aa0cd5ab',
}
enum TokenAddressBSC {
  WBNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
}
enum TokenAddressPoly {
  WMATIC = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
}

export default {
  [NetworkChainID.Ethereum]: {
    [TokenAddressEth.WETH]: {
      symbol: 'WETH',
    },
  },
  [NetworkChainID.Ropsten]: {
    [TokenAddressRopsten.WETH]: {
      symbol: 'WETH',
    },
  },
  [NetworkChainID.BinanceSmartChain]: {
    [TokenAddressBSC.WBNB]: {
      symbol: 'WBNB',
    },
  },
  [NetworkChainID.PolygonPOS]: {
    [TokenAddressPoly.WMATIC]: {
      symbol: 'WMATIC',
    },
  },
  [NetworkChainID.HardHat]: {},
} as NetworkTokensConfig;