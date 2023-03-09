import { BigNumber } from '@ethersproject/bignumber';

export const removeNaNs = (a: number[]): number[] => {
  const newArray: number[] = [];
  a.forEach((item) => {
    if (!Number.isNaN(item)) {
      newArray.push(item);
    }
  });
  return newArray;
};

export function removeUndefineds<T>(a: Optional<T>[]): T[] {
  const newArray: T[] = [];
  for (const item of a) {
    if (item != null) {
      newArray.push(item);
    }
  }
  return newArray;
}

export const resetMapObject = <T>(map: MapType<T> | NumMapType<T>) => {
  for (const key in map) {
    if ({}.hasOwnProperty.call(map, key)) {
      // eslint-disable-next-line no-param-reassign
      delete (map as MapType<T>)[key];
    }
  }
};

export const resetArray = (a: object[]) => {
  // eslint-disable-next-line no-param-reassign
  a.length = 0;
};

export const maxBigNumber = (b1: BigNumber, b2: BigNumber) => {
  return b1.gt(b2) ? b1 : b2;
};

export const minBigNumber = (b1: BigNumber, b2: BigNumber) => {
  return b1.lt(b2) ? b1 : b2;
};
