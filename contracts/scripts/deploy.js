const hre = require("hardhat");
async function main() {
  console.log("🚀 Deploying Stamp...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("📬 From:", deployer.address);
  const Contract = await hre.ethers.getContractFactory("Stamp");
  const instance = await Contract.deploy();
  await instance.waitForDeployment();
  const address = await instance.getAddress();
  console.log("\n✅ Stamp deployed!");
  console.log("📍 Address:", address);
  console.log("🔍 https://testnet.arcscan.app/address/" + address);
  console.log("\nVITE_CONTRACT_ADDRESS=" + address);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
