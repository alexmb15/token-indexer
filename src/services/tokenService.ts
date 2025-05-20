import { TokenModel } from '../models/token.model.js';

export const upsertToken = async (token: any) => {
  await TokenModel.updateOne(
    { chainId: token.chainId, address: token.address },
    { $set: token },
    { upsert: true }
  );
};

export const isTokenNewOrUpdated = (oldT: any, newT: any) =>
  !oldT || ['symbol','name','decimals','logoURI'].some(k => oldT[k] !== newT[k]);
