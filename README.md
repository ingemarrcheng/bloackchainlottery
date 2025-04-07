# HKMU - Blockchain Lottery System

![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.19-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19.5-yellow)
![Vite](https://img.shields.io/badge/Vite-4.4.9-purple)

A decentralized lottery system built on Ethereum that automatically selects winners when a threshold is reached. This project demonstrates blockchain-based randomness, smart contract development, and web3 integration.

## ✨ Features

- **Automated Lottery System**: Automatically triggers winner selection when threshold is reached
- **Fixed Prize Pool**: Guarantees a consistent reward for winners
- **Manager Controls**: Administrative functions for lottery management
- **User-friendly Interface**: Clean web UI with real-time updates
- **MetaMask Integration**: Seamless wallet connection for transactions
- **Auto-restart**: New lottery round begins automatically after each draw

## 🏗️ Project Structure

```
blockching/
├── contracts/             # Solidity smart contracts
│   └── Lottery.sol        # Main lottery contract with auto-draw functionality
├── scripts/               # Deployment scripts
│   └── deploy.cjs         # Script to deploy the contract to Ethereum networks
├── src/                   # Frontend source code
│   ├── main.js            # Main JavaScript file with web3 integration
│   ├── LotteryABI.js      # Contract ABI for frontend interaction
│   └── style.css          # CSS styles for the UI
├── index.html             # Main HTML file
├── hardhat.config.cjs     # Hardhat configuration for development and deployment
└── package.json           # Project dependencies
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js and npm installed
- MetaMask browser extension
- Ethereum testnet account with test ETH (Sepolia recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blockchingching.git
cd blockchingching
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_wallet_private_key
```

### Smart Contract Deployment

1. Compile the smart contract:
```bash
npm run compile
```

2. Deploy to the Sepolia testnet:
```bash
npm run deploy
```

3. After deployment, copy the contract address and update it in your frontend configuration

### Running the Frontend

Start the development server:
```bash
npm run dev
```

## 🎮 Using the Lottery System

### As the Manager (Contract Deployer)

1. Connect with the manager's MetaMask account
2. Start a new lottery round by clicking "Start Lottery"
3. Wait for players to enter
4. The lottery will automatically pick a winner when the threshold is reached, or you can manually trigger it after the countdown

### As a Player

1. Connect your MetaMask wallet
2. Ensure you're on the same network as the deployed contract (Sepolia)
3. Click "Enter Lottery" to join (requires exactly 0.0001 ETH)
4. Wait for the threshold to be reached or the manager to pick a winner

## 🧪 Testing with Multiple Accounts

1. Open MetaMask and create or import multiple accounts
2. Switch between accounts to simulate different users
3. Use one account as the manager and others as players
4. Test the full workflow including automatic winner selection

## 🔒 Security Considerations

- The contract uses a pseudo-random number generator based on blockchain data
- For production use, consider implementing a more secure randomness source like Chainlink VRF
- The contract includes security measures like manager-only functions and state updates before transfers

## 🛠️ Troubleshooting

- **Transaction Errors**: Ensure you have enough ETH for gas fees
- **Contract Not Found**: Verify the contract address in your configuration
- **Network Issues**: Make sure MetaMask is connected to the Sepolia testnet

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
