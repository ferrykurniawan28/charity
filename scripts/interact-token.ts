import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Your deployed addresses
const TOKEN_ADDRESS = "0xdb1876928F514b0A0563b871E770A3ab0F21Af86";
const PLATFORM_ADDRESS = "0x98340893fA616C7D9624652Cbc83977962D0F617";

// ABI for IDRXToken
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function batchTransfer(address[] recipients, uint256[] amounts) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, wallet);

  console.log("\n💰 IDRXToken Interaction Script\n");
  console.log("=" .repeat(50));
  console.log("Token Address:", TOKEN_ADDRESS);
  console.log("Your Address:", wallet.address);
  console.log("=" .repeat(50));

  // Get token info
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const balance = await token.balanceOf(wallet.address);

  console.log("\n📊 Token Information:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("  Your Balance:", ethers.formatUnits(balance, decimals), symbol);

  // Check allowance for platform
  const allowance = await token.allowance(wallet.address, PLATFORM_ADDRESS);
  console.log("\n🔓 Allowances:");
  console.log("  Platform Allowance:", ethers.formatUnits(allowance, decimals), symbol);

  // Uncomment below to perform actions:

  // 1. APPROVE tokens for platform (needed before donating)
  console.log("\n💡 To donate, first approve tokens:");
  console.log("   Uncomment the approve section in this script");
  /*
  const approveAmount = ethers.parseUnits("1000", decimals); // 1000 IDRX
  console.log("\n⏳ Approving", ethers.formatUnits(approveAmount, decimals), symbol, "for platform...");
  const approveTx = await token.approve(PLATFORM_ADDRESS, approveAmount);
  console.log("  Transaction:", approveTx.hash);
  await approveTx.wait();
  console.log("  ✅ Approved!");
  */

  // 2. TRANSFER tokens to another address
  /*
  const recipient = "0x..."; // Replace with recipient address
  const transferAmount = ethers.parseUnits("100", decimals); // 100 IDRX
  console.log("\n⏳ Transferring", ethers.formatUnits(transferAmount, decimals), symbol, "to", recipient);
  const transferTx = await token.transfer(recipient, transferAmount);
  console.log("  Transaction:", transferTx.hash);
  await transferTx.wait();
  console.log("  ✅ Transfer complete!");
  */

  // 3. MINT new tokens (only owner can do this)
  /*
  const mintAmount = ethers.parseUnits("10000", decimals); // 10000 IDRX
  console.log("\n⏳ Minting", ethers.formatUnits(mintAmount, decimals), symbol);
  const mintTx = await token.mint(wallet.address, mintAmount);
  console.log("  Transaction:", mintTx.hash);
  await mintTx.wait();
  console.log("  ✅ Minted!");
  */

  // 4. BATCH TRANSFER to multiple addresses
  /*
  const recipients = ["0x...", "0x..."];
  const amounts = [
    ethers.parseUnits("50", decimals),
    ethers.parseUnits("75", decimals)
  ];
  console.log("\n⏳ Batch transferring to", recipients.length, "addresses");
  const batchTx = await token.batchTransfer(recipients, amounts);
  console.log("  Transaction:", batchTx.hash);
  await batchTx.wait();
  console.log("  ✅ Batch transfer complete!");
  */

  console.log("\n🔗 View on Block Explorer:");
  console.log("  https://sepolia-blockscout.lisk.com/address/" + TOKEN_ADDRESS);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
