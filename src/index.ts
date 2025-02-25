import 'dotenv/config';
import { SupervisorAgent } from './SupervisorAgent';

async function main() {
  try {
    // Initialize the supervisor agent
    const supervisor = new SupervisorAgent();

    // Get user query from command line arguments or use default example
    const userQuery = process.argv[2] || "Check if wallet CRVidEDtEUTYZisCxBZkpELzhQc9eauMLR3FWg74tReL has any copy traders";
    
    console.log(`User query: "${userQuery}"`);
    console.log("Processing...");
    
    // Process the user query
    const result = await supervisor.processQuery(userQuery);
    
    // Print the results
    console.log("\n=== Analysis Results ===");
    if(typeof result === 'object'){
        console.log(JSON.stringify(result, null, 2));
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