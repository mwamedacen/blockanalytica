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
  quoteToken: {
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
  ticker: z.string().describe("The token ticker/symbol to search for. It should not have $ / cashtag symbols."),
  chain: z.string().optional().default("base").describe("The chain to search on (default: base)")
});

// Chain ID mapping
const CHAIN_IDS: { [key: string]: string } = {
  'base': 'base',
  'ethereum': 'ethereum',
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
  // Add more chains as needed
};

// Create the tool using the functional approach
export const DexScreenerTokenResolverTool = tool(
  async ({ ticker, chain }: z.infer<typeof DexScreenerTokenResolverSchema>) => {
    // Check for cashtag at start of ticker
    if (ticker.startsWith('$')) {
      throw new Error('Ticker should not start with $ symbol. Please remove the cashtag.');
    }
    
    console.log(`[DexScreenerTokenResolver] Starting resolution for ticker: ${ticker} on chain: ${chain}`);
    try {
      // Safely get chain ID
      const chainLower = chain.toLowerCase();
      if (!(chainLower in CHAIN_IDS)) {
        console.warn(`[DexScreenerTokenResolver] Unsupported chain requested: ${chain}`);
        return JSON.stringify({
          success: false,
          error: `Unsupported chain: ${chain}`
        });
      }
      const chainId = CHAIN_IDS[chainLower];

      console.log(`[DexScreenerTokenResolver] Querying DexScreener API for ${ticker}...`);
      // Query DexScreener API with error handling
      let response;
      try {
        response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker} ${chainId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (fetchError: any) {
        console.error(`[DexScreenerTokenResolver] API fetch error: ${fetchError.message}`);
        throw new Error(`DexScreener API fetch failed: ${fetchError.message}`);
      }

      let data;
      try {
        data = await response.json() as DexScreenerResponse;
      } catch (parseError: any) {
        console.error(`[DexScreenerTokenResolver] JSON parse error: ${parseError.message}`);
        throw new Error('Failed to parse DexScreener API response');
      }

      console.log(`[DexScreenerTokenResolver] Found ${data.pairs.length} total pairs from DexScreener`);
      
      // Filter pairs for the specified chain and sort by liquidity
      try {
        const chainPairs = data.pairs
          .filter(pair => 
            pair.chainId.toLowerCase() === chainId && 
            (pair.baseToken.symbol.toLowerCase() === ticker.toLowerCase() || 
             pair.quoteToken.symbol.toLowerCase() === ticker.toLowerCase())
          )
          .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

        console.log(`[DexScreenerTokenResolver] Filtered to ${chainPairs.length} pairs on ${chain}`);

        if (chainPairs.length === 0) {
          console.warn(`[DexScreenerTokenResolver] No pairs found for ${ticker} on ${chain}`);
          return JSON.stringify({
            success: false,
            error: `No pairs found for token ${ticker} on chain ${chain}`
          });
        }

        // Get the pair with highest liquidity
        const bestPair = chainPairs[0];
        console.log(`[DexScreenerTokenResolver] Selected best pair: ${bestPair.baseToken.symbol}/${bestPair.quoteToken.symbol} with $${bestPair.liquidity.usd.toLocaleString()} liquidity`);
        
        // Determine which token in the pair matches our search
        const baseTokenMatch = bestPair.baseToken.symbol.toLowerCase() === ticker.toLowerCase();
        const quoteTokenMatch = bestPair.quoteToken.symbol.toLowerCase() === ticker.toLowerCase();

        if (!baseTokenMatch && !quoteTokenMatch) {
          throw new Error(`Could not find exact symbol match for ${ticker} in pair ${bestPair.baseToken.symbol}/${bestPair.quoteToken.symbol}`);
        }

        const matchingToken = baseTokenMatch ? bestPair.baseToken : bestPair.quoteToken;
        return JSON.stringify({
          success: true,
          token: {
            address: matchingToken.address,
            name: matchingToken.name,
            symbol: matchingToken.symbol,
            chain: chain,
            liquidity_usd: bestPair.liquidity.usd
          }
        });
      } catch (processingError: any) {
        console.error(`[DexScreenerTokenResolver] Error processing pairs: ${processingError.message}`);
        throw new Error(`Failed to process token pairs: ${processingError.message}`);
      }
    } catch (error: any) {
      console.error(`[DexScreenerTokenResolver] Error resolving token: ${error.message}`);
      console.error(error.stack);
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