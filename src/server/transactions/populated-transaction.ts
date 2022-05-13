import { TransactionRequest } from '@ethersproject/providers';
import { parse, Transaction } from '@ethersproject/transactions';
import { logger } from '../../util/logger';

export const deserializeTransaction = (
  rawTransaction: string,
): TransactionRequest => {
  try {
    const transaction: Transaction = parse(rawTransaction);
    return {
      ...transaction,
      type: transaction.type ?? undefined,
    };
  } catch (err) {
    logger.error(err);
    throw new Error('Could not deserialize transaction.');
  }
};
