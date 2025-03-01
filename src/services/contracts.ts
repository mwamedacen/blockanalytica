import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Import ABIs and addresses
import * as coreDeployment from '../eigen-contracts/deployments/core/17000.json';
import * as avsDeployment from '../eigen-contracts/deployments/chain-analytica/17000.json';
import delegationManagerABI from '../eigen-contracts/abis/IDelegationManager.json';
import ecdsaRegistryABI from '../eigen-contracts/abis/ECDSAStakeRegistry.json';
import chainAnalyticaServiceManagerABI from '../eigen-contracts/abis/ChainAnalyticaServiceManager.json';
import avsDirectoryABI from '../eigen-contracts/abis/IAVSDirectory.json';

if (!process.env.PK_OPERATOR) {
  throw new Error('Operator private key not found in environment variables');
}

// Initialize viem clients
export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL)
});

const account = privateKeyToAccount(process.env.PK_OPERATOR as `0x${string}`);

export const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.RPC_URL)
});

// Contract addresses
export const addresses = {
  delegationManager: coreDeployment.addresses.delegation as `0x${string}`,
  avsDirectory: coreDeployment.addresses.avsDirectory as `0x${string}`,
  chainAnalyticaServiceManager: avsDeployment.addresses.chainAnalyticaServiceManager as `0x${string}`,
  ecdsaStakeRegistry: avsDeployment.addresses.stakeRegistry as `0x${string}`,
};

// Contract ABIs
export const abis = {
  delegationManager: delegationManagerABI,
  ecdsaRegistry: ecdsaRegistryABI,
  chainAnalyticaServiceManager: chainAnalyticaServiceManagerABI,
  avsDirectory: avsDirectoryABI,
}; 