const { ethers } = require("hardhat");

async function main() {
  const cap = 2_000_000; // hard maximum supply
  const initialSupply = 1_000_000; // minted to the deployer at launch

  const Factory = await ethers.getContractFactory("CampusCoinV2");
  const token = await Factory.deploy(cap, initialSupply);
  await token.waitForDeployment();

  console.log("CampusCoinV2 deployed to:", await token.getAddress());
  console.log("  cap:", cap, "  initial supply:", initialSupply);
  console.log("Verify with:");
  console.log(
    `  npx hardhat verify --network sepolia ${await token.getAddress()} ${cap} ${initialSupply}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
