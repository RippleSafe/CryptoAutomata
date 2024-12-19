import React, { useState, useCallback, useEffect } from 'react';
import DfaNfaVisualizer from './Canvas';
import './App.css';
import logo from './logo.svg';
import NetworkStats from './components/NetworkStats';
import WalletButton from './components/WalletButton';

const AI_LORE = [
    "Initializing Quantum Neural Core...",
    "Calibrating State Matrices...",
    "Synchronizing Network Nodes...",
    "Establishing Neural Pathways...",
    "Activating Quantum Processors...",
    "Loading AI Consciousness...",
    "System Ready for Neural Interface"
];

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

const App = () => {
    const [xp, setXp] = useState(0);
    const maxXp = 100;
    const [walletState, setWalletState] = useState({ connected: false, address: null });
    const [currentTheme, setCurrentTheme] = useState(NODE_THEMES.default);
    const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS.none);
    const [states, setStates] = useState([]);
    const [transitions, setTransitions] = useState([]);
    const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);
    const [currentLoreIndex, setCurrentLoreIndex] = useState(0);
    const [showLore, setShowLore] = useState(true);

    // AI Lore Animation Effect
    useEffect(() => {
        if (currentLoreIndex < AI_LORE.length && showLore) {
            const timer = setTimeout(() => {
                setCurrentLoreIndex(prev => prev + 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentLoreIndex, showLore]);

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

    // Update states and transitions
    const handleStateChange = (newStates) => {
        setStates(newStates);
    };

    const handleTransitionChange = (newTransitions) => {
        setTransitions(newTransitions);
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
            <div className="right-panel">
                <WalletButton />
                {/* Premium Features Panel */}
                <div className="premium-features">
                    <button 
                        className="features-toggle"
                        onClick={() => setShowPremiumFeatures(!showPremiumFeatures)}
                    >
                        {showPremiumFeatures ? 'Hide Premium Features' : 'Show Premium Features'} 
                        <span className="premium-badge">PRO</span>
                    </button>
                    
                    {showPremiumFeatures && (
                        <div className="feature-sections">
                            {/* Theme Selection */}
                            <div className="feature-section">
                                <h4>Node Theme <span className="premium-badge">PRO</span></h4>
                                <select 
                                    className="theme-select"
                                    value={currentTheme === NODE_THEMES.default ? 'default' : 
                                           currentTheme === NODE_THEMES.neon ? 'neon' :
                                           currentTheme === NODE_THEMES.cyber ? 'cyber' : 'quantum'}
                                    onChange={(e) => {
                                        const theme = NODE_THEMES[e.target.value];
                                        if (theme) {
                                            setCurrentTheme(theme);
                                            handleThemeChange(theme);
                                        }
                                    }}
                                >
                                    <option value="default">Default Theme</option>
                                    <option value="neon">Neon Theme</option>
                                    <option value="cyber">Cyber Theme</option>
                                    <option value="quantum">Quantum Theme</option>
                                </select>
                            </div>

                            {/* Animation Selection */}
                            <div className="feature-section">
                                <h4>Node Animation <span className="premium-badge">PRO</span></h4>
                                <select 
                                    className="animation-select"
                                    value={currentAnimation}
                                    onChange={(e) => {
                                        setCurrentAnimation(e.target.value);
                                        handleAnimationChange(e.target.value);
                                    }}
                                >
                                    <option value="none">No Animation</option>
                                    <option value="pulse">Pulse Effect</option>
                                    <option value="glow">Glow Effect</option>
                                </select>
                            </div>

                            {/* Template Selection */}
                            <div className="feature-section">
                                <h4>Premium Templates <span className="premium-badge">PRO</span></h4>
                                <select 
                                    className="template-select"
                                    onChange={(e) => {
                                        const template = PREMIUM_TEMPLATES.find(t => t.name === e.target.value);
                                        if (template) {
                                            handleTemplateSelect(template);
                                        }
                                    }}
                                >
                                    <option value="">Select a Template</option>
                                    {PREMIUM_TEMPLATES.map((template, index) => (
                                        <option key={index} value={template.name}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <header className="app-header">
                <img src={logo} alt="CryptoAutomata Logo" className="app-logo" />
                <h1 className="title">
                    <span>CryptoAutomata</span>
                </h1>
                <p className="subtitle">The future of network visualization and state machine design.</p>
                {/* AI Lore Messages */}
                {showLore && currentLoreIndex < AI_LORE.length && (
                    <div className="ai-lore">
                        {AI_LORE.slice(0, currentLoreIndex + 1).map((message, index) => (
                            <div key={index} className="system-message" style={{ 
                                animationDelay: `${index * 0.5}s`,
                                opacity: index === currentLoreIndex ? 1 : 0.6 
                            }}>
                                {message}
                            </div>
                        ))}
                    </div>
                )}
            </header>
            <VersionIndicator />

            <DfaNfaVisualizer 
                onStateChange={handleStateChange}
                onTransitionChange={handleTransitionChange}
                theme={currentTheme}
                animation={currentAnimation}
                onAction={handleAction}
            />
            <div className="visualizer-container">
                <NetworkStats stats={{
                    totalStates: states.length,
                    acceptingStates: states.filter(s => s.accepting).length,
                    totalTransitions: transitions.length,
                    density: states.length > 0 ? transitions.length / (states.length * states.length) : 0,
                    connected: true,
                    deterministic: true
                }} />
            </div>
        </div>
    );
};

export default App;