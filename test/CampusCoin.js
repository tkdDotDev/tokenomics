const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("CampusCoin", function () {
  // Deploy once, reuse in every test (fast + clean).
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const initialSupply = 1_000_000;
    const CampusCoin = await ethers.getContractFactory("CampusCoin");
    const token = await CampusCoin.deploy(initialSupply);
    return { token, owner, alice, bob, initialSupply };
  }

  it("gives the whole supply to the deployer", async function () {
    const { token, owner, initialSupply } = await loadFixture(deployFixture);
    const expected = ethers.parseUnits(initialSupply.toString(), 18);
    expect(await token.totalSupply()).to.equal(expected);
    expect(await token.balanceOf(owner.address)).to.equal(expected);
  });

  it("transfers tokens between accounts", async function () {
    const { token, alice } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("100", 18);
    await token.transfer(alice.address, amount);
    expect(await token.balanceOf(alice.address)).to.equal(amount);
  });

  it("lets an approved account spend on your behalf", async function () {
    const { token, owner, alice, bob } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("50", 18);
    await token.approve(alice.address, amount);
    await token
      .connect(alice)
      .transferFrom(owner.address, bob.address, amount);
    expect(await token.balanceOf(bob.address)).to.equal(amount);
  });
});
