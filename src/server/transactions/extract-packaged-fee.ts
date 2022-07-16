import {
  ByteLength,
  formatToByteLength,
  nToBytes,
  nToHex,
  trim,
} from '@railgun-community/lepton/dist/utils/bytes';
import { BigNumber, Contract } from 'ethers';
import { Note } from '@railgun-community/lepton';
import { getSharedSymmetricKey } from '@railgun-community/lepton/dist/utils/keys-utils';
import { TransactionRequest } from '@ethersproject/providers';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { abiForProxyContract, abiForRelayAdaptContract } from '../abi/abi';
import { getProviderForNetwork } from '../providers/active-network-providers';
import {
  getRailgunAddressData,
  getRailgunWallet,
} from '../wallets/active-wallets';
import { Ciphertext } from '@railgun-community/lepton/dist/models/formatted-types';

const parseFormattedTokenAddress = (formattedTokenAddress: string) => {
  return `0x${trim(formattedTokenAddress, 20)}`;
};

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: BigNumber;
};

type CommitmentCiphertext = {
  ciphertext: BigNumber[];
  ephemeralKeys: BigNumber[];
  memo: BigNumber;
};

type BoundParams = {
  // uint16 treeNumber;
  // WithdrawType withdraw;
  // address adaptContract;
  // bytes32 adaptParams;
  commitmentCiphertext: CommitmentCiphertext[];
};

type TransactionData = {
  // SnarkProof proof;
  // uint256 merkleRoot;
  // uint256[] nullifiers;
  commitments: BigNumber[];
  boundParams: BoundParams;
  // CommitmentPreimage withdrawPreimage;
  // address overrideOutput;
};

enum TransactionName {
  Proxy = 'transact',
  RelayAdapt = 'relay',
}

export const extractPackagedFeeFromTransaction = (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
  useRelayAdapt: boolean,
): Promise<PackagedFee> => {
  if (useRelayAdapt) {
    return extractPackagedFeeFromRelayAdaptTransaction(
      chainID,
      transactionRequest,
    );
  }

  return extractPackagedFeeFromProxyTransaction(chainID, transactionRequest);
};

const extractPackagedFeeFromProxyTransaction = (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
): Promise<PackagedFee> => {
  const network = configNetworks[chainID];
  return extractPackagedFee(
    chainID,
    transactionRequest,
    TransactionName.Proxy,
    network.proxyContract,
    abiForProxyContract(),
  );
};

const extractPackagedFeeFromRelayAdaptTransaction = (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
): Promise<PackagedFee> => {
  const network = configNetworks[chainID];
  return extractPackagedFee(
    chainID,
    transactionRequest,
    TransactionName.RelayAdapt,
    network.relayAdaptContract,
    abiForRelayAdaptContract(),
  );
};

const extractPackagedFee = async (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
  transactionName: TransactionName,
  contractAddress: string,
  abi: Array<any>,
): Promise<PackagedFee> => {
  if (
    !transactionRequest.to ||
    transactionRequest.to.toLowerCase() !== contractAddress.toLowerCase()
  ) {
    throw new Error(
      `Invalid contract address: got ${transactionRequest.to}, expected ${contractAddress} for chain ${chainID}`,
    );
  }

  const provider = getProviderForNetwork(chainID);
  const contract = new Contract(contractAddress, abi, provider);

  const parsedTransaction = contract.interface.parseTransaction({
    data: (transactionRequest.data as string) ?? '',
    value: transactionRequest.value,
  });
  if (parsedTransaction.name !== transactionName) {
    throw new Error(`Contract method invalid: expected ${transactionName}`);
  }

  const viewingKeys = getRailgunWallet().getViewingKeyPair();
  const viewingPrivateKey = viewingKeys.privateKey;
  const { masterPublicKey } = getRailgunAddressData();

  const tokenPaymentAmounts: MapType<BigNumber> = {};

  // eslint-disable-next-line no-underscore-dangle
  const railgunTxs = parsedTransaction.args._transactions as any;

  await Promise.all(
    railgunTxs.map((railgunTx: any) =>
      extractFeesFromRailgunTransactions(
        railgunTx,
        tokenPaymentAmounts,
        viewingPrivateKey,
        masterPublicKey,
      ),
    ),
  );

  const tokens = Object.keys(tokenPaymentAmounts);
  if (tokens.length < 1) {
    throw new Error('No Relayer payment included in transaction.');
  }

  // Return first payment.
  return {
    tokenAddress: parseFormattedTokenAddress(tokens[0].toLowerCase()),
    packagedFeeAmount: tokenPaymentAmounts[tokens[0]],
  };
};

const getSharedKeySafe = (
  viewingPrivateKey: Uint8Array,
  ephemeralKey: Uint8Array,
) => {
  try {
    return getSharedSymmetricKey(viewingPrivateKey, ephemeralKey);
  } catch (err) {
    return null;
  }
};

const decryptSenderNoteSafe = (
  encryptedNote: Ciphertext,
  sharedKey: Uint8Array,
) => {
  try {
    const memoField: string[] = [];
    return Note.decrypt(encryptedNote, sharedKey , memoField );
  } catch (err) {
    return null;
  }
};

const extractFeesFromRailgunTransactions = async (
  railgunTx: TransactionData,
  tokenPaymentAmounts: MapType<BigNumber>,
  viewingPrivateKey: Uint8Array,
  masterPublicKey: bigint,
) => {
  const { commitments } = railgunTx;

  // First commitment should always be the fee.
  const index = 0;
  const hash = commitments[index];
  const ciphertext = railgunTx.boundParams.commitmentCiphertext[index];

  const ephemeralKeySenderBytes = nToBytes(
    BigInt(ciphertext.ephemeralKeys[0].toHexString()),
    ByteLength.UINT_256,
  );

  const sharedKey = await getSharedKeySafe(
    viewingPrivateKey,
    ephemeralKeySenderBytes,
  );
  if (sharedKey == null) {
    // Not addressed to us.
    return;
  }

  const ciphertextHexlified = ciphertext.ciphertext.map((el) =>
    formatToByteLength(el.toHexString(), ByteLength.UINT_256),
  );
  const ivTag = ciphertextHexlified[0];
  const encryptedNote: Ciphertext = {
    iv: ivTag.substring(0, 32),
    tag: ivTag.substring(32),
    data: ciphertextHexlified.slice(1),
  };
  const decryptedSenderNote = decryptSenderNoteSafe(encryptedNote, sharedKey);
  if (decryptedSenderNote == null) {
    // Addressed to us, but different note than fee.
    return;
  }

  if (decryptedSenderNote.masterPublicKey === masterPublicKey) {
    const noteHash = nToHex(decryptedSenderNote.hash, ByteLength.UINT_256);
    const commitHash = formatToByteLength(
      hash.toHexString(),
      ByteLength.UINT_256,
    );
    if (noteHash !== commitHash) {
      throw new Error(
        `Client attempted to steal from relayer via invalid ciphertext: Note hash mismatch ${noteHash} vs ${commitHash}.`,
      );
    }

    if (!tokenPaymentAmounts[decryptedSenderNote.token]) {
      // eslint-disable-next-line no-param-reassign
      tokenPaymentAmounts[decryptedSenderNote.token] = BigNumber.from(0);
    }
    // eslint-disable-next-line no-param-reassign
    tokenPaymentAmounts[decryptedSenderNote.token] = tokenPaymentAmounts[
      decryptedSenderNote.token
    ].add(decryptedSenderNote.value.toString());
  }
};
