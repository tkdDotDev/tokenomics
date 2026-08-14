const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TokenVesting", function () {
  const units = (n) => ethers.parseUnits(n.toString(), 18);
  const CLIFF = 120; // 2 minutes
  const DURATION = 600; // 10 minutes
  const GRANT = units(1000); // tokens locked in the schedule

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    // a simple fixed-supply token to vest
    const Token = await ethers.getContractFactory("CampusCoin");
    const token = await Token.deploy(1_000_000);

    const start = (await time.latest()) + 1; // begin one second from now
    const Vesting = await ethers.getContractFactory("TokenVesting");
    const vesting = await Vesting.deploy(
      await token.getAddress(),
      alice.address, // beneficiary
      start,
      CLIFF,
      DURATION,
      true, // revocable
    );

    // fund the schedule with 1000 tokens
    await token.transfer(await vesting.getAddress(), GRANT);

    return { token, vesting, owner, alice, bob, start };
  }

  it("releases nothing before the cliff", async function () {
    const { vesting } = await loadFixture(deployFixture);
    await time.increase(60); // 60s in; cliff is at 120s
    expect(await vesting.releasable()).to.equal(0n);
    await expect(vesting.release()).to.be.revertedWith("nothing to release");
  });

  it("has unlocked about half the tokens halfway through", async function () {
    const { vesting, start } = await loadFixture(deployFixture);
    await time.increaseTo(start + DURATION / 2); // 50% through
    expect(await vesting.releasable()).to.equal(units(500));
  });

  it("releases everything after the full window", async function () {
    const { token, vesting, alice, start } = await loadFixture(deployFixture);
    await time.increaseTo(start + DURATION + 1);
    await vesting.release();
    expect(await token.balanceOf(alice.address)).to.equal(GRANT);
    expect(await token.balanceOf(await vesting.getAddress())).to.equal(0n);
  });

  it("lets the beneficiary claim in stages", async function () {
    const { token, vesting, alice, start } = await loadFixture(deployFixture);
    await time.setNextBlockTimestamp(start + DURATION / 2);
    await vesting.release(); // claim the first half
    expect(await token.balanceOf(alice.address)).to.equal(units(500));

    await time.increaseTo(start + DURATION + 1);
    await vesting.release(); // claim the rest
    expect(await token.balanceOf(alice.address)).to.equal(GRANT);
  });

  it("revoke: locked part returns to owner, vested part stays for beneficiary", async function () {
    const { token, vesting, owner, alice, start } = await loadFixture(deployFixture);
    const ownerBefore = await token.balanceOf(owner.address);

    await time.setNextBlockTimestamp(start + DURATION / 2); // revoke at 50%
    await vesting.revoke();

    // the locked half (500) went back to the owner
    expect(await token.balanceOf(owner.address)).to.equal(ownerBefore + units(500));
    // the beneficiary can still claim the vested half (500)
    await vesting.release();
    expect(await token.balanceOf(alice.address)).to.equal(units(500));
  });

  it("blocks a non-owner from revoking", async function () {
    const { vesting, bob } = await loadFixture(deployFixture);
    await expect(
      vesting.connect(bob).revoke(),
    ).to.be.revertedWithCustomError(vesting, "OwnableUnauthorizedAccount");
  });
});
