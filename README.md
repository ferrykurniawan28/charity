# 🎗️ Charity Platform - Transparent Blockchain Donations

A decentralized charity platform built on **Lisk Sepolia Testnet** that enables transparent, trustless donations using ERC-20 tokens. Create campaigns, accept donations, and release funds to beneficiaries with full on-chain transparency.

## 🌟 Features

- **🎯 Campaign Management** - Create time-bound charity campaigns with funding goals
- **💝 Token-Based Donations** - Accept donations in IDRX tokens (ERC-20)
- **👥 Multi-Donor Support** - Track individual contributions and donor counts
- **🔒 Secure Fund Release** - Funds only released to beneficiaries after campaign ends
- **📊 Full Transparency** - All transactions recorded on blockchain
- **⏰ Campaign Extensions** - Creators can extend campaign duration
- **🎨 IPFS Integration** - Store campaign images on IPFS
- **📈 Real-Time Analytics** - View platform statistics and campaign progress

## 📍 Deployed Contracts

**Network:** Lisk Sepolia Testnet (Chain ID: 4202)

| Contract | Address | Explorer |
|----------|---------|----------|
| IDRXToken | `0xdb1876928F514b0A0563b871E770A3ab0F21Af86` | [View](https://sepolia-blockscout.lisk.com/address/0xdb1876928F514b0A0563b871E770A3ab0F21Af86) |
| CharityPlatform | `0x98340893fA616C7D9624652Cbc83977962D0F617` | [View](https://sepolia-blockscout.lisk.com/address/0x98340893fA616C7D9624652Cbc83977962D0F617) |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or web3 wallet
- Lisk Sepolia testnet ETH ([Get from faucet](https://sepolia-faucet.lisk.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/ferrykurniawan28/charity.git
cd charity

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your PRIVATE_KEY to .env
```

### Running Tests

The project includes **68 comprehensive tests** covering all functionality:

```bash
# Run all tests
npx hardhat test

# Run specific test suites
npx hardhat test test/IDRXToken.ts
npx hardhat test test/CharityPlatform.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

## 💡 Usage Guide

### 1. View Platform Statistics

```bash
npx hardhat run scripts/interact-charity.ts --network lisk-sepolia
```

Shows all campaigns, donations, and platform stats.

### 2. Create a Campaign

Edit `scripts/create-campaign.ts` with your campaign details:

```typescript
const CAMPAIGN_CONFIG = {
  title: "Medical Equipment Fund",
  description: "Help us purchase medical equipment...",
  targetAmount: "50000",  // 50,000 IDRX
  beneficiary: "0xYourAddress",
  durationInDays: 30
};
```

Then run:

```bash
npx hardhat run scripts/create-campaign.ts --network lisk-sepolia
```

### 3. Make a Donation

Edit `scripts/quick-donate.ts`:

```typescript
const CAMPAIGN_ID = 1;
const AMOUNT = "100";  // 100 IDRX
const MESSAGE = "Keep up the good work!";
```

Then run:

```bash
npx hardhat run scripts/quick-donate.ts --network lisk-sepolia
```

### 4. Watch Live Events

Monitor real-time donations and campaign activities:

```bash
npx hardhat run scripts/watch-events.ts --network lisk-sepolia
```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `check-balance.ts` | Check your ETH and IDRX balance |
| `interact-token.ts` | View token info, transfer, approve, mint |
| `interact-charity.ts` | View campaigns, donate, release funds |
| `create-campaign.ts` | Quick campaign creation |
| `quick-donate.ts` | Fast donation with auto-approval |
| `watch-events.ts` | Real-time event monitoring |

See [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) for detailed documentation.

## 🏗️ Project Structure

```
charity/
├── contracts/
│   ├── charity.sol          # Main charity platform contract
│   └── mockIDRX.sol         # ERC-20 token contract
├── scripts/
│   ├── check-balance.ts     # Balance checker
│   ├── interact-token.ts    # Token interactions
│   ├── interact-charity.ts  # Platform interactions
│   ├── create-campaign.ts   # Campaign creator
│   ├── quick-donate.ts      # Quick donation
│   └── watch-events.ts      # Event watcher
├── test/
│   ├── IDRXToken.ts         # Token tests (25 tests)
│   └── CharityPlatform.ts   # Platform tests (43 tests)
├── ignition/modules/
│   ├── IDRXToken.ts         # Token deployment module
│   └── CharityPlatform.ts   # Platform deployment module
└── hardhat.config.ts        # Hardhat configuration
```

## 🔧 Smart Contract Overview

### IDRXToken (ERC-20)

Standard ERC-20 token with additional features:

- **Total Supply:** 1,000,000 IDRX
- **Decimals:** 18
- **Minting:** Owner can mint new tokens
- **Batch Transfers:** Transfer to multiple addresses at once

### CharityPlatform

Main platform contract with comprehensive features:

**Core Functions:**
- `createCampaign()` - Create new charity campaign
- `donate()` - Make donation to campaign
- `releaseFunds()` - Release funds to beneficiary (after campaign ends)
- `extendCampaign()` - Extend campaign duration
- `toggleCampaignStatus()` - Pause/resume campaign

**View Functions:**
- `getCampaign()` - Get campaign details
- `getCampaignDonations()` - Get all donations
- `getPlatformStats()` - Get platform statistics
- `getCampaignProgress()` - Get funding percentage

## 🧪 Testing

Comprehensive test suite with **68 tests** covering:

✅ Token functionality (transfers, approvals, minting)  
✅ Campaign creation and management  
✅ Donation flow and tracking  
✅ Fund release mechanics  
✅ Access control and permissions  
✅ Edge cases and error conditions  

**Test Coverage:**
- IDRXToken: 25 tests
- CharityPlatform: 43 tests

## 🔐 Security Features

- ✅ **Access Control** - Only authorized addresses can release funds
- ✅ **Time Locks** - Funds only released after campaign ends
- ✅ **Input Validation** - All inputs validated on-chain
- ✅ **Reentrancy Protection** - Safe external calls
- ✅ **Event Logging** - All actions emit events for transparency

## 🌐 Network Information

**Lisk Sepolia Testnet**
- Chain ID: 4202
- RPC URL: https://rpc.sepolia-api.lisk.com
- Block Explorer: https://sepolia-blockscout.lisk.com
- Faucet: https://sepolia-faucet.lisk.com

**Gas Fees:** Extremely cheap (~0.001 gwei, ~$0.003 per transaction)

## 📖 Documentation

- [Scripts Guide](./SCRIPTS_GUIDE.md) - Detailed script documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Lisk Documentation](https://docs.lisk.com)

## 🛠️ Development

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy to Testnet

```bash
npx hardhat ignition deploy ignition/modules/CharityPlatform.ts --network lisk-sepolia
```

### Verify Contracts

```bash
npx hardhat verify --network lisk-sepolia <CONTRACT_ADDRESS>
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Deployed on [Lisk](https://lisk.com/)
- Verified on [Blockscout](https://blockscout.com/)

---

**Ready to make a difference!** 🎉 Start creating campaigns and accepting transparent, blockchain-based donations

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
