require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
  );

  const borrower = new ethers.Wallet(
    process.env.BORROWER_ACCOUNT_PRIVATE_KEY,
    provider
  );
  const lender = new ethers.Wallet(
    process.env.LENDER_ACCOUNT_PRIVATE_KEY,
    provider
  );

  const contractAddress = process.env.CONTRACT_ADDRESS;

  const contract = await ethers.getContractAt(
    "CollateralizedLoan",
    contractAddress
  );

  const borrowerContract = contract.connect(borrower);
  const lenderContract = contract.connect(lender);

  const borrowerBalance = await provider.getBalance(borrower.address);
  const lenderBalance = await provider.getBalance(lender.address);

  console.log("Borrower:", borrower.address, ethers.formatEther(borrowerBalance), "ETH");
  console.log("Lender  :", lender.address, ethers.formatEther(lenderBalance), "ETH");

  const collateralAmount = ethers.parseEther("0.001");
  const interestRate = 10;
  const durationSeconds = 7 * 24 * 60 * 60; // 7 days

  if (borrowerBalance < collateralAmount) {
    throw new Error("Borrower balance is below collateral amount");
  }

  const tx1 = await borrowerContract.depositCollateralAndRequestLoan(
    interestRate,
    durationSeconds,
    { value: collateralAmount }
  );
  await tx1.wait();
  console.log(`\x1b[34mLoan requested at ${tx1.hash}\x1b[0m`);

  const loanId = await contract.nextLoanId();
  const loan = await contract.loans(loanId);
  const requiredFunding = loan.loanAmount;

  const tx2 = await lenderContract.fundLoan(loanId, { value: requiredFunding });
  await tx2.wait();
  console.log(`\x1b[34mLoan funded at ${tx2.hash}\x1b[0m`);

  console.log(`\x1b[32mLoan ${loanId.toString()} requested and funded successfully.\x1b[0m`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\x1b[31mAn error occurred during the interaction:\x1b[0m", error);
    process.exit(1);
  });
