import React, { useState } from 'react';

const WalletButton = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  const connectWallet = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        setIsConnected(true);
        setWalletAddress(response.publicKey.toString());
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  return (
    <>
      <button 
        className={`wallet-button ${isConnected ? 'connected' : ''}`}
        onClick={connectWallet}
      >
        {isConnected ? 'Connected' : 'Connect Phantom'}
      </button>
      
      {isConnected && walletAddress && (
        <div className="wallet-info">
          <h4>Wallet Connected</h4>
          <div className="wallet-balance">
            <span className="balance-label">Address</span>
            <span className="balance-value">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletButton; 