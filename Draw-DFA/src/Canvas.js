import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as joint from 'jointjs';
import { dia, shapes } from 'jointjs';

const DfaNfaVisualizer = ({ onAction, walletConnected, theme, animation, onStateChange, onTransitionChange }) => {
    const paperRef = useRef(null);
    const statesRef = useRef([]);  // Add ref to track current states
    const [graph, setGraph] = useState(null);
    const [paper, setPaper] = useState(null);
    const [stateCounter, setStateCounter] = useState(0);
    const [states, setStates] = useState([]);
    const [transitions, setTransitions] = useState([]);
    const [isAddingTransition, setIsAddingTransition] = useState(false);
    const [transitionSource, setTransitionSource] = useState(null);
    const [transitionTarget, setTransitionTarget] = useState(null);
    const [transitionLabel, setTransitionLabel] = useState('');
    const [acceptingStates, setAcceptingStates] = useState(new Set());
    const [testString, setTestString] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [startState, setStartState] = useState(null);
    const [machineType, setMachineType] = useState('');
    const [dfa1, setDfa1] = useState(null);
    const [dfa2, setDfa2] = useState(null);
    const [equivalenceResult, setEquivalenceResult] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showStatistics, setShowStatistics] = useState(false);
    const [stateHistory, setStateHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentTheme, setCurrentTheme] = useState(theme);
    const [currentAnimation, setCurrentAnimation] = useState(animation);

    // Update states ref whenever states change
    useEffect(() => {
        statesRef.current = states;
    }, [states]);

    // Initial paper setup
    useEffect(() => {
        const newGraph = new dia.Graph({}, { cellNamespace: shapes });
        const newPaper = new dia.Paper({
            el: paperRef.current,
            width: 900,
            height: 650,
            model: newGraph,
            cellViewNamespace: shapes,
            gridSize: 20,
            interactive: true,
            defaultLink: new shapes.standard.Link(),
            defaultConnectionPoint: { name: 'boundary' },
            validateConnection: () => true,
            background: {
                color: '#1a202c'
            }
        });

        // Enable dragging for all elements
        newPaper.on('element:pointerdown', function(elementView) {
            const element = elementView.model;
            element.toFront();
        });

        setGraph(newGraph);
        setPaper(newPaper);
    }, []);

    const setStartingState = (stateId) => {
        // Update visual appearance of previous start state
        if (startState) {
            const prevStartState = states.find(s => s.id === startState);
            prevStartState?.node.attr('body/fill', acceptingStates.has(prevStartState.id) ? '#90EE90' : '#ccccff');
        }
    
        // Update visual appearance of new start state
        const newStartState = states.find(s => s.id === stateId);
        newStartState?.node.attr('body/fill', '#FFE4E1');
    
        setStartState(stateId);
    };

    const toggleAcceptingState = (stateId) => {
        setAcceptingStates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stateId)) {
                newSet.delete(stateId);
                // Update visual appearance to non-accepting state
                const state = states.find(s => s.id === stateId);
                if (state) {
                    state.node.attr('body/fill', '#ccccff');
                }
            } else {
                newSet.add(stateId);
                // Update visual appearance to accepting state
                const state = states.find(s => s.id === stateId);
                if (state) {
                    state.node.attr('body/fill', '#90EE90');
                }
            }
            return newSet;
        });
    };

    const addState = () => {
        if (!graph) return;
        
        onAction?.(10);

        const label = `q${stateCounter}`;
        const circlesPerRow = 5;
        const horizontalSpacing = 140;
        const verticalSpacing = 140;
        const startX = 120;
        const startY = 100;

        const x = startX + (stateCounter % circlesPerRow) * horizontalSpacing;
        const y = startY + Math.floor(stateCounter / circlesPerRow) * verticalSpacing;

        const circle = new shapes.standard.Circle();
        const stateId = `state-${stateCounter}`;
        circle.set('id', stateId);
        circle.position(x, y);
        circle.resize(60, 60);
        circle.attr({
            body: { 
                fill: theme?.fill || '#1a1a1a',
                stroke: theme?.stroke || '#06b6d4',
                strokeWidth: 2
            },
            label: { 
                text: label, 
                fill: theme?.textColor || '#e2e8f0',
                fontSize: 16,
                fontWeight: 'bold',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                refX: '50%',
                refY: '50%'
            }
        });

        // Apply animation to new node if active
        if (animation !== 'none') {
            switch (animation) {
                case 'glow':
                    circle.attr('body/filter', {
                        name: 'dropShadow',
                        args: {
                            dx: 0,
                            dy: 0,
                            blur: 10,
                            opacity: 0.3,
                            color: theme?.stroke || '#06b6d4'
                        }
                    });
                    break;
                default:
                    break;
            }
        }

        circle.addTo(graph);

        const newState = { id: stateId, label, node: circle };
        setStates(prev => [...prev, newState]);
        setStateCounter(prev => prev + 1);

        // Add to history
        const historyAction = {
            type: 'ADD_STATE',
            stateId,
            x,
            y,
            label,
            counter: stateCounter
        };
        addToHistory(historyAction);
    };

    const startAddingTransition = () => {
        setIsAddingTransition(true);
        setTransitionSource(null);
        setTransitionTarget(null);
        setTransitionLabel('');
    };

    const confirmTransition = () => {
        if (!graph || !transitionSource || !transitionTarget || !transitionLabel) return;
        if(machineType === "DFA" && transitionLabel === "ε") return;

        onAction?.(15);

        const sourceState = states.find(state => state.id === transitionSource);
        const targetState = states.find(state => state.id === transitionTarget);

        const link = new shapes.standard.Link();
        link.source({ id: sourceState.id });
        link.target({ id: targetState.id });
        link.router({
            name: 'manhattan',
            args: {
                padding: 20,
                startDirections: ['top', 'right', 'bottom', 'left'],
                endDirections: ['top', 'right', 'bottom', 'left']
            }
        });
        link.attr({
            line: {
                stroke: 'black',
                strokeWidth: 2,
                targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z', fill: 'black' }
            }
        });
        link.labels([{
            attrs: { text: { text: transitionLabel, fontSize: 14, fontWeight: 'bold' } },
            position: 0.5
        }]);
        link.addTo(graph);

        const newTransition = {
            sourceId: sourceState.id,
            source: sourceState.label,
            targetId: targetState.id,
            target: targetState.label,
            label: transitionLabel
        };
        setTransitions([...transitions, newTransition]);

        // Add to history
        addToHistory({
            type: 'ADD_TRANSITION',
            sourceId: sourceState.id,
            targetId: targetState.id,
            label: transitionLabel
        });

        setIsAddingTransition(false);
    };

    const handleZoom = useCallback((delta) => {
        const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
        setZoomLevel(newZoom);
        if (paper) {
            paper.scale(newZoom, newZoom);
            paper.fitToContent({ padding: 50 });
        }
    }, [zoomLevel, paper]);

    const undo = useCallback(() => {
        console.log('Attempting undo:', { historyIndex, historyLength: stateHistory.length });
        if (historyIndex >= 0 && stateHistory[historyIndex]) {
            console.log('Executing undo for action:', stateHistory[historyIndex]);
            const historyItem = stateHistory[historyIndex];
            historyItem.undo();
            setHistoryIndex(prev => prev - 1);
            onAction?.(5);
        }
    }, [historyIndex, stateHistory, onAction]);

    const redo = useCallback(() => {
        console.log('Attempting redo:', { historyIndex, historyLength: stateHistory.length });
        if (historyIndex < stateHistory.length - 1) {
            console.log('Executing redo for action:', stateHistory[historyIndex + 1]);
            const historyItem = stateHistory[historyIndex + 1];
            historyItem.redo();
            setHistoryIndex(prev => prev + 1);
            onAction?.(5);
        }
    }, [historyIndex, stateHistory, onAction]);

    const saveMachine = useCallback(() => {
        onAction?.(30);
        const machineData = {
            machineType,
            startState,
            states: states.map(state => ({
                label: state.label,
                id: state.id,
                x: state.node.position().x,
                y: state.node.position().y,
                isAccepting: acceptingStates.has(state.id)
            })),
            transitions: transitions.map(transition => ({
                sourceId: transition.sourceId,
                targetId: transition.targetId,
                label: transition.label,
                source: transition.source,
                target: transition.target
            }))
        };
    
        const blob = new Blob([JSON.stringify(machineData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'dfa_nfa_machine.json';
        link.click();
    }, [machineType, startState, states, transitions, acceptingStates, onAction]);

    const loadMachine = (event) => {
        // Add XP for importing network
        onAction?.(25);

        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            graph.clear();
            setStates([]);
            setTransitions([]);
            setStateCounter(0);
            setAcceptingStates(new Set());
    
            const stateMap = {};
            const newAcceptingStates = new Set();

            setStartingState(data.startState);
            setMachineType(data.machineType);
            data.states.forEach(state => {
                const circle = new shapes.standard.Circle({
                    id: state.id  // Set the ID explicitly
                }); 
                circle.position(state.x, state.y);
                circle.resize(60, 60);
                circle.attr({
                    body: { 
                        fill: state.isAccepting ? '#90EE90' : data.startState === circle.id ? '#FFE4E1':'#ccccff', 
                        strokeWidth: 3 
                    },
                    label: { text: state.label, fill: 'black', fontWeight: 'bold' },
                });
                circle.addTo(graph);
                
                stateMap[state.id] = circle.id;
                if (state.isAccepting) {
                    newAcceptingStates.add(circle.id);
                }
                
                setStates(prevStates => [
                    ...prevStates,
                    { id: circle.id, label: state.label, node: circle }
                ]);
                setStateCounter(prevCounter => prevCounter + 1);
            });
    
            setAcceptingStates(newAcceptingStates);
    
            data.transitions.forEach(transition => {
                const sourceStateId = stateMap[transition.sourceId];
                const targetStateId = stateMap[transition.targetId];
    
                if (sourceStateId && targetStateId) {
                    const existingLink = graph.getLinks().find(link => {
                        const sourceId = link.getSourceElement().id;
                        const targetId = link.getTargetElement().id;
                        return sourceId === sourceStateId && targetId === targetStateId;
                    });
    
                    if (existingLink) {
                        const existingLabel = existingLink.labels()[0].attrs.text.text;
                        existingLink.labels([{
                            attrs: { text: { text: `${existingLabel}, ${transition.label}`, fontSize: 14, fontWeight: 'bold' } },
                            position: 0.5,
                        }]);
                    } else {
                        const link = new shapes.standard.Link();
                        link.source({ id: sourceStateId });
                        link.target({ id: targetStateId });
    
                        if (sourceStateId === targetStateId) {
                            link.router({
                                name: 'manhattan',
                                args: {
                                    padding: 20,
                                    startDirections: ['top'],
                                    endDirections: ['bottom'],
                                },
                            });
                            link.connector('rounded');
                        } else {
                            link.router({
                                name: 'manhattan',
                                args: {
                                    padding: 20,
                                    startDirections: ['top', 'left', 'bottom', 'right'],
                                    endDirections: ['top', 'left', 'bottom', 'right'],
                                },
                            });
                        }
    
                        link.attr({
                            line: {
                                stroke: 'black',
                                strokeWidth: 2,
                                targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z', fill: 'black' },
                            },
                        });
    
                        link.labels([{
                            attrs: { text: { text: transition.label, fontSize: 14, fontWeight: 'bold' } },
                            position: 0.5,
                        }]);
    
                        link.addTo(graph);
                    }
    
                    setTransitions(prevTransitions => [
                        ...prevTransitions,
                        { 
                            sourceId: transition.sourceId, 
                            targetId: transition.targetId, 
                            label: transition.label, 
                            source: transition.source, 
                            target: transition.target 
                        }
                    ]);
                }
            });
        };
        reader.readAsText(file);
    };
    // Function to test a given string input
    const testInput = () => {
        // Ensure states and transitions are properly defined
        if (!states || !transitions) {
            setTestResult({
                accepted: false,
                message: 'Error: States, transitions, or input string not properly defined',
                path: []
            });
            return;
        }

        // Start at the designated start state
        let currentState = states.find(s => s.id === startState)?.label;
        
        
        if(!states.find(t => t.label === currentState)) {
            setTestResult({
                accepted: false,
                message: 'Error: States, transitions, or input string not properly defined',
                path: []
            });
            return;
        }
        //initialize array which holds path
        const path = [currentState];
        // Process each character in the input string
        for (const symbol of testString) {
            const transition = transitions.find(
                t => t.source === currentState && t.label === symbol
            );

            // If no transition is found, reject the string
            if (!transition) {
                setTestResult({
                    accepted: false,
                    message: `Rejected: No transition found from state ${currentState} with symbol ${symbol}`,
                    path
                });
                highlightPath(path);
                return;
            }
            //set current state to the state reached on given input & add to path
            currentState = transition.target;
            path.push(currentState);
        }

        // Check if the current state is an accepting state and set message
        const isAccepted = acceptingStates.has(states.find(s => s.label === currentState)?.id);
        
        // Add XP for testing a string
        onAction?.(20);
        if (isAccepted) {
            // Bonus XP for successful validation
            onAction?.(10);
        }

        setTestResult({
            accepted: isAccepted,
            message: isAccepted ? 'Accepted' : 'Rejected: Ended in non-accepting state',
            path
        });
        highlightPath(path);
    };
    const testNFAInput = () => {
        // Ensure states and transitions are properly defined
        if (!states || !transitions) {
            setTestResult({
                accepted: false,
                message: 'Error: States, transitions, or input string not properly defined',
                path: []
            });
            return;
        }
    
        // Helper function to perform DFS from a given state with remaining input
        const dfs = (currentStateParam, remainingInput, currentPath) => {
            let localCurrentState = currentStateParam;
            // If we've processed all input, explore epsilon transitions and check accepting states
            if (remainingInput.length === 0) {
                // Check if the current state is accepting
                const stateObj = states.find(s => s.label === localCurrentState);
                if (stateObj && acceptingStates.has(stateObj.id)) {
                    return {
                        accepted: true,
                        path: currentPath
                    };
                }
        
                // Explore epsilon transitions
                const epsilonTransitions = transitions.filter(
                    t => t.source === localCurrentState && t.label === "ε"
                );
        
                for (const transition of epsilonTransitions) {
                    const result = dfs(
                        transition.target,
                        remainingInput,
                        [...currentPath, transition.target]
                    );
        
                    if (result) {
                        return result;
                    }
                }
                return null;
            }
        
            // Process the next symbol in the input
            const symbol = remainingInput[0];
            const restInput = remainingInput.slice(1);
        
            // Find all possible transitions for the current symbol or epsilon
            const possibleTransitions = transitions.filter(
                t => t.source === localCurrentState && (t.label === symbol || t.label === "ε")
            );
        
            // Try each possible transition
            for (const transition of possibleTransitions) {
                const result = dfs(
                    transition.target,
                    transition.label === "ε" ? remainingInput : restInput,
                    [...currentPath, transition.target]
                );
        
                if (result) {
                    return result;
                }
            }
            return null;
        };
        
        
    
        // Start the search from the initial state
        const startStateLabel = states.find(s => s.id === startState)?.label;
        
        if (!startStateLabel) {
            setTestResult({
                accepted: false,
                message: 'Error: Start state not properly defined',
                path: []
            });
            return;
        }
    
        // Convert input string to array of characters
        const inputArray = Array.from(testString);
        const result = dfs(startStateLabel, inputArray, [startStateLabel]);
    
        if (result) {
            setTestResult({
                accepted: true,
                message: 'Accepted',
                path: result.path
            });
        } else {
            setTestResult({
                accepted: false,
                message: 'Rejected: No accepting path found',
                path: []
            });
        }
    
        // Highlight the accepting path if one was found
        if (result && result.path) {
            highlightPath(result.path);
        }
    };

    // Function to highlight the path in the visualization
    const highlightPath = (path) => {
        if (!graph || !states || path.length === 0) return;

        // Reset all states and transitions to default appearance
        states.forEach(state => {
            state.node.attr('body/fill',
                acceptingStates.has(state.id) ? '#90EE90' : '#ccccff'
            );
        });

        graph.getLinks().forEach(link => {
            link.attr('line/stroke', 'black');
            link.attr('line/strokeWidth', 2);
        });

        // Highlight the states and transitions in the path
        for (let i = 0; i < path.length - 1; i++) {
            const currentState = path[i];
            const nextState = path[i + 1];

            const currentNode = states.find(s => s.label === currentState).node;
            if (currentNode) {
                currentNode.attr('body/fill', '#FFB6C1');
            }

            const link = graph.getLinks().find(link =>
                link.getSourceElement().id === currentNode.id &&
                link.getTargetElement().id === states.find(s => s.label === nextState).node.id
            );

            if (link) {
                link.attr('line/stroke', '#FF69B4');
                link.attr('line/strokeWidth', 3);
            }
        }

        // Highlight the final state reached
        const finalState = states.find(s => s.label === path[path.length - 1]).node;
        if (finalState) {
            finalState.attr('body/fill', '#FF69B4');
        }
    };

    // Function to reset highlighting
    const resetHighlighting = () => {
        if (!graph || !states) return;

        // Reset states to default colors
        states.forEach(state => {
            if(state.id === startState){
                state.node.attr('body/fill', '#FFE4E1');
            }
            else{
                state.node.attr('body/fill',
                    acceptingStates.has(state.id) ? '#90EE90' : '#ccccff'
                );
            }

        });

        // Reset transitions to default appearance
        graph.getLinks().forEach(link => {
            link.attr('line/stroke', 'black');
            link.attr('line/strokeWidth', 2);
        });
    };
  // Handle file uploads for equivalence testing
  const handleDfaFileUpload = (fileNumber, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dfa = JSON.parse(e.target.result);
          if (fileNumber === 1) {
            setDfa1(dfa);
          } else {
            setDfa2(dfa);
          }
        } catch (error) {
          alert('Error reading file: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };
    // Function to check DFA equivalence
    const checkDfaEquivalence = () => {
        if (!dfa1 || !dfa2) {
          alert('Please upload both DFA files first');
          return;
        }
    
        // Basic validation that both are DFAs
        if (dfa1.machineType !== 'DFA' || dfa2.machineType !== 'DFA') {
          setEquivalenceResult({
            equivalent: false,
            message: 'Both machines must be DFAs'
          });
          return;
        }
        const newMachine = {
            machineType: "DFA",
            startState: null,
            states: [],
            transitions: []
        }
    
        let alphabet = new Set();
        dfa1.transitions.forEach(t => alphabet.add(t.label));
    
        // Stack to keep track of state pairs we need to process
        let statesToProcess = [];
    
        // Start with initial states
        let currState1 = dfa1.states.find(s => s.id === dfa1.startState);
        let currState2 = dfa2.states.find(s => s.id === dfa2.startState);
        const currStatePair = {
            id: `${currState1.id},${currState2.id}`,
            label: `${currState1.label},${currState2.label}`,
            isAccepting:
              (currState1.isAccepting && !currState2.isAccepting) ||
              (!currState1.isAccepting && currState2.isAccepting)
        };
        
        // Initialize machine with start state
        newMachine.startState = currStatePair;
        newMachine.states.push(currStatePair);
        statesToProcess.push([currState1, currState2]);
    
        // Process states until no new ones are found (lazy construction)
        while (statesToProcess.length > 0) {
            [currState1, currState2] = statesToProcess.pop();
            const currentPair = newMachine.states.find(s => s.id === `${currState1.id},${currState2.id}`);
            processAlphabet(Array.from(alphabet), currState1, currState2, currentPair, newMachine, statesToProcess);
        }
    
        console.log("Final Machine:", newMachine);
        
        // BFS to check for accepting states
        let queue = [newMachine.startState];
        let visited = new Set([newMachine.startState.id]);

        while (queue.length > 0) {
            const currentState = queue.shift();
            
            // Check if current state is accepting
            if (currentState.isAccepting) {
                setEquivalenceResult({
                    equivalent: false,
                    message: `DFAs are not equivalent - Found distinguishing state: ${currentState.label}`
                });
                return;
            }

            // Get all transitions from current state
            const stateTransitions = newMachine.transitions.filter(t => t.sourceId === currentState.id);
            
            // Add unvisited target states to queue
            stateTransitions.forEach(transition => {
                const targetState = newMachine.states.find(s => s.id === transition.targetId);
                if (!visited.has(targetState.id)) {
                    visited.add(targetState.id);
                    queue.push(targetState);
                }
            });
        }

            // If no accepting states were found, the DFAs are equivalent
            setEquivalenceResult({
                equivalent: true,
                message: 'Analysis complete. The DFAs are equivalent.'
            });

        // Add XP for checking equivalence
        onAction?.(50);
        if (queue.length === 0) {
            // Bonus XP for finding equivalent networks
            onAction?.(25);
        }
    };

    const clearMachine = () => {
        const oldStates = states.map(s => ({
            id: s.id,
            label: s.label,
            x: s.node.position().x,
            y: s.node.position().y,
            isAccepting: acceptingStates.has(s.id)
        }));
        const oldTransitions = [...transitions];

        addToHistory({
            type: 'CLEAR',
            states: oldStates,
            transitions: oldTransitions
        });

        graph.clear();
        setStates([]);
        setTransitions([]);
        setStateCounter(0);
        setAcceptingStates(new Set());
        setStartState(null);
        setTestString('');
        setTestResult(null);
        setDfa1(null);
        setDfa2(null);
        setEquivalenceResult(null);
        setMachineType('');
    };

    const processAlphabet = (alphabet, currState1Param, currState2Param, currentPair, newMachine, statesToProcess) => {
        let localState1 = currState1Param;
        let localState2 = currState2Param;
        alphabet.forEach(letter => {
            // Find transitions for current letter
            const currTrans1 = dfa1.transitions.find(t => t.sourceId === localState1.id && t.label === letter);
            const currTrans2 = dfa2.transitions.find(t => t.sourceId === localState2.id && t.label === letter);

            // Find next states
            const nextState1 = dfa1.states.find(state => state.id === currTrans1.targetId);
            const nextState2 = dfa2.states.find(state => state.id === currTrans2.targetId);

            // Create next state pair
            const nextStatePair = {
                id: `${nextState1.id},${nextState2.id}`,
                label: `${nextState1.label},${nextState2.label}`,
                isAccepting:
                    (nextState1.isAccepting && !nextState2.isAccepting) ||
                    (!nextState1.isAccepting && nextState2.isAccepting)
            };

            // Add transition to new machine
            const newTransition = {
                sourceId: currentPair.id,
                targetId: nextStatePair.id,
                label: letter
            };

            // If this is a new state, add it for processing
            if (!newMachine.states.some(s => s.id === nextStatePair.id)) {
                newMachine.states.push(nextStatePair);
                statesToProcess.push([nextState1, nextState2]);
            }
            newMachine.transitions.push(newTransition);
        });
    };

    // Add history tracking with proper action objects
    const addToHistory = useCallback((action) => {
        console.log('Adding action to history:', action);
        const historyItem = {
            undo: () => {
                console.log('Executing undo for action:', action);
                switch (action.type) {
                    case 'ADD_STATE':
                        // Use statesRef to get current states
                        const stateToRemove = statesRef.current.find(s => s.id === action.stateId);
                        console.log('Looking for state:', action.stateId, 'Found:', stateToRemove);
                        if (stateToRemove) {
                            console.log('Found state to remove:', stateToRemove);
                            // Remove from graph first
                            stateToRemove.node.remove();
                            // Then update states array
                            setStates(prev => {
                                console.log('Current states:', prev);
                                const newStates = prev.filter(s => s.id !== action.stateId);
                                console.log('New states:', newStates);
                                return newStates;
                            });
                            // Update counter
                            setStateCounter(prev => prev - 1);
                            // If it was a start state, clear it
                            if (startState === action.stateId) {
                                setStartState(null);
                            }
                            // If it was an accepting state, remove it
                            if (acceptingStates.has(action.stateId)) {
                                setAcceptingStates(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(action.stateId);
                                    return newSet;
                                });
                            }
                            // Remove any transitions involving this state
                            const relatedTransitions = transitions.filter(t => 
                                t.sourceId === action.stateId || t.targetId === action.stateId
                            );
                            relatedTransitions.forEach(t => {
                                const link = graph.getLinks().find(link => 
                                    link.getSourceElement().id === t.sourceId && 
                                    link.getTargetElement().id === t.targetId
                                );
                                if (link) link.remove();
                            });
                            setTransitions(prev => prev.filter(t => 
                                t.sourceId !== action.stateId && t.targetId !== action.stateId
                            ));
                        } else {
                            console.warn('State not found for undo:', action);
                        }
                        break;
                    case 'ADD_TRANSITION':
                        const sourceState = states.find(s => s.id === action.sourceId);
                        const targetState = states.find(s => s.id === action.targetId);
                        if (sourceState && targetState) {
                            const link = new shapes.standard.Link();
                            link.source({ id: sourceState.id });
                            link.target({ id: targetState.id });
                            link.router({
                                name: 'manhattan',
                                args: {
                                    padding: 20,
                                    startDirections: ['top', 'right', 'bottom', 'left'],
                                    endDirections: ['top', 'right', 'bottom', 'left']
                                }
                            });
                            link.attr({
                                line: {
                                    stroke: 'black',
                                    strokeWidth: 2,
                                    targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z', fill: 'black' }
                                }
                            });
                            link.labels([{
                                attrs: { text: { text: action.label, fontSize: 14, fontWeight: 'bold' } },
                                position: 0.5
                            }]);
                            link.addTo(graph);
                            setTransitions(prev => [...prev, {
                                sourceId: sourceState.id,
                                targetId: targetState.id,
                                label: action.label,
                                source: sourceState.label,
                                target: targetState.label
                            }]);
                        }
                        break;
                    case 'CLEAR':
                        graph.clear();
                        setStates([]);
                        setTransitions([]);
                        break;
                }
            },
            redo: () => {
                console.log('Executing redo for action:', action);
                switch (action.type) {
                    case 'ADD_STATE':
                        const circle = new shapes.standard.Circle();
                        circle.set('id', action.stateId);  // Set the same ID
                        circle.position(action.x, action.y);
                        circle.resize(60, 60);
                        circle.attr({
                            body: { 
                                fill: '#ccccff', 
                                strokeWidth: 3
                            },
                            label: { 
                                text: action.label, 
                                fill: 'black', 
                                fontWeight: 'bold',
                                fontSize: 16,
                                textAnchor: 'middle',
                                textVerticalAnchor: 'middle',
                                refX: '50%',
                                refY: '50%'
                            }
                        });
                        circle.addTo(graph);
                        const newState = { id: action.stateId, label: action.label, node: circle };
                        setStates(prev => [...prev, newState]);
                        setStateCounter(action.counter + 1);
                        break;
                    case 'ADD_TRANSITION':
                        const sourceState = states.find(s => s.id === action.sourceId);
                        const targetState = states.find(s => s.id === action.targetId);
                        if (sourceState && targetState) {
                            const link = new shapes.standard.Link();
                            link.source({ id: sourceState.id });
                            link.target({ id: targetState.id });
                            link.router({
                                name: 'manhattan',
                                args: {
                                    padding: 20,
                                    startDirections: ['top', 'right', 'bottom', 'left'],
                                    endDirections: ['top', 'right', 'bottom', 'left']
                                }
                            });
                            link.attr({
                                line: {
                                    stroke: 'black',
                                    strokeWidth: 2,
                                    targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z', fill: 'black' }
                                }
                            });
                            link.labels([{
                                attrs: { text: { text: action.label, fontSize: 14, fontWeight: 'bold' } },
                                position: 0.5
                            }]);
                            link.addTo(graph);
                            setTransitions(prev => [...prev, {
                                sourceId: sourceState.id,
                                targetId: targetState.id,
                                label: action.label,
                                source: sourceState.label,
                                target: targetState.label
                            }]);
                        }
                        break;
                    case 'CLEAR':
                        graph.clear();
                        setStates([]);
                        setTransitions([]);
                        break;
                }
            }
        };

        const newHistory = stateHistory.slice(0, historyIndex + 1);
        newHistory.push(historyItem);
        console.log('New history:', newHistory);
        setStateHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [stateHistory, historyIndex, graph, startState, acceptingStates, transitions]);

    // Add keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'z': 
                        if (e.shiftKey) redo();
                        else undo();
                        break;
                    case 'y': redo(); break;
                    case 's': 
                        e.preventDefault();
                        saveMachine();
                        break;
                    case '+': 
                        e.preventDefault();
                        handleZoom(0.1);
                        break;
                    case '-': 
                        e.preventDefault();
                        handleZoom(-0.1);
                        break;
                    default: break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleZoom, redo, saveMachine, undo]);

    // Add network statistics
    const getNetworkStatistics = useCallback(() => {
        return {
            totalStates: states.length,
            acceptingStates: Array.from(acceptingStates).length,
            totalTransitions: transitions.length,
            density: transitions.length / (states.length * states.length),
            connected: isNetworkConnected(),
            deterministic: isDeterministic()
        };
    }, [states.length, transitions.length, acceptingStates]);

    // Check if network is connected
    const isNetworkConnected = useCallback(() => {
        if (!states.length) return true;
        const visited = new Set();
        const queue = [states[0]];
        
        while (queue.length > 0) {
            const current = queue.shift();
            visited.add(current.id);
            
            transitions
                .filter(t => t.sourceId === current.id)
                .forEach(t => {
                    const targetState = states.find(s => s.id === t.targetId);
                    if (targetState && !visited.has(targetState.id)) {
                        queue.push(targetState);
                    }
                });
        }
        
        return visited.size === states.length;
    }, [states, transitions]);

    // Check if network is deterministic
    const isDeterministic = useCallback(() => {
        if (machineType !== 'DFA') return false;
        
        const transitionMap = new Map();
        for (const state of states) {
            transitionMap.set(state.id, new Set());
        }
        
        for (const transition of transitions) {
            const key = `${transition.sourceId}-${transition.label}`;
            if (transitionMap.get(transition.sourceId).has(key)) {
                return false;
            }
            transitionMap.get(transition.sourceId).add(key);
        }
        
        return true;
    }, [machineType, states, transitions]);

    // Add effect to monitor history changes
    useEffect(() => {
        console.log('History state updated:', {
            historyLength: stateHistory.length,
            historyIndex,
            history: stateHistory
        });
    }, [stateHistory, historyIndex]);

    // Update theme and animations
    useEffect(() => {
        if (theme && states.length > 0) {
            states.forEach(state => {
                if (!state || !state.node) return;  // Skip if state or node is invalid
                
                try {
                    // Apply theme
                    state.node.attr({
                        body: {
                            fill: theme.fill,
                            stroke: theme.stroke,
                            strokeWidth: 2
                        },
                        label: {
                            fill: theme.textColor,
                            fontSize: 16,
                            fontWeight: 'bold'
                        }
                    });

                    // Clear any existing animations
                    if (state.node.animation) {
                        clearInterval(state.node.animation);
                        state.node.animation = null;
                    }

                    // Apply new animation
                    if (animation !== 'none') {
                        switch (animation) {
                            case 'pulse':
                                // Create a pulsing effect using opacity and shadow
                                let pulsePhase = 0;
                                const pulseInterval = setInterval(() => {
                                    if (!state || !state.node) {  // Check if state still exists
                                        clearInterval(pulseInterval);
                                        return;
                                    }
                                    
                                    pulsePhase = (pulsePhase + 1) % 100;
                                    const opacity = 0.3 + 0.2 * Math.sin(pulsePhase * Math.PI / 50);
                                    const blurRadius = 5 + 3 * Math.sin(pulsePhase * Math.PI / 50);
                                    
                                    try {
                                        state.node.attr('body/filter', {
                                            name: 'dropShadow',
                                            args: {
                                                dx: 0,
                                                dy: 0,
                                                blur: blurRadius,
                                                opacity: opacity,
                                                color: theme.stroke
                                            }
                                        });
                                    } catch (error) {
                                        console.warn('Error applying pulse animation:', error);
                                        clearInterval(pulseInterval);
                                    }
                                }, 50);
                                state.node.animation = pulseInterval;
                                break;

                            case 'glow':
                                try {
                                    state.node.attr('body/filter', {
                                        name: 'dropShadow',
                                        args: {
                                            dx: 0,
                                            dy: 0,
                                            blur: 10,
                                            opacity: 0.3,
                                            color: theme.stroke
                                        }
                                    });
                                } catch (error) {
                                    console.warn('Error applying glow effect:', error);
                                }
                                break;

                            default:
                                break;
                        }
                    } else {
                        // Reset to default state
                        state.node.attr({
                            body: {
                                transform: '',
                                filter: '',
                                strokeWidth: 2
                            }
                        });
                    }
                } catch (error) {
                    console.warn('Error applying theme or animation:', error);
                }
            });
        }

        // Cleanup function to clear intervals
        return () => {
            if (states.length > 0) {
                states.forEach(state => {
                    if (state && state.node && state.node.animation) {
                        clearInterval(state.node.animation);
                        state.node.animation = null;
                    }
                });
            }
        };
    }, [theme, animation, states]);

    // Apply template function
    window.applyTemplate = (template) => {
        if (!graph || !template) return;
        
        // Clear existing graph
        graph.clear();
        setStates([]);
        setTransitions([]);
        setStateCounter(0);
        setAcceptingStates(new Set());
        setStartState(null);
        
        // Create new nodes
        const newStates = [];
        template.nodes.forEach(nodeTemplate => {
            const circle = new shapes.standard.Circle();
            circle.set('id', nodeTemplate.id);
            circle.position(nodeTemplate.x, nodeTemplate.y);
            circle.resize(60, 60);
            circle.attr({
                body: {
                    fill: theme?.fill || '#1a1a1a',
                    stroke: theme?.stroke || '#06b6d4',
                    strokeWidth: 2
                },
                label: {
                    text: nodeTemplate.label,
                    fill: theme?.textColor || '#e2e8f0',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    refX: '50%',
                    refY: '50%'
                }
            });
            circle.addTo(graph);
            
            const newState = { 
                id: nodeTemplate.id, 
                label: nodeTemplate.label, 
                node: circle 
            };
            newStates.push(newState);
        });
        
        setStates(newStates);
        setStateCounter(newStates.length);
        
        // Create transitions
        const newTransitions = [];
        template.transitions.forEach(transTemplate => {
            const sourceState = newStates.find(s => s.id === transTemplate.from);
            const targetState = newStates.find(s => s.id === transTemplate.to);
            
            if (sourceState && targetState) {
                const link = new shapes.standard.Link();
                link.source({ id: sourceState.id });
                link.target({ id: targetState.id });
                link.router({
                    name: 'manhattan',
                    args: {
                        padding: 20,
                        startDirections: ['top', 'right', 'bottom', 'left'],
                        endDirections: ['top', 'right', 'bottom', 'left']
                    }
                });
                link.attr({
                    line: {
                        stroke: 'black',
                        strokeWidth: 2,
                        targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z', fill: 'black' }
                    }
                });
                link.labels([{
                    attrs: { text: { text: transTemplate.label, fontSize: 14, fontWeight: 'bold' } },
                    position: 0.5
                }]);
                link.addTo(graph);
                
                newTransitions.push({
                    sourceId: sourceState.id,
                    targetId: targetState.id,
                    label: transTemplate.label,
                    source: sourceState.label,
                    target: targetState.label
                });
            }
        });
        
        setTransitions(newTransitions);
        
        // Set first node as start state if exists
        if (newStates.length > 0) {
            setStartState(newStates[0].id);
            setStartingState(newStates[0].id);
        }
        
        // Apply current theme and animation if set
        if (theme || animation !== 'none') {
            newStates.forEach(state => {
                if (state && state.node) {
                    // Apply theme
                    if (theme) {
                        state.node.attr({
                            body: {
                                fill: theme.fill,
                                stroke: theme.stroke,
                                strokeWidth: 2
                            },
                            label: {
                                fill: theme.textColor,
                                fontSize: 16,
                                fontWeight: 'bold'
                            }
                        });
                    }
                    
                    // Apply animation
                    if (animation !== 'none') {
                        switch (animation) {
                            case 'glow':
                                state.node.attr('body/filter', {
                                    name: 'dropShadow',
                                    args: {
                                        dx: 0,
                                        dy: 0,
                                        blur: 10,
                                        opacity: 0.3,
                                        color: theme?.stroke || '#06b6d4'
                                    }
                                });
                                break;
                            case 'pulse':
                                let pulsePhase = 0;
                                const pulseInterval = setInterval(() => {
                                    if (!state || !state.node) {
                                        clearInterval(pulseInterval);
                                        return;
                                    }
                                    pulsePhase = (pulsePhase + 1) % 100;
                                    const opacity = 0.3 + 0.2 * Math.sin(pulsePhase * Math.PI / 50);
                                    const blurRadius = 5 + 3 * Math.sin(pulsePhase * Math.PI / 50);
                                    state.node.attr('body/filter', {
                                        name: 'dropShadow',
                                        args: {
                                            dx: 0,
                                            dy: 0,
                                            blur: blurRadius,
                                            opacity: opacity,
                                            color: theme?.stroke || '#06b6d4'
                                        }
                                    });
                                }, 50);
                                state.node.animation = pulseInterval;
                                break;
                            default:
                                break;
                        }
                    }
                }
            });
        }
    };

    const addNode = (x, y) => {
        const newNode = {
            id: `q${states.length}`,
            label: `q${states.length}`,
            x,
            y,
            style: {
                fill: theme?.fill || '#1a1a1a',
                stroke: theme?.stroke || '#06b6d4',
                color: theme?.textColor || '#e2e8f0',
                transition: 'all 0.3s ease'
            }
        };
        if (animation !== 'none') {
            newNode.style.animation = `${animation} 2s infinite`;
        }
        setStates([...states, newNode]);
        onAction(5); // Award XP for adding a node
    };

    // Update parent component when states change
    useEffect(() => {
        onStateChange?.(states);
    }, [states, onStateChange]);

    // Update parent component when transitions change
    useEffect(() => {
        onTransitionChange?.(transitions);
    }, [transitions, onTransitionChange]);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '1000px'}}>
            <div>
                <div>
                    <select 
                        value={machineType || ''} 
                        onChange={(e) => setMachineType(e.target.value)}
                    >
                        <option value="" disabled>
                            Select Network Type
                        </option>
                        <option value="DFA">Deterministic Network</option>
                        <option value="NFA">Non-Deterministic Network</option>
                    </select>

                    <button onClick={addState} className="button">Add Node</button>
                    <button onClick={startAddingTransition} disabled={isAddingTransition} className="button">Add Connection</button>
                    <button onClick={saveMachine} className="button">Export Network</button>
                    <input type="file" onChange={loadMachine} accept=".json" style={{ display: 'none' }} id="fileInput"/>
                    <button onClick={() => document.getElementById('fileInput').click()} className="button">
                        Import Network
                    </button>
                    <button onClick={clearMachine} className="button">Reset Network</button>
                    
                    {machineType === "NFA" && (
                        <h4 style={{color : 'var(--text-color)'}}>Epsilon symbol for Non-Deterministic Network (copy and paste) ε</h4>
                    )}

                    <div style={{ marginTop: '10px' }}>
                        <h4 style={{ color: 'var(--text-color)' }}>Set Initial Node</h4>
                        <select 
                            value={startState || ''} 
                            onChange={(e) => setStartingState(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            <option value="" disabled>Select Initial Node</option>
                            {states.length === 0 ? (
                                <option value="" disabled>Add nodes using "Add Node" button</option>
                            ) : (
                                states.map(state => (
                                    <option key={state.id} value={state.id}>
                                        {state.label} {acceptingStates.has(state.id) ? '(Accepting)' : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="test-container">
                        <h4>Validation String (Starting from {states.find(s => s.id === startState)?.label})</h4>
                        <div style={{ marginTop: '5px' }}>
                            <input
                                type="text"
                                value={testString}
                                onChange={(e) => {
                                    resetHighlighting();
                                    setTestString(e.target.value);
                                    setTestResult(null); 
                                }}
                                placeholder="Enter validation string"
                            />
                            <button 
                                onClick={machineType === "DFA" ? testInput : testNFAInput}
                                className="button"
                            >
                                Validate String
                            </button>
                        </div>

                        {testResult && (
                            <div style={{
                                marginTop: '10px',
                                padding: '5px',
                                backgroundColor: testResult.accepted ? 'green' : 'red',
                                borderRadius: '4px'
                            }}>
                                <strong>Result:</strong> {testResult.message}
                                {testResult.path && (
                                    <div>
                                        <strong>Path:</strong> {testResult.path.join(' → ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="test-container">
                        <h4>Network Equivalence Test (Upload 2 Network JSON files)</h4>
                        <div>
                            <input
                                type="file"
                                onChange={(e) => handleDfaFileUpload(1, e)}
                                accept=".json"
                                style={{color: 'var(--text-color)'}}
                            />
                            <input
                                type="file"
                                onChange={(e) => handleDfaFileUpload(2, e)}
                                accept=".json"
                                style={{color: 'var(--text-color)'}}
                            />
                            <button 
                                onClick={checkDfaEquivalence}
                                className="button"
                                disabled={!dfa1 || !dfa2}
                            >
                                Check Network Equivalence
                            </button>
                        </div>

                        {equivalenceResult && (
                            <div style={{
                                marginTop: '10px',
                                padding: '5px',
                                backgroundColor: equivalenceResult.equivalent ? 'green' : 'red',
                                borderRadius: '4px'
                            }}>
                                <strong>Result:</strong> {equivalenceResult.message}
                            </div>
                        )}
                    </div>

                    <div className="test-container">
                        <h4>Quick Actions</h4>
                        <div className="button-group">
                            <button onClick={undo} className="button" title="Ctrl+Z">
                                Undo
                            </button>
                            <button onClick={redo} className="button" title="Ctrl+Y">
                                Redo
                            </button>
                            <button onClick={() => handleZoom(0.1)} className="button" title="Ctrl++">
                                Zoom In
                            </button>
                            <button onClick={() => handleZoom(-0.1)} className="button" title="Ctrl+-">
                                Zoom Out
                            </button>
                            <button onClick={() => setShowStatistics(!showStatistics)} className="button">
                                {showStatistics ? 'Hide' : 'Show'} Statistics
                            </button>
                        </div>

                        {showStatistics && (
                            <div className="statistics-panel">
                                <h4>Network Statistics</h4>
                                <div className="stats-grid">
                                    {Object.entries(getNetworkStatistics()).map(([key, value]) => (
                                        <div key={key} className="stat-item">
                                            <span className="stat-label">
                                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                            </span>
                                            <span className="stat-value">
                                                {typeof value === 'number' && key === 'density' 
                                                    ? value.toFixed(2) 
                                                    : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="diagram-container">
                        <div className="network-info-sidebar">
                            <h3>Network Nodes</h3>
                            <div>
                                {states.map(state => (
                                    <div key={state.id} style={{ marginBottom: '5px' }}>
                                        <label style={{ color: 'var(--text-color)' }}>
                                            <input
                                                type="checkbox"
                                                checked={acceptingStates.has(state.id)}
                                                onChange={() => toggleAcceptingState(state.id)}
                                            />
                                            {state.label} (Toggle Acceptance)
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <h3 style={{ marginTop: '2rem' }}>Network Connections</h3>
                            <ul>
                                {transitions.map((t, index) => (
                                    <li key={index}>{`${t.source} --${t.label}--> ${t.target}`}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="graph-container">
                            <h3 className="diagram-title">AI-Generated Network Visualization</h3>
                            <div ref={paperRef} style={{ width: '100%', height: '600px' }}></div>
                        </div>
                    </div>

                    {isAddingTransition && (
                        <div style={{ marginTop: '10px' }}>
                            <h4>Adding Connection</h4>
                            <select onChange={(e) => setTransitionSource(e.target.value)} value={transitionSource || ''}>
                                <option value="">Select Source Node</option>
                                {states.map(state => (
                                    <option key={state.id} value={state.id}>{state.label}</option>
                                ))}
                            </select>

                            <select onChange={(e) => setTransitionTarget(e.target.value)} value={transitionTarget || ''}>
                                <option value="">Select Target Node</option>
                                {states.map(state => (
                                    <option key={state.id} value={state.id}>{state.label}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Connection Character"
                                value={transitionLabel}
                                onChange={(e) => setTransitionLabel(e.target.value)}
                                maxLength="1"
                            />

                            <button
                                onClick={confirmTransition}
                                disabled={!transitionSource || !transitionTarget || !transitionLabel}
                            >
                                Confirm Connection
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DfaNfaVisualizer;
