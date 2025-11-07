import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for IDRXToken (Mock IDRX Token)
 * This deploys the ERC-20 token contract that will be used for donations
 */
const IDRXTokenModule = buildModule("IDRXTokenModule", (m) => {
  // Deploy the IDRX Token
  const idrxToken = m.contract("IDRXToken", []);

  return { idrxToken };
});

export default IDRXTokenModule;
