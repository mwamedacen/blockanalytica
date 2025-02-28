import Link from 'next/link';

export default function Home() {
  return (
    <main className="hero">
      <h1>BlockAnalytica</h1>
      <p>Blockchain Forensics Tool</p>
      
      <div className="welcome-message">
        <h2>Welcome to BlockAnalytica</h2>
        <p>Your advanced blockchain forensics and intelligence platform powered by specialized AI agents.</p>
        
        <div className="agent-capabilities">
          <h3>Our agents can help you with:</h3>
          <ul>
            <li><strong>Wallet Analysis</strong> - Identify wallet owners, discover side wallets, and analyze transaction patterns</li>
            <li><strong>Token Intelligence</strong> - Investigate token deployments, trading patterns, and security risks</li>
            <li><strong>Trading Patterns</strong> - Detect copy trading behavior, pump and dump schemes, and insider trading</li>
            <li><strong>Smart Contract Analysis</strong> - Analyze contract security, ownership structures, and similar contracts</li>
            <li><strong>Identity Resolution</strong> - Connect blockchain addresses to ENS domains and social media accounts</li>
          </ul>
        </div>
        
        <p className="start-prompt">Start a conversation with our agents to analyze blockchain data and gain valuable insights.</p>
      </div>
      
      <div className="flex flex-col gap-4">
        <Link 
          href="/chat" 
          className="btn btn-primary"
        >
          Standard Chat
        </Link>
      </div>
    </main>
  );
}