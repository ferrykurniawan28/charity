import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Your deployed addresses
const PLATFORM_ADDRESS = "0x98340893fA616C7D9624652Cbc83977962D0F617";
const TOKEN_ADDRESS = "0xdb1876928F514b0A0563b871E770A3ab0F21Af86";

const PLATFORM_ABI = [
  "function createCampaign(string title, string description, string imageHash, uint256 targetAmount, address beneficiary, uint256 durationInDays) returns (uint256)",
  "function getCampaignCount() view returns (uint256)",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 targetAmount, uint256 endTime)"
];

const TOKEN_ABI = [
  "function decimals() view returns (uint8)"
];

async function createCampaign(
  title: string,
  description: string,
  imageHash: string,
  targetAmount: string,
  beneficiary: string,
  durationInDays: number
) {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const platform = new ethers.Contract(PLATFORM_ADDRESS, PLATFORM_ABI, wallet);
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, wallet);

  console.log("\n🎗️  Create New Charity Campaign");
  console.log("=" .repeat(50));
  console.log("Creator:", wallet.address);

  const decimals = await token.decimals();
  const targetAmountWei = ethers.parseUnits(targetAmount, decimals);

  console.log("\n📋 Campaign Details:");
  console.log("  Title:", title);
  console.log("  Description:", description);
  console.log("  Target:", targetAmount, "IDRX");
  console.log("  Beneficiary:", beneficiary);
  console.log("  Duration:", durationInDays, "days");
  console.log("  Image Hash:", imageHash || "(none)");

  console.log("\n⏳ Creating campaign...");
  
  const tx = await platform.createCampaign(
    title,
    description,
    imageHash,
    targetAmountWei,
    beneficiary,
    durationInDays
  );
  
  console.log("  Transaction:", tx.hash);
  const receipt = await tx.wait();
  console.log("  ✅ Campaign created!");

  // Get campaign ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      return platform.interface.parseLog(log)?.name === "CampaignCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = platform.interface.parseLog(event);
    const campaignId = parsed?.args[0];
    const endTime = parsed?.args[4];
    
    console.log("\n🎉 Success!");
    console.log("  Campaign ID:", campaignId.toString());
    console.log("  Ends:", new Date(Number(endTime) * 1000).toLocaleString());
  }

  const totalCampaigns = await platform.getCampaignCount();
  console.log("  Total Campaigns:", totalCampaigns.toString());

  console.log("\n🔗 View transaction:");
  console.log("  https://sepolia-blockscout.lisk.com/tx/" + tx.hash);
  console.log();
}

// ============ EDIT CAMPAIGN DETAILS BELOW ============

const CAMPAIGN_CONFIG = {
  title: "Medical Equipment for Rural Clinic",
  description: "Help us purchase essential medical equipment including blood pressure monitors, thermometers, and basic diagnostic tools for a rural healthcare clinic serving 5000+ residents.",
  imageHash: "QmExample123...", // Optional: IPFS hash for campaign image
  targetAmount: "50000",  // 50,000 IDRX
  beneficiary: "0x745ACf2267C21daef4A9A5719363D2ea0cD487e8", // Address that will receive funds
  durationInDays: 30  // Campaign duration
};

// Run the script
createCampaign(
  CAMPAIGN_CONFIG.title,
  CAMPAIGN_CONFIG.description,
  CAMPAIGN_CONFIG.imageHash,
  CAMPAIGN_CONFIG.targetAmount,
  CAMPAIGN_CONFIG.beneficiary,
  CAMPAIGN_CONFIG.durationInDays
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
