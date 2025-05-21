import axios from 'axios';
import axiosRetry from 'axios-retry';
import { Queue } from 'bullmq';
import { upsertToken, isTokenNewOrUpdated } from '../services/tokenService.js';
import { providerForChain } from '../loaders/provider.js';
import { NETWORK_MAP_COINGECKO } from '../constants/network.map.js';
import crypto from 'crypto';
import { redis } from '../loaders/redis.js';
import { logger } from '../loaders/logger.js';

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

export const tokenQueue = new Queue('token-fetch', { connection: redis });

export const fetchTokensJob = async (chainId: number) => {
  /* ------------------------------------------------------------------ *
   * 1. Forming a URL list for a specific network
   * ------------------------------------------------------------------ */
  const platformId = NETWORK_MAP_COINGECKO[chainId];
  if (!platformId) {
    logger.warn({ chainId }, 'CoinGecko list not supported for this chain');
    return;
  }

  const url = `https://tokens.coingecko.com/${platformId}/all.json`;

  /* ------------------------------------------------------------------ *
   * 2. Loading list + retry
   * ------------------------------------------------------------------ */
  const { data } = await axios.get(url);
  if (!data?.tokens) {
    logger.warn({ url }, 'Unexpected response from CoinGecko');
    return;
  }

  const tokenlist: any[] = data.tokens;

  /* ------------------------------------------------------------------ *
   * 3. We bring it to a single format
   * ------------------------------------------------------------------ */
  const normalized = tokenlist
    .filter(t => t.chainId === chainId)
    .map(t => ({ ...t, address: t.address.toLowerCase() }));

  /* ------------------------------------------------------------------ *
   * 4. Hash Snapshot and Diff
   * ------------------------------------------------------------------ */
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');

  const snapshotKey = `snapshot_hash:${chainId}`;
  const oldHash = await redis.get(snapshotKey);

  if (oldHash === hash) return; // No token changes detected
/*
  if (oldHash === hash) {
    logger.info({ chainId }, 'No token changes detected');
    return;
  }
*/
  const oldTokensArr = JSON.parse(
    (await redis.get(`snapshot:${chainId}`)) || '[]'
  );
  const oldMap = new Map(oldTokensArr.map((t: any) => [t.address, t]));

  const diff = normalized.filter(t => {
    const old = oldMap.get(t.address);
    return isTokenNewOrUpdated(old, t);
  });

  /* ------------------------------------------------------------------ *
   * 5. Enrich + upsert
   * ------------------------------------------------------------------ */
  const provider = providerForChain(chainId);
  for (const t of diff) {
  // here you can add on-chain verify totalSupply / decimals
  /*
  try {
    const contract = new Contract(getAddress(t.address), ERC20, provider);
    const [rawSupply, rawDecimals] = await Promise.all([
      contract.totalSupply(),
      contract.decimals()
    ]);

    t.totalSupply = rawSupply.toString();
    t.decimals    = rawDecimals;          // override if different
  } catch (e) {
    logger.warn({ address: t.address, err: e }, 'On-chain read failed');
  }
  * */
    await upsertToken(t);
  }

  /* ------------------------------------------------------------------ *
   * 6. Save a new snapshot
   * ------------------------------------------------------------------ */
  await redis.mset({
    [snapshotKey]: hash,
    [`snapshot:${chainId}`]: JSON.stringify(normalized),
  });

  logger.info(
    { chainId, insertedOrUpdated: diff.length },
    'CoinGecko list processed'
  );
};
