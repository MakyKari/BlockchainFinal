// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SepoliaDonation {
    event DonationSent(address indexed sender, address indexed recipient, uint256 amount);
    event TransactionFailed(address indexed sender, string reason);

    function sendSepoliaETH(address payable _recipient) external payable {
        if (msg.value <= 0) {
            emit TransactionFailed(msg.sender, "You must send some Sepolia ETH");

            revert("You must send some Sepolia ETH");
        }

        _recipient.transfer(msg.value);
        
        emit DonationSent(msg.sender, _recipient, msg.value);
    }
}
