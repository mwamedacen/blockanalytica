'use client';

import { usePrivy } from '@privy-io/react-auth';
import WalletInfo from './components/WalletInfo';
import { useState } from 'react';

export default function Home() {
  const { login, authenticated, user, logout } = usePrivy();
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');

  const networks = [
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'optimism', name: 'Optimism' },
    { id: 'base', name: 'Base' },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">Blockchain Wallet Manager</h1>
        
        {authenticated ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg">
                  Welcome, <span className="font-semibold">{user?.email?.address || 'User'}</span>
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-2">
                Select Network
              </label>
              <select
                id="network"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
              >
                {networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
              
              <WalletInfo network={selectedNetwork} />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-6">
              Sign in to manage your blockchain wallet securely
            </p>
            <button
              onClick={login}
              className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 text-lg"
            >
              Sign In with Privy
            </button>
          </div>
        )}
      </div>
    </main>
  );
}