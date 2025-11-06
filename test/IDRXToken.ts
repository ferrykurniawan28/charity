import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, formatEther, Address } from "viem";

describe("IDRXToken", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      const token = await viem.deployContract("IDRXToken");

      assert.equal(await token.read.name(), "Mock IDRX Token");
      assert.equal(await token.read.symbol(), "IDRX");
      assert.equal(await token.read.decimals(), 18);
    });

    it("Should mint initial supply to deployer", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [deployer] = await viem.getWalletClients();

      const totalSupply = await token.read.totalSupply();
      const deployerBalance = await token.read.balanceOf([deployer.account.address]);

      assert.equal(totalSupply, parseEther("1000000"));
      assert.equal(deployerBalance, parseEther("1000000"));
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, recipient] = await viem.getWalletClients();

      const transferAmount = parseEther("100");
      
      await token.write.transfer([recipient.account.address, transferAmount]);

      const recipientBalance = await token.read.balanceOf([recipient.account.address]);
      assert.equal(recipientBalance, transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, recipient] = await viem.getWalletClients();

      const transferAmount = parseEther("50");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await token.write.transfer([recipient.account.address, transferAmount]);

      const events = await publicClient.getContractEvents({
        address: token.address,
        abi: token.abi,
        eventName: "Transfer",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      const transferEvent = events.find((e: any) => 
        e.args.to?.toLowerCase() === recipient.account.address.toLowerCase() &&
        e.args.value === transferAmount
      );

      assert.ok(transferEvent, "Transfer event should be emitted");
    });

    it("Should fail when sender doesn't have enough tokens", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, recipient] = await viem.getWalletClients();

      const recipientToken = await viem.getContractAt(
        "IDRXToken",
        token.address,
        { client: { wallet: recipient } }
      );

      await assert.rejects(
        recipientToken.write.transfer([owner.account.address, parseEther("1")]),
        /ERC20: transfer amount exceeds balance/
      );
    });

    it("Should fail when transferring to zero address", async function () {
      const token = await viem.deployContract("IDRXToken");

      await assert.rejects(
        token.write.transfer(["0x0000000000000000000000000000000000000000", parseEther("1")]),
        /ERC20: transfer to the zero address/
      );
    });

    it("Should update balances correctly after multiple transfers", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, addr1, addr2] = await viem.getWalletClients();

      const initialBalance = await token.read.balanceOf([owner.account.address]) as bigint;

      await token.write.transfer([addr1.account.address, parseEther("100")]);
      await token.write.transfer([addr2.account.address, parseEther("50")]);

      const ownerBalance = await token.read.balanceOf([owner.account.address]);
      const addr1Balance = await token.read.balanceOf([addr1.account.address]);
      const addr2Balance = await token.read.balanceOf([addr2.account.address]);

      assert.equal(ownerBalance, initialBalance - parseEther("150"));
      assert.equal(addr1Balance, parseEther("100"));
      assert.equal(addr2Balance, parseEther("50"));
    });
  });

  describe("Approval", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender] = await viem.getWalletClients();

      const approvalAmount = parseEther("100");
      await token.write.approve([spender.account.address, approvalAmount]);

      const allowance = await token.read.allowance([owner.account.address, spender.account.address]);
      assert.equal(allowance, approvalAmount);
    });

    it("Should emit Approval event", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender] = await viem.getWalletClients();

      const approvalAmount = parseEther("100");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await token.write.approve([spender.account.address, approvalAmount]);

      const events = await publicClient.getContractEvents({
        address: token.address,
        abi: token.abi,
        eventName: "Approval",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      const approvalEvent = events.find((e: any) => 
        e.args.spender?.toLowerCase() === spender.account.address.toLowerCase() &&
        e.args.value === approvalAmount
      );

      assert.ok(approvalEvent, "Approval event should be emitted");
    });

    it("Should increase allowance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender] = await viem.getWalletClients();

      await token.write.approve([spender.account.address, parseEther("100")]);
      await token.write.increaseAllowance([spender.account.address, parseEther("50")]);

      const allowance = await token.read.allowance([owner.account.address, spender.account.address]);
      assert.equal(allowance, parseEther("150"));
    });

    it("Should decrease allowance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender] = await viem.getWalletClients();

      await token.write.approve([spender.account.address, parseEther("100")]);
      await token.write.decreaseAllowance([spender.account.address, parseEther("40")]);

      const allowance = await token.read.allowance([owner.account.address, spender.account.address]);
      assert.equal(allowance, parseEther("60"));
    });

    it("Should fail when decreasing allowance below zero", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender] = await viem.getWalletClients();

      await token.write.approve([spender.account.address, parseEther("100")]);

      await assert.rejects(
        token.write.decreaseAllowance([spender.account.address, parseEther("150")]),
        /ERC20: decreased allowance below zero/
      );
    });
  });

  describe("TransferFrom", function () {
    it("Should transfer tokens using allowance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender, recipient] = await viem.getWalletClients();

      const transferAmount = parseEther("100");
      await token.write.approve([spender.account.address, transferAmount]);

      const spenderToken = await viem.getContractAt(
        "IDRXToken",
        token.address,
        { client: { wallet: spender } }
      );

      await spenderToken.write.transferFrom([
        owner.account.address,
        recipient.account.address,
        transferAmount
      ]);

      const recipientBalance = await token.read.balanceOf([recipient.account.address]);
      assert.equal(recipientBalance, transferAmount);
    });

    it("Should decrease allowance after transferFrom", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender, recipient] = await viem.getWalletClients();

      await token.write.approve([spender.account.address, parseEther("100")]);

      const spenderToken = await viem.getContractAt(
        "IDRXToken",
        token.address,
        { client: { wallet: spender } }
      );

      await spenderToken.write.transferFrom([
        owner.account.address,
        recipient.account.address,
        parseEther("40")
      ]);

      const allowance = await token.read.allowance([owner.account.address, spender.account.address]);
      assert.equal(allowance, parseEther("60"));
    });

    it("Should fail when transferFrom exceeds allowance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender, recipient] = await viem.getWalletClients();

      await token.write.approve([spender.account.address, parseEther("100")]);

      const spenderToken = await viem.getContractAt(
        "IDRXToken",
        token.address,
        { client: { wallet: spender } }
      );

      await assert.rejects(
        spenderToken.write.transferFrom([
          owner.account.address,
          recipient.account.address,
          parseEther("150")
        ]),
        /ERC20: insufficient allowance/
      );
    });

    it("Should handle max uint256 allowance without decreasing", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, spender, recipient] = await viem.getWalletClients();

      const maxAllowance = 2n ** 256n - 1n;
      await token.write.approve([spender.account.address, maxAllowance]);

      const spenderToken = await viem.getContractAt(
        "IDRXToken",
        token.address,
        { client: { wallet: spender } }
      );

      await spenderToken.write.transferFrom([
        owner.account.address,
        recipient.account.address,
        parseEther("100")
      ]);

      const allowance = await token.read.allowance([owner.account.address, spender.account.address]);
      assert.equal(allowance, maxAllowance);
    });
  });

  describe("Mint", function () {
    it("Should mint new tokens", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, recipient] = await viem.getWalletClients();

      const initialSupply = await token.read.totalSupply() as bigint;
      const mintAmount = parseEther("1000");

      await token.write.mint([recipient.account.address, mintAmount]);

      const newSupply = await token.read.totalSupply();
      const recipientBalance = await token.read.balanceOf([recipient.account.address]);

      assert.equal(newSupply, initialSupply + mintAmount);
      assert.equal(recipientBalance, mintAmount);
    });

    it("Should emit Transfer event from zero address when minting", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, recipient] = await viem.getWalletClients();

      const mintAmount = parseEther("500");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await token.write.mint([recipient.account.address, mintAmount]);

      const events = await publicClient.getContractEvents({
        address: token.address,
        abi: token.abi,
        eventName: "Transfer",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      const mintEvent = events.find((e: any) => 
        e.args.from?.toLowerCase() === "0x0000000000000000000000000000000000000000" &&
        e.args.to?.toLowerCase() === recipient.account.address.toLowerCase() &&
        e.args.value === mintAmount
      );

      assert.ok(mintEvent, "Transfer event from zero address should be emitted when minting");
    });

    it("Should fail when minting to zero address", async function () {
      const token = await viem.deployContract("IDRXToken");

      await assert.rejects(
        token.write.mint(["0x0000000000000000000000000000000000000000", parseEther("100")]),
        /ERC20: mint to the zero address/
      );
    });
  });

  describe("Batch Transfer", function () {
    it("Should batch transfer to multiple recipients", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, addr1, addr2, addr3] = await viem.getWalletClients();

      const recipients = [
        addr1.account.address,
        addr2.account.address,
        addr3.account.address
      ] as Address[];
      
      const amounts = [
        parseEther("100"),
        parseEther("200"),
        parseEther("300")
      ];

      await token.write.batchTransfer([recipients, amounts]);

      const addr1Balance = await token.read.balanceOf([addr1.account.address]);
      const addr2Balance = await token.read.balanceOf([addr2.account.address]);
      const addr3Balance = await token.read.balanceOf([addr3.account.address]);

      assert.equal(addr1Balance, parseEther("100"));
      assert.equal(addr2Balance, parseEther("200"));
      assert.equal(addr3Balance, parseEther("300"));
    });

    it("Should emit Transfer events for each batch transfer", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, addr1, addr2] = await viem.getWalletClients();
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      const recipients = [
        addr1.account.address,
        addr2.account.address
      ] as Address[];
      
      const amounts = [
        parseEther("50"),
        parseEther("75")
      ];

      await token.write.batchTransfer([recipients, amounts]);

      const events = await publicClient.getContractEvents({
        address: token.address,
        abi: token.abi,
        eventName: "Transfer",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      // Filter events (excluding deployment mint event)
      const batchEvents = events.filter((e: any) => 
        e.args.from?.toLowerCase() === owner.account.address.toLowerCase()
      );

      assert.equal(batchEvents.length, 2);
      assert.equal((batchEvents[0] as any).args.value, parseEther("50"));
      assert.equal((batchEvents[1] as any).args.value, parseEther("75"));
    });

    it("Should fail when recipients and amounts arrays have different lengths", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, addr1, addr2] = await viem.getWalletClients();

      const recipients = [addr1.account.address, addr2.account.address] as Address[];
      const amounts = [parseEther("100")];

      await assert.rejects(
        token.write.batchTransfer([recipients, amounts]),
        /IDRX: arrays length mismatch/
      );
    });

    it("Should fail batch transfer if sender doesn't have enough balance", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, addr1, addr2] = await viem.getWalletClients();

      const recipients = [addr1.account.address, addr2.account.address] as Address[];
      const amounts = [parseEther("600000"), parseEther("600000")];

      await assert.rejects(
        token.write.batchTransfer([recipients, amounts]),
        /ERC20: transfer amount exceeds balance/
      );
    });
  });

  describe("Total Supply Integrity", function () {
    it("Should maintain total supply integrity through transfers", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, addr1, addr2] = await viem.getWalletClients();

      const initialSupply = await token.read.totalSupply() as bigint;

      await token.write.transfer([addr1.account.address, parseEther("1000")]);
      await token.write.transfer([addr2.account.address, parseEther("2000")]);

      const addr1Token = await viem.getContractAt(
        "IDRXToken",
        token.address,
        { client: { wallet: addr1 } }
      );
      await addr1Token.write.transfer([addr2.account.address, parseEther("500")]);

      const finalSupply = await token.read.totalSupply();
      assert.equal(finalSupply, initialSupply);
    });

    it("Should increase total supply when minting", async function () {
      const token = await viem.deployContract("IDRXToken");
      const [owner, recipient] = await viem.getWalletClients();

      const initialSupply = await token.read.totalSupply() as bigint;
      await token.write.mint([recipient.account.address, parseEther("5000")]);

      const finalSupply = await token.read.totalSupply();
      assert.equal(finalSupply, initialSupply + parseEther("5000"));
    });
  });
});
