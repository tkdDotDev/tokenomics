// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Lab 5: a vesting schedule for one beneficiary.
//  - cliff:   nothing unlocks until the cliff time passes
//  - linear:  after the cliff, tokens unlock smoothly up to the end
//  - revocable: the owner can cancel and reclaim the still-locked tokens
// Fund it by transferring tokens to this contract after deployment.
contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start; // when vesting begins
    uint256 public immutable cliff; // start + cliffDuration
    uint256 public immutable duration; // total length, from start
    bool public immutable revocable;

    uint256 public released; // how much has been sent to the beneficiary
    bool public revoked;

    event Released(uint256 amount);
    event Revoked(uint256 refund);

    constructor(
        IERC20 _token,
        address _beneficiary,
        uint256 _start,
        uint256 _cliffDuration,
        uint256 _duration,
        bool _revocable
    ) Ownable(msg.sender) {
        require(_beneficiary != address(0), "beneficiary is zero");
        require(_duration > 0, "duration is 0");
        require(_cliffDuration <= _duration, "cliff longer than duration");

        token = _token;
        beneficiary = _beneficiary;
        start = _start;
        cliff = _start + _cliffDuration;
        duration = _duration;
        revocable = _revocable;
    }

    // How many tokens have unlocked so far.
    function vestedAmount() public view returns (uint256) {
        uint256 total = token.balanceOf(address(this)) + released;
        if (block.timestamp < cliff) {
            return 0; // still inside the cliff: nothing unlocked
        } else if (block.timestamp >= start + duration || revoked) {
            return total; // fully vested (or frozen at revoke)
        } else {
            return (total * (block.timestamp - start)) / duration; // linear
        }
    }

    // Unlocked but not yet withdrawn.
    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    // Send whatever is currently releasable to the beneficiary.
    function release() public {
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(amount);
    }

    // Owner cancels the schedule: the still-locked tokens go back to the
    // owner, and the already-vested portion stays claimable by the beneficiary.
    function revoke() public onlyOwner {
        require(revocable, "not revocable");
        require(!revoked, "already revoked");

        uint256 balance = token.balanceOf(address(this));
        uint256 unreleased = releasable(); // vested but not yet withdrawn
        uint256 refund = balance - unreleased; // the still-locked remainder

        revoked = true;
        token.safeTransfer(owner(), refund);
        emit Revoked(refund);
    }
}
