# Collateralized Loan Smart Contract
> Part of the Udacity Blockchain Nanodegree program. Starter code available [here](https://github.com/udacity/cd13282-blockchain-with-solidity-project/)

## 🛠 Setup
1. Clone the repo.
2. Run `npm install`.
3. Create a `.env` file containing the variables `INFURA_API_KEY`, `BORROWER_ACCOUNT_PRIVATE_KEY`, `LENDER_ACCOUNT_PRIVATE_KEY` and `CONTRACT_ADDRESS`. **The contract address should be set after deploying the contract**.
4. To compile, deploy and call the transactions:

```shell
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia-testnet
npx hardhat run scripts/interact.js --network sepolia-testnet
```

## Project Rubric Requirements
- ✅ Contract implements the required methods
- ✅ Tests for at least 2 use cases
- ✅ Contract deployed to the testnet ([etherscan link](https://sepolia.etherscan.io/address/0x915Fd761d5482Cd50589948e08369C5b8523DF18))
