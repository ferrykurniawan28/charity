import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const PLATFORM_ADDRESS = "0x98340893fA616C7D9624652Cbc83977962D0F617";
const TOKEN_ADDRESS = "0xdb1876928F514b0A0563b871E770A3ab0F21Af86";

const PLATFORM_ABI = [
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 targetAmount, uint256 endTime)",
  "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, string message)",
  "event FundsReleased(uint256 indexed campaignId, address indexed beneficiary, uint256 amount)",
  "event CampaignStatusChanged(uint256 indexed campaignId, bool isActive)",
  "event CampaignExtended(uint256 indexed campaignId, uint256 newEndTime)"
];

const TOKEN_ABI = [
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function watchEvents() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const platform = new ethers.Contract(PLATFORM_ADDRESS, PLATFORM_ABI, provider);
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);

  const decimals = await token.decimals();

  console.log("\n👁️  Watching CharityPlatform Events...\n");
  console.log("=" .repeat(50));
  console.log("Platform:", PLATFORM_ADDRESS);
  console.log("Press Ctrl+C to stop watching");
  console.log("=" .repeat(50));
  console.log();

  // Listen for Campaign Created
  platform.on("CampaignCreated", (campaignId, creator, title, targetAmount, endTime, event) => {
    console.log("\n🎗️  NEW CAMPAIGN CREATED!");
    console.log("  Campaign ID:", campaignId.toString());
    console.log("  Title:", title);
    console.log("  Creator:", creator);
    console.log("  Target:", ethers.formatUnits(targetAmount, decimals), "IDRX");
    console.log("  Ends:", new Date(Number(endTime) * 1000).toLocaleString());
    console.log("  TX:", event.log.transactionHash);
    console.log();
  });

  // Listen for Donations
  platform.on("DonationReceived", (campaignId, donor, amount, message, event) => {
    console.log("\n💝 DONATION RECEIVED!");
    console.log("  Campaign ID:", campaignId.toString());
    console.log("  Donor:", donor);
    console.log("  Amount:", ethers.formatUnits(amount, decimals), "IDRX");
    if (message) console.log("  Message:", message);
    console.log("  TX:", event.log.transactionHash);
    console.log();
  });

  // Listen for Funds Released
  platform.on("FundsReleased", (campaignId, beneficiary, amount, event) => {
    console.log("\n🎉 FUNDS RELEASED!");
    console.log("  Campaign ID:", campaignId.toString());
    console.log("  Beneficiary:", beneficiary);
    console.log("  Amount:", ethers.formatUnits(amount, decimals), "IDRX");
    console.log("  TX:", event.log.transactionHash);
    console.log();
  });

  // Listen for Campaign Status Changes
  platform.on("CampaignStatusChanged", (campaignId, isActive, event) => {
    console.log("\n🔄 CAMPAIGN STATUS CHANGED!");
    console.log("  Campaign ID:", campaignId.toString());
    console.log("  Status:", isActive ? "Active ✅" : "Paused ⏸️");
    console.log("  TX:", event.log.transactionHash);
    console.log();
  });

  // Listen for Campaign Extended
  platform.on("CampaignExtended", (campaignId, newEndTime, event) => {
    console.log("\n⏰ CAMPAIGN EXTENDED!");
    console.log("  Campaign ID:", campaignId.toString());
    console.log("  New End Time:", new Date(Number(newEndTime) * 1000).toLocaleString());
    console.log("  TX:", event.log.transactionHash);
    console.log();
  });

  console.log("✅ Listening for events... (waiting for new transactions)\n");

  // Keep the script running
  await new Promise(() => {});
}

watchEvents().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
