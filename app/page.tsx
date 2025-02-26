import Link from 'next/link';

export default function Home() {
  return (
    <main className="hero">
      <h1>BlockAnalytica</h1>
      <p>Blockchain Forensics Tool</p>
      
      <div className="flex flex-col gap-4">
        <Link 
          href="/chat" 
          className="btn btn-primary"
        >
          Standard Chat
        </Link>
        
        <Link 
          href="/chat/streaming" 
          className="btn btn-secondary"
        >
          Real-time Agent Status
        </Link>
      </div>
    </main>
  );
}