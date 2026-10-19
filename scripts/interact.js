// A scripted version of the Part 7 console demo, so transfer / approve /
// transferFrom can be verified end-to-end in one run. Deploys a fresh token,
// runs the full flow, and prints balances at each step.
const { ethers } = require("hardhat");

const fmt = (x) => ethers.formatUnits(x, 18);

async function main() {
  const [owner, alice, bob] = await ethers.getSigners();

  const CampusCoin = await ethers.getContractFactory("CampusCoin");
  const token = await CampusCoin.deploy(1_000_000);
  await token.waitForDeployment();
  console.log("Token:", await token.getAddress());

  console.log("\nStart:");
  console.log("  owner:", fmt(await token.balanceOf(owner.address)));

  // transfer
  await token.transfer(alice.address, ethers.parseUnits("100", 18));
  console.log("\nAfter owner transfers 100 to alice:");
  console.log("  alice:", fmt(await token.balanceOf(alice.address)));

  // approve + transferFrom
  await token.approve(alice.address, ethers.parseUnits("50", 18));
  await token
    .connect(alice)
    .transferFrom(owner.address, bob.address, ethers.parseUnits("50", 18));
  console.log("\nAfter owner approves alice 50, alice moves it to bob:");
  console.log("  bob:  ", fmt(await token.balanceOf(bob.address)));

  console.log(
    "\nOwner now holds:",
    fmt(await token.balanceOf(owner.address)),
    "(1,000,000 - 100 - 50)",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
