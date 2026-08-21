// Buys tokens one at a time on the bonding curve, reads the price and the
// "Bought" event each time, and writes the data to a CSV. Then plot it with
// plot_curve.py. This is the "Hardhat events piped to Python matplotlib" step.
const { ethers } = require("hardhat");
const fs = require("fs");

const POINTS = 50;

async function main() {
  const slope = ethers.parseEther("0.001");
  const base = ethers.parseEther("0.01");
  const [buyer] = await ethers.getSigners();

  const Curve = await ethers.getContractFactory("BondingCurve");
  const curve = await Curve.deploy(slope, base);
  await curve.waitForDeployment();

  const rows = ["supply,price_eth,reserve_eth"];
  for (let i = 0; i < POINTS; i++) {
    const price = await curve.currentPrice(); // price to mint the next token
    await curve.connect(buyer).buy(1n, { value: price }); // buy exactly one
    const reserve = await curve.reserve(); // total ETH now held
    rows.push(
      `${i + 1},${ethers.formatEther(price)},${ethers.formatEther(reserve)}`,
    );
  }

  fs.writeFileSync("bonding_curve.csv", rows.join("\n"));
  console.log(`Wrote bonding_curve.csv (${POINTS} points).`);
  console.log("Now plot it:  python plot_curve.py");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
