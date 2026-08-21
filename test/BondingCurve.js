const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("BondingCurve", function () {
  async function deployFixture() {
    const [deployer, alice, bob] = await ethers.getSigners();
    const slope = ethers.parseEther("0.001"); // price rises 0.001 ETH per token
    const base = ethers.parseEther("0.01"); // first token costs 0.01 ETH
    const Curve = await ethers.getContractFactory("BondingCurve");
    const curve = await Curve.deploy(slope, base);
    return { curve, deployer, alice, bob, slope, base };
  }

  it("starts at the base price and has no reserve", async function () {
    const { curve, base } = await loadFixture(deployFixture);
    expect(await curve.totalSupply()).to.equal(0n);
    expect(await curve.currentPrice()).to.equal(base);
    expect(await curve.reserve()).to.equal(0n);
  });

  it("the price rises by exactly `slope` after each token", async function () {
    const { curve, alice, slope } = await loadFixture(deployFixture);
    const p0 = await curve.currentPrice();
    await curve.connect(alice).buy(1, { value: await curve.costToBuy(1) });
    const p1 = await curve.currentPrice();
    expect(p1 - p0).to.equal(slope);
  });

  it("buys the right number of tokens for the right cost", async function () {
    const { curve, alice, base } = await loadFixture(deployFixture);
    // first token costs exactly the base price
    expect(await curve.costToBuy(1)).to.equal(base);
    const cost = await curve.costToBuy(5);
    await curve.connect(alice).buy(5, { value: cost });
    expect(await curve.balanceOf(alice.address)).to.equal(5n);
    expect(await curve.totalSupply()).to.equal(5n);
    expect(await curve.reserve()).to.equal(cost);
  });

  it("refunds any extra ETH sent on a buy", async function () {
    const { curve, alice } = await loadFixture(deployFixture);
    const cost = await curve.costToBuy(3);
    const curveAddr = await curve.getAddress();
    const before = await ethers.provider.getBalance(curveAddr);
    await curve.connect(alice).buy(3, { value: cost + ethers.parseEther("1") });
    const after = await ethers.provider.getBalance(curveAddr);
    // the contract keeps only the true cost; the extra 1 ETH is returned
    expect(after - before).to.equal(cost);
  });

  it("a buy-then-sell round trip returns exactly what you paid", async function () {
    const { curve, alice } = await loadFixture(deployFixture);
    const cost = await curve.costToBuy(10);
    await curve.connect(alice).buy(10, { value: cost });
    const refund = await curve.refundForSell(10);
    expect(refund).to.equal(cost);
  });

  it("sell returns the correct ETH from the reserve", async function () {
    const { curve, alice } = await loadFixture(deployFixture);
    await curve.connect(alice).buy(8, { value: await curve.costToBuy(8) });
    const curveAddr = await curve.getAddress();
    const before = await ethers.provider.getBalance(curveAddr);
    const refund = await curve.refundForSell(5);
    await curve.connect(alice).sell(5);
    const after = await ethers.provider.getBalance(curveAddr);
    expect(before - after).to.equal(refund);
    expect(await curve.balanceOf(alice.address)).to.equal(3n);
  });

  it("the reserve stays solvent: everyone can be bought back out to zero", async function () {
    const { curve, alice, bob } = await loadFixture(deployFixture);
    const curveAddr = await curve.getAddress();

    const c1 = await curve.costToBuy(10);
    await curve.connect(alice).buy(10, { value: c1 });
    const c2 = await curve.costToBuy(10); // pricier: supply is now higher
    await curve.connect(bob).buy(10, { value: c2 });

    // reserve holds exactly what both paid in
    expect(await curve.reserve()).to.equal(c1 + c2);

    // both sell everything; the reserve empties exactly to zero
    await curve.connect(bob).sell(10);
    await curve.connect(alice).sell(10);
    expect(await curve.reserve()).to.equal(0n);
    expect(await curve.totalSupply()).to.equal(0n);
  });

  it("reverts on too little ETH, or selling tokens you don't have", async function () {
    const { curve, alice } = await loadFixture(deployFixture);
    await expect(
      curve.connect(alice).buy(5, { value: 1 }),
    ).to.be.revertedWith("not enough ETH sent");
    await expect(curve.connect(alice).sell(1)).to.be.revertedWith(
      "not enough tokens",
    );
  });
});
