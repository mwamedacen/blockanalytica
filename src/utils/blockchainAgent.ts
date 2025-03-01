import { BaseWallet, ethers, Wallet } from 'ethers';
import { createServiceRoleClient } from './supabase';
import crypto from 'crypto';

// Supported networks and their RPC URLs
const NETWORK_RPC_URLS: Record<string, string> = {
  ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  polygon: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  optimism: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
};

// Get provider for a specific network
function getProvider(network: keyof typeof NETWORK_RPC_URLS) {
  const rpcUrl = NETWORK_RPC_URLS[network];
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for network: ${network}`);
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Encrypt a private key for storage
function encryptPrivateKey(privateKey: string, userId: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET + userId, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt a private key from storage
function decryptPrivateKey(encryptedData: string, userId: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET + userId, 'salt', 32);
  
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Get or create a wallet for a user
export async function getUserWallet(userId: string): Promise<BaseWallet> {
  const supabase = createServiceRoleClient();
  
  // Check if user already has a wallet
  const { data, error } = await supabase
    .from('user_wallets')
    .select('wallet_address, encrypted_private_key')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (data) {
    // User has a wallet, decrypt the private key
    const privateKey = decryptPrivateKey(data.encrypted_private_key, userId);
    return new ethers.Wallet(privateKey);
  }
  
  // User doesn't have a wallet, create one
  const wallet = ethers.Wallet.createRandom();
  
  // Encrypt the private key
  const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, userId);
  
  // Store in Supabase
  const { error: insertError } = await supabase
    .from('user_wallets')
    .insert({
      user_id: userId,
      wallet_address: wallet.address,
      encrypted_private_key: encryptedPrivateKey,
    });
  
  if (insertError) {
    console.error('Error creating wallet:', insertError);
    throw new Error('Failed to create wallet');
  }
  
  return wallet;
}

// Get a user's wallet address
export async function getUserWalletAddress(userId: string): Promise<string> {
  const wallet = await getUserWallet(userId);
  return wallet.address;
}

// Get a user's balance on a specific network
export async function getUserBalance(userId: string, network: keyof typeof NETWORK_RPC_URLS) {
  const wallet = await getUserWallet(userId);
  const provider = getProvider(network);
  
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

// Send a transaction
export async function sendTransaction(
  userId: string,
  network: keyof typeof NETWORK_RPC_URLS,
  toAddress: string,
  amount: string,
  gasLimit?: bigint
) {
  const wallet = await getUserWallet(userId);
  const provider = getProvider(network);
  const connectedWallet = wallet.connect(provider);
  
  // Create transaction
  const tx = {
    to: toAddress,
    value: ethers.parseEther(amount),
    gasLimit: gasLimit || undefined,
  };
  
  // Send transaction
  const txResponse = await connectedWallet.sendTransaction(tx);
  
  // Store transaction in database
  const supabase = createServiceRoleClient();
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      tx_hash: txResponse.hash,
      network,
      from_address: wallet.address,
      to_address: toAddress,
      value: amount,
      status: 'pending',
    });
  
  // Return transaction hash
  return txResponse.hash;
}

// Call a smart contract function
export async function callContract(
  userId: string,
  network: keyof typeof NETWORK_RPC_URLS,
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[],
  value?: string
) {
  const wallet = await getUserWallet(userId);
  const provider = getProvider(network);
  const connectedWallet = wallet.connect(provider);
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, abi, connectedWallet);
  
  // Prepare transaction options
  const options: any = {};
  if (value) {
    options.value = ethers.parseEther(value);
  }
  
  // Call contract function
  const txResponse = await contract[functionName](...args, options);
  
  // Store transaction in database
  const supabase = createServiceRoleClient();
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      tx_hash: txResponse.hash,
      network,
      from_address: wallet.address,
      to_address: contractAddress,
      value: value || '0',
      status: 'pending',
      contract_interaction: true,
      function_name: functionName,
    });
  
  // Return transaction hash
  return txResponse.hash;
}

// Get transaction status
export async function getTransactionStatus(txHash: string, network: keyof typeof NETWORK_RPC_URLS) {
  const provider = getProvider(network);
  
  // Get transaction receipt
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    return 'pending';
  }
  
  return receipt.status === 1 ? 'success' : 'failed';
}

// Update transaction status in database
export async function updateTransactionStatus(txHash: string, network: keyof typeof NETWORK_RPC_URLS) {
  const status = await getTransactionStatus(txHash, network);
  
  const supabase = createServiceRoleClient();
  await supabase
    .from('transactions')
    .update({ status })
    .eq('tx_hash', txHash);
  
  return status;
} 