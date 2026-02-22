// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CollateralizedLoan {
    struct Loan {
        uint id;
        address borrower;
        address lender;
        uint loanAmount;
        uint interestRate;
        uint dueDate;
        bool isFunded;
        bool isRepaid;
        bool wasCollateralClaimed;
    }

    mapping(uint => Loan) public loans;
    uint public nextLoanId;

    event LoanRequested(address borrower, uint loanAmount, uint interestRate, uint dueDate);
    event LoanFunded(address lender, address borrower, uint loanAmount);
    event LoanRepaid(address lender, address borrower, uint paidAmount);
    event CollateralClaimed(address lender, address borrower, uint collateral);

    modifier loanExists(uint loanId) {
        require(loans[loanId].id != 0 && loanId <= nextLoanId, "This loan does not exist");
        _;
    }

    modifier loanNotFunded(uint loanId) {
        require(!loans[loanId].isFunded, "This loan is already funded");
        _;
    }

    function depositCollateralAndRequestLoan(uint _interestRate, uint _duration) external payable {
        require(msg.value > 0, "A collateral must be provided");

        // The assignment asked to consider loan == collateral
        uint loanAmount = msg.value;
        nextLoanId++;
        loans[nextLoanId] = Loan(nextLoanId, msg.sender, address(0), loanAmount, _interestRate, block.timestamp + _duration, false, false, false);

        emit LoanRequested(msg.sender, loanAmount, _interestRate, block.timestamp + _duration);
    }

    function fundLoan(uint loanId) external payable loanExists(loanId) loanNotFunded(loanId) {
        Loan storage loan = loans[loanId];

        require(loan.borrower != msg.sender, "You can't lend to yourself");
        require(msg.value == loan.loanAmount, "The sent amount must be equal to the requested loan amount");

        loan.isFunded = true;
        loan.lender = msg.sender;

        address payable borrower = payable(loan.borrower);
        
        // We pass the msg.value (the ETH just received) directly to the borrower
        (bool success, ) = borrower.call{value: msg.value}("");
        require(success, "It was not possible to fund the loan");

        emit LoanFunded(loan.lender, loan.borrower, loan.loanAmount);
    }

    function repayLoan(uint loanId) external loanExists(loanId) {
        Loan storage loan = loans[loanId];

        require(loan.borrower == msg.sender, "Only a borrower can repay a loan");
        require(!loan.isRepaid, "This loan was already repaid");

        // Since Solidity hasn't float, I'm assuming interestRate is an integer
        uint valueToPay = loan.loanAmount + (loan.loanAmount * loan.interestRate)/100;
        loan.isRepaid = true;

        address payable lender = payable(loan.lender);
        (bool success, ) = lender.call{value: valueToPay}("");
        require(success, "It was not possible to repay the loan");

        emit LoanRepaid(loan.lender, loan.borrower, valueToPay);
    }

    function claimCollateral(uint loanId) external loanExists(loanId) {
        Loan storage loan = loans[loanId];

        require(loan.lender == msg.sender, "You're not the lender of this loan");
        require(block.timestamp > loan.dueDate, "This loan is not due to claim the collateral");
        require(!loan.wasCollateralClaimed, "This loan's collateral was already claimed");

        uint collateral = loan.loanAmount;
        loan.wasCollateralClaimed = true;

        address payable lender = payable(loan.lender);
        (bool success, ) = lender.call{value: collateral}("");
        require(success, "It was not possible to claim the collateral");

        emit CollateralClaimed(lender, loan.borrower, collateral);
    }
}