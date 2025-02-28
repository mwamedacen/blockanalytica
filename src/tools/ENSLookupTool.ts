import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// Define the schema for the tool's input
const ENSLookupSchema = z.object({
  ens_domain: z.string().describe("The ENS domain to resolve (e.g., 'vitalik.eth')")
});

// Initialize Ethereum client
const getEthClient = () => {
  return createPublicClient({
    chain: mainnet,
    transport: http("https://eth.llamarpc.com")
  });
};

// Create the tool using the functional approach
export const ENSLookupTool = tool(
  async ({ ens_domain }: z.infer<typeof ENSLookupSchema>) => {
    try {
      // Ensure the domain has .eth suffix if not provided
      const ensName = ens_domain.includes('.') ? ens_domain : `${ens_domain}.eth`;
      
      const client = getEthClient();
      
      // Resolve ENS name to address
      const address = await client.getEnsAddress({
        name: ensName,
      });
      
      if (!address) {
        throw new Error(`No address found for ENS domain: ${ensName}`);
      }
      
      return JSON.stringify({ 
        success: true, 
        ens_domain: ensName, 
        address 
      });
    } catch (error: any) {
      console.error("Error resolving ENS domain:", error);
      throw new Error(error.message);
    }
  },
  {
    name: "ens_lookup",
    description: "Resolves an ENS domain to its corresponding Ethereum address. The ENS domain must be in the format of X.eth",
    schema: ENSLookupSchema,
  }
); 