import { ethers } from 'ethers';
import LotteryABI from './LotteryABI.js';
import ConfettiGenerator from 'confetti-js';

// Contract configuration
const CONTRACT_ADDRESS = '0x49140456414525e13de1551927284d5f67631298';

class LotteryApp {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isManager = false;
    this.account = null;
    this.pendingTransaction = false;
    this.currentNonce = null;
    this.countdownInterval = null;
    this.lastDrawTime = null;
    this.localCountdown = null;
    this.confetti = null;
    
    // UI Elements
    this.elements = {
      networkName: document.getElementById('network-name'),
      accountAddress: document.getElementById('account-address'),
      lotteryStatus: document.getElementById('lottery-status'),
      entryFee: document.getElementById('entry-fee'),
      playerCount: document.getElementById('player-count'),
      prizePool: document.getElementById('prize-pool'),
      countdownTimer: document.getElementById('countdown-timer'),
      entryFeeInput: document.getElementById('entry-fee-input'),
      fundingAmountInput: document.getElementById('funding-amount-input'),
      startLotteryBtn: document.getElementById('start-lottery-btn'),
      pickWinnerBtn: document.getElementById('pick-winner-btn'),
      fundContractBtn: document.getElementById('fund-contract-btn'),
      enterLotteryBtn: document.getElementById('enter-lottery-btn'),
      entryInstructions: document.getElementById('entry-instructions'),
      lastWinnerAddress: document.getElementById('last-winner-address'),
      lastPrizeAmount: document.getElementById('last-prize-amount'),
      notification: document.getElementById('notification'),
      notificationMessage: document.getElementById('notification-message'),
      notificationClose: document.getElementById('notification-close'),
      managerSection: document.getElementById('manager-section'),
      lastWinnerSection: document.getElementById('last-winner-section'),
      winnerModal: document.getElementById('winner-modal'),
      winnerMessage: document.getElementById('winner-message'),
      confettiCanvas: document.getElementById('confetti-canvas')
    };
    
    this.init();
  }
  
  async init() {
    if (typeof window.ethereum === 'undefined') {
      this.showNotification('Please install MetaMask to use this application', 'error');
      return;
    }
    
    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        this.showNotification('Please switch to Sepolia network', 'warning');
        return;
      }
      
      this.setupEventListeners();
      await this.connectWallet();
      await this.setupContract();
      this.updateUI();
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showNotification('Failed to initialize application', 'error');
    }
  }
  
  setupEventListeners() {
    window.addEventListener('load', () => this.connectWallet());
    
    window.ethereum.on('accountsChanged', (accounts) => {
      this.account = accounts[0];
      this.updateUI();
    });
    
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
    
    this.elements.startLotteryBtn.addEventListener('click', () => this.startLottery());
    this.elements.pickWinnerBtn.addEventListener('click', () => this.pickWinner());
    this.elements.fundContractBtn.addEventListener('click', () => this.fundContract());
    this.elements.enterLotteryBtn.addEventListener('click', () => this.enterLottery());
    this.elements.notificationClose.addEventListener('click', () => this.hideNotification());
    this.elements.winnerModal.addEventListener('click', (e) => {
      if (e.target === this.elements.winnerModal) {
        this.hideWinnerModal();
      }
    });
  }
  
  async connectWallet() {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.account = accounts[0];
      
      this.signer = await this.provider.getSigner();
      this.currentNonce = await this.provider.getTransactionCount(this.account);
      
      if (this.contract) {
        await this.checkManager();
      }
      
      this.updateConnectionStatus();
      this.showNotification('Wallet connected successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this.showNotification('Failed to connect wallet', 'error');
      return false;
    }
  }
  
  async setupContract() {
    try {
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, LotteryABI, this.signer);
      await this.checkManager();
      await this.startCountdownCheck();
      
      // Set up contract events
      this.contract.on('PlayerEntered', (player, amount) => {
        this.updateUI();
        if (player.toLowerCase() === this.account.toLowerCase()) {
          this.showNotification('You have successfully entered the lottery!', 'success');
        }
      });
      
      this.contract.on('DrawCountdownStarted', (drawTime) => {
        this.updateUI();
        this.startCountdownCheck();
        this.showNotification('Draw countdown has started!', 'info');
      });
      
      this.contract.on('LotteryStarted', () => {
        this.updateUI();
        this.showNotification('A new lottery round has started!', 'info');
      });
      
      this.contract.on('LotteryEnded', (winner, amount) => {
        this.updateUI();
        const etherAmount = ethers.formatEther(amount);
        if (winner.toLowerCase() === this.account.toLowerCase()) {
          this.showWinnerModal(etherAmount);
        } else {
          this.showNotification(`Lottery ended. Winner: ${this.shortenAddress(winner)} won ${etherAmount} ETH`, 'info');
        }
      });
    } catch (error) {
      console.error('Error setting up contract:', error);
      this.showNotification('Error connecting to contract', 'error');
    }
  }
  
  async checkManager() {
    if (!this.contract) return;

    try {
      const manager = await this.contract.manager();
      this.isManager = manager.toLowerCase() === this.account.toLowerCase();
      this.elements.managerSection.classList.toggle('hidden', !this.isManager);
    } catch (error) {
      console.error('Error checking manager:', error);
    }
  }
  
  showWinnerModal(amount) {
    this.elements.winnerMessage.textContent = `Congratulations! You won ${amount} ETH!`;
    this.elements.winnerModal.classList.remove('hidden');
    
    if (this.confetti) {
      this.confetti.clear();
    }
    
    const confettiSettings = {
      target: this.elements.confettiCanvas,
      max: 200,
      size: 1.5,
      animate: true,
      props: ['circle', 'square', 'triangle', 'line'],
      colors: [[165, 104, 246], [230, 61, 135], [0, 199, 228], [253, 214, 126]],
      clock: 25,
      rotate: true,
      start_from_edge: true,
      respawn: true
    };
    
    this.confetti = new ConfettiGenerator(confettiSettings);
    this.confetti.render();
    
    setTimeout(() => {
      if (this.confetti) {
        this.confetti.clear();
        this.confetti = null;
      }
    }, 5000);
  }
  
  hideWinnerModal() {
    this.elements.winnerModal.classList.add('hidden');
    if (this.confetti) {
      this.confetti.clear();
      this.confetti = null;
    }
  }
  
  async startCountdownCheck() {
    if (!this.contract) {
      this.elements.countdownTimer.textContent = 'Waiting for contract connection...';
      return;
    }

    try {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      const [lotteryOpen, timeUntilDraw, threshold, prizePool] = await Promise.all([
        this.contract.lotteryOpen(),
        this.contract.getTimeUntilDraw(),
        this.contract.THRESHOLD(),
        this.contract.getPrizePool()
      ]);

      if (!lotteryOpen) {
        this.elements.countdownTimer.textContent = 'Lottery is not open';
        return;
      }

      if (prizePool < threshold) {
        const thresholdEth = ethers.formatEther(threshold);
        this.elements.countdownTimer.textContent = `Waiting for prize pool to reach ${thresholdEth} ETH`;
        return;
      }

      this.localCountdown = Number(timeUntilDraw);
      this.updateCountdownDisplay();

      this.countdownInterval = setInterval(() => {
        if (this.localCountdown > 0) {
          this.localCountdown--;
          this.updateCountdownDisplay();
        } else if (!this.pendingTransaction) {
          clearInterval(this.countdownInterval);
          this.elements.countdownTimer.textContent = 'Selecting winner...';
          this.pickWinner();
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting countdown check:', error);
      this.elements.countdownTimer.textContent = 'Error checking countdown status';
    }
  }

  updateCountdownDisplay() {
    const minutes = Math.floor(this.localCountdown / 60);
    const seconds = this.localCountdown % 60;
    this.elements.countdownTimer.textContent = 
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  async updateUI() {
    if (!this.contract) return;
    
    try {
      this.updateConnectionStatus();
      this.elements.managerSection.classList.toggle('hidden', !this.isManager);
      
      const [lotteryOpen, entryFee, players, prizePool, lastWinner, lastPrizeAmount] = await Promise.all([
        this.contract.lotteryOpen(),
        this.contract.ENTRY_FEE(),
        this.contract.getPlayers(),
        this.contract.getPrizePool(),
        this.contract.lastWinner(),
        this.contract.lastPrizeAmount()
      ]);
      
      this.elements.lotteryStatus.textContent = lotteryOpen ? 'Open' : 'Closed';
      this.elements.lotteryStatus.style.color = lotteryOpen ? 'var(--success-color)' : 'var(--error-color)';
      
      const entryFeeEth = ethers.formatEther(entryFee);
      this.elements.entryFee.textContent = `${entryFeeEth} ETH`;
      
      this.elements.playerCount.textContent = players.length;
      
      const prizePoolEth = ethers.formatEther(prizePool);
      this.elements.prizePool.textContent = `${prizePoolEth} ETH`;
      
      if (this.isManager) {
        this.elements.startLotteryBtn.disabled = lotteryOpen;
        this.elements.pickWinnerBtn.disabled = !lotteryOpen || players.length === 0;
      }
      
      this.elements.enterLotteryBtn.disabled = !lotteryOpen;
      this.elements.entryInstructions.textContent = lotteryOpen 
        ? `Send ${entryFeeEth} ETH to enter the lottery` 
        : 'Lottery is currently closed';
      
      if (lastWinner !== ethers.ZeroAddress) {
        this.elements.lastWinnerSection.classList.remove('hidden');
        this.elements.lastWinnerAddress.textContent = this.shortenAddress(lastWinner);
        this.elements.lastPrizeAmount.textContent = `${ethers.formatEther(lastPrizeAmount)} ETH`;
      }
    } catch (error) {
      console.error('Error updating UI:', error);
      this.showNotification('Error updating lottery information', 'error');
    }
  }
  
  updateConnectionStatus() {
    this.provider.getNetwork().then(network => {
      const networkNames = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        31337: 'Hardhat Local'
      };
      const networkName = networkNames[network.chainId] || `Chain ID: ${network.chainId}`;
      this.elements.networkName.textContent = networkName;
    });
    
    if (this.account) {
      this.elements.accountAddress.textContent = this.shortenAddress(this.account);
    } else {
      this.elements.accountAddress.textContent = 'Not connected';
    }
  }
  
  async startLottery() {
    if (this.pendingTransaction) {
      this.showNotification('Please wait for the previous transaction to complete', 'warning');
      return;
    }
    
    try {
      this.pendingTransaction = true;
      this.elements.startLotteryBtn.disabled = true;
      this.showNotification('Starting lottery...', 'info');      
      
      const tx = await this.contract.startLottery({
        nonce: this.currentNonce++
      });
      this.showNotification('Waiting for transaction confirmation...', 'info');
      await tx.wait();
      
      this.showNotification('Lottery started successfully!', 'success');
      this.updateUI();
    } catch (error) {
      console.error('Error starting lottery:', error);
      let errorMessage = 'Failed to start lottery';
      
      if (error.error) {
        if (error.error.message.includes('ALREADY_EXISTS')) {
          errorMessage = 'Transaction already pending. Please wait for it to complete';
        } else if (error.error.message.includes('pending sub-pool is full')) {
          errorMessage = 'Too many pending transactions. Please wait a moment and try again';
        }
      }
      
      this.showNotification(errorMessage, 'error');
    } finally {
      this.pendingTransaction = false;
      this.elements.startLotteryBtn.disabled = false;
    }
  }

  async fundContract() {
    if (this.pendingTransaction) {
      this.showNotification('Please wait for the previous transaction to complete', 'warning');
      return;
    }

    try {
      const fundingAmount = this.elements.fundingAmountInput.value;
      if (!fundingAmount || parseFloat(fundingAmount) <= 0) {
        this.showNotification('Please enter a valid funding amount', 'error');
        return;
      }

      this.pendingTransaction = true;
      this.elements.fundContractBtn.disabled = true;
      this.showNotification('Sending funds to contract...', 'info');

      const amountInWei = ethers.parseEther(fundingAmount);
      const tx = await this.signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: amountInWei,
        nonce: this.currentNonce++
      });

      this.showNotification('Waiting for transaction confirmation...', 'info');
      await tx.wait();

      this.showNotification(`Successfully funded contract with ${fundingAmount} ETH!`, 'success');
      this.updateUI();
    } catch (error) {
      console.error('Error funding contract:', error);
      let errorMessage = 'Failed to fund contract';

      if (error.error) {
        if (error.error.message.includes('ALREADY_EXISTS')) {
          errorMessage = 'Transaction already pending. Please wait for it to complete';
        } else if (error.error.message.includes('pending sub-pool is full')) {
          errorMessage = 'Too many pending transactions. Please wait a moment and try again';
        } else if (error.error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds in your wallet';
        }
      }

      this.showNotification(errorMessage, 'error');
    } finally {
      this.pendingTransaction = false;
      this.elements.fundContractBtn.disabled = false;
    }
  }
  
  async pickWinner() {
    if (this.pendingTransaction) {
      this.showNotification('Please wait for the previous transaction to complete', 'warning');
      return;
    }
    
    try {
      this.pendingTransaction = true;
      this.elements.pickWinnerBtn.disabled = true;
      this.showNotification('Picking a winner...', 'info');
      
      const tx = await this.contract.pickWinner({
        nonce: this.currentNonce++
      });
      this.showNotification('Waiting for transaction confirmation...', 'info');
      await tx.wait();
    } catch (error) {
      console.error('Error picking winner:', error);
      let errorMessage = 'Failed to pick winner';
      
      if (error.error) {
        if (error.error.message.includes('ALREADY_EXISTS')) {
          errorMessage = 'Transaction already pending. Please wait for it to complete';
        } else if (error.error.message.includes('pending sub-pool is full')) {
          errorMessage = 'Too many pending transactions. Please wait a moment and try again';
        }
      }
      
      this.showNotification(errorMessage, 'error');
    } finally {
      this.pendingTransaction = false;
      this.elements.pickWinnerBtn.disabled = false;
    }
  }
  
  async enterLottery() {
    if (this.pendingTransaction) {
      this.showNotification('Please wait for the previous transaction to complete', 'warning');
      return;
    }
    
    try {
      this.pendingTransaction = true;
      this.elements.enterLotteryBtn.disabled = true;
      this.showNotification('Entering lottery...', 'info');
      
      const entryFee = await this.contract.ENTRY_FEE();
      
      const tx = await this.contract.enter({ 
        value: entryFee,
        nonce: this.currentNonce++
      });
      this.showNotification('Waiting for transaction confirmation...', 'info');
      await tx.wait();
    } catch (error) {
      console.error('Error entering lottery:', error);
      let errorMessage = 'Failed to enter lottery';
      
      if (error.error) {
        if (error.error.message.includes('ALREADY_EXISTS')) {
          errorMessage = 'Transaction already pending. Please wait for it to complete';
        } else if (error.error.message.includes('pending sub-pool is full')) {
          errorMessage = 'Too many pending transactions. Please wait a moment and try again';
        }
      }
      
      this.showNotification(errorMessage, 'error');
    } finally {
      this.pendingTransaction = false;
      this.elements.enterLotteryBtn.disabled = false;
    }
  }
  
  showNotification(message, type = 'info') {
    this.elements.notificationMessage.textContent = message;
    this.elements.notification.className = '';
    this.elements.notification.classList.add(type);
    this.elements.notification.classList.remove('hidden');
    
    setTimeout(() => this.hideNotification(), 5000);
  }
  
  hideNotification() {
    this.elements.notification.classList.add('hidden');
  }
  
  shortenAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LotteryApp();
});