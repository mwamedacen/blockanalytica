# Blockchain Forensics Tool

A powerful agentic application for comprehensive blockchain address analysis, combining LLMs with specialized blockchain data retrieval tools to provide deep insights into wallet activities, relationships, and token movements.

## 🔍 Overview

This project implements a sophisticated blockchain analysis system using NodeJS and the LangChain framework with a Supervisor architecture. The application orchestrates specialized agents and tools to retrieve, analyze, and visualize detailed information about wallet addresses across multiple blockchains (EVM, Solana).

## 🏗️ Architecture

The system is built using LangChain's Supervisor pattern ([LangGraph Agent Supervisor](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/)), which enables complex workflows where a supervisor agent coordinates specialized sub-agents to complete forensic tasks.

### Components

- **SupervisorAgent**: Orchestrates the entire analysis workflow, delegates tasks to specialized agents, and synthesizes final results
- **Agents**: Specialized modules that solve complex tasks by coordinating multiple tools
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

### Agents

**Discovery Agents:**
- TokenFinderAgent (Token finder agent): TBD
- WalletIdentifierAgent (Wallet identity agent): TBD
- ENSWalletIdentifierAgent (Resolve wallet agent): given an ens domain it will resolve the address using ENSLookupTool
- ENSFinderAgent (ens finder agent): TBD
- TwitterResolverAgent (Twitter account resolver agent): TBD
- SideWalletsFinderAgent (Side wallets discoverer): given a wallet address, it would first rely on BidrectionalTransfersTool to get the addresses that transferred from and to that address

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
