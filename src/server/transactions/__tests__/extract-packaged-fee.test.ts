import { FallbackProvider } from '@ethersproject/providers';
import { Note, Lepton } from '@railgun-community/lepton';
import { RailgunProxyContract } from '@railgun-community/lepton/dist/contracts/railgun-proxy';
import { RelayAdaptContract } from '@railgun-community/lepton/dist/contracts/relay-adapt';
import {
  hexlify,
  padToLength,
  random,
} from '@railgun-community/lepton/dist/utils/bytes';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { AddressData } from '@railgun-community/lepton/dist/keyderivation/bech32-encode';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import { getMockRopstenNetwork, getMockToken } from '../../../test/mocks.test';
import { getLepton, initLepton } from '../../lepton/lepton-init';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../../providers/active-network-providers';
import {
  getActiveWallets,
  getRailgunAddressData,
  getRailgunWallet,
  initWallets,
} from '../../wallets/active-wallets';
import { extractPackagedFeeFromTransaction } from '../extract-packaged-fee';
import {
  createLeptonVerifyProofStub,
  createLeptonWalletBalancesStub,
  restoreLeptonStubs,
} from '../../../test/stubs/lepton-stubs.test';
import {
  SerializedTransaction,
  TokenType,
} from '@railgun-community/lepton/dist/models/formatted-types';
import { TransactionBatch } from '@railgun-community/lepton/dist/transaction/transaction-batch';

chai.use(chaiAsPromised);
const { expect } = chai;

let lepton: Lepton;
let proxyContract: RailgunProxyContract;
let relayAdaptContract: RelayAdaptContract;
let railgunWallet: RailgunWallet;
const RANDOM = random(16);
const MOCK_TOKEN_ADDRESS = getMockToken().address;

const TREE = 0;
const ROPSTEN_CHAIN_ID = NetworkChainID.Ropsten;
const HARDHAT_CHAIN_ID = NetworkChainID.HardHat;
const MOCK_MNEMONIC_1 =
  'test test test test test test test test test test test junk';

const createRopstenTransferTransactions = (
  addressData: AddressData,
  fee: BigNumber,
  tokenAddress: string,
): Promise<SerializedTransaction[]> => {
  const transaction = new TransactionBatch(
    tokenAddress,
    TokenType.ERC20,
    ROPSTEN_CHAIN_ID,
  );
  transaction.addOutput(
    new Note(addressData, RANDOM, fee.toHexString(), tokenAddress),
  );
  return transaction.generateDummySerializedTransactions(
    railgunWallet,
    configDefaults.lepton.dbEncryptionKey,
  );
};

const createRopstenRelayAdaptWithdrawTransactions = (
  addressData: AddressData,
  fee: BigNumber,
  tokenAddress: string,
): Promise<SerializedTransaction[]> => {
  const transaction = new TransactionBatch(
    tokenAddress,
    TokenType.ERC20,
    ROPSTEN_CHAIN_ID,
  );
  transaction.addOutput(
    new Note(addressData, RANDOM, fee.toHexString(), tokenAddress),
  );
  return transaction.generateDummySerializedTransactions(
    railgunWallet,
    configDefaults.lepton.dbEncryptionKey,
  );
};

describe('extract-packaged-fee', () => {
  before(async () => {
    initLepton();
    lepton = getLepton();

    configDefaults.wallet.mnemonic = MOCK_MNEMONIC_1;
    await initWallets();

    const ropstenNetwork = getMockRopstenNetwork();
    const {
      proxyContract: ropstenProxyContractAddress,
      relayAdaptContract: ropstenRelayAdaptContractAddress,
    } = ropstenNetwork;
    // Async call - run sync
    initNetworkProviders([ROPSTEN_CHAIN_ID, HARDHAT_CHAIN_ID]);
    const provider = getProviderForNetwork(ROPSTEN_CHAIN_ID);

    // Note: this call is typically async but we won't wait for the full call.
    // We just need to load the merkletrees.
    lepton.loadNetwork(
      ROPSTEN_CHAIN_ID,
      ropstenProxyContractAddress,
      ropstenRelayAdaptContractAddress,
      provider as FallbackProvider,
      0, // deploymentBlock
    );
    proxyContract = new RailgunProxyContract(
      ropstenProxyContractAddress,
      provider,
    );
    relayAdaptContract = new RelayAdaptContract(
      ropstenRelayAdaptContractAddress,
      provider,
    );
    railgunWallet = getRailgunWallet();

    const tokenAddressHexlify = hexlify(padToLength(MOCK_TOKEN_ADDRESS, 32));
    createLeptonWalletBalancesStub(tokenAddressHexlify, TREE);
    createLeptonVerifyProofStub();
  });

  after(() => {
    restoreLeptonStubs();
  });

  it('Should extract fee correctly - transfer', async () => {
    const fee = BigNumber.from('1000');
    const addressData = getRailgunAddressData();
    const transactions = await createRopstenTransferTransactions(
      addressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction = await proxyContract.transact(transactions);
    const packagedFee = await extractPackagedFeeFromTransaction(
      ROPSTEN_CHAIN_ID,
      populatedTransaction,
      false, // useRelayAdapt
    );
    expect(packagedFee.tokenAddress).to.equal(MOCK_TOKEN_ADDRESS.toLowerCase());
    expect(packagedFee.packagedFeeAmount.toString()).to.equal('1000');
  }).timeout(60000);

  it('Should fail for incorrect receiver address - transfer', async () => {
    const fee = BigNumber.from('1000');
    const addressData = Lepton.decodeAddress(
      '0zk1q8hxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kfrv7j6fe3z53llhxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kg0zpzts',
    );
    const transactions = await createRopstenTransferTransactions(
      addressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction = await proxyContract.transact(transactions);
    await expect(
      extractPackagedFeeFromTransaction(
        ROPSTEN_CHAIN_ID,
        populatedTransaction,
        false, // useRelayAdapt
      ),
    ).to.be.rejectedWith('No Relayer payment included in transaction.');
  }).timeout(60000);

  it('Should extract fee correctly - relay adapt', async () => {
    const fee = BigNumber.from('1000');
    const addressData = getRailgunAddressData();
    const transactions = await createRopstenRelayAdaptWithdrawTransactions(
      addressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction =
      await relayAdaptContract.populateWithdrawBaseToken(
        transactions,
        getActiveWallets()[0].address,
        RANDOM,
      );
    const packagedFee = await extractPackagedFeeFromTransaction(
      ROPSTEN_CHAIN_ID,
      populatedTransaction,
      true, // useRelayAdapt
    );
    expect(packagedFee.tokenAddress).to.equal(MOCK_TOKEN_ADDRESS.toLowerCase());
    expect(packagedFee.packagedFeeAmount.toString()).to.equal('1000');
  }).timeout(60000);

  it('Should fail for incorrect receiver address - relay adapt', async () => {
    const fee = BigNumber.from('1000');
    const addressData = Lepton.decodeAddress(
      '0zk1q8hxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kfrv7j6fe3z53llhxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kg0zpzts',
    );
    const transactions = await createRopstenRelayAdaptWithdrawTransactions(
      addressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction =
      await relayAdaptContract.populateWithdrawBaseToken(
        transactions,
        getActiveWallets()[0].address,
        RANDOM,
      );
    await expect(
      extractPackagedFeeFromTransaction(
        ROPSTEN_CHAIN_ID,
        populatedTransaction,
        true, // useRelayAdapt
      ),
    ).to.be.rejectedWith('No Relayer payment included in transaction.');
  }).timeout(60000);
}).timeout(120000);
