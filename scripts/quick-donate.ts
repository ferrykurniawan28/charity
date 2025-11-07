import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Your deployed addresses
const TOKEN_ADDRESS = "0xdb1876928F514b0A0563b871E770A3ab0F21Af86";
const PLATFORM_ADDRESS = "0x98340893fA616C7D9624652Cbc83977962D0F617";

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const PLATFORM_ABI = [
  "function donate(uint256 campaignId, uint256 amount, string message)",
  "function getCampaign(uint256 campaignId) view returns (tuple(uint256 id, address creator, string title, string description, string imageHash, uint256 targetAmount, uint256 raisedAmount, address beneficiary, uint256 startTime, uint256 endTime, bool isActive, bool fundsReleased, uint256 donorCount))",
  "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, string message)"
];

async function donate(campaignId: number, amount: string, message: string) {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, wallet);
  const platform = new ethers.Contract(PLATFORM_ADDRESS, PLATFORM_ABI, wallet);

  console.log("\n💝 Quick Donate to Campaign #" + campaignId);
  console.log("=" .repeat(50));

  // Get campaign info
  const campaign = await platform.getCampaign(campaignId);
  const decimals = await token.decimals();
  
  console.log("Campaign:", campaign.title);
  console.log("Target:", ethers.formatUnits(campaign.targetAmount, decimals), "IDRX");
  console.log("Raised:", ethers.formatUnits(campaign.raisedAmount, decimals), "IDRX");

  // Parse donation amount
  const donationAmount = ethers.parseUnits(amount, decimals);
  
  // Check balance
  const balance = await token.balanceOf(wallet.address);
  if (balance < donationAmount) {
    console.error("\n❌ Insufficient balance!");
    console.log("Your balance:", ethers.formatUnits(balance, decimals), "IDRX");
    process.exit(1);
  }

  // Check allowance
  const allowance = await token.allowance(wallet.address, PLATFORM_ADDRESS);
  
  if (allowance < donationAmount) {
    console.log("\n⏳ Step 1/2: Approving tokens...");
    const approveTx = await token.approve(PLATFORM_ADDRESS, donationAmount);
    console.log("  TX:", approveTx.hash);
    await approveTx.wait();
    console.log("  ✅ Approved!");
  } else {
    console.log("\n✅ Tokens already approved");
  }

  console.log("\n⏳ Step 2/2: Making donation...");
  const donateTx = await platform.donate(campaignId, donationAmount, message);
  console.log("  TX:", donateTx.hash);
  
  const receipt = await donateTx.wait();
  console.log("  ✅ Donation successful!");
  
  console.log("\n📊 Summary:");
  console.log("  Campaign ID:", campaignId);
  console.log("  Amount:", amount, "IDRX");
  console.log("  Message:", message);
  console.log("  Transaction:", donateTx.hash);
  
  console.log("\n🔗 View transaction:");
  console.log("  https://sepolia-blockscout.lisk.com/tx/" + donateTx.hash);
  console.log();
}

// Usage: npx hardhat run scripts/quick-donate.ts
// Edit the parameters below:

const CAMPAIGN_ID = 1;           // Change to campaign ID
const AMOUNT = "100";            // Amount in IDRX (e.g., "100" = 100 IDRX)
const MESSAGE = "Keep up the good work!";  // Your donation message

donate(CAMPAIGN_ID, AMOUNT, MESSAGE)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
