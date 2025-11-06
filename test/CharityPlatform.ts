import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, formatEther, Address } from "viem";

describe("CharityPlatform", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // Helper function to increase time in the blockchain
  async function increaseTime(seconds: number) {
    await publicClient.request({
      method: "evm_increaseTime" as any,
      params: [seconds] as any,
    });
    await publicClient.request({
      method: "evm_mine" as any,
      params: [] as any,
    });
  }

  describe("Deployment", function () {
    it("Should deploy with correct token address and owner", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner] = await viem.getWalletClients();

      assert.equal((await charity.read.token()).toLowerCase(), token.address.toLowerCase());
      assert.equal((await charity.read.owner()).toLowerCase(), owner.account.address.toLowerCase());
      assert.equal(await charity.read.campaignCounter(), 0n);
      assert.equal(await charity.read.totalDonations(), 0n);
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign successfully", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      const campaignId = await charity.write.createCampaign([
        "Help Build School",
        "Building a school for underprivileged children",
        "QmXYZ123...",
        parseEther("1000"),
        beneficiary.account.address,
        30n // 30 days
      ]);

      const campaign = await charity.read.getCampaign([1n]);
      
      assert.equal(campaign.id, 1n);
      assert.equal(campaign.title, "Help Build School");
      assert.equal(campaign.description, "Building a school for underprivileged children");
      assert.equal(campaign.targetAmount, parseEther("1000"));
      assert.equal(campaign.beneficiary.toLowerCase(), beneficiary.account.address.toLowerCase());
      assert.equal(campaign.raisedAmount, 0n);
      assert.equal(campaign.isActive, true);
      assert.equal(campaign.fundsReleased, false);
      assert.equal(campaign.donorCount, 0n);
    });

    it("Should emit CampaignCreated event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await charity.write.createCampaign([
        "Help Build School",
        "Description",
        "QmXYZ123...",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      const events = await publicClient.getContractEvents({
        address: charity.address,
        abi: charity.abi,
        eventName: "CampaignCreated",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.campaignId, 1n);
      assert.equal(event.args.title, "Help Build School");
      assert.equal(event.args.targetAmount, parseEther("1000"));
    });

    it("Should increment campaign counter", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Campaign 1",
        "Description 1",
        "hash1",
        parseEther("100"),
        beneficiary.account.address,
        10n
      ]);

      await charity.write.createCampaign([
        "Campaign 2",
        "Description 2",
        "hash2",
        parseEther("200"),
        beneficiary.account.address,
        20n
      ]);

      assert.equal(await charity.read.campaignCounter(), 2n);
      assert.equal(await charity.read.getCampaignCount(), 2n);
    });

    it("Should fail with empty title", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await assert.rejects(
        charity.write.createCampaign([
          "",
          "Description",
          "hash",
          parseEther("100"),
          beneficiary.account.address,
          10n
        ]),
        /Title cannot be empty/
      );
    });

    it("Should fail with empty description", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await assert.rejects(
        charity.write.createCampaign([
          "Title",
          "",
          "hash",
          parseEther("100"),
          beneficiary.account.address,
          10n
        ]),
        /Description cannot be empty/
      );
    });

    it("Should fail with zero target amount", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await assert.rejects(
        charity.write.createCampaign([
          "Title",
          "Description",
          "hash",
          0n,
          beneficiary.account.address,
          10n
        ]),
        /Target amount must be positive/
      );
    });

    it("Should fail with zero address beneficiary", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);

      await assert.rejects(
        charity.write.createCampaign([
          "Title",
          "Description",
          "hash",
          parseEther("100"),
          "0x0000000000000000000000000000000000000000",
          10n
        ]),
        /Invalid beneficiary address/
      );
    });

    it("Should fail with invalid duration", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await assert.rejects(
        charity.write.createCampaign([
          "Title",
          "Description",
          "hash",
          parseEther("100"),
          beneficiary.account.address,
          0n
        ]),
        /Duration must be between 1-365 days/
      );

      await assert.rejects(
        charity.write.createCampaign([
          "Title",
          "Description",
          "hash",
          parseEther("100"),
          beneficiary.account.address,
          366n
        ]),
        /Duration must be between 1-365 days/
      );
    });
  });

  describe("Donations", function () {
    it("Should accept donations to active campaign", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      // Create campaign
      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      // Give donor some tokens
      await token.write.transfer([donor.account.address, parseEther("500")]);

      // Donor approves charity contract
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("100")]);

      // Donor donates
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("100"), "Keep up the good work!"]);

      const campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.raisedAmount, parseEther("100"));
      assert.equal(campaign.donorCount, 1n);
      assert.equal(await charity.read.totalDonations(), parseEther("100"));
    });

    it("Should emit DonationReceived event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);

      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("100")]);

      const deploymentBlockNumber = await publicClient.getBlockNumber();

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("100"), "Great cause!"]);

      const events = await publicClient.getContractEvents({
        address: charity.address,
        abi: charity.abi,
        eventName: "DonationReceived",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.campaignId, 1n);
      assert.equal(event.args.amount, parseEther("100"));
      assert.equal(event.args.message, "Great cause!");
    });

    it("Should track multiple donations from same donor", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);

      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("300")]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      
      await donorCharity.write.donate([1n, parseEther("100"), "First donation"]);
      await donorCharity.write.donate([1n, parseEther("50"), "Second donation"]);

      const campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.raisedAmount, parseEther("150"));
      assert.equal(campaign.donorCount, 1n); // Same donor, count should be 1

      const contribution = await charity.read.getDonorContribution([1n, donor.account.address]);
      assert.equal(contribution, parseEther("150"));
    });

    it("Should track multiple donors", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor1, donor2, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      // Setup donor1
      await token.write.transfer([donor1.account.address, parseEther("200")]);
      const donor1Token = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor1 }
      });
      await donor1Token.write.approve([charity.address, parseEther("100")]);
      const donor1Charity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor1 }
      });

      // Setup donor2
      await token.write.transfer([donor2.account.address, parseEther("200")]);
      const donor2Token = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor2 }
      });
      await donor2Token.write.approve([charity.address, parseEther("150")]);
      const donor2Charity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor2 }
      });

      await donor1Charity.write.donate([1n, parseEther("100"), "From donor 1"]);
      await donor2Charity.write.donate([1n, parseEther("150"), "From donor 2"]);

      const campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.raisedAmount, parseEther("250"));
      assert.equal(campaign.donorCount, 2n);

      const donors = await charity.read.getCampaignDonors([1n]);
      assert.equal(donors.length, 2);
    });

    it("Should record donation history", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("200")]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      
      await donorCharity.write.donate([1n, parseEther("100"), "First donation"]);
      await donorCharity.write.donate([1n, parseEther("50"), "Second donation"]);

      const donations = await charity.read.getCampaignDonations([1n]);
      assert.equal(donations.length, 2);
      assert.equal(donations[0].amount, parseEther("100"));
      assert.equal(donations[0].message, "First donation");
      assert.equal(donations[1].amount, parseEther("50"));
      assert.equal(donations[1].message, "Second donation");
    });

    it("Should fail with zero donation amount", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });

      await assert.rejects(
        donorCharity.write.donate([1n, 0n, "Zero donation"]),
        /Donation amount must be positive/
      );
    });

    it("Should fail with insufficient balance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });

      await assert.rejects(
        donorCharity.write.donate([1n, parseEther("100"), "Too much"]),
        /Insufficient token balance/
      );
    });

    it("Should fail with insufficient allowance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });

      await assert.rejects(
        donorCharity.write.donate([1n, parseEther("100"), "No allowance"]),
        /Insufficient allowance/
      );
    });

    it("Should fail to donate to inactive campaign", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      // Deactivate campaign
      await charity.write.toggleCampaignStatus([1n]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("100")]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });

      await assert.rejects(
        donorCharity.write.donate([1n, parseEther("100"), "To inactive"]),
        /Campaign not active/
      );
    });

    it("Should fail to donate to ended campaign", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n // 1 day
      ]);

      // Fast forward time beyond campaign end
      await increaseTime(2 * 24 * 60 * 60); // 2 days

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("100")]);

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });

      await assert.rejects(
        donorCharity.write.donate([1n, parseEther("100"), "Too late"]),
        /Campaign has ended/
      );
    });

    it("Should fail to donate to non-existent campaign", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor] = await viem.getWalletClients();

      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });

      await assert.rejects(
        donorCharity.write.donate([999n, parseEther("100"), "Ghost campaign"]),
        /Campaign does not exist/
      );
    });
  });

  describe("Fund Release", function () {
    it("Should allow campaign creator to release funds after campaign ends", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, creator, donor, beneficiary] = await viem.getWalletClients();

      // Creator creates campaign
      const creatorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: creator }
      });
      await creatorCharity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n // 1 day
      ]);

      // Donor donates
      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      // Fast forward past campaign end
      await increaseTime(2 * 24 * 60 * 60);

      // Creator releases funds
      await creatorCharity.write.releaseFunds([1n]);

      const beneficiaryBalance = await token.read.balanceOf([beneficiary.account.address]);
      assert.equal(beneficiaryBalance, parseEther("500"));

      const campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.fundsReleased, true);
      assert.equal(campaign.isActive, false);
    });

    it("Should allow owner to release funds", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      await increaseTime(2 * 24 * 60 * 60);

      // Owner releases funds
      await charity.write.releaseFunds([1n]);

      const beneficiaryBalance = await token.read.balanceOf([beneficiary.account.address]);
      assert.equal(beneficiaryBalance, parseEther("500"));
    });

    it("Should emit FundsReleased event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      await increaseTime(2 * 24 * 60 * 60);

      const deploymentBlockNumber = await publicClient.getBlockNumber();
      await charity.write.releaseFunds([1n]);

      const events = await publicClient.getContractEvents({
        address: charity.address,
        abi: charity.abi,
        eventName: "FundsReleased",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.campaignId, 1n);
      assert.equal(event.args.amount, parseEther("500"));
    });

    it("Should fail if unauthorized person tries to release funds", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, unauthorized, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      await increaseTime(2 * 24 * 60 * 60);

      const unauthorizedCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: unauthorized }
      });

      await assert.rejects(
        unauthorizedCharity.write.releaseFunds([1n]),
        /Not authorized to release funds/
      );
    });

    it("Should fail to release funds before campaign ends", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        30n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      await assert.rejects(
        charity.write.releaseFunds([1n]),
        /Campaign not ended yet/
      );
    });

    it("Should fail to release funds if no funds raised", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n
      ]);

      await increaseTime(2 * 24 * 60 * 60);

      await assert.rejects(
        charity.write.releaseFunds([1n]),
        /No funds to release/
      );
    });

    it("Should fail to release funds twice", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      await increaseTime(2 * 24 * 60 * 60);

      await charity.write.releaseFunds([1n]);

      await assert.rejects(
        charity.write.releaseFunds([1n]),
        /Funds already released/
      );
    });
  });

  describe("Campaign Management", function () {
    it("Should extend campaign duration by creator", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, creator, beneficiary] = await viem.getWalletClients();

      const creatorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: creator }
      });
      
      await creatorCharity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      const campaignBefore = await charity.read.getCampaign([1n]);
      const endTimeBefore = campaignBefore.endTime;

      await creatorCharity.write.extendCampaign([1n, 5n]);

      const campaignAfter = await charity.read.getCampaign([1n]);
      const endTimeAfter = campaignAfter.endTime;

      assert.equal(endTimeAfter, endTimeBefore + BigInt(5 * 24 * 60 * 60));
    });

    it("Should emit CampaignExtended event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      const deploymentBlockNumber = await publicClient.getBlockNumber();
      await charity.write.extendCampaign([1n, 5n]);

      const events = await publicClient.getContractEvents({
        address: charity.address,
        abi: charity.abi,
        eventName: "CampaignExtended",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.campaignId, 1n);
    });

    it("Should fail to extend campaign by non-creator", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, creator, other, beneficiary] = await viem.getWalletClients();

      const creatorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: creator }
      });
      
      await creatorCharity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      const otherCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: other }
      });

      await assert.rejects(
        otherCharity.write.extendCampaign([1n, 5n]),
        /Not campaign creator/
      );
    });

    it("Should fail to extend campaign with invalid duration", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await assert.rejects(
        charity.write.extendCampaign([1n, 0n]),
        /Can extend by 1-30 days/
      );

      await assert.rejects(
        charity.write.extendCampaign([1n, 31n]),
        /Can extend by 1-30 days/
      );
    });

    it("Should toggle campaign status by creator", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, creator, beneficiary] = await viem.getWalletClients();

      const creatorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: creator }
      });
      
      await creatorCharity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      let campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.isActive, true);

      await creatorCharity.write.toggleCampaignStatus([1n]);

      campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.isActive, false);

      await creatorCharity.write.toggleCampaignStatus([1n]);

      campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.isActive, true);
    });

    it("Should toggle campaign status by owner", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, creator, beneficiary] = await viem.getWalletClients();

      const creatorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: creator }
      });
      
      await creatorCharity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await charity.write.toggleCampaignStatus([1n]);

      const campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.isActive, false);
    });

    it("Should emit CampaignStatusChanged event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      const deploymentBlockNumber = await publicClient.getBlockNumber();
      await charity.write.toggleCampaignStatus([1n]);

      const events = await publicClient.getContractEvents({
        address: charity.address,
        abi: charity.abi,
        eventName: "CampaignStatusChanged",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      const event = events[0] as any;
      assert.equal(event.args.campaignId, 1n);
      assert.equal(event.args.isActive, false);
    });

    it("Should fail to toggle status by unauthorized person", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, creator, other, beneficiary] = await viem.getWalletClients();

      const creatorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: creator }
      });
      
      await creatorCharity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      const otherCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: other }
      });

      await assert.rejects(
        otherCharity.write.toggleCampaignStatus([1n]),
        /Not authorized/
      );
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow owner to emergency withdraw", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      const ownerBalanceBefore = await token.read.balanceOf([owner.account.address]);
      
      await charity.write.emergencyWithdraw([1n]);

      const ownerBalanceAfter = await token.read.balanceOf([owner.account.address]);
      assert.equal(ownerBalanceAfter, ownerBalanceBefore + parseEther("500"));

      const campaign = await charity.read.getCampaign([1n]);
      assert.equal(campaign.fundsReleased, true);
      assert.equal(campaign.isActive, false);
    });

    it("Should fail emergency withdraw by non-owner", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, other, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      const otherCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: other }
      });

      await assert.rejects(
        otherCharity.write.emergencyWithdraw([1n])
      );
    });

    it("Should fail emergency withdraw if no funds", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await assert.rejects(
        charity.write.emergencyWithdraw([1n])
      );
    });

    it("Should fail emergency withdraw if funds already released", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        1n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("500"), "Donation"]);

      await increaseTime(2 * 24 * 60 * 60);
      await charity.write.releaseFunds([1n]);

      await assert.rejects(
        charity.write.emergencyWithdraw([1n]),
        /Funds already released/
      );
    });
  });

  describe("View Functions", function () {
    it("Should check if campaign is active", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      assert.equal(await charity.read.isCampaignActive([1n]), true);

      await charity.write.toggleCampaignStatus([1n]);
      assert.equal(await charity.read.isCampaignActive([1n]), false);
    });

    it("Should calculate campaign progress percentage", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      let progress = await charity.read.getCampaignProgress([1n]);
      assert.equal(progress, 0n);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("250")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("250"), "Donation"]);

      progress = await charity.read.getCampaignProgress([1n]);
      assert.equal(progress, 25n); // 25%
    });

    it("Should cap progress at 100%", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Test Campaign",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await token.write.transfer([donor.account.address, parseEther("2000")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("1500")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("1500"), "Donation"]);

      const progress = await charity.read.getCampaignProgress([1n]);
      assert.equal(progress, 100n);
    });

    it("Should get platform stats", async function () {
      const token = await viem.deployContract("IDRXToken");
      const charity = await viem.deployContract("CharityPlatform", [token.address]);
      const [owner, donor, beneficiary] = await viem.getWalletClients();

      await charity.write.createCampaign([
        "Campaign 1",
        "Description",
        "hash",
        parseEther("1000"),
        beneficiary.account.address,
        10n
      ]);

      await charity.write.createCampaign([
        "Campaign 2",
        "Description",
        "hash",
        parseEther("2000"),
        beneficiary.account.address,
        20n
      ]);

      await token.write.transfer([donor.account.address, parseEther("500")]);
      const donorToken = await viem.getContractAt("IDRXToken", token.address, {
        client: { wallet: donor }
      });
      await donorToken.write.approve([charity.address, parseEther("300")]);
      const donorCharity = await viem.getContractAt("CharityPlatform", charity.address, {
        client: { wallet: donor }
      });
      await donorCharity.write.donate([1n, parseEther("100"), "Donation 1"]);
      await donorCharity.write.donate([2n, parseEther("200"), "Donation 2"]);

      const stats = await charity.read.getPlatformStats();
      
      assert.equal(stats[0], 2n); // totalCampaigns
      assert.equal(stats[1], parseEther("300")); // totalRaised
      assert.equal(stats[2], 2n); // activeCampaigns
    });
  });
});
