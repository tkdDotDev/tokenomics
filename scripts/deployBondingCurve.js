const { ethers } = require("hardhat");

async function main() {
  const slope = ethers.parseEther("0.001"); // price rise per token
  const base = ethers.parseEther("0.01"); // price of the first token

  const Curve = await ethers.getContractFactory("BondingCurve");
  const curve = await Curve.deploy(slope, base);
  await curve.waitForDeployment();

  console.log("BondingCurve deployed to:", await curve.getAddress());
  console.log("  slope:", ethers.formatEther(slope), "ETH/token");
  console.log("  base :", ethers.formatEther(base), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
