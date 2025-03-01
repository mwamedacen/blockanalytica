# Blockchain Forensics & Intelligence Tool

A powerful agentic application for comprehensive blockchain address analysis, combining LLMs with specialized blockchain data retrieval tools to provide deep insights into wallet activities, relationships, and token movements. Each agent's intellectual property is securely stored and verified on the Story Protocol blockchain.

## 🔍 Overview

This project implements a sophisticated blockchain analysis system using NodeJS and the LangChain framework with a Supervisor architecture. The application orchestrates specialized agents and tools to retrieve, analyze, and visualize detailed information about wallet addresses across multiple blockchains (EVM, Solana). Each agent's unique IP and algorithms are registered and protected through Story Protocol's IP management system.

## 🏗️ Architecture

The system is built using LangChain's Supervisor pattern ([LangGraph Agent Supervisor](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/)), which enables complex workflows where a supervisor agent coordinates specialized sub-agents to complete forensic tasks. The intellectual property of each agent's decision-making processes and specialized algorithms is registered on Story Protocol.

### Components

- **SupervisorAgent**: Orchestrates the entire analysis workflow, delegates tasks to specialized agents, and synthesizes final results
- **Agents**: Specialized modules with protected IP that solve complex tasks by coordinating multiple tools
- **Tools**: Atomic units that retrieve specific data points from various blockchain and off-chain sources

## 🛠️ Agent & Tool Architecture

### Tools

**Token Data Tools:**
- TokenDeploymentMetadataTool (Token deployment metadata retriever): TBD
- PumpFunMetadataTool (PumpFun token deployment metadata retriever): TBD
- TokenBalanceTool (Token balances retriever): TBD
- TokenSwapsRetrieverTool (Token Swap activity retriever): given an token address, a side, date ranges it should use the Dune Query of id 12345 via @duneanalytics/client-sdk
- CoingeckoDataTool (Coingecko data retriever): TBD
- DexscreenerDataTool (Dexscreener data retriever): TBD

**Wallet Data Tools:**
- WalletBalanceTool (Wallet balance retriever): TBD
- WalletSwapsRetrieverTool (Wallet Swap activity retriever): given a wallet address, a side, date ranges, limit, it should use the Dune Query of id 12346 via @duneanalytics/client-sdk
- TokenPurchaseTool (Token purchasing retriever): TBD
- FundingSourceTool (Funding source retriever): TBD
- InteractionPatternTool (Interaction pattern retriever): TBD
- BridgeTransactionTool (Bridge transaction retriever): TBD
- SafeSignersTool (Safe/multisig account signers retriever): TBD
- BidrectionalTransfersTool (check bidirectional transfers): rely on dune query 4776661 to collect bi direectional data
- RecursiveFundingAddressTool (check funding address recursively) : TBD

**Identity Resolution Tools:**
- ENSLookupTool (ENS domain retriever): it would resolve the ens domain by issueing a call to ethereum rpc
- EtherscanTagTool (Etherscan tag retriever): TBD
- ArkhamTagTool (Arkham intelligence tag retriever): TBD
- DeBankUserTool (DeBank user retriever): TBD
- NFTOwnershipTool (NFT ownership retriever): TBD
- NFTMetadataTool (NFT metadata retriever): TBD

**Social Media Tools:**
- TweetRetrievalTool (Tweet retrieve tool): TBD
- TwitterSearchTool (Twitter Search tool): TBD

**Search Tools:**
- TavilySearchTool (Tavily web search tool): TBD

**Smart Contract Tools:**
- ContractCodeTool (Contract code retriever): TBD
- BytecodeTool (Bytecode retriever): TBD
- ProxyImplementationTool (Proxy implementation retriever): TBD
- SimilarBytecodeTool (Similar bytecode retriever): TBD
- SafeContractTool (Safe contract detector): TBD
- BridgeContractTool (Bridge contract detector): TBD

### Agents (All IPs Registered on Story Protocol)

**Discovery Agents:**
- TokenFinderAgent (Token finder agent): TBD
- WalletIdentifierAgent (Wallet identity agent): TBD
- ENSWalletIdentifierAgent (Resolve wallet agent): given an ens domain it will resolve the address using ENSLookupTool
- ENSFinderAgent (ens finder agent): TBD
- TwitterResolverAgent (Twitter account resolver agent): TBD
- SideWalletsFinderAgent (Side wallets discoverer): given a wallet address, it would rely on BidrectionalTransfersTool and FundingSourceTool (recursively using it till no more funding address)

**Trading Pattern Agents:**
- CopyTraderDetectorAgent (Copy trading detector agent): Analyzes potential copy trading behavior by:
  1. Extracting wallet addresses from input text (done by the llm as part of the prompt)
  2. Retrieving recent swap activity (up to 10 swaps in last 2 months) for the target address
  3. Identifying wallets that consistently trade the same tokens shortly after the target address (minimum 2 correlated swaps)
  4. Generating a detailed analysis including:
     - Number of potential copy trading wallets detected
     - Average trade volume comparison between target and copy traders
     - Time delay patterns between original and copy trades
  Tools: WalletSwapsRetrieverTool and TokenSwapsRetrieverTool

- PumpDumpDetectorAdgent (Pump and dump X detector agent): TBD
- InsiderDetectorAgent (Token insider finder agent): TBD
- MultiTokenAnalyzeragent (Multi-token trading pattern agent): TBD

**Security Analysis Agents:**
- TokenSecurityAnalyzer (Token security analyzer agent): TBD
- ContractSecurityAnalyzer (Contract security analyzer agent): TBD
- OwnershipResolver (Contract ownership resolver agent): TBD
- SimilarContractDetector (Similar contract detector agent): TBD

## 🖥️ Interface Options (out of scope of this project)

The system can be accessed through multiple interfaces:

- **Twitter Bot**: Command-based queries for quick forensic analysis
- **Telegram Bot**: Interactive crypto forensics commands
- **Web Interface**:
  - Conversational chatbot for query input
  - Structured data visualization components
  - Interactive relationship charts (ZachXBT-style)
  - Dynamic token and wallet activity dashboards

## 🔐 Authentication

The application supports multiple authentication methods:

- **Wallet Connect**: Connect directly with your Web3 wallet
- **Privy Authentication**: Email, social login, and embedded wallet options through Privy

### Setting Up Authentication

1. **Wallet Connect**: Configured through OnchainKit
2. **Privy Authentication**: 
   - Create an account at [Privy](https://privy.io/)
   - Get your Privy App ID
   - Add it to your `.env` file as `NEXT_PUBLIC_PRIVY_APP_ID`

## 🔗 Blockchain Integration

The application uses a server-side blockchain agent to interact with various blockchain networks on behalf of users. This approach provides several benefits:

- **Enhanced Security**: Private keys are encrypted and stored securely in the database
- **Simplified UX**: Users can authenticate with email or social login without needing a wallet
- **Cross-Chain Support**: Interact with multiple blockchain networks from a single interface
- **Gas Abstraction**: Potential to abstract gas fees away from users

### Server-Side Wallet Management

When a user authenticates with Privy, the system:

1. Checks if the user already has a wallet in the database
2. If not, generates a new wallet and encrypts the private key
3. Stores the encrypted private key in Supabase, associated with the user's Privy ID

### Blockchain Interactions

The server-side agent can:

- Send transactions on behalf of users
- Call smart contract functions
- Retrieve wallet balances and transaction history
- Support multiple blockchain networks (Ethereum, Base, etc.)

### Setting Up Blockchain Integration

1. Create a Supabase account and set up the database schema (see `supabase/README.md`)
2. Add RPC URLs for the blockchain networks you want to support to your `.env` file
3. Configure the Privy authentication as described above
