import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Your deployed addresses
const TOKEN_ADDRESS = "0xdb1876928F514b0A0563b871E770A3ab0F21Af86";
const PLATFORM_ADDRESS = "0x98340893fA616C7D9624652Cbc83977962D0F617";

// ABI for CharityPlatform
const PLATFORM_ABI = [
  "function createCampaign(string title, string description, string imageHash, uint256 targetAmount, address beneficiary, uint256 durationInDays) returns (uint256)",
  "function donate(uint256 campaignId, uint256 amount, string message)",
  "function releaseFunds(uint256 campaignId)",
  "function extendCampaign(uint256 campaignId, uint256 additionalDays)",
  "function toggleCampaignStatus(uint256 campaignId)",
  "function getCampaign(uint256 campaignId) view returns (tuple(uint256 id, address creator, string title, string description, string imageHash, uint256 targetAmount, uint256 raisedAmount, address beneficiary, uint256 startTime, uint256 endTime, bool isActive, bool fundsReleased, uint256 donorCount))",
  "function getCampaignDonations(uint256 campaignId) view returns (tuple(address donor, uint256 amount, uint256 timestamp, string message)[])",
  "function getCampaignDonors(uint256 campaignId) view returns (address[])",
  "function getDonorContribution(uint256 campaignId, address donor) view returns (uint256)",
  "function getCampaignCount() view returns (uint256)",
  "function isCampaignActive(uint256 campaignId) view returns (bool)",
  "function getCampaignProgress(uint256 campaignId) view returns (uint256)",
  "function getPlatformStats() view returns (uint256 totalCampaigns, uint256 totalRaised, uint256 activeCampaigns)",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 targetAmount, uint256 endTime)",
  "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, string message)"
];

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const platform = new ethers.Contract(PLATFORM_ADDRESS, PLATFORM_ABI, wallet);
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, wallet);

  console.log("\n🎗️  CharityPlatform Interaction Script\n");
  console.log("=" .repeat(50));
  console.log("Platform Address:", PLATFORM_ADDRESS);
  console.log("Your Address:", wallet.address);
  console.log("=" .repeat(50));

  // Get platform stats
  const stats = await platform.getPlatformStats();
  const decimals = await token.decimals();

  console.log("\n📊 Platform Statistics:");
  console.log("  Total Campaigns:", stats.totalCampaigns.toString());
  console.log("  Total Raised:", ethers.formatUnits(stats.totalRaised, decimals), "IDRX");
  console.log("  Active Campaigns:", stats.activeCampaigns.toString());

  const campaignCount = await platform.getCampaignCount();
  
  // List all campaigns
  if (campaignCount > 0n) {
    console.log("\n📋 Campaign List:");
    for (let i = 1n; i <= campaignCount; i++) {
      const campaign = await platform.getCampaign(i);
      const isActive = await platform.isCampaignActive(i);
      const progress = await platform.getCampaignProgress(i);
      
      console.log(`\n  Campaign #${i}:`);
      console.log(`    Title: ${campaign.title}`);
      console.log(`    Creator: ${campaign.creator}`);
      console.log(`    Target: ${ethers.formatUnits(campaign.targetAmount, decimals)} IDRX`);
      console.log(`    Raised: ${ethers.formatUnits(campaign.raisedAmount, decimals)} IDRX (${progress}%)`);
      console.log(`    Donors: ${campaign.donorCount.toString()}`);
      console.log(`    Active: ${isActive ? "✅ Yes" : "❌ No"}`);
      console.log(`    Funds Released: ${campaign.fundsReleased ? "✅ Yes" : "❌ No"}`);
      
      const endDate = new Date(Number(campaign.endTime) * 1000);
      console.log(`    Ends: ${endDate.toLocaleString()}`);

      // Get donations for this campaign
      const donations = await platform.getCampaignDonations(i);
      if (donations.length > 0) {
        console.log(`    Recent Donations:`);
        donations.slice(-3).forEach((donation: any, idx: number) => {
          console.log(`      ${idx + 1}. ${ethers.formatUnits(donation.amount, decimals)} IDRX from ${donation.donor.slice(0, 10)}...`);
          if (donation.message) console.log(`         Message: "${donation.message}"`);
        });
      }
    }
  } else {
    console.log("\n📋 No campaigns yet!");
  }

  // Uncomment below to perform actions:

  // 1. CREATE A CAMPAIGN
  console.log("\n💡 To create a campaign, uncomment the createCampaign section");
  /*
  const title = "Medical Aid for Children";
  const description = "Raising funds for pediatric healthcare equipment";
  const imageHash = "QmXyz..."; // IPFS hash
  const targetAmount = ethers.parseUnits("50000", decimals); // 50,000 IDRX
  const beneficiary = wallet.address; // Or another address
  const durationInDays = 30; // 30 days

  console.log("\n⏳ Creating campaign...");
  const createTx = await platform.createCampaign(
    title,
    description,
    imageHash,
    targetAmount,
    beneficiary,
    durationInDays
  );
  console.log("  Transaction:", createTx.hash);
  const receipt = await createTx.wait();
  console.log("  ✅ Campaign created!");
  
  // Get campaign ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      return platform.interface.parseLog(log)?.name === "CampaignCreated";
    } catch { return false; }
  });
  if (event) {
    const parsed = platform.interface.parseLog(event);
    console.log("  Campaign ID:", parsed?.args[0].toString());
  }
  */

  // 2. DONATE TO A CAMPAIGN
  /*
  const campaignId = 1; // Campaign ID to donate to
  const donationAmount = ethers.parseUnits("500", decimals); // 500 IDRX
  const message = "Happy to support this cause!";

  // First, check and approve if needed
  const allowance = await token.allowance(wallet.address, PLATFORM_ADDRESS);
  if (allowance < donationAmount) {
    console.log("\n⏳ Approving tokens for donation...");
    const approveTx = await token.approve(PLATFORM_ADDRESS, donationAmount);
    await approveTx.wait();
    console.log("  ✅ Approved!");
  }

  console.log("\n⏳ Making donation...");
  const donateTx = await platform.donate(campaignId, donationAmount, message);
  console.log("  Transaction:", donateTx.hash);
  await donateTx.wait();
  console.log("  ✅ Donation successful!");
  console.log("  Amount:", ethers.formatUnits(donationAmount, decimals), "IDRX");
  */

  // 3. RELEASE FUNDS (after campaign ends)
  /*
  const campaignId = 1;
  console.log("\n⏳ Releasing funds to beneficiary...");
  const releaseTx = await platform.releaseFunds(campaignId);
  console.log("  Transaction:", releaseTx.hash);
  await releaseTx.wait();
  console.log("  ✅ Funds released!");
  */

  // 4. EXTEND CAMPAIGN (creator only)
  /*
  const campaignId = 1;
  const additionalDays = 7; // Extend by 7 days
  console.log("\n⏳ Extending campaign...");
  const extendTx = await platform.extendCampaign(campaignId, additionalDays);
  console.log("  Transaction:", extendTx.hash);
  await extendTx.wait();
  console.log("  ✅ Campaign extended by", additionalDays, "days!");
  */

  // 5. CHECK YOUR DONATIONS
  /*
  const campaignId = 1;
  const yourContribution = await platform.getDonorContribution(campaignId, wallet.address);
  console.log("\n💝 Your Contribution to Campaign #" + campaignId + ":");
  console.log("  Amount:", ethers.formatUnits(yourContribution, decimals), "IDRX");
  */

  console.log("\n🔗 View on Block Explorer:");
  console.log("  https://sepolia-blockscout.lisk.com/address/" + PLATFORM_ADDRESS);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
