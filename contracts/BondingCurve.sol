// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Lab 6: a linear bonding curve.
// The contract IS the market. There is no exchange and no order book.
// The price of the next token is a pure function of how many exist:
//
//     price(supply) = slope * supply + base
//
// buy()  mints new tokens and takes ETH into a reserve.
// sell() burns tokens and returns ETH from the reserve.
// Because ETH in always equals the area under the curve, the reserve can
// always buy everyone back out: it is always solvent.
//
// Tokens are whole units (0 decimals) so the maths stays exact.
contract BondingCurve is ERC20 {
    uint256 public immutable slope; // how fast the price rises per token (wei)
    uint256 public immutable base; // the price of the very first token (wei)

    event Bought(address indexed buyer, uint256 amount, uint256 cost);
    event Sold(address indexed seller, uint256 amount, uint256 refund);

    constructor(uint256 _slope, uint256 _base) ERC20("Curve Token", "CURVE") {
        slope = _slope;
        base = _base;
    }

    function decimals() public pure override returns (uint8) {
        return 0; // whole tokens only
    }

    // Spot price to mint the NEXT token at the current supply.
    function currentPrice() public view returns (uint256) {
        return slope * totalSupply() + base;
    }

    // ETH needed to buy `amount` tokens right now.
    // Sum of price(s), price(s+1), ... price(s+amount-1), where s = supply.
    //   = slope * (amount*s + amount*(amount-1)/2) + base*amount
    function costToBuy(uint256 amount) public view returns (uint256) {
        uint256 s = totalSupply();
        return slope * (amount * s + (amount * (amount - 1)) / 2) + base * amount;
    }

    // ETH returned for selling `amount` tokens right now.
    // It is exactly the cost of the top `amount` tokens on the curve, so a
    // buy-then-sell round trip returns precisely what you paid.
    function refundForSell(uint256 amount) public view returns (uint256) {
        uint256 s = totalSupply();
        require(amount <= s, "amount exceeds supply");
        uint256 start = s - amount;
        return slope * (amount * start + (amount * (amount - 1)) / 2) + base * amount;
    }

    // The ETH the contract is holding (its reserve).
    function reserve() external view returns (uint256) {
        return address(this).balance;
    }

    // Send ETH, receive `amount` tokens. Any extra ETH is refunded.
    function buy(uint256 amount) external payable {
        uint256 cost = costToBuy(amount);
        require(msg.value >= cost, "not enough ETH sent");

        _mint(msg.sender, amount);
        emit Bought(msg.sender, amount, cost);

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost); // return overpay
        }
    }

    // Return `amount` tokens, receive ETH from the reserve.
    function sell(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "not enough tokens");
        uint256 refund = refundForSell(amount);

        _burn(msg.sender, amount); // effects before interaction
        emit Sold(msg.sender, amount, refund);

        payable(msg.sender).transfer(refund);
    }
}
