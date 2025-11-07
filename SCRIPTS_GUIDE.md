# 🎗️ Charity Platform - Interaction Scripts

Complete guide to interact with your deployed contracts on **Lisk Sepolia Testnet**.

## 📍 Deployed Addresses

- **IDRXToken:** `0xdb1876928F514b0A0563b871E770A3ab0F21Af86`
- **CharityPlatform:** `0x98340893fA616C7D9624652Cbc83977962D0F617`

[View on Blockscout](https://sepolia-blockscout.lisk.com/address/0x98340893fA616C7D9624652Cbc83977962D0F617)

---

## 🚀 Quick Start

### 1. View Token Information
```bash
npx hardhat run scripts/interact-token.ts --network lisk-sepolia
```
Shows your IDRX balance, allowances, and token details.

### 2. View Platform Statistics
```bash
npx hardhat run scripts/interact-charity.ts --network lisk-sepolia
```
Shows all campaigns, donations, and platform stats.

### 3. Create a Campaign
Edit `scripts/create-campaign.ts` with your campaign details, then:
```bash
npx hardhat run scripts/create-campaign.ts --network lisk-sepolia
```

### 4. Make a Donation
Edit `scripts/quick-donate.ts` with campaign ID and amount, then:
```bash
npx hardhat run scripts/quick-donate.ts --network lisk-sepolia
```

### 5. Watch Live Events
```bash
npx hardhat run scripts/watch-events.ts --network lisk-sepolia
```
Monitors real-time donations, campaign creations, etc. Press Ctrl+C to stop.

---

## 📚 Script Reference

### `check-balance.ts`
Check your ETH and IDRX balance on Lisk Sepolia.
```bash
npx hardhat run scripts/check-balance.ts
```

### `interact-token.ts`
**View token information and perform token operations:**
- ✅ View balance and token details
- ✅ Check allowances
- ✅ Approve tokens for platform (uncomment section)
- ✅ Transfer tokens to addresses (uncomment section)
- ✅ Mint new tokens - owner only (uncomment section)
- ✅ Batch transfer to multiple addresses (uncomment section)

**Usage:**
```bash
npx hardhat run scripts/interact-token.ts --network lisk-sepolia
```

**To enable actions:**
1. Open the file
2. Find the commented sections (marked with `/*  */`)
3. Uncomment the action you want to perform
4. Modify parameters as needed
5. Run the script

### `interact-charity.ts`
**View campaigns and perform charity operations:**
- ✅ View all campaigns with details
- ✅ View donations for each campaign
- ✅ Check platform statistics
- ✅ Create campaigns (uncomment section)
- ✅ Make donations (uncomment section)
- ✅ Release funds to beneficiary (uncomment section)
- ✅ Extend campaign duration (uncomment section)

**Usage:**
```bash
npx hardhat run scripts/interact-charity.ts --network lisk-sepolia
```

### `create-campaign.ts`
**Quick campaign creation script.**

**Edit the CAMPAIGN_CONFIG section:**
```typescript
const CAMPAIGN_CONFIG = {
  title: "Your Campaign Title",
  description: "Detailed description of your cause",
  imageHash: "QmIPFSHash...", // Optional IPFS hash
  targetAmount: "50000",  // Target in IDRX
  beneficiary: "0xYourBeneficiaryAddress",
  durationInDays: 30
};
```

Then run:
```bash
npx hardhat run scripts/create-campaign.ts --network lisk-sepolia
```

### `quick-donate.ts`
**Fast donation to a campaign.**

**Edit the parameters:**
```typescript
const CAMPAIGN_ID = 1;           // Campaign to donate to
const AMOUNT = "100";            // Amount in IDRX
const MESSAGE = "Keep it up!";   // Your message
```

Then run:
```bash
npx hardhat run scripts/quick-donate.ts --network lisk-sepolia
```

**Note:** Script automatically approves tokens if needed.

### `watch-events.ts`
**Real-time event monitoring.**

Watches for:
- 🎗️ Campaign Created
- 💝 Donations Received
- 🎉 Funds Released
- 🔄 Campaign Status Changes
- ⏰ Campaign Extensions

```bash
npx hardhat run scripts/watch-events.ts --network lisk-sepolia
```

Press `Ctrl+C` to stop watching.

---

## 💡 Common Workflows

### Creating Your First Campaign

1. **Check your balance:**
   ```bash
   npx hardhat run scripts/check-balance.ts
   ```

2. **Create campaign:**
   - Edit `scripts/create-campaign.ts`
   - Set title, description, target, beneficiary
   - Run: `npx hardhat run scripts/create-campaign.ts --network lisk-sepolia`

3. **Note the Campaign ID** from the output

### Making a Donation

1. **View available campaigns:**
   ```bash
   npx hardhat run scripts/interact-charity.ts --network lisk-sepolia
   ```

2. **Make donation:**
   - Edit `scripts/quick-donate.ts`
   - Set CAMPAIGN_ID and AMOUNT
   - Run: `npx hardhat run scripts/quick-donate.ts --network lisk-sepolia`

### Releasing Funds (Campaign Creator)

1. **Wait for campaign to end**

2. **Open `scripts/interact-charity.ts`**

3. **Uncomment the "RELEASE FUNDS" section:**
   ```typescript
   const campaignId = 1;
   console.log("\n⏳ Releasing funds to beneficiary...");
   const releaseTx = await platform.releaseFunds(campaignId);
   await releaseTx.wait();
   console.log("  ✅ Funds released!");
   ```

4. **Run:**
   ```bash
   npx hardhat run scripts/interact-charity.ts --network lisk-sepolia
   ```

---

## 🔧 Advanced Usage

### Approving Tokens Manually

Before donating, you can pre-approve tokens:

1. **Edit `scripts/interact-token.ts`**
2. **Uncomment the approve section:**
   ```typescript
   const approveAmount = ethers.parseUnits("1000", decimals);
   const approveTx = await token.approve(PLATFORM_ADDRESS, approveAmount);
   await approveTx.wait();
   ```
3. **Run:**
   ```bash
   npx hardhat run scripts/interact-token.ts --network lisk-sepolia
   ```

### Minting New Tokens (Owner Only)

1. **Edit `scripts/interact-token.ts`**
2. **Uncomment the mint section:**
   ```typescript
   const mintAmount = ethers.parseUnits("10000", decimals);
   const mintTx = await token.mint(wallet.address, mintAmount);
   await mintTx.wait();
   ```
3. **Run as owner:**
   ```bash
   npx hardhat run scripts/interact-token.ts --network lisk-sepolia
   ```

### Batch Transfers

Send tokens to multiple addresses at once:

1. **Edit `scripts/interact-token.ts`**
2. **Uncomment batch transfer section:**
   ```typescript
   const recipients = ["0xAddress1", "0xAddress2"];
   const amounts = [
     ethers.parseUnits("50", decimals),
     ethers.parseUnits("75", decimals)
   ];
   const batchTx = await token.batchTransfer(recipients, amounts);
   ```
3. **Run:**
   ```bash
   npx hardhat run scripts/interact-token.ts --network lisk-sepolia
   ```

---

## 🌐 Block Explorer Links

**View Your Contracts:**
- Token: https://sepolia-blockscout.lisk.com/address/0xdb1876928F514b0A0563b871E770A3ab0F21Af86
- Platform: https://sepolia-blockscout.lisk.com/address/0x98340893fA616C7D9624652Cbc83977962D0F617

**Your Wallet:**
- https://sepolia-blockscout.lisk.com/address/0x745ACf2267C21daef4A9A5719363D2ea0cD487e8

---

## ⚠️ Important Notes

1. **Gas Fees:** Lisk Sepolia has very cheap gas (~0.001 gwei). Transactions cost ~$0.003 USD.

2. **Approvals:** You must approve tokens before donating. The `quick-donate.ts` script handles this automatically.

3. **Campaign Duration:** Min 1 day, max 365 days. Can be extended by creator (max +30 days).

4. **Releasing Funds:** Only campaign creator or platform owner can release funds, and only after campaign ends.

5. **No MetaMask Popup:** These scripts use your private key from `.env`. No browser popup appears.

---

## 🛠️ Troubleshooting

**"Insufficient balance"**
- Get testnet tokens: https://sepolia-faucet.lisk.com/

**"Insufficient allowance"**
- Run the approve section in `interact-token.ts` first
- Or use `quick-donate.ts` which auto-approves

**"Campaign not active"**
- Check if campaign has ended
- Check if campaign was paused by creator

**"Not authorized to release funds"**
- Only campaign creator or platform owner can release
- Campaign must have ended

---

## 📊 Your Current Status

✅ Token Address: Deployed and verified
✅ Platform Address: Deployed and verified
✅ Your Balance: 1,000,000 IDRX + 0.13 ETH
✅ Network: Lisk Sepolia (Chain ID: 4202)

**Ready to start creating campaigns and accepting donations!** 🎉
