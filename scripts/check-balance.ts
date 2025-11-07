import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl = "https://rpc.sepolia-api.lisk.com";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("\n🔍 Checking Lisk Sepolia Account...\n");
  console.log("Address:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n❌ Your account has 0 ETH!");
    console.log("🚰 Get testnet ETH from: https://sepolia-faucet.lisk.com/");
    console.log("   Use this address:", wallet.address);
  } else {
    console.log("\n✅ Account has funds! You can deploy.");
  }

  const network = await provider.getNetwork();
  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.chainId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
