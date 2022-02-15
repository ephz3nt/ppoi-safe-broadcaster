import { DebugLevel } from '../../models/debug-models';
import { NetworkChainID } from './config-chain-ids';
import secrets from './config-secrets';

export default {
  // Blockchain networks to activate.
  useNetworks: [
    NetworkChainID.Ethereum,
    NetworkChainID.Ropsten,
    NetworkChainID.HardHat,
    // NetworkChainID.BinanceSmartChain,
    // NetworkChainID.PolygonPOS,
  ],

  // Refresh all token prices every 30 seconds.
  // Note that free Coingecko API tier only allows 50 requests per minute.
  // We send one request per network for every refresh (disregarding test nets).
  tokenPriceRefreshDelayInMS: 30 * 1000,

  // Retry Coingecko lookup one time.
  numRetriesCoingeckoPriceLookup: 1,

  // Log extra information about tokens, fees and incoming transactions.
  // Options: None, VerboseLogs, WarningsErrors, OnlyErrors
  debugLevel: DebugLevel.VerboseLogs,

  // Whether to show verbose Lepton debugging logs.
  debugLepton: false,

  // How long to cache Gas Token balances.
  gasTokenBalanceCacheTTLInMS: 5 * 60 * 1000,

  // How long to cache the fee sent for a given transaction.
  transactionFeeCacheTTLInMS: 2 * 60 * 1000,

  // Precision for transaction fee ratio calculations.
  transactionFeePrecision: 10 ** 8,

  // Used when calculating the ratio of token price to gas token price.
  // We guard against price ratios under this amount, which are too imprecise.
  transactionFeeRatioMinimum: 10 ** 3,

  // directory in which leveldown db will be stored
  leptonDb: process.env.LEPTON_DB ?? 'server.db',

  // Key used to encrypt wallets in the Lepton database.
  leptonDbEncryptionKey: secrets.dbEncryptionKey,

  // secret mnemonic phrase
  mnemonic: secrets.mnemonic,

  // Broadcast fees every 15 seconds.
  broadcastFeesDelayInMS: 15 * 1000,

  // Waku options.
  //  peers to request waku rpc to connect to
  directPeers: [
    '/dns4/relayer.of.holdings/tcp/8000/wss/p2p/16Uiu2HAmMUjGmiUhJeiZgu6ZZnLRkE2VViR2JgjqtW9aTZnHQqgg',
  ],
  //  url of nim-waku rpc server (eg http://localhost:8546)
  wakuRpcUrl: process.env.WAKU_RPC_URL ?? 'http://localhost:8546',
};
