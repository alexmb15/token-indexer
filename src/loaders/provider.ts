import { JsonRpcProvider } from 'ethers';

const RPC_ENV_MAP: Record<number, string | undefined> = {
  1: process.env.RPC_URL_ETH,
  56: process.env.RPC_URL_BSC,
  137: process.env.RPC_URL_POLYGON,
  42161: process.env.RPC_URL_ARBITRUM,
  10: process.env.RPC_URL_OPTIMISM,
};

export const providerForChain = (chainId: number): JsonRpcProvider => {
  const url = RPC_ENV_MAP[chainId];
  if (!url) throw new Error(`No RPC URL configured for chain ${chainId}`);
  return new JsonRpcProvider(url);
};
