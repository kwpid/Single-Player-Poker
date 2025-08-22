// Main Application Controller for Dark Poker Game

class GameApp {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.pokerGame = null;
        this.eloSystem = new EloSystem();
        this.queueTimer = null;
        this.queueStartTime = null;
        
        this.initializeApp();
        this.setupEventListeners();
        this.loadUserData();
    }
    
    initializeApp() {
        // Get all screen elements
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            queueScreen: document.getElementById('queueScreen'),
            gameScreen: document.getElementById('gameScreen'),
            resultsScreen: document.getElementById('resultsScreen')
        };
        
        // Get modal elements
        this.modals = {
            settings: document.getElementById('settingsModal'),
            help: document.getElementById('helpModal')
        };
        
        // Initialize settings from localStorage
        this.initializeSettings();
        
        // Show main menu
        this.showScreen('mainMenu');
    }
    
    initializeSettings() {
        // Load sound setting
        const soundEnabled = Utils.loadGameData('soundEnabled', true);
        document.getElementById('soundToggle').checked = soundEnabled;
        
        // Load animations setting
        const animationsEnabled = Utils.loadGameData('animationsEnabled', true);
        document.getElementById('animationsToggle').checked = animationsEnabled;
        
        // Load username
        const username = Utils.loadGameData('username', 'Player');
        document.getElementById('usernameInput').value = username;
    }
    
    loadUserData() {
        // Update username display
        const username = Utils.loadGameData('username', 'Player');
        document.getElementById('playerUsername').textContent = username;
        
        // Update ELO display
        const playerElo = this.eloSystem.getPlayerRating();
        document.getElementById('playerElo').textContent = playerElo;
    }
    
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('casualQueueBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.startQueue();
        });
        
        document.getElementById('tutorialBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showTutorial();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showModal('settings');
        });
        
        document.getElementById('helpBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showModal('help');
        });
        
        // Queue screen
        document.getElementById('cancelQueueBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.cancelQueue();
        });
        
        // Results screen
        document.getElementById('reQueueBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.startQueue();
        });
        
        document.getElementById('returnToMenuBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showScreen('mainMenu');
        });
        
        // Settings modal
        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.hideModal('settings');
        });
        
        document.getElementById('saveUsernameBtn').addEventListener('click', () => {
            this.saveUsername();
        });
        
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            Utils.saveGameData('soundEnabled', e.target.checked);
        });
        
        document.getElementById('animationsToggle').addEventListener('change', (e) => {
            Utils.saveGameData('animationsEnabled', e.target.checked);
        });
        
        // Help modal
        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            this.hideModal('help');
        });
        
        // Modal backdrop clicks
        Object.values(this.modals).forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id.replace('Modal', ''));
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Username input enter key
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveUsername();
            }
        });
    }
    
    handleKeyPress(e) {
        // ESC key to close modals or return to menu
        if (e.key === 'Escape') {
            const activeModal = Object.keys(this.modals).find(key => 
                this.modals[key].classList.contains('active'));
            
            if (activeModal) {
                this.hideModal(activeModal);
            } else if (this.currentScreen === 'queueScreen') {
                this.cancelQueue();
            }
        }
        
        // Space bar for quick actions
        if (e.key === ' ') {
            e.preventDefault();
            if (this.currentScreen === 'mainMenu') {
                this.startQueue();
            }
        }
    }
    
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
        
        // Screen-specific setup
        this.handleScreenTransition(screenName);
    }
    
    handleScreenTransition(screenName) {
        switch (screenName) {
            case 'mainMenu':
                this.loadUserData(); // Refresh user data
                break;
            case 'gameScreen':
                // Game screen is handled by PokerGame class
                break;
            case 'resultsScreen':
                // Results are populated by PokerGame class
                break;
        }
    }
    
    showModal(modalName) {
        if (this.modals[modalName]) {
            this.modals[modalName].classList.add('active');
        }
    }
    
    hideModal(modalName) {
        if (this.modals[modalName]) {
            this.modals[modalName].classList.remove('active');
        }
    }
    
    saveUsername() {
        const usernameInput = document.getElementById('usernameInput');
        const newUsername = usernameInput.value.trim();
        
        if (newUsername && newUsername.length >= 2 && newUsername.length <= 20) {
            Utils.saveGameData('username', newUsername);
            document.getElementById('playerUsername').textContent = newUsername;
            
            // Show success feedback
            const saveBtn = document.getElementById('saveUsernameBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.background = 'var(--accent-green)';
            
            Utils.playSound('click');
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 1500);
        } else {
            // Show error feedback
            usernameInput.style.borderColor = 'var(--accent-red)';
            usernameInput.placeholder = 'Username must be 2-20 characters';
            
            setTimeout(() => {
                usernameInput.style.borderColor = '';
                usernameInput.placeholder = 'Enter username';
            }, 2000);
        }
    }
    
    startQueue() {
        this.showScreen('queueScreen');
        this.queueStartTime = Date.now();
        
        // Random queue time between 10-20 seconds
        const queueDuration = 10000 + Math.random() * 10000; // 10-20 seconds
        
        // Start queue timer display
        this.startQueueTimer();
        
        // Start queue progress
        setTimeout(() => {
            this.foundGame();
        }, queueDuration);
        
        // Add some realistic queue events
        this.addQueueEvents(queueDuration);
    }
    
    startQueueTimer() {
        let elapsed = 0;
        this.queueTimer = setInterval(() => {
            elapsed = Math.floor((Date.now() - this.queueStartTime) / 1000);
            document.getElementById('queueTime').textContent = Utils.formatTime(elapsed);
        }, 1000);
    }
    
    addQueueEvents(totalDuration) {
        // Add some intermediate messages to make queue feel more realistic
        const events = [
            { time: 0.3, message: 'Searching for opponents...' },
            { time: 0.6, message: 'Found 2 players, looking for more...' },
            { time: 0.8, message: 'Almost ready...' }
        ];
        
        events.forEach(event => {
            setTimeout(() => {
                if (this.currentScreen === 'queueScreen') {
                    const header = document.querySelector('.queue-header p');
                    header.textContent = event.message;
                }
            }, totalDuration * event.time);
        });
    }
    
    cancelQueue() {
        if (this.queueTimer) {
            clearInterval(this.queueTimer);
            this.queueTimer = null;
        }
        
        this.showScreen('mainMenu');
    }
    
    foundGame() {
        if (this.currentScreen !== 'queueScreen') return;
        
        if (this.queueTimer) {
            clearInterval(this.queueTimer);
            this.queueTimer = null;
        }
        
        // Show "Game Found" message briefly
        const queueHeader = document.querySelector('.queue-header h2');
        const queueText = document.querySelector('.queue-header p');
        
        queueHeader.innerHTML = '<i class="fas fa-check-circle"></i> Game Found!';
        queueHeader.style.color = 'var(--accent-green)';
        queueText.textContent = 'Joining game...';
        
        Utils.playSound('win');
        
        setTimeout(() => {
            this.startGame();
        }, 2000);
    }
    
    startGame() {
        this.showScreen('gameScreen');
        
        // Initialize poker game
        this.pokerGame = new PokerGame();
        
        // Number of AI players (3-5 total players including human)
        const numPlayers = 3 + Math.floor(Math.random() * 3); // 3-5 players total
        this.pokerGame.startGame(numPlayers);
        
        // Override the poker game's result handler
        this.setupGameResultHandler();
    }
    
    setupGameResultHandler() {
        // Store original showResults method
        const originalShowResults = this.pokerGame.showResults.bind(this.pokerGame);
        
        // Override to handle our app flow
        this.pokerGame.showResults = (standings, eloResult) => {
            // Call original method
            originalShowResults(standings, eloResult);
            
            // Update main menu ELO display
            setTimeout(() => {
                this.loadUserData();
            }, 100);
        };
    }
    
    showTutorial() {
        // Simple tutorial implementation
        const tutorialSteps = [
            {
                title: "Welcome to Dark Poker!",
                content: "This is a Texas Hold'em poker game where you play against AI opponents. Your goal is to be the last player with chips."
            },
            {
                title: "Game Flow",
                content: "Each player starts with $5,000 in chips. The game uses standard poker rules with blinds that increase the action."
            },
            {
                title: "Betting Actions",
                content: "You can Fold (give up your hand), Call/Check (match the bet or pass), or Raise (increase the bet)."
            },
            {
                title: "Hand Rankings",
                content: "From highest to lowest: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card."
            },
            {
                title: "ELO System",
                content: "Your skill rating increases with good finishes. 1st place gives the most ELO, while poor finishes give little to no ELO."
            }
        ];
        
        let currentStep = 0;
        
        const showStep = () => {
            const step = tutorialSteps[currentStep];
            const isLastStep = currentStep === tutorialSteps.length - 1;
            
            const modalContent = `
                <div class="tutorial-content">
                    <h3>${step.title}</h3>
                    <p>${step.content}</p>
                    <div class="tutorial-progress">
                        <span>Step ${currentStep + 1} of ${tutorialSteps.length}</span>
                    </div>
                    <div class="tutorial-buttons">
                        ${currentStep > 0 ? '<button id="tutorialPrev" class="menu-button">Previous</button>' : ''}
                        ${!isLastStep ? '<button id="tutorialNext" class="menu-button">Next</button>' : '<button id="tutorialDone" class="game-button primary">Start Playing!</button>'}
                    </div>
                </div>
            `;
            
            // Create temporary tutorial modal
            const tutorialModal = document.createElement('div');
            tutorialModal.className = 'modal active';
            tutorialModal.id = 'tutorialModal';
            tutorialModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-graduation-cap"></i> Tutorial</h3>
                        <button class="close-btn" id="closeTutorialBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${modalContent}
                    </div>
                </div>
            `;
            
            // Remove existing tutorial modal if any
            const existing = document.getElementById('tutorialModal');
            if (existing) existing.remove();
            
            document.body.appendChild(tutorialModal);
            
            // Add event listeners
            const nextBtn = document.getElementById('tutorialNext');
            const prevBtn = document.getElementById('tutorialPrev');
            const doneBtn = document.getElementById('tutorialDone');
            const closeBtn = document.getElementById('closeTutorialBtn');
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    Utils.playSound('click');
                    currentStep++;
                    showStep();
                });
            }
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    Utils.playSound('click');
                    currentStep--;
                    showStep();
                });
            }
            
            if (doneBtn) {
                doneBtn.addEventListener('click', () => {
                    Utils.playSound('click');
                    tutorialModal.remove();
                    this.startQueue();
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    tutorialModal.remove();
                });
            }
            
            // Close on backdrop click
            tutorialModal.addEventListener('click', (e) => {
                if (e.target === tutorialModal) {
                    tutorialModal.remove();
                }
            });
        };
        
        showStep();
    }
    
    // Debug/admin functions
    resetAllData() {
        if (confirm('Are you sure you want to reset all game data? This cannot be undone.')) {
            localStorage.clear();
            this.eloSystem.reset();
            this.loadUserData();
            alert('All data has been reset.');
        }
    }
    
    // Add some easter eggs and debug commands
    handleDebugCommands() {
        let konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // Up up down down left right left right B A
        let konamiIndex = 0;
        
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === konami[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konami.length) {
                    this.activateDebugMode();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
    }
    
    activateDebugMode() {
        console.log('Debug mode activated!');
        
        // Add debug panel
        const debugPanel = document.createElement('div');
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
        `;
        debugPanel.innerHTML = `
            <div>Debug Mode Active</div>
            <button onclick="gameApp.eloSystem.playerRating += 100; gameApp.loadUserData();">+100 ELO</button>
            <button onclick="gameApp.resetAllData();">Reset Data</button>
            <button onclick="this.parentNode.remove();">Close</button>
        `;
        document.body.appendChild(debugPanel);
    }
    
    // Performance monitoring
    startPerformanceMonitoring() {
        if (window.performance && window.performance.mark) {
            setInterval(() => {
                const memory = window.performance.memory;
                if (memory && memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
                    console.warn('High memory usage detected:', memory.usedJSHeapSize / 1024 / 1024, 'MB');
                }
            }, 30000); // Check every 30 seconds
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Global app instance
    window.gameApp = new GameApp();
    
    // Start performance monitoring in production
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        window.gameApp.startPerformanceMonitoring();
    }
    
    // Enable debug commands
    window.gameApp.handleDebugCommands();
    
    // Add global error handler
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--accent-red);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
            font-weight: bold;
        `;
        errorDiv.textContent = 'An error occurred. Please refresh the page.';
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    });
    
    // Prevent right-click context menu in production
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        document.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    // Add visual feedback for touch devices
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Add touch feedback styles
        const touchStyles = document.createElement('style');
        touchStyles.textContent = `
            .touch-device button:active,
            .touch-device .game-button:active,
            .touch-device .menu-button:active {
                transform: scale(0.95);
                transition: transform 0.1s;
            }
        `;
        document.head.appendChild(touchStyles);
    }
    
    // Add loading indicator management
    const hideLoader = () => {
        const loader = document.querySelector('.loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    };
    
    // Hide loader after everything is initialized
    setTimeout(hideLoader, 500);
    
    console.log('🃏 Dark Poker initialized successfully!');
});

// Service Worker registration for PWA capability
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Add CSS for tutorial styles
const tutorialStyles = document.createElement('style');
tutorialStyles.textContent = `
    .tutorial-content {
        text-align: center;
        padding: 1rem 0;
    }
    
    .tutorial-content h3 {
        color: var(--accent-gold);
        margin-bottom: 1rem;
        font-size: 1.3rem;
    }
    
    .tutorial-content p {
        line-height: 1.6;
        margin-bottom: 1.5rem;
        color: var(--text-secondary);
    }
    
    .tutorial-progress {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }
    
    .tutorial-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .tutorial-buttons .menu-button,
    .tutorial-buttons .game-button {
        min-width: 100px;
    }
    
    @media (max-width: 480px) {
        .tutorial-buttons {
            flex-direction: column;
            align-items: center;
        }
        
        .tutorial-buttons .menu-button,
        .tutorial-buttons .game-button {
            width: 100%;
            max-width: 200px;
        }
    }
`;
document.head.appendChild(tutorialStyles);
