import { ethers } from 'ethers';
import { EigenDAClient } from 'eigenda-sdk';
import * as dotenv from 'dotenv';

// Import ABIs and addresses
import * as avsDeployment from './eigen-contracts/deployments/chain-analytica/17000.json';
import * as coreDeployment from './eigen-contracts/deployments/core/17000.json';
import chainAnalyticaServiceManagerABI from './eigen-contracts/abis/ChainAnalyticaServiceManager.json';
import delegationManagerABI from './eigen-contracts/abis/IDelegationManager.json';
import stakeRegistryABI from './eigen-contracts/abis/ECDSAStakeRegistry.json';
import avsDirectoryABI from './eigen-contracts/abis/IAVSDirectory.json';

// Load environment variables
dotenv.config();

if (!process.env.WS_RPC_URL || !process.env.PK_OPERATOR || !process.env.PK_EIGENDA || !process.env.API_CHAIN_ANALYTICA_HTTP) {
  throw new Error('Missing required environment variables');
}

class AVSOperator {
  private provider: ethers.WebSocketProvider;
  private signer: ethers.Wallet;
  private eigenDAClient: EigenDAClient;
  private identifier: Uint8Array;
  private chainAnalyticaServiceManagerAddress: string;
  private chainAnalyticaServiceManager: ethers.Contract;
  private delegationManager: ethers.Contract;
  private avsDirectory: ethers.Contract;
  private ecdsaRegistryContract: ethers.Contract;
  private isRunning: boolean = false;

  constructor() {
    // Initialize WebSocket provider and signer
    this.provider = new ethers.WebSocketProvider(process.env.WS_RPC_URL!);
    this.signer = new ethers.Wallet(process.env.PK_OPERATOR!, this.provider);

    this.eigenDAClient = new EigenDAClient({
      privateKey: process.env.PK_EIGENDA
    });

    this.identifier = new Uint8Array(Array(31).fill(0).concat([9]));
    this.chainAnalyticaServiceManagerAddress = avsDeployment.addresses.chainAnalyticaServiceManager;
    
    // Initialize contracts
    this.chainAnalyticaServiceManager = new ethers.Contract(
      this.chainAnalyticaServiceManagerAddress,
      chainAnalyticaServiceManagerABI,
      this.signer
    );

    // Initialize delegation manager contract
    this.delegationManager = new ethers.Contract(
      coreDeployment.addresses.delegationManager,
      delegationManagerABI,
      this.signer
    );

    // Initialize AVS directory contract 
    this.avsDirectory = new ethers.Contract(
      coreDeployment.addresses.avsDirectory,
      avsDirectoryABI,
      this.signer
    );

    // Initialize ECDSA registry contract
    this.ecdsaRegistryContract = new ethers.Contract(
      avsDeployment.addresses.stakeRegistry,
      stakeRegistryABI, 
      this.signer
    );
  }

  async registerOperator  ()  {
    
    // Registers as an Operator in EigenLayer.
    // try {
    //     const tx1 = await this.delegationManager.registerAsOperator({
    //       initDelegationApprover: "0x0000000000000000000000000000000000000000",
    //       //delegationApprover: "0x0000000000000000000000000000000000000000",
    //       allocationDelay: 0,
    //       metadataURI: ""
    //     }, "");
    //     await tx1.wait();
    //     console.log("Operator registered to Core EigenLayer contracts");
    // } catch (error) {
    //     console.error("Error in registering as operator:", error);
    // }
    
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + 3600; // Example expiry, 1 hour from now

    // Define the output structure
    let operatorSignatureWithSaltAndExpiry = {
        signature: "",
        salt: salt,
        expiry: expiry
    };

    // Calculate the digest hash, which is a unique value representing the operator, avs, unique value (salt) and expiration date.
    const operatorDigestHash = await this.avsDirectory.calculateOperatorAVSRegistrationDigestHash(
        this.signer.address, 
        await this.chainAnalyticaServiceManager.getAddress(), 
        salt, 
        expiry
    );
    console.log(operatorDigestHash);
    
    // Sign the digest hash with the operator's private key
    console.log("Signing digest hash with operator's private key");
    const operatorSigningKey = new ethers.SigningKey(process.env.PK_OPERATOR!);
    const operatorSignedDigestHash = operatorSigningKey.sign(operatorDigestHash);

    // Encode the signature in the required format
    operatorSignatureWithSaltAndExpiry.signature = ethers.Signature.from(operatorSignedDigestHash).serialized;

    console.log("Registering Operator to AVS Registry contract");

    
    // Register Operator to AVS
    // Per release here: https://github.com/Layr-Labs/eigenlayer-middleware/blob/v0.2.1-mainnet-rewards/src/unaudited/ECDSAStakeRegistry.sol#L49
    const tx2 = await this.ecdsaRegistryContract.registerOperatorWithSignature(
        operatorSignatureWithSaltAndExpiry,
        this.signer.address
    );
    await tx2.wait();
    console.log("Operator registered on AVS successfully");
}


  private async handleTask(taskIndex: number, taskCreatedBlock: number, taskName: string) {
    try {
      console.log(`Processing task ${taskIndex}: ${taskName}`);

      // Make API call to get response
      const response = await fetch(process.env.API_CHAIN_ANALYTICA_HTTP!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: taskName })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const { agentStatus, response: stringifiedJson } = await response.json();
      const parsedJson = JSON.parse(stringifiedJson.replace(/```json\n|\n```/g, ''));

      // Upload to EigenDA
      const uploadResult = await this.eigenDAClient.upload(
        JSON.stringify(parsedJson),
        this.identifier
      ) as unknown as { job_id: string };

      console.log('Upload Job ID:', uploadResult.job_id);

      // Format response
      const taskResponse = `${uploadResult.job_id}:${parsedJson.message}`;

      // Send transaction
      const tx = await this.chainAnalyticaServiceManager.respondToTask(
        { name: taskName, taskCreatedBlock },
        taskIndex,
        taskResponse
      );
      await tx.wait();

      // Wait for EigenDA confirmation
      //await this.eigenDAClient.waitForStatus(uploadResult.job_id, 'CONFIRMED');

      console.log(`Task ${taskIndex} completed successfully`);
    } catch (error) {
      console.error(`Error handling task ${taskIndex}:`, error);
    }
  }

  async start() {
    //await this.handleTask(4, 3432206, "resolve nick.eth");
    if (this.isRunning) {
      console.log('Operator is already running');
      return;
    }

    console.log('Starting AVS operator...');

    // Set up WebSocket event listener
    this.chainAnalyticaServiceManager.on('NewTaskCreated', async (taskIndex: number, task: { taskCreatedBlock: number, name: string }) => {
      await this.handleTask(taskIndex, task.taskCreatedBlock, task.name);
    });

    // Set up WebSocket error handling and reconnection
    this.provider.on('error', async (error) => {
      console.error('WebSocket error:', error);
      await this.reconnect();
    });

    this.isRunning = true;
    console.log('AVS operator is running with WebSocket connection');

    // Keep the process alive
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());

    // Keep the process running indefinitely
    return new Promise(() => {});
  }

  private async reconnect() {
    try {
      await this.stop();
      this.provider = new ethers.WebSocketProvider(process.env.WS_RPC_URL!);
      this.signer = new ethers.Wallet(process.env.PK_OPERATOR!, this.provider);
      this.chainAnalyticaServiceManager = new ethers.Contract(
        this.chainAnalyticaServiceManagerAddress,
        chainAnalyticaServiceManagerABI,
        this.signer
      );
      await this.start();
    } catch (error) {
      console.error('Failed to reconnect:', error);
      // Attempt to reconnect again after delay
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Operator is not running');
      return;
    }

    console.log('Stopping AVS operator...');
    this.chainAnalyticaServiceManager.removeAllListeners();
    await this.provider.destroy();
    this.isRunning = false;
    console.log('AVS operator stopped');
    process.exit(0);
  }
}

// Start the operator
const operator = new AVSOperator();
//operator.registerOperator().finally(() => {
operator.start().catch((error: Error) => {
  console.error('Failed to start operator:', error);
  process.exit(1);
});
//});
