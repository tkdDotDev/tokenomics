// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Lab 4: the Lab 3 token, upgraded.
//  - ERC20Capped    -> a hard maximum supply that can never be exceeded
//  - ERC20Burnable  -> any holder can burn (destroy) their OWN tokens
//  - AccessControl  -> named roles decide who may mint and admin-burn
contract CampusCoinV2 is ERC20, ERC20Capped, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor(uint256 cap, uint256 initialSupply)
        ERC20("Campus Coin", "CAMP")
        ERC20Capped(cap * 10 ** 18)
    {
        // The deployer becomes the admin and gets both working roles.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    // Only a MINTER_ROLE holder can create new tokens, and only up to the cap.
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // A privileged burn: a BURNER_ROLE holder can remove tokens from ANY
    // account (think compliance / clawback). Ordinary holders use burn()
    // from ERC20Burnable to destroy their own tokens.
    function adminBurn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    // Required override: both ERC20 and ERC20Capped define _update, so we
    // must state which ones we combine. super._update runs both, and the
    // ERC20Capped one enforces the cap.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
