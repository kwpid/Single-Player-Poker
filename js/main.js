// Main Application Controller for Dark Poker Game

class GameApp {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.pokerGame = null;
        this.eloSystem = new EloSystem();
        this.statsSystem = new StatsSystem();
        this.rankedSystem = new RankedSystem();
        this.leaderboardSystem = new LeaderboardSystem();
        this.queueTimer = null;
        this.queueStartTime = null;
        this.currentGameMode = 'casual'; // 'casual' or 'ranked'
        this.gameInProgress = false; // Track if a game is currently active
        this.gameStartTime = null; // Track when the current game started
        
        this.initializeApp();
        this.setupEventListeners();
        this.loadUserData();
        this.checkForGameRefresh(); // Check if player refreshed during a game
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
            help: document.getElementById('helpModal'),
            stats: document.getElementById('statsModal'),
            ranked: document.getElementById('rankedModal'),
            leaderboard: document.getElementById('leaderboardModal')
        };
        
        // Initialize settings from localStorage
        this.initializeSettings();
        
        // Regenerate leaderboards with new AI names if needed
        this.regenerateLeaderboardsIfNeeded();
        
        // Update ranked button display on initialization
        this.updateRankedButtonDisplay();
        
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
        
        // Update ranked button display
        this.updateRankedButtonDisplay();
    }
    
    updateRankedButtonDisplay() {
        const rankedRankText = document.getElementById('rankedRankText');
        const rankedEloText = document.getElementById('rankedEloText');
        
        if (rankedRankText && rankedEloText) {
            // Get ranked stats
            const rankedStats = this.rankedSystem.getRankedStats();
            const playerElo = this.eloSystem.getPlayerRating();
            
            // Update rank text
            if (rankedStats.isRanked) {
                rankedRankText.textContent = rankedStats.rank;
                // Add color styling based on rank
                rankedRankText.style.color = rankedStats.rankInfo.color;
            } else {
                rankedRankText.textContent = 'Unranked';
                rankedRankText.style.color = 'var(--accent-gold)'; // Default gold color
            }
            
            // Update ELO text
            rankedEloText.textContent = `${playerElo} ELO`;
        }
    }
    
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('casualQueueBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.currentGameMode = 'casual';
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

        // New UI buttons
        document.getElementById('rankedBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showModal('ranked');
        });

        document.getElementById('statsBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showModal('stats');
        });

        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.showModal('leaderboard');
        });

        // Stats modal
        document.getElementById('closeStatsBtn').addEventListener('click', () => {
            this.hideModal('stats');
        });

        // Ranked modal
        document.getElementById('closeRankedBtn').addEventListener('click', () => {
            this.hideModal('ranked');
        });

        document.getElementById('startRankedBtn').addEventListener('click', () => {
            Utils.playSound('click');
            this.startRankedQueue();
        });

        // Leaderboard modal
        document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
            this.hideModal('leaderboard');
        });

        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLeaderboardTab(e.target.dataset.tab);
            });
        });

        // Stats leaderboard controls
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchStatsCategory(e.target.dataset.category);
            });
        });

        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchStatsTimeframe(e.target.dataset.timeframe);
            });
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
        
        // Custom bet input functionality
        this.setupCustomBetInput();
        
        // Page visibility and unload events for refresh detection
        this.setupRefreshDetection();
    }
    
    setupCustomBetInput() {
        const betAmount = document.getElementById('betAmount');
        const betSlider = document.getElementById('betSlider');
        
        if (betAmount && betSlider) {
            betAmount.addEventListener('click', () => {
                this.enableCustomBetInput();
            });
            
            // Update slider when custom input changes
            betSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.updateBetAmount(value);
            });
        }
    }
    
    enableCustomBetInput() {
        const betAmount = document.getElementById('betAmount');
        const betSlider = document.getElementById('betSlider');
        
        if (!betAmount || !betSlider) return;
        
        // Get current player chips for max bet
        const currentChips = this.pokerGame ? this.pokerGame.getPlayerChips() : 500;
        const maxBet = Math.min(currentChips, 500); // Cap at 500 or current chips
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'custom-bet-input';
        input.min = '0';
        input.max = maxBet.toString();
        input.value = betAmount.textContent;
        input.placeholder = `0-${maxBet}`;
        
        // Replace bet amount with input
        betAmount.style.display = 'none';
        betAmount.parentNode.insertBefore(input, betAmount);
        
        // Focus and select input
        input.focus();
        input.select();
        
        // Handle input events
        input.addEventListener('blur', () => {
            this.finalizeCustomBet(input);
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.finalizeCustomBet(input);
            } else if (e.key === 'Escape') {
                this.cancelCustomBet(input);
            }
        });
        
        // Update slider to match input
        input.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 0;
            const clampedValue = Math.max(0, Math.min(value, maxBet));
            betSlider.value = clampedValue;
        });
    }
    
    finalizeCustomBet(input) {
        const betAmount = document.getElementById('betAmount');
        const betSlider = document.getElementById('betSlider');
        
        if (!betAmount || !betSlider) return;
        
        const value = parseInt(input.value) || 0;
        const maxBet = parseInt(input.max);
        const clampedValue = Math.max(0, Math.min(value, maxBet));
        
        // Update bet amount and slider
        this.updateBetAmount(clampedValue);
        betSlider.value = clampedValue;
        
        // Remove input and show bet amount
        input.remove();
        betAmount.style.display = 'inline';
        
        // Update slider max if needed
        if (this.pokerGame) {
            const currentChips = this.pokerGame.getPlayerChips();
            betSlider.max = Math.min(currentChips, 500).toString();
        }
    }
    
    cancelCustomBet(input) {
        const betAmount = document.getElementById('betAmount');
        if (betAmount) {
            input.remove();
            betAmount.style.display = 'inline';
        }
    }
    
    updateBetAmount(amount) {
        const betAmount = document.getElementById('betAmount');
        if (betAmount) {
            betAmount.textContent = amount;
        }
    }
    
    setupRefreshDetection() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (this.gameInProgress && document.hidden) {
                // Player switched tabs or minimized during game
                Utils.saveGameData('gameTabSwitchTime', Date.now());
            } else if (this.gameInProgress && !document.hidden) {
                // Player returned to tab
                const tabSwitchTime = Utils.loadGameData('gameTabSwitchTime', 0);
                if (tabSwitchTime > 0) {
                    const timeAway = Date.now() - tabSwitchTime;
                    if (timeAway > 30000) { // More than 30 seconds away
                        console.warn('Player was away from game for extended period. Applying penalty.');
                        const penaltyResult = this.eloSystem.applyPenalty(50);
                        this.showPenaltyMessage(penaltyResult);
                    }
                }
            }
        });
        
        // Track page unload (refresh, close, navigation)
        window.addEventListener('beforeunload', (e) => {
            if (this.gameInProgress) {
                // Mark that player is leaving during game
                Utils.saveGameData('gameLeftTime', Date.now());
                Utils.saveGameData('gameLeftDuringPlay', true);
                
                // Show warning message
                e.preventDefault();
                e.returnValue = 'You have an active game in progress. Leaving now will result in an ELO penalty. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
        
        // Track page load to detect refresh during game
        window.addEventListener('load', () => {
            const gameLeftDuringPlay = Utils.loadGameData('gameLeftDuringPlay', false);
            const gameLeftTime = Utils.loadGameData('gameLeftTime', 0);
            
            if (gameLeftDuringPlay && gameLeftTime > 0) {
                const timeSinceLeft = Date.now() - gameLeftTime;
                
                // Check if this was a legitimate exit
                if (!this.eloSystem.isLegitimateExit()) {
                    // If they left very recently (within 5 seconds), it's likely a refresh
                    if (timeSinceLeft < 5000) {
                        console.warn('Player refreshed during active game. Applying penalty.');
                        const penaltyResult = this.eloSystem.applyPenalty(100);
                        this.showPenaltyMessage(penaltyResult);
                    }
                }
                
                // Clear the flags
                Utils.saveGameData('gameLeftDuringPlay', false);
                Utils.saveGameData('gameLeftTime', 0);
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
            
            // Populate modal data when opened
            switch (modalName) {
                case 'stats':
                    this.populateStatsModal();
                    break;
                case 'ranked':
                    this.populateRankedModal();
                    break;
                case 'leaderboard':
                    this.populateLeaderboardModal();
                    break;
            }
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
        
        // Reset queue display to initial state
        this.resetQueueDisplay();
        
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

    resetQueueDisplay() {
        // Reset queue header and text to initial state
        const queueHeader = document.querySelector('.queue-header h2');
        const queueText = document.querySelector('.queue-header p');
        
        if (queueHeader) {
            queueHeader.innerHTML = '<i class="fas fa-search"></i> Finding Game...';
            queueHeader.style.color = '';
        }
        
        if (queueText) {
            queueText.textContent = this.currentGameMode === 'ranked' ? 
                'Searching for opponents in ranked mode' : 
                'Searching for opponents in casual mode';
        }
        
        // Reset queue timer
        const queueTime = document.getElementById('queueTime');
        if (queueTime) {
            queueTime.textContent = '0:00';
        }
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
        
        // Reset game state if queue was cancelled
        this.gameInProgress = false;
        this.gameStartTime = null;
        Utils.saveGameData('gameInProgress', false);
        Utils.saveGameData('gameStartTime', 0);
        
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
        
        // Set game state to active
        this.gameInProgress = true;
        this.gameStartTime = Date.now();
        
        // Save game start time to localStorage for refresh detection
        Utils.saveGameData('gameStartTime', this.gameStartTime);
        Utils.saveGameData('gameInProgress', true);
        
        // Game settings based on mode
        const gameSettings = {
            gameMode: this.currentGameMode,
            startingChips: this.currentGameMode === 'ranked' ? 500 : 500
        };
        
        // Initialize poker game with settings
        this.pokerGame = new PokerGame(gameSettings);
        
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
            // End the game state
            this.gameInProgress = false;
            this.gameStartTime = null;
            
            // Save game end time for refresh detection
            Utils.saveGameData('gameEndTime', Date.now());
            Utils.saveGameData('gameInProgress', false);
            
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
                content: "Each player starts with $500 in chips. The game uses standard poker rules with blinds that increase the action."
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

    // New System Integration Methods
    
    populateStatsModal() {
        const stats = this.statsSystem.getStats();
        
        // Overall stats
        document.getElementById('totalWins').textContent = stats.overall.wins;
        document.getElementById('totalLosses').textContent = stats.overall.losses;
        document.getElementById('totalWinRate').textContent = stats.overall.winRate + '%';
        document.getElementById('totalGames').textContent = stats.overall.gamesPlayed;
        
        // Casual stats
        document.getElementById('casualWins').textContent = stats.casual.wins;
        document.getElementById('casualWinRate').textContent = stats.casual.winRate + '%';
        document.getElementById('peakCasualElo').textContent = stats.peaks.casualElo;
        
        // Ranked stats
        document.getElementById('rankedWins').textContent = stats.ranked.wins;
        document.getElementById('rankedWinRate').textContent = stats.ranked.winRate + '%';
        document.getElementById('peakRankedElo').textContent = stats.peaks.rankedElo;
        document.getElementById('peakRank').textContent = stats.peaks.rank;
        
        // XP and progression
        document.getElementById('playerLevel').textContent = stats.progression.currentLevel;
        document.getElementById('totalXP').textContent = stats.progression.totalXP.toLocaleString();
        document.getElementById('xpProgress').style.width = stats.progression.progress + '%';
        document.getElementById('xpText').textContent = 
            `${stats.progression.currentXP} / ${stats.progression.neededXP} XP`;
        
        // Populate match history
        this.populateMatchHistory('all');
        
        // Add event listeners for match history tabs
        this.setupMatchHistoryTabs();
    }
    
    populateRankedModal() {
        const rankedStats = this.rankedSystem.getRankedStats();
        const seasonInfo = this.rankedSystem.getSeasonInfo();
        
        // Update ranked button display to ensure consistency
        this.updateRankedButtonDisplay();
        
        let infoHTML = '';
        
        if (rankedStats.isRanked) {
            // Player is already ranked
            infoHTML = `
                <div class="ranked-status">
                    <h4>Current Season: ${seasonInfo.name}</h4>
                    <div class="rank-display">
                        <div class="rank-info">
                            <span class="rank-name" style="color: ${rankedStats.rankInfo.color}">${rankedStats.rank}</span>
                            <span class="rank-elo">${rankedStats.elo} ELO</span>
                        </div>
                    </div>
                    <div class="ranked-note">
                        <p>Ranked games use 500 chips for faster gameplay.</p>
                        <p>AI opponents will be matched to your skill level.</p>
                    </div>
                </div>
            `;
        } else {
            // Player needs placement matches
            const placement = rankedStats.placementProgress;
            infoHTML = `
                <div class="placement-status">
                    <h4>Placement Matches</h4>
                    <p>Complete 5 placement matches to get your rank for ${seasonInfo.name} season.</p>
                    <div class="placement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(placement.matches / 5) * 100}%"></div>
                        </div>
                        <span class="progress-text">${placement.matches} / 5 matches completed</span>
                    </div>
                    <div class="placement-record">
                        <span>Wins: ${placement.wins}</span>
                    </div>
                    <div class="ranked-note">
                        <p>Ranked games use 500 chips for faster gameplay.</p>
                        <p>Your placement will determine your starting rank.</p>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('rankedInfo').innerHTML = infoHTML;
    }
    
    populateLeaderboardModal() {
        // Initialize with stats tab
        this.switchLeaderboardTab('stats');
    }
    
    switchLeaderboardTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide tab content
        document.getElementById('statsTab').classList.toggle('hidden', tabName !== 'stats');
        document.getElementById('competitiveTab').classList.toggle('hidden', tabName !== 'competitive');
        
        if (tabName === 'stats') {
            this.updateStatsLeaderboard();
        } else if (tabName === 'competitive') {
            this.updateCompetitiveLeaderboard();
        }
    }
    
    switchStatsCategory(category) {
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide timeframe selector for XP category
        const timeframeSelector = document.getElementById('timeframeSelector');
        timeframeSelector.style.display = category === 'xp' ? 'none' : 'flex';
        
        this.updateStatsLeaderboard();
    }
    
    switchStatsTimeframe(timeframe) {
        // Update timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.timeframe === timeframe) {
                btn.classList.add('active');
            }
        });
        
        this.updateStatsLeaderboard();
    }
    
    updateStatsLeaderboard() {
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        const activeTimeframe = document.querySelector('.timeframe-btn.active')?.dataset.timeframe || 'allTime';
        
        const leaderboardData = this.leaderboardSystem.getStatsLeaderboard(activeCategory, activeTimeframe);
        
        let html = '';
        leaderboardData.forEach((entry, index) => {
            const rank = index + 1;
            const isPlayer = entry.isPlayer;
            let value, subtitle;
            
            if (activeCategory === 'wins') {
                if (activeTimeframe === 'weekly') {
                    value = entry.weeklyWins || 0;
                    subtitle = `${entry.winRate}% WR`;
                } else if (activeTimeframe === 'monthly') {
                    value = entry.monthlyWins || 0;
                    subtitle = `${entry.winRate}% WR`;
                } else {
                    value = entry.wins;
                    subtitle = `${entry.winRate}% WR`;
                }
            } else {
                value = entry.xp.toLocaleString();
                subtitle = `Level ${entry.level}`;
            }
            
            html += `
                <div class="leaderboard-entry ${isPlayer ? 'player-entry' : ''}">
                    <span class="rank">${rank}</span>
                    <span class="name">${entry.name}</span>
                    <div class="stats">
                        <span class="value">${value}</span>
                        <span class="subtitle">${subtitle}</span>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('statsLeaderboard').innerHTML = html;
    }
    
    updateCompetitiveLeaderboard() {
        const seasonInfo = this.rankedSystem.getSeasonInfo();
        document.getElementById('seasonInfo').textContent = `Season: ${seasonInfo.name}`;
        
        const leaderboardData = this.leaderboardSystem.getCompetitiveLeaderboard();
        
        let html = '';
        leaderboardData.forEach((entry, index) => {
            const rank = index + 1;
            const isPlayer = entry.isPlayer;
            
            html += `
                <div class="leaderboard-entry ${isPlayer ? 'player-entry' : ''}">
                    <span class="rank">${rank}</span>
                    <span class="name">${entry.name}</span>
                    <div class="stats">
                        <span class="rank-name" style="color: ${this.rankedSystem.getRankFromElo(entry.rankedElo).color}">
                            ${entry.rank}
                        </span>
                        <span class="elo">${entry.rankedElo} ELO</span>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('competitiveLeaderboard').innerHTML = html;
    }
    
    startRankedQueue() {
        this.currentGameMode = 'ranked';
        this.hideModal('ranked');
        this.startQueue();
    }
    
    // Handle game completion with stats tracking
    handleGameComplete(gameResult) {
        const isRanked = gameResult.gameMode === 'ranked';
        const placement = gameResult.placement;
        const totalPlayers = gameResult.totalPlayers;
        
        // Record stats and award XP
        const xpResult = this.statsSystem.recordGameResult(placement, totalPlayers, isRanked, gameResult.playerElo);
        
        // Record match history
        const matchData = {
            gameMode: gameResult.gameMode,
            placement: placement,
            totalPlayers: totalPlayers,
            startingChips: gameResult.startingChips || 500,
            finalChips: gameResult.finalChips || 0,
            eloChange: gameResult.eloChange || 0,
            eloBefore: gameResult.playerElo || 1000,
            eloAfter: gameResult.playerElo + (gameResult.eloChange || 0),
            duration: gameResult.duration || 0,
            handsPlayed: gameResult.handsPlayed || 0,
            biggestPot: gameResult.biggestPot || 0,
            allInCount: gameResult.allInCount || 0,
            foldCount: gameResult.foldCount || 0,
            raiseCount: gameResult.raiseCount || 0,
            callCount: gameResult.callCount || 0
        };
        
        this.statsSystem.recordGame(matchData);
        
        // Handle ranked game result
        let rankedResult = null;
        if (isRanked) {
            rankedResult = this.rankedSystem.processRankedGameResult(placement, totalPlayers);
            
            // Update peak rank if improved
            if (rankedResult.newRank !== 'Unranked') {
                this.statsSystem.updatePeakRank(rankedResult.newRank);
            }
        }
        
        // Update UI with results
        this.displayGameResults(gameResult, xpResult, rankedResult);
        
        // Refresh user data and ranked button display
        this.loadUserData();
        this.updateRankedButtonDisplay();
        
        // Reset game mode to casual for next game
        this.currentGameMode = 'casual';
    }
    
    displayGameResults(gameResult, xpResult, rankedResult) {
        // This method would be called by the PokerGame class to show results
        // Including XP gained, level ups, ELO changes, rank changes, etc.
        const resultsContainer = document.getElementById('eloChanges');
        
        let html = '<div class="game-results-summary">';
        
        // XP and level info
        html += `
            <div class="xp-results">
                <h4>Experience Gained</h4>
                <p>+${xpResult.xpEarned} XP</p>
                <p>Total XP: ${xpResult.totalXP.toLocaleString()}</p>
        `;
        
        if (xpResult.leveledUp) {
            html += `<p class="level-up">🎉 Level Up! Now Level ${xpResult.newLevel}</p>`;
        }
        
        html += '</div>';
        
        // Ranked results
        if (rankedResult) {
            const eloChangeText = rankedResult.eloChange >= 0 ? 
                `+${rankedResult.eloChange}` : `${rankedResult.eloChange}`;
            
            html += `
                <div class="ranked-results">
                    <h4>Ranked Results</h4>
                    <p>ELO Change: ${eloChangeText}</p>
                    <p>New ELO: ${rankedResult.newElo}</p>
                    <p>Rank: ${rankedResult.newRank}</p>
            `;
            
            if (rankedResult.isPlacementComplete) {
                html += `<p class="placement-complete">🏆 Placement matches complete!</p>`;
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        resultsContainer.innerHTML = html;
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
            <button onclick="gameApp.forceRegenerateLeaderboards();">Regen Leaderboards</button>
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

    // Regenerate leaderboards with new AI names if needed
    regenerateLeaderboardsIfNeeded() {
        const lastRegeneration = Utils.loadGameData('leaderboardsRegeneratedAt', 0);
        const currentTime = Date.now();
        const timeSinceLastRegeneration = currentTime - lastRegeneration;

        // Regenerate leaderboards every 24 hours
        if (timeSinceLastRegeneration > 24 * 60 * 60 * 1000) {
            console.log('Regenerating leaderboards with new AI names...');
            this.leaderboardSystem.regenerateLeaderboards();
            Utils.saveGameData('leaderboardsRegeneratedAt', currentTime);
            console.log('Leaderboards regenerated.');
        }
    }

    // Manual leaderboard regeneration (for testing/debugging)
    forceRegenerateLeaderboards() {
        console.log('Force regenerating leaderboards...');
        this.leaderboardSystem.regenerateLeaderboards();
        Utils.saveGameData('leaderboardsRegeneratedAt', Date.now());
        console.log('Leaderboards force regenerated.');
        
        // Refresh any open modals
        if (this.currentScreen === 'leaderboard') {
            this.populateLeaderboardModal();
        }
    }

    setupMatchHistoryTabs() {
        const tabButtons = document.querySelectorAll('.history-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked tab
                e.target.classList.add('active');
                
                // Get the tab type and populate history
                const tabType = e.target.dataset.historyTab;
                this.populateMatchHistory(tabType);
            });
        });
    }

    populateMatchHistory(gameMode = 'all') {
        const matchHistoryList = document.getElementById('matchHistoryList');
        const matches = this.statsSystem.getMatchHistory(5, gameMode);
        
        if (matches.length === 0) {
            matchHistoryList.innerHTML = `
                <div class="match-history-item" style="text-align: center; color: var(--text-muted);">
                    <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No ${gameMode === 'all' ? '' : gameMode} games played yet.</p>
                    <p>Start playing to see your match history!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        matches.forEach(match => {
            const placementText = this.getPlacementText(match.placement);
            const gameModeIcon = match.gameMode === 'ranked' ? 'fas fa-crown' : 'fas fa-gamepad';
            const gameModeClass = match.gameMode === 'ranked' ? 'ranked' : 'casual';
            const timestamp = this.formatTimestamp(match.timestamp);
            
            html += `
                <div class="match-history-item">
                    <div class="match-header">
                        <div class="match-mode ${gameModeClass}">
                            <i class="${gameModeIcon}"></i>
                            ${match.gameMode.charAt(0).toUpperCase() + match.gameMode.slice(1)}
                        </div>
                        <div class="match-placement">${placementText}</div>
                    </div>
                    
                    <div class="match-details">
                        <div class="match-detail">
                            <span class="detail-label">Players</span>
                            <span class="detail-value">${match.totalPlayers}</span>
                        </div>
                        <div class="match-detail">
                            <span class="detail-label">Final Chips</span>
                            <span class="detail-value">$${Utils.formatMoney(match.finalChips)}</span>
                        </div>
                        <div class="match-detail">
                            <span class="detail-label">ELO Change</span>
                            <span class="detail-value ${match.eloChange >= 0 ? 'positive' : 'negative'}">
                                ${match.eloChange >= 0 ? '+' : ''}${match.eloChange}
                            </span>
                        </div>
                        <div class="match-detail">
                            <span class="detail-label">Duration</span>
                            <span class="detail-value">${this.formatDuration(match.duration)}</span>
                        </div>
                        ${match.handsPlayed > 0 ? `
                        <div class="match-detail">
                            <span class="detail-label">Hands Played</span>
                            <span class="detail-value">${match.handsPlayed}</span>
                        </div>
                        ` : ''}
                        ${match.biggestPot > 0 ? `
                        <div class="match-detail">
                            <span class="detail-label">Biggest Pot</span>
                            <span class="detail-value">$${Utils.formatMoney(match.biggestPot)}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="match-timestamp">${timestamp}</div>
                </div>
            `;
        });
        
        matchHistoryList.innerHTML = html;
    }

    getPlacementText(placement) {
        const placementMap = {
            1: '🥇 1st',
            2: '🥈 2nd', 
            3: '🥉 3rd',
            4: '4th',
            5: '5th'
        };
        return placementMap[placement] || `${placement}th`;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }

    formatDuration(seconds) {
        if (!seconds || seconds < 60) return '< 1 min';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes < 60) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    checkForGameRefresh() {
        const gameInProgress = Utils.loadGameData('gameInProgress', false);
        const gameStartTime = Utils.loadGameData('gameStartTime', 0);
        const gameEndTime = Utils.loadGameData('gameEndTime', 0);
        const currentTime = Date.now();
        
        // Check if there was an active game that wasn't properly ended
        if (gameInProgress && gameStartTime > 0) {
            const timeSinceGameStart = currentTime - gameStartTime;
            const timeSinceGameEnd = gameEndTime > 0 ? currentTime - gameEndTime : 0;
            
            // If game started more than 30 seconds ago and no end time recorded, likely a refresh
            if (timeSinceGameStart > 30000 && (gameEndTime === 0 || timeSinceGameEnd < 10000)) {
                console.warn('Player refreshed during an active game. Applying ELO penalty.');
                
                // Calculate penalty based on game duration (longer game = bigger penalty)
                const penaltyAmount = Math.min(150, Math.max(50, Math.floor(timeSinceGameStart / 60000) * 25));
                
                // Apply penalty
                const penaltyResult = this.eloSystem.applyPenalty(penaltyAmount);
                
                // Show penalty message
                this.showPenaltyMessage(penaltyResult);
                
                // Reset game state
                this.gameInProgress = false;
                this.gameStartTime = null;
                Utils.saveGameData('gameInProgress', false);
                Utils.saveGameData('gameStartTime', 0);
                
                // Update UI
                this.loadUserData();
            }
        }
        
        // Also check for very recent game ends (within last 10 seconds) to catch immediate refreshes
        if (gameEndTime > 0 && (currentTime - gameEndTime) < 10000) {
            console.warn('Player refreshed immediately after game end. Applying minor penalty.');
            const penaltyResult = this.eloSystem.applyPenalty(25);
            this.showPenaltyMessage(penaltyResult);
            this.loadUserData();
        }
    }
    
    showPenaltyMessage(penaltyResult) {
        // Create penalty notification
        const penaltyDiv = document.createElement('div');
        penaltyDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--accent-red);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            z-index: 10000;
            text-align: center;
            font-weight: bold;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        
        penaltyDiv.innerHTML = `
            <h3>⚠️ Game Violation Detected</h3>
            <p>You refreshed during an active game.</p>
            <p><strong>ELO Penalty: -${penaltyResult.penaltyAmount}</strong></p>
            <p>Old Rating: ${penaltyResult.oldRating}</p>
            <p>New Rating: ${penaltyResult.newRating}</p>
            <p style="font-size: 0.9rem; margin-top: 1rem;">
                Please complete games properly to avoid penalties.
            </p>
            <button onclick="this.parentNode.remove()" style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: white;
                color: var(--accent-red);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            ">Acknowledge</button>
        `;
        
        document.body.appendChild(penaltyDiv);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (penaltyDiv.parentNode) {
                penaltyDiv.remove();
            }
        }, 8000);
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
