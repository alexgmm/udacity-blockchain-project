const { ethers } = require("hardhat");

async function main() {
  console.log("\x1b[34mStarting deployment...\x1b[0m");

  const CollateralizedLoan = await ethers.getContractFactory(
    "CollateralizedLoan"
  );

  const contract = await CollateralizedLoan.deploy();
  const address = await contract.getAddress();
  console.log(`\x1b[32mCollateralizedLoan deployed successfully at ${address}\x1b[0m`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\x1b[31mAn error occurred during deployment:\x1b[0m", error);
    process.exit(1);
  });
