import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import IDRXTokenModule from "./IDRXToken.js";

/**
 * Deployment module for CharityPlatform
 * This deploys the charity platform contract with the IDRX token
 */
const CharityPlatformModule = buildModule("CharityPlatformModule", (m) => {
  // Option 1: Use an existing token address (if already deployed)
  // const tokenAddress = m.getParameter("tokenAddress", "0x...");
  
  // Option 2: Deploy a new token first (default)
  const { idrxToken } = m.useModule(IDRXTokenModule);
  
  // Deploy the Charity Platform with the token address
  const charityPlatform = m.contract("CharityPlatform", [idrxToken]);

  return { charityPlatform, idrxToken };
});

export default CharityPlatformModule;
