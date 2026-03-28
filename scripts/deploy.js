// ══════════════════════════════════════════
//  QuantumGuard — Deploy Smart Contract
//  Run: npx hardhat run scripts/deploy.js --network sepolia
// ══════════════════════════════════════════
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying FarmerIdentity contract to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("📦 Deploying from wallet:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Wallet balance:", ethers.formatEther(balance), "ETH");

  const Contract = await ethers.getContractFactory("FarmerIdentity");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ FarmerIdentity deployed to:", address);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + address);
  console.log("\n👉 Copy this address to your .env file as:");
  console.log("   CONTRACT_ADDRESS=" + address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
