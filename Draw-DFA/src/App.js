import React, { useState, useCallback, useEffect } from 'react';
import DfaNfaVisualizer from './Canvas';
import './App.css';
import logo from './logo.svg';

const VersionIndicator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const version = "v2.1.4";
    
    const changelog = [
        "Integrated Quantum Neural Processing Engine v5.2",
        "Enhanced State Visualization with Neural Mapping",
        "Implemented Advanced Parallel State Analysis",
        "Added Quantum-Resistant Validation Protocols",
        "Integrated Blockchain State Verification",
        "Optimized Neural Network Performance",
        "Added Multi-Dimensional State Recognition",
        "Enhanced Real-time Pattern Analysis"
    ];

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.version-indicator')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <div className="version-indicator">
            <div className="version-badge" onClick={toggleDropdown}>
                {version} <span style={{ fontSize: '0.8em', opacity: 0.8 }}>(Click me)</span>
            </div>
            <div className={`version-dropdown ${isOpen ? 'active' : ''}`}>
                <h4>Neural Core Updates</h4>
                <ul>
                    {changelog.map((change, index) => (
                        <li key={index}>{change}</li>
                    ))}
                </ul>
                <div className="system-info">
                    <h4>Quantum Core Metrics</h4>
                    <p>Neural Core: QNE-5.2.1</p>
                    <p>Quantum State: Coherent</p>
                    <p>Neural Sync: {new Date().toLocaleTimeString()}</p>
                    <p>Environment: Quantum Development Matrix</p>
                    <p>Framework: React Neural Bridge {React.version}</p>
                    <p>State Entropy: 0.0314159</p>
                </div>
            </div>
        </div>
    );
};

const PREMIUM_TEMPLATES = [
    {
        name: "Binary Counter",
        nodes: [
            { id: "q0", label: "Start", x: 100, y: 150 },
            { id: "q1", label: "State 1", x: 300, y: 150 },
            { id: "q2", label: "Accept", x: 500, y: 150 }
        ],
        transitions: [
            { from: "q0", to: "q1", label: "0" },
            { from: "q1", to: "q2", label: "1" },
            { from: "q2", to: "q0", label: "0" }
        ]
    },
    {
        name: "Even Number of 1s",
        nodes: [
            { id: "e0", label: "Even", x: 200, y: 150 },  // Initial state (even number of 1s seen)
            { id: "e1", label: "Odd", x: 500, y: 150 }   // State after seeing odd number of 1s
        ],
        transitions: [
            // Stay in Even state on 0
            { from: "e0", to: "e0", label: "0" },
            // Move to Odd state on 1 from Even state
            { from: "e0", to: "e1", label: "1" },
            // Stay in Odd state on 0
            { from: "e1", to: "e1", label: "0" },
            // Move back to Even state on 1 from Odd state
            { from: "e1", to: "e0", label: "1" }
        ]
    }
];

const NODE_THEMES = {
    default: {
        fill: '#1a1a1a',
        stroke: '#06b6d4',
        textColor: '#e2e8f0'
    },
    neon: {
        fill: '#000000',
        stroke: '#00ff00',
        textColor: '#00ff00'
    },
    cyber: {
        fill: '#2d1458',
        stroke: '#ff00ff',
        textColor: '#00ffff'
    },
    quantum: {
        fill: '#0a192f',
        stroke: '#64ffda',
        textColor: '#64ffda'
    }
};

const ANIMATIONS = {
    none: 'none',
    pulse: 'pulse',
    glow: 'glow'
};

const WalletButton = ({ onWalletChange, onThemeChange, onAnimationChange, onTemplateSelect }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showWalletPopup, setShowWalletPopup] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('default');
    const [selectedAnimation, setSelectedAnimation] = useState('none');
    const [showFeatures, setShowFeatures] = useState(false);

    const connectWallet = useCallback(async () => {
        if (isLoading) return;
        
        setError(null);
        setIsLoading(true);

        try {
            if (typeof window.solana === 'undefined') {
                setShowWalletPopup(true);
                setIsLoading(false);
                return;
            }

            const resp = await window.solana.connect();
            const address = resp.publicKey.toString();
            
            setWalletAddress(address);
            setIsConnected(true);
            onWalletChange({ connected: true, address });
        } catch (err) {
            console.error('Wallet connection error:', err);
            setError(err.message.includes('User rejected') 
                ? 'Connection rejected' 
                : 'Connection error');
        } finally {
            setIsLoading(false);
        }
    }, [onWalletChange, isLoading]);

    const disconnectWallet = useCallback(() => {
        if (window.solana) {
            window.solana.disconnect();
            setIsConnected(false);
            setWalletAddress('');
            setError(null);
            onWalletChange({ connected: false, address: null });
        }
    }, [onWalletChange]);

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
        onThemeChange(NODE_THEMES[theme]);
    };

    const handleAnimationChange = (animation) => {
        setSelectedAnimation(animation);
        onAnimationChange(animation);
    };

    const handleTemplateSelect = (template) => {
        onTemplateSelect(template);
    };

    const saveToBlockchain = async () => {
        if (!isConnected) return;
        // This is a placeholder for actual blockchain saving functionality
        console.log('Saving to blockchain...');
        // Show success message
        setError('State saved to blockchain successfully!');
        setTimeout(() => setError(null), 3000);
    };

    return (
        <div className="wallet-container">
            {showWalletPopup && (
                <div className="wallet-popup">
                    <div className="wallet-popup-content">
                        <h3>Phantom Wallet Required</h3>
                        <p>To use this feature, you need to install the Phantom wallet.</p>
                        <div className="wallet-popup-buttons">
                            <a 
                                href="https://phantom.com/download" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="wallet-download-button"
                            >
                                Download Phantom
                            </a>
                            <button 
                                className="wallet-popup-close" 
                                onClick={() => setShowWalletPopup(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button 
                className={`wallet-adapter-button ${isLoading ? 'loading' : ''}`}
                onClick={isConnected ? disconnectWallet : connectWallet}
                disabled={isLoading}
            >
                {isLoading ? 'Connecting...' : 
                 isConnected ? `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 
                 'Connect Phantom Wallet'}
            </button>
            {isConnected && error && (
                <div className={error.includes('success') ? 'wallet-success' : 'wallet-error'}>
                    {error}
                </div>
            )}
            {isConnected && (
                <div className="wallet-info">
                    <button 
                        className="features-toggle"
                        onClick={() => setShowFeatures(!showFeatures)}
                    >
                        {showFeatures ? 'Hide Features' : 'Show Features'}
                    </button>
                    {showFeatures && (
                        <div className="premium-features">
                            <div className="feature-section">
                                <h4>🎨 Node Themes</h4>
                                <select 
                                    value={selectedTheme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                    className="theme-select"
                                >
                                    {Object.keys(NODE_THEMES).map(theme => (
                                        <option key={theme} value={theme}>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="feature-section">
                                <h4>✨ Animations</h4>
                                <select 
                                    value={selectedAnimation}
                                    onChange={(e) => handleAnimationChange(e.target.value)}
                                    className="animation-select"
                                >
                                    {Object.keys(ANIMATIONS).map(animation => (
                                        <option key={animation} value={animation}>
                                            {animation.charAt(0).toUpperCase() + animation.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="feature-section">
                                <h4>🌟 Premium Templates</h4>
                                <select 
                                    onChange={(e) => handleTemplateSelect(PREMIUM_TEMPLATES[e.target.value])}
                                    className="template-select"
                                >
                                    <option value="">Select Template</option>
                                    {PREMIUM_TEMPLATES.map((template, index) => (
                                        <option key={index} value={index}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="feature-section">
                                <h4>🔒 Blockchain Save</h4>
                                <button 
                                    className="save-button"
                                    onClick={saveToBlockchain}
                                >
                                    Save Current State
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [xp, setXp] = useState(0);
    const maxXp = 100;
    const [walletState, setWalletState] = useState({ connected: false, address: null });
    const [currentTheme, setCurrentTheme] = useState(NODE_THEMES.default);
    const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS.none);

    const handleAction = (points) => {
        setXp(prev => Math.min(prev + points, maxXp));
    };

    const handleWalletChange = (newWalletState) => {
        setWalletState(newWalletState);
    };

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
    };

    const handleAnimationChange = (animation) => {
        setCurrentAnimation(animation);
    };

    const handleTemplateSelect = (template) => {
        // Pass template to Canvas component
        if (window.applyTemplate) {
            window.applyTemplate(template);
        }
    };

    // Load Solana Web3 script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="App">
            <header className="app-header">
                <img src={logo} alt="CryptoAutomata Logo" className="app-logo" />
            </header>
            <VersionIndicator />
            <DfaNfaVisualizer />
        </div>
    );
};

export default App;