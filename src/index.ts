import 'dotenv/config';
import { SupervisorAgent } from './SupervisorAgent';
import { CopyTraderResult } from './types';

async function main() {
  try {
    // Initialize the supervisor agent
    const supervisor = new SupervisorAgent();

    // Get user query from command line arguments or use default example
    const userQuery = process.argv[2] || "Check if wallet CRVidEDtEUTYZisCxBZkpELzhQc9eauMLR3FWg74tReL has any copy traders";
    
    console.log(`User query: "${userQuery}"`);
    console.log("Processing...");
    
    // Process the user query
    const result = await supervisor.processQuery(userQuery, "ethereum");
    
    // Print the results
    console.log("\n=== Analysis Results ===");
    
    if (result && typeof result === 'object') {
      if ('target_wallet' in result) {
        // Handle CopyTraderResult
        const copyTraderResult = result as CopyTraderResult;
        console.log(`Target Wallet: ${copyTraderResult.target_wallet}`);
        console.log(`Total Copy Traders Found: ${copyTraderResult.total_copy_traders_found}`);
        
        if (copyTraderResult.copy_traders && copyTraderResult.copy_traders.length > 0) {
          console.log("\nPotential Copy Traders:");
          copyTraderResult.copy_traders.forEach((trader, index) => {
            console.log(`\n${index + 1}. Wallet: ${trader.wallet_address}`);
            console.log(`   Average Time Delay: ${trader.avg_time_delay_seconds} seconds`);
            console.log(`   Average Volume Ratio: ${trader.avg_volume_ratio}`);
            console.log(`   Correlated Swaps: ${trader.correlated_swaps.length}`);
          });
        } else {
          console.log("\nNo potential copy traders found.");
        }
      } else {
        // Handle other structured results
        console.log(JSON.stringify(result, null, 2));
      }
    } else if (typeof result === 'string') {
      // Handle string results (like ENS resolution)
      console.log(result);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error); 