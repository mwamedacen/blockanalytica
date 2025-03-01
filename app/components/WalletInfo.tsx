'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';

interface WalletInfoProps {
  network?: string;
}

export default function WalletInfo({ network = 'ethereum' }: WalletInfoProps) {
  const { user, authenticated, getAccessToken } = usePrivy();
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    balance: string;
    network: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction state
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  
  // Fetch wallet info
  const fetchWalletInfo = async () => {
    if (!authenticated || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAccessToken();
      const response = await fetch(`/api/user/wallet?network=${network}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet info');
      }
      
      setWalletInfo(data.wallet);
    } catch (err) {
      console.error('Error fetching wallet info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  // Send transaction
  const sendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authenticated || !user) return;
    if (!toAddress || !amount) {
      setError('To address and amount are required');
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      setTxHash(null);
      setTxStatus(null);
      
      // Validate address
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid address');
      }
      
      // Validate amount
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
      }
      
      const token = await getAccessToken();
      const response = await fetch('/api/user/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          network,
          toAddress,
          amount,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send transaction');
      }
      
      setTxHash(data.txHash);
      setTxStatus('pending');
      
      // Poll for transaction status
      const interval = setInterval(async () => {
        const statusResponse = await fetch(`/api/user/transaction?txHash=${data.txHash}&network=${network}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const statusData = await statusResponse.json();
        
        if (statusResponse.ok && statusData.transaction) {
          setTxStatus(statusData.transaction.status);
          
          if (statusData.transaction.status !== 'pending') {
            clearInterval(interval);
            fetchWalletInfo(); // Refresh wallet info after transaction is confirmed
          }
        }
      }, 5000);
      
      // Clear form
      setToAddress('');
      setAmount('');
    } catch (err) {
      console.error('Error sending transaction:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };
  
  // Fetch wallet info on mount and when network changes
  useEffect(() => {
    if (authenticated && user) {
      fetchWalletInfo();
    }
  }, [authenticated, user, network]);
  
  if (!authenticated || !user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-center text-gray-500">Please sign in to view your wallet</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-center text-gray-500">Loading wallet information...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Your Wallet</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {walletInfo && (
        <div className="mb-6">
          <div className="mb-2">
            <span className="font-semibold">Network:</span> {walletInfo.network}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Address:</span>{' '}
            <span className="font-mono text-sm break-all">{walletInfo.address}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Balance:</span>{' '}
            {walletInfo.balance} {network === 'ethereum' ? 'ETH' : network.toUpperCase()}
          </div>
        </div>
      )}
      
      <div className="border-t pt-4">
        <h3 className="text-xl font-bold mb-4">Send Transaction</h3>
        
        <form onSubmit={sendTransaction}>
          <div className="mb-4">
            <label htmlFor="toAddress" className="block text-sm font-medium text-gray-700 mb-1">
              To Address
            </label>
            <input
              type="text"
              id="toAddress"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="0x..."
              disabled={sending}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="0.01"
              disabled={sending}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={sending || !walletInfo}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        
        {txHash && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="font-semibold">Transaction Hash:</p>
            <p className="font-mono text-sm break-all">{txHash}</p>
            <p className="mt-2">
              Status: <span className="font-semibold">{txStatus}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 