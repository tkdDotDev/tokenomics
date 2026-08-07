// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// A basic fixed-supply ERC-20. The whole supply is minted once, to the
// deployer, in the constructor. There is no mint function, so the supply
// can never grow -- the "fixed supply" model from Lecture 4.
contract CampusCoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("Campus Coin", "CAMP") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
