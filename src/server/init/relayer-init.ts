import { getLepton, initLepton } from '../lepton/lepton-init';
import { initWallets } from '../wallets/active-wallets';
import { initNetworkProviders } from '../providers/active-network-providers';
import {
  initPricePoller,
  stopTokenPricePolling,
} from '../tokens/token-price-poller';
import { logger } from '../../util/logger';
import { initSettingsDB, closeSettingsDB } from '../db/settings-db';
// @ts-ignore
import { myConfigOverrides } from '../../MY-CONFIG';
import { initTokens } from '../tokens/network-tokens';
import {
  initTopUpPoller,
  stopTopUpPolling,
} from '../wallets/wallet-top-up-poller';

export const initRelayerModules = async (forTest = false) => {
  if (!forTest) {
    myConfigOverrides && myConfigOverrides();
  }
  initSettingsDB();
  initLepton();
  await initNetworkProviders();
  await Promise.all([initWallets(), initTokens()]);
  initPricePoller();
  initTopUpPoller();
  logger.log('Relayer ready.');
};

export const uninitRelayerModules = () => {
  stopTokenPricePolling();
  logger.log('stopping token price polling');
  stopTopUpPolling();
  logger.log('stopping wallet top up polling');
  closeSettingsDB();
  logger.log('closed settings db');
  getLepton().unload();
  logger.log('unloaded lepton');
};
