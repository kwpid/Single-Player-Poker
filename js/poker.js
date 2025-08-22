// Main Poker Game Logic

class PokerGame {
    constructor() {
        this.players = [];
        this.deck = null;
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.currentPlayerIndex = 0;
        this.dealerIndex = 0;
        this.smallBlind = 25;
        this.bigBlind = 50;
        this.gamePhase = 'waiting'; // waiting, preflop, flop, turn, river, showdown
        this.bettingRound = 0;
        this.gameActive = false;
        this.handHistory = [];
        
        this.initializeElements();
    }
    
    initializeElements() {
        // Game elements
        this.gameScreen = document.getElementById('gameScreen');
        this.playersArea = document.querySelector('.players-area');
        this.communityCardsArea = document.querySelector('.card-container');
        this.potDisplay = document.getElementById('potAmount');
        this.playerChipsDisplay = document.getElementById('playerChips');
        this.gameMessages = document.getElementById('gameMessages');
        
        // Player controls
        this.bettingControls = document.getElementById('bettingControls');
        this.betSlider = document.getElementById('betSlider');
        this.betAmount = document.getElementById('betAmount');
        this.foldBtn = document.getElementById('foldBtn');
        this.callBtn = document.getElementById('callBtn');
        this.raiseBtn = document.getElementById('raiseBtn');
        this.callText = document.getElementById('callText');
        
        // Player cards
        this.playerCard1 = document.getElementById('playerCard1');
        this.playerCard2 = document.getElementById('playerCard2');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.betSlider.addEventListener('input', () => {
            const amount = parseInt(this.betSlider.value);
            this.betAmount.textContent = Utils.formatMoney(amount);
        });
        
        this.foldBtn.addEventListener('click', () => this.playerAction('fold'));
        this.callBtn.addEventListener('click', () => this.playerAction('call'));
        this.raiseBtn.addEventListener('click', () => this.playerAction('raise'));
        
        document.getElementById('gameMenuBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit this game?')) {
                this.endGame();
            }
        });
    }
    
    // Initialize game with AI players
    startGame(numPlayers = 4) {
        this.gameActive = true;
        this.players = [];
        
        // Create human player
        const humanPlayer = {
            name: Utils.loadGameData('username', 'Player'),
            chips: 5000,
            hand: [],
            isHuman: true,
            folded: false,
            allIn: false,
            currentBet: 0,
            totalBetThisHand: 0
        };
        this.players.push(humanPlayer);
        
        // Create AI players
        const aiNames = AINameGenerator.generateUniqueNames(numPlayers - 1);
        const difficulties = ['easy', 'medium', 'hard'];
        
        for (let i = 0; i < numPlayers - 1; i++) {
            const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
            const aiPlayer = new AIPlayer(aiNames[i], difficulty);
            aiPlayer.position = i + 1;
            this.players.push(aiPlayer);
        }
        
        this.dealerIndex = Math.floor(Math.random() * this.players.length);
        this.setupGameUI();
        this.startNewHand();
    }
    
    setupGameUI() {
        // Clear players area
        this.playersArea.innerHTML = '';
        
        // Position AI players around the table
        const positions = ['top-left', 'top-center', 'top-right', 'right', 'left'];
        let positionIndex = 0;
        
        for (let i = 1; i < this.players.length; i++) {
            const player = this.players[i];
            const position = positions[positionIndex % positions.length];
            positionIndex++;
            
            const playerElement = this.createPlayerElement(player, position);
            this.playersArea.appendChild(playerElement);
        }
        
        this.updateUI();
    }
    
    createPlayerElement(player, position) {
        const playerDiv = Utils.createElement('div', `opponent-player ${position}`);
        playerDiv.id = `player-${player.name}`;
        
        const infoDiv = Utils.createElement('div', 'opponent-info');
        const nameDiv = Utils.createElement('div', 'opponent-name', player.name);
        const chipsDiv = Utils.createElement('div', 'opponent-chips', 
            `<i class="fas fa-coins"></i>$<span class="chip-amount">${Utils.formatMoney(player.chips)}</span>`);
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(chipsDiv);
        playerDiv.appendChild(infoDiv);
        
        // Add card placeholders
        const cardsDiv = Utils.createElement('div', 'opponent-cards');
        const card1 = Utils.createElement('div', 'card hidden');
        const card2 = Utils.createElement('div', 'card hidden');
        cardsDiv.appendChild(card1);
        cardsDiv.appendChild(card2);
        playerDiv.appendChild(cardsDiv);
        
        return playerDiv;
    }
    
    startNewHand() {
        if (this.players.filter(p => p.chips > 0).length < 2) {
            this.endGame();
            return;
        }
        
        this.showMessage('New hand starting...', 2000);
        
        // Reset hand state
        this.deck = new Utils.Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.gamePhase = 'preflop';
        this.bettingRound = 0;
        
        // Reset players
        for (let player of this.players) {
            if (player.isHuman) {
                player.hand = [];
                player.folded = false;
                player.allIn = false;
                player.currentBet = 0;
                player.totalBetThisHand = 0;
            } else {
                player.newHand();
            }
        }
        
        // Move dealer button
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        
        // Post blinds
        this.postBlinds();
        
        // Deal cards
        setTimeout(() => this.dealHoleCards(), 1000);
    }
    
    postBlinds() {
        const activePlayerIndices = this.getActivePlayerIndices();
        if (activePlayerIndices.length < 2) return;
        
        let smallBlindIndex, bigBlindIndex;
        
        if (activePlayerIndices.length === 2) {
            // Heads-up: dealer posts small blind
            smallBlindIndex = this.dealerIndex;
            bigBlindIndex = (this.dealerIndex + 1) % this.players.length;
        } else {
            // Multi-way: standard blind structure
            smallBlindIndex = (this.dealerIndex + 1) % this.players.length;
            bigBlindIndex = (this.dealerIndex + 2) % this.players.length;
        }
        
        // Post small blind
        const sbAmount = Math.min(this.smallBlind, this.players[smallBlindIndex].chips);
        this.players[smallBlindIndex].chips -= sbAmount;
        this.players[smallBlindIndex].currentBet = sbAmount;
        this.players[smallBlindIndex].totalBetThisHand = sbAmount;
        this.pot += sbAmount;
        
        // Post big blind
        const bbAmount = Math.min(this.bigBlind, this.players[bigBlindIndex].chips);
        this.players[bigBlindIndex].chips -= bbAmount;
        this.players[bigBlindIndex].currentBet = bbAmount;
        this.players[bigBlindIndex].totalBetThisHand = bbAmount;
        this.pot += bbAmount;
        this.currentBet = bbAmount;
        
        // Set first to act (UTG or after big blind)
        this.currentPlayerIndex = (bigBlindIndex + 1) % this.players.length;
        
        this.showMessage(`Blinds posted: $${sbAmount}/$${bbAmount}`, 1500);
        this.updateUI();
    }
    
    dealHoleCards() {
        Utils.playSound('card');
        
        // Deal two cards to each active player
        for (let round = 0; round < 2; round++) {
            for (let i = 0; i < this.players.length; i++) {
                const playerIndex = (this.dealerIndex + 1 + i) % this.players.length;
                if (this.players[playerIndex].chips > 0) {
                    const card = this.deck.deal();
                    this.players[playerIndex].hand.push(card);
                }
            }
        }
        
        this.displayPlayerCards();
        setTimeout(() => this.startBettingRound(), 1000);
    }
    
    displayPlayerCards() {
        const humanPlayer = this.players[0];
        if (humanPlayer.hand.length >= 2) {
            this.displayCard(this.playerCard1, humanPlayer.hand[0]);
            this.displayCard(this.playerCard2, humanPlayer.hand[1]);
        }
        
        // Update AI player card backs
        for (let i = 1; i < this.players.length; i++) {
            const playerElement = document.getElementById(`player-${this.players[i].name}`);
            if (playerElement && this.players[i].chips > 0) {
                const cards = playerElement.querySelectorAll('.opponent-cards .card');
                cards.forEach(card => card.classList.add('hidden'));
            }
        }
    }
    
    displayCard(element, card) {
        element.innerHTML = `
            <div class="card-rank">${card.rank}</div>
            <div class="suit">${card.suit}</div>
        `;
        element.className = `card ${card.isRed() ? 'red' : 'black'}`;
        element.classList.add('revealed');
    }
    
    startBettingRound() {
        this.findNextActivePlayer();
        if (this.isBettingRoundComplete()) {
            this.nextGamePhase();
        } else {
            this.processPlayerTurn();
        }
    }
    
    findNextActivePlayer() {
        let attempts = 0;
        while (attempts < this.players.length) {
            if (!this.players[this.currentPlayerIndex].folded && 
                this.players[this.currentPlayerIndex].chips > 0) {
                break;
            }
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        }
    }
    
    isBettingRoundComplete() {
        const activePlayers = this.players.filter(p => !p.folded && p.chips >= 0);
        
        if (activePlayers.length <= 1) return true;
        
        // Check if all active players have acted and matched the current bet
        for (let player of activePlayers) {
            if (player.chips > 0 && player.currentBet < this.currentBet) {
                return false;
            }
        }
        
        return true;
    }
    
    processPlayerTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Update UI to show current player
        this.updatePlayerHighlight();
        
        if (currentPlayer.isHuman) {
            this.showPlayerControls();
        } else {
            this.processAITurn();
        }
    }
    
    async processAITurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        const gameState = {
            currentBet: this.currentBet,
            potSize: this.pot,
            communityCards: this.communityCards,
            numPlayersInHand: this.players.filter(p => !p.folded).length,
            bettingRound: this.gamePhase
        };
        
        try {
            const decision = await currentPlayer.makeDecisionWithDelay(gameState);
            this.executePlayerAction(decision.action, decision.amount || 0);
        } catch (error) {
            console.error('AI decision error:', error);
            this.executePlayerAction('fold', 0);
        }
    }
    
    showPlayerControls() {
        const callAmount = this.currentBet - this.players[0].currentBet;
        
        // Update call button text
        if (callAmount === 0) {
            this.callText.textContent = 'Check';
        } else {
            this.callText.textContent = `Call $${Utils.formatMoney(callAmount)}`;
        }
        
        // Update bet slider
        this.betSlider.min = Math.max(this.currentBet + this.bigBlind, callAmount);
        this.betSlider.max = this.players[0].chips;
        this.betSlider.value = Math.min(this.pot, this.players[0].chips);
        this.betAmount.textContent = Utils.formatMoney(this.betSlider.value);
        
        // Enable/disable buttons
        this.foldBtn.disabled = false;
        this.callBtn.disabled = callAmount > this.players[0].chips;
        this.raiseBtn.disabled = this.players[0].chips <= callAmount;
        
        this.bettingControls.classList.add('active');
    }
    
    playerAction(action) {
        const callAmount = this.currentBet - this.players[0].currentBet;
        let amount = 0;
        
        switch (action) {
            case 'fold':
                break;
            case 'call':
                amount = Math.min(callAmount, this.players[0].chips);
                break;
            case 'raise':
                amount = Math.min(parseInt(this.betSlider.value), this.players[0].chips);
                break;
        }
        
        this.executePlayerAction(action, amount);
        this.bettingControls.classList.remove('active');
    }
    
    executePlayerAction(action, amount) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        let actionText = '';
        
        switch (action) {
            case 'fold':
                currentPlayer.folded = true;
                actionText = 'Folds';
                break;
                
            case 'call':
            case 'check':
                if (amount === 0) {
                    actionText = 'Checks';
                } else {
                    currentPlayer.chips -= amount;
                    currentPlayer.currentBet += amount;
                    currentPlayer.totalBetThisHand += amount;
                    this.pot += amount;
                    actionText = amount === currentPlayer.chips + amount ? 
                        'All-in' : `Calls $${Utils.formatMoney(amount)}`;
                }
                break;
                
            case 'raise':
                currentPlayer.chips -= amount;
                const raiseAmount = amount - (this.currentBet - currentPlayer.currentBet);
                currentPlayer.currentBet = amount;
                currentPlayer.totalBetThisHand += amount;
                this.pot += amount;
                this.currentBet = Math.max(this.currentBet, currentPlayer.currentBet);
                
                actionText = currentPlayer.chips === 0 ? 
                    'All-in' : `Raises to $${Utils.formatMoney(currentPlayer.currentBet)}`;
                break;
        }
        
        // Show action
        this.showPlayerAction(currentPlayer, actionText);
        Utils.playSound(action === 'fold' ? 'click' : 'chip');
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        setTimeout(() => {
            if (this.isBettingRoundComplete()) {
                this.nextGamePhase();
            } else {
                this.findNextActivePlayer();
                this.processPlayerTurn();
            }
        }, 1500);
        
        this.updateUI();
    }
    
    showPlayerAction(player, action) {
        if (player.isHuman) {
            this.showMessage(action, 1500);
        } else {
            const playerElement = document.getElementById(`player-${player.name}`);
            if (playerElement) {
                const existingAction = playerElement.querySelector('.opponent-action');
                if (existingAction) existingAction.remove();
                
                const actionElement = Utils.createElement('div', 'opponent-action', action);
                playerElement.appendChild(actionElement);
                
                setTimeout(() => {
                    if (actionElement.parentNode) {
                        actionElement.parentNode.removeChild(actionElement);
                    }
                }, 3000);
            }
        }
    }
    
    nextGamePhase() {
        // Reset betting for next round
        for (let player of this.players) {
            player.currentBet = 0;
        }
        this.currentBet = 0;
        
        const activePlayers = this.players.filter(p => !p.folded);
        if (activePlayers.length <= 1) {
            this.endHand();
            return;
        }
        
        switch (this.gamePhase) {
            case 'preflop':
                this.dealFlop();
                break;
            case 'flop':
                this.dealTurn();
                break;
            case 'turn':
                this.dealRiver();
                break;
            case 'river':
                this.showdown();
                break;
        }
    }
    
    dealFlop() {
        this.gamePhase = 'flop';
        this.deck.deal(); // Burn card
        
        for (let i = 0; i < 3; i++) {
            this.communityCards.push(this.deck.deal());
        }
        
        this.displayCommunityCards();
        this.showMessage('Flop dealt', 1500);
        
        // First to act is first active player after dealer
        this.currentPlayerIndex = this.getFirstToAct();
        
        setTimeout(() => this.startBettingRound(), 1500);
    }
    
    dealTurn() {
        this.gamePhase = 'turn';
        this.deck.deal(); // Burn card
        this.communityCards.push(this.deck.deal());
        
        this.displayCommunityCards();
        this.showMessage('Turn dealt', 1500);
        
        this.currentPlayerIndex = this.getFirstToAct();
        setTimeout(() => this.startBettingRound(), 1500);
    }
    
    dealRiver() {
        this.gamePhase = 'river';
        this.deck.deal(); // Burn card
        this.communityCards.push(this.deck.deal());
        
        this.displayCommunityCards();
        this.showMessage('River dealt', 1500);
        
        this.currentPlayerIndex = this.getFirstToAct();
        setTimeout(() => this.startBettingRound(), 1500);
    }
    
    getFirstToAct() {
        for (let i = 1; i < this.players.length; i++) {
            const playerIndex = (this.dealerIndex + i) % this.players.length;
            if (!this.players[playerIndex].folded && this.players[playerIndex].chips > 0) {
                return playerIndex;
            }
        }
        return 0;
    }
    
    displayCommunityCards() {
        const cardElements = this.communityCardsArea.children;
        
        for (let i = 0; i < this.communityCards.length; i++) {
            if (cardElements[i]) {
                this.displayCard(cardElements[i], this.communityCards[i]);
                Utils.playSound('card');
            }
        }
    }
    
    showdown() {
        this.gamePhase = 'showdown';
        const activePlayers = this.players.filter(p => !p.folded);
        
        if (activePlayers.length === 1) {
            this.endHand();
            return;
        }
        
        // Evaluate hands and determine winner
        const playerHands = [];
        
        for (let player of activePlayers) {
            const allCards = [...player.hand, ...this.communityCards];
            const bestHand = Utils.HandEvaluator.evaluateHand(allCards);
            
            playerHands.push({
                player: player,
                hand: bestHand,
                handName: Utils.HandEvaluator.getHandName(bestHand.type)
            });
        }
        
        // Sort by hand strength
        playerHands.sort((a, b) => Utils.HandEvaluator.compareHands(b.hand, a.hand));
        
        // Show all hands
        this.revealAllHands(activePlayers);
        
        setTimeout(() => {
            const winner = playerHands[0];
            this.showMessage(`${winner.player.name} wins with ${winner.handName}!`, 3000);
            Utils.playSound('win');
            
            winner.player.chips += this.pot;
            this.pot = 0;
            
            setTimeout(() => this.endHand(), 3000);
        }, 2000);
    }
    
    revealAllHands(activePlayers) {
        for (let player of activePlayers) {
            if (!player.isHuman) {
                const playerElement = document.getElementById(`player-${player.name}`);
                const cards = playerElement.querySelectorAll('.opponent-cards .card');
                
                if (player.hand.length >= 2) {
                    this.displayCard(cards[0], player.hand[0]);
                    this.displayCard(cards[1], player.hand[1]);
                }
            }
        }
    }
    
    endHand() {
        setTimeout(() => {
            // Check if game should continue
            const playersWithChips = this.players.filter(p => p.chips > 0);
            
            if (playersWithChips.length <= 1) {
                this.endGame();
            } else {
                this.startNewHand();
            }
        }, 2000);
    }
    
    endGame() {
        this.gameActive = false;
        
        // Calculate final standings
        const standings = [...this.players].sort((a, b) => b.chips - a.chips);
        const humanPlayer = standings.find(p => p.isHuman);
        const humanPlacement = standings.indexOf(humanPlayer) + 1;
        
        // Update ELO
        const eloSystem = new EloSystem();
        const eloResult = eloSystem.applyEloChange(humanPlacement, this.players.length - 1, true);
        eloSystem.updateStats(humanPlacement);
        
        this.showResults(standings, eloResult);
    }
    
    showResults(standings, eloResult) {
        const resultsScreen = document.getElementById('resultsScreen');
        const finalStandings = document.getElementById('finalStandings');
        const eloChanges = document.getElementById('eloChanges');
        
        // Clear previous results
        finalStandings.innerHTML = '';
        eloChanges.innerHTML = '';
        
        // Show final standings
        standings.forEach((player, index) => {
            const standing = Utils.createElement('div', 
                `standing-item ${player.isHuman ? 'player' : ''}`);
            
            const position = Utils.createElement('div', 
                `standing-position ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`);
            position.innerHTML = `${index + 1}${this.getOrdinalSuffix(index + 1)}`;
            
            const name = Utils.createElement('div', 'standing-name', player.name);
            const chips = Utils.createElement('div', 'standing-chips', `$${Utils.formatMoney(player.chips)}`);
            
            standing.appendChild(position);
            standing.appendChild(name);
            standing.appendChild(chips);
            finalStandings.appendChild(standing);
        });
        
        // Show ELO changes
        const eloChange = Utils.createElement('div', 
            `elo-change ${eloResult.change >= 0 ? 'positive' : 'negative'}`);
        eloChange.innerHTML = `ELO Change: ${eloResult.change >= 0 ? '+' : ''}${eloResult.change}`;
        
        const newElo = Utils.createElement('div', 'elo-new', 
            `New ELO: ${eloResult.newRating}`);
        
        eloChanges.appendChild(eloChange);
        eloChanges.appendChild(newElo);
        
        // Show results screen
        document.getElementById('gameScreen').classList.remove('active');
        resultsScreen.classList.add('active');
    }
    
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }
    
    // UI Helper methods
    updateUI() {
        this.potDisplay.textContent = Utils.formatMoney(this.pot);
        this.playerChipsDisplay.textContent = Utils.formatMoney(this.players[0].chips);
        
        // Update AI player chip counts
        for (let i = 1; i < this.players.length; i++) {
            const player = this.players[i];
            const playerElement = document.getElementById(`player-${player.name}`);
            if (playerElement) {
                const chipAmount = playerElement.querySelector('.chip-amount');
                if (chipAmount) {
                    chipAmount.textContent = Utils.formatMoney(player.chips);
                }
                
                const infoDiv = playerElement.querySelector('.opponent-info');
                if (player.folded) {
                    infoDiv.classList.add('folded');
                } else {
                    infoDiv.classList.remove('folded');
                }
            }
        }
    }
    
    updatePlayerHighlight() {
        // Remove all highlights
        document.querySelectorAll('.opponent-info').forEach(info => {
            info.classList.remove('active');
        });
        
        // Highlight current player
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer.isHuman) {
            const playerElement = document.getElementById(`player-${currentPlayer.name}`);
            if (playerElement) {
                const infoDiv = playerElement.querySelector('.opponent-info');
                infoDiv.classList.add('active');
            }
        }
    }
    
    showMessage(message, duration = 2000) {
        const messageDiv = this.gameMessages.querySelector('.message');
        messageDiv.textContent = message;
        this.gameMessages.classList.add('active');
        
        setTimeout(() => {
            this.gameMessages.classList.remove('active');
        }, duration);
    }
    
    getActivePlayerIndices() {
        return this.players
            .map((player, index) => ({ player, index }))
            .filter(item => item.player.chips > 0)
            .map(item => item.index);
    }
}

// Export for global use
window.PokerGame = PokerGame;
