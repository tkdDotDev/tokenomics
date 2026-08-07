const { ethers } = require("hardhat");

async function main() {
  const initialSupply = 1_000_000;

  const CampusCoin = await ethers.getContractFactory("CampusCoin");
  const token = await CampusCoin.deploy(initialSupply);
  await token.waitForDeployment();

  console.log("CampusCoin deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
