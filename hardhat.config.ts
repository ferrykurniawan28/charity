import { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatIgnitionViemPlugin from "@nomicfoundation/hardhat-ignition-viem";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatIgnitionViemPlugin, hardhatVerify, hardhatEthers],
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      viaIR: true,
    },
  },
  networks: {
    "lisk-sepolia": {
      type: "http",
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.PRIVATE_KEY as string],
      chainId: 4202,
    },
  },
  // etherscan: {
  //   apiKey: {
  //     "lisk-sepolia": "no-api-key-needed",
  //   },
  //   customChains: [
  //     {
  //       network: "lisk-sepolia",
  //       chainId: 4202,
  //       urls: {
  //         apiURL: "https://sepolia-blockscout.lisk.com/api",
  //         browserURL: "https://sepolia-blockscout.lisk.com",
  //       },
  //     },
  //   ],
  // },
  // sourcify: {
  //   enabled: false,
  // },
  // chainDescriptors: {
  //   4202: {
  //     name: "Lisk Sepolia",
  //     blockExplorers: {
  //       blockscout: {
  //         name: "Blockscout",
  //         url: "https://sepolia-blockscout.lisk.com/",
  //         apiUrl: "https://sepolia-blockscout.lisk.com/api",
  //       },
  //     },
  //   },
  // },
  verify: {
    blockscout: {
      enabled: true,
    },
  },
};

export default config;
