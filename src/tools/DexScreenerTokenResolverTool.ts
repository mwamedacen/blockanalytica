import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define interfaces for DexScreener API response
interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}

interface DexScreenerPair {
  chainId: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  liquidity: {
    usd: number;
  };
}

// Define the schema for the tool's input
const DexScreenerTokenResolverSchema = z.object({
  ticker: z.string().describe("The token ticker/symbol to search for"),
  chain: z.string().optional().default("base").describe("The chain to search on (default: base)")
});

// Chain ID mapping
const CHAIN_IDS = {
  'base': 'base',
  'ethereum': 'ethereum',
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
  // Add more chains as needed
};

// Create the tool using the functional approach
export const DexScreenerTokenResolverTool = tool(
  async ({ ticker, chain }: z.infer<typeof DexScreenerTokenResolverSchema>) => {
    try {
      const chainId = CHAIN_IDS[chain.toLowerCase()];
      if (!chainId) {
        return JSON.stringify({
          success: false,
          error: `Unsupported chain: ${chain}`
        });
      }

      // Query DexScreener API
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`);
      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.statusText}`);
      }

      const data = await response.json() as DexScreenerResponse;
      
      // Filter pairs for the specified chain and sort by liquidity
      const chainPairs = data.pairs
        .filter(pair => pair.chainId.toLowerCase() === chainId)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

      if (chainPairs.length === 0) {
        return JSON.stringify({
          success: false,
          error: `No pairs found for token ${ticker} on chain ${chain}`
        });
      }

      // Get the pair with highest liquidity
      const bestPair = chainPairs[0];
      
      return JSON.stringify({
        success: true,
        token: {
          address: bestPair.baseToken.address,
          name: bestPair.baseToken.name,
          symbol: bestPair.baseToken.symbol,
          chain: chain,
          liquidity_usd: bestPair.liquidity.usd
        }
      });
    } catch (error: any) {
      console.error("Error resolving token:", error);
      return JSON.stringify({
        success: false,
        error: `Failed to resolve token: ${error.message}`
      });
    }
  },
  {
    name: "dexscreener_token_resolver",
    description: "Resolves a token ticker to its contract address on a specific chain using DexScreener, picking the pool with highest liquidity",
    schema: DexScreenerTokenResolverSchema,
  }
); 