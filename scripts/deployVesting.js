const { ethers } = require("hardhat");

async function main() {
  const [deployer, beneficiary] = await ethers.getSigners();

  const CLIFF = 120; // 2 minutes
  const DURATION = 600; // 10 minutes total

  // 1) deploy a token to vest
  const Token = await ethers.getContractFactory("CampusCoin");
  const token = await Token.deploy(1_000_000);
  await token.waitForDeployment();

  // 2) deploy the vesting schedule
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const Vesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await Vesting.deploy(
    await token.getAddress(),
    beneficiary.address,
    now,
    CLIFF,
    DURATION,
    true, // revocable
  );
  await vesting.waitForDeployment();

  // 3) fund the schedule with 1000 tokens
  await token.transfer(await vesting.getAddress(), ethers.parseUnits("1000", 18));

  console.log("Token      :", await token.getAddress());
  console.log("Vesting    :", await vesting.getAddress());
  console.log("Beneficiary:", beneficiary.address);
  console.log("Cliff 2 min, total 10 min, 1000 CAMP funded.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
