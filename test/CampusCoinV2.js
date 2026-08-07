const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("CampusCoinV2", function () {
  const units = (n) => ethers.parseUnits(n.toString(), 18);

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const cap = 2_000_000;
    const initialSupply = 1_000_000;
    const Factory = await ethers.getContractFactory("CampusCoinV2");
    const token = await Factory.deploy(cap, initialSupply);
    return { token, owner, alice, bob, cap, initialSupply };
  }

  it("starts with the initial supply and the right cap", async function () {
    const { token, owner, cap, initialSupply } = await loadFixture(deployFixture);
    expect(await token.totalSupply()).to.equal(units(initialSupply));
    expect(await token.balanceOf(owner.address)).to.equal(units(initialSupply));
    expect(await token.cap()).to.equal(units(cap));
  });

  it("lets a MINTER mint new tokens", async function () {
    const { token, alice } = await loadFixture(deployFixture);
    await token.mint(alice.address, units(500));
    expect(await token.balanceOf(alice.address)).to.equal(units(500));
    expect(await token.totalSupply()).to.equal(units(1_000_500));
  });

  it("blocks a non-minter from minting", async function () {
    const { token, alice } = await loadFixture(deployFixture);
    await expect(
      token.connect(alice).mint(alice.address, units(1)),
    ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
  });

  it("cannot mint beyond the cap", async function () {
    const { token, owner } = await loadFixture(deployFixture);
    // cap 2,000,000; 1,000,000 already minted; +1,000,001 goes over.
    await expect(
      token.mint(owner.address, units(1_000_001)),
    ).to.be.revertedWithCustomError(token, "ERC20ExceededCap");
  });

  it("lets any holder burn their own tokens, reducing supply", async function () {
    const { token, owner } = await loadFixture(deployFixture);
    await token.burn(units(100));
    expect(await token.totalSupply()).to.equal(units(999_900));
    expect(await token.balanceOf(owner.address)).to.equal(units(999_900));
  });

  it("tracks supply correctly after several mints and burns", async function () {
    const { token, alice } = await loadFixture(deployFixture);
    await token.mint(alice.address, units(1000)); // +1000 -> 1,001,000
    await token.connect(alice).burn(units(400)); //  -400 -> 1,000,600
    await token.burn(units(600)); //                 -600 -> 1,000,000
    expect(await token.totalSupply()).to.equal(units(1_000_000));
  });

  it("lets a BURNER_ROLE account burn from any wallet, but no one else", async function () {
    const { token, alice, bob } = await loadFixture(deployFixture);
    await token.mint(alice.address, units(1000));
    // owner (deployer) has BURNER_ROLE -> can burn alice's tokens
    await token.adminBurn(alice.address, units(400));
    expect(await token.balanceOf(alice.address)).to.equal(units(600));
    // bob has no BURNER_ROLE -> reverts
    await expect(
      token.connect(bob).adminBurn(alice.address, units(1)),
    ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
  });
});
