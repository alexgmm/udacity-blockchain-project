const {
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollateralizedLoan", function () {
  let contract;
  let _owner, borrower, lender;
  const thirtyDays = 2592000;
  const interestRate = 3;
  const loanAmount = 10;
  const firstLoanId = 1;

  beforeEach(async function () {
    const Contract = await ethers.getContractFactory("CollateralizedLoan");
    contract = await Contract.deploy();
    [_owner, borrower, lender] = await ethers.getSigners();
  });

  function requestLoan() {
    return contract.connect(borrower)
      .depositCollateralAndRequestLoan(
        interestRate,
        thirtyDays,
        { value: loanAmount }
      );
  }

  function fundLoan() {
    return contract.connect(lender).fundLoan(firstLoanId, { value: loanAmount });
  }

  async function getTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  describe("Loan Request", function () {
    it("Should let a borrower deposit collateral and request a loan", async function () {
      await expect(requestLoan()).to.emit(contract, "LoanRequested");

      const nextLoanId = await contract.nextLoanId();
      const loan = await contract.loans(firstLoanId);

      const thirtyDaysFromNow = (await getTimestamp()) + thirtyDays;
      expect(nextLoanId).to.be.equal(firstLoanId);
      expect(loan.interestRate).to.be.equals(interestRate);
      expect(loan.dueDate).to.be.equals(thirtyDaysFromNow);
    });

    it("Should revert if no collateral is provided", async function () {
      await expect(contract.connect(borrower)
        .depositCollateralAndRequestLoan(
          interestRate,
          thirtyDays,
          { value: 0 }
      )).to.be.reverted;
    });
  });

  describe("Funding a Loan", function () {
    it("Allows a lender to fund a requested loan", async function () {
      await requestLoan();

      await expect(fundLoan()).to.emit(contract, "LoanFunded");

      const loan = await contract.loans(firstLoanId);
      expect(loan.isFunded).to.be.equals(true);
      expect(loan.lender).to.be.equals(lender);
    });
    
    it("Should revert if lender and borrower are the same", async function () {
      await requestLoan();

      await expect(contract.connect(borrower)
        .fundLoan(firstLoanId)).to.be.reverted;
    });
  });

  describe("Repaying a Loan", function () {
    it("Enables the borrower to repay the loan fully", async function () {
      await requestLoan();
      await fundLoan();
      const tx = contract.connect(borrower).repayLoan(firstLoanId);
      await expect(tx).to.emit(contract, "LoanRepaid");
      await expect(tx).to.changeEtherBalance(
        lender, BigInt(loanAmount) + (BigInt(loanAmount) * BigInt(interestRate))/100n
      );

      const loan = await contract.loans(firstLoanId);
      expect(loan.isRepaid).to.be.equals(true);
    });
  });

  describe("Claiming Collateral", function () {
    it("Permits the lender to claim collateral if the loan isn't repaid on time", async function () {
      await requestLoan();
      await fundLoan();
      await time.increase(thirtyDays + 1);
      const tx = contract.connect(lender).claimCollateral(firstLoanId);
      await expect(tx).to.emit(contract, "CollateralClaimed");
      await expect(tx).to.changeEtherBalance(lender, loanAmount);

      const loan = await contract.loans(firstLoanId);
      expect(loan.wasCollateralClaimed).to.be.equals(true);
    });
  });
});