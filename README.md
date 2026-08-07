# tokenomics-labs

Hands-on ERC-20 lab projects for the **Tokenomics** course
(B.Sc. Blockchain Technology, Semester VI).

**Stack:** Hardhat 2 · ethers v6 · OpenZeppelin Contracts v5 · Solidity 0.8.24.

## Labs in this repo

### Lab 3 — Basic ERC-20
A fixed-supply token: **Campus Coin (CAMP)**, 1,000,000 minted once to the
deployer, then frozen forever.
- `contracts/CampusCoin.sol`
- `test/CampusCoin.js`
- `scripts/deploy.js`, `scripts/interact.js`

### Lab 4 — Minting, Burning & Access Control
The Lab 3 token upgraded with a **max-supply cap**, **role-controlled minting**
(`MINTER_ROLE`), and **burning** (holder self-burn + a `BURNER_ROLE`
admin burn), using OpenZeppelin's `ERC20Capped`, `ERC20Burnable`, and
`AccessControl`.
- `contracts/CampusCoinV2.sol`
- `test/CampusCoinV2.js`
- `scripts/deployV2.js`

## Getting started

```bash
npm install                 # install dependencies
npx hardhat compile         # compile all contracts
npx hardhat test            # run all tests (Lab 3 + Lab 4)
```

## Deploy locally

```bash
npx hardhat node                                          # terminal 1
npx hardhat run scripts/deployV2.js --network localhost   # terminal 2
npx hardhat console --network localhost                   # poke it by hand
```

## Deploy to Sepolia + verify

1. `cp .env.example .env` and fill in your values (RPC URL, **burner** private
   key, Etherscan key). **Never commit `.env`.**
2. Deploy and verify:

```bash
# Lab 3
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat verify --network sepolia <ADDRESS> 1000000

# Lab 4 (constructor takes cap AND initial supply)
npx hardhat run scripts/deployV2.js --network sepolia
npx hardhat verify --network sepolia <ADDRESS> 2000000 1000000
```
