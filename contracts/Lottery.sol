// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Lottery
 * @dev A simple blockchain-based lottery system
 */
contract Lottery {
    address public manager;
    address[] public players;
    address public lastWinner;
    uint public constant ENTRY_FEE = 0.0001 ether; // Fixed entry fee
    uint public constant THRESHOLD = 0.0002 ether;   // Threshold to trigger countdown
    uint public drawTime;
    uint public lastPrizeAmount;
    bool public lotteryOpen;
    uint public currentPrizePool;

    event PlayerEntered(address player, uint amount);
    event LotteryStarted();
    event DrawCountdownStarted(uint drawTime);
    event LotteryEnded(address winner, uint amount);
    event ContractFunded(address funder, uint amount);

    /**
     * @dev Sets the contract deployer as the manager and initializes the lottery state
     */
    constructor() {
        manager = msg.sender;
        lotteryOpen = false;
        currentPrizePool = 0;
    }

    /**
     * @dev Modifier to restrict functions to the manager only
     */
    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can call this function");
        _;
    }

    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function to accept ETH with data
     */
    fallback() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }

    /**
     * @dev Starts a new lottery round
     */
    function startLottery() external onlyManager {
        require(!lotteryOpen, "Lottery is already open");
        
        // Reset lottery state
        delete players;
        lotteryOpen = true;
        drawTime = 0;
        currentPrizePool = 0;
        
        emit LotteryStarted();
    }

    /**
     * @dev Allows users to enter the lottery by sending the required entry fee
     */
    function enter() external payable {
        require(lotteryOpen, "Lottery is not open");
        require(msg.value == ENTRY_FEE, "Entry fee must be exactly 0.0001 ETH");

        players.push(msg.sender);
        currentPrizePool += msg.value;
        emit PlayerEntered(msg.sender, msg.value);

        // Check if threshold is reached
        if (currentPrizePool >= THRESHOLD && drawTime == 0) {
            drawTime = block.timestamp + 1 minutes;
            emit DrawCountdownStarted(drawTime);
        }

        // Auto pick winner if draw time has been reached
        if (drawTime > 0 && block.timestamp >= drawTime) {
            _pickWinner();
        }
    }

    /**
     * @dev Returns the list of current players
     * @return Array of player addresses
     */
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    /**
     * @dev Returns the current prize pool amount
     * @return Current prize pool for this round
     */
    function getPrizePool() external view returns (uint) {
        return currentPrizePool;
    }

    /**
     * @dev Returns the total contract balance
     * @return Total balance in the contract
     */
    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }

    /**
     * @dev Generates a pseudo-random number
     * @return A pseudo-random uint
     */
    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
    }

    /**
     * @dev Internal function to pick a winner and transfer the prize pool
     */
    function _pickWinner() private {
        require(players.length > 0, "No players in the lottery");
        
        uint index = random() % players.length;
        address winner = players[index];
        uint prizeAmount = THRESHOLD; // Fixed prize amount
        
        // Update state before transfer to prevent reentrancy attacks
        lastWinner = winner;
        lastPrizeAmount = prizeAmount;
        lotteryOpen = false;
        currentPrizePool = 0;
        
        // Transfer prize to winner
        (bool success, ) = winner.call{value: prizeAmount}("");
        require(success, "Failed to send prize to winner");
        
        emit LotteryEnded(winner, prizeAmount);

        // Auto start next round
        delete players;
        lotteryOpen = true;
        drawTime = 0;
        emit LotteryStarted();
    }

    /**
     * @dev Public function to manually trigger winner selection if needed
     */
    function pickWinner() external {
        require(lotteryOpen, "Lottery is not open");
        require(drawTime > 0, "Draw countdown not started");
        require(block.timestamp >= drawTime, "Draw time not reached");
        _pickWinner();
    }

    /**
     * @dev Returns the time remaining until draw
     * @return Time in seconds until draw, 0 if no draw scheduled
     */
    function getTimeUntilDraw() external view returns (uint) {
        if (drawTime == 0 || block.timestamp >= drawTime) return 0;
        return drawTime - block.timestamp;
    }
}