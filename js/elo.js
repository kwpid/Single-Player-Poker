// ELO Rating System for Poker Game

class EloSystem {
    static DEFAULT_RATING = 1000;
    static K_FACTOR = 32; // Standard K-factor for chess/gaming
    static CASUAL_K_FACTOR = 24; // Slightly lower for casual games
    
    constructor() {
        this.playerRating = this.loadPlayerRating();
        console.log('EloSystem initialized with rating:', this.playerRating);
    }
    
    loadPlayerRating() {
        const rating = Utils.loadGameData('playerElo', EloSystem.DEFAULT_RATING);
        console.log('Loaded player ELO from storage:', rating);
        
        // If no rating found, try to recover from backup
        if (rating === EloSystem.DEFAULT_RATING) {
            const backupRating = Utils.loadGameData('playerEloBackup', null);
            if (backupRating && backupRating !== EloSystem.DEFAULT_RATING) {
                console.log('Recovering ELO from backup:', backupRating);
                Utils.saveGameData('playerElo', backupRating);
                return backupRating;
            }
        }
        
        return rating;
    }
    
    savePlayerRating() {
        console.log('Saving player ELO to storage:', this.playerRating);
        Utils.saveGameData('playerElo', this.playerRating);
        
        // Also save to a backup key to ensure persistence
        Utils.saveGameData('playerEloBackup', this.playerRating);
        Utils.saveGameData('playerEloTimestamp', Date.now());
        
        // Verify the save was successful
        const verifyRating = Utils.loadGameData('playerElo', null);
        if (verifyRating !== this.playerRating) {
            console.error('ELO save verification failed! Expected:', this.playerRating, 'Got:', verifyRating);
            // Try to save again
            Utils.saveGameData('playerElo', this.playerRating);
        }
    }
    
    getPlayerRating() {
        // Always get the latest from storage to ensure consistency
        const storedRating = Utils.loadGameData('playerElo', this.playerRating);
        if (storedRating !== this.playerRating) {
            console.log('ELO mismatch detected, updating from storage:', storedRating);
            this.playerRating = storedRating;
        }
        return this.playerRating;
    }
    
    // Calculate expected score for a player given their rating and opponents' ratings
    calculateExpectedScore(playerRating, opponentRatings) {
        let totalExpected = 0;
        
        for (let opponentRating of opponentRatings) {
            const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
            totalExpected += expectedScore;
        }
        
        return totalExpected;
    }
    
    // Calculate actual score based on placement
    calculateActualScore(placement, totalPlayers) {
        // Convert placement to a score between 0 and (totalPlayers - 1)
        // 1st place gets highest score, last place gets 0
        const maxScore = totalPlayers - 1;
        const actualScore = maxScore - (placement - 1);
        return actualScore;
    }
    
    // Calculate ELO change for a tournament-style game
    calculateEloChange(placement, opponentRatings, isCasual = true) {
        const totalPlayers = opponentRatings.length + 1; // +1 for player
        const kFactor = isCasual ? EloSystem.CASUAL_K_FACTOR : EloSystem.K_FACTOR;
        
        // Generate realistic AI ratings based on player rating
        const adjustedOpponentRatings = this.generateAIRatings(opponentRatings.length);
        
        const expectedScore = this.calculateExpectedScore(this.playerRating, adjustedOpponentRatings);
        const actualScore = this.calculateActualScore(placement, totalPlayers);
        
        // Normalize scores to 0-1 range for traditional ELO calculation
        const normalizedExpected = expectedScore / (totalPlayers - 1);
        const normalizedActual = actualScore / (totalPlayers - 1);
        
        const eloChange = Math.round(kFactor * (normalizedActual - normalizedExpected));
        
        return {
            change: eloChange,
            newRating: this.playerRating + eloChange,
            placement: placement,
            totalPlayers: totalPlayers
        };
    }
    
    // Generate realistic AI ratings based on player skill level
    generateAIRatings(numOpponents) {
        const baseRating = this.playerRating;
        const ratings = [];
        
        for (let i = 0; i < numOpponents; i++) {
            // Generate ratings within ±200 points of player rating for balanced games
            const variation = (Math.random() - 0.5) * 400; // -200 to +200
            const aiRating = Math.max(500, Math.min(2000, baseRating + variation));
            ratings.push(Math.round(aiRating));
        }
        
        return ratings;
    }
    
    // Apply ELO change and save
    applyEloChange(placement, numOpponents, isCasual = true) {
        const opponentRatings = Array(numOpponents).fill(0); // Placeholder for AI ratings
        const result = this.calculateEloChange(placement, opponentRatings, isCasual);
        
        this.playerRating = result.newRating;
        this.savePlayerRating();
        
        return result;
    }
    
    // Get ELO change preview without applying
    previewEloChange(placement, numOpponents, isCasual = true) {
        const opponentRatings = Array(numOpponents).fill(0);
        return this.calculateEloChange(placement, opponentRatings, isCasual);
    }
    
    // Get rank name based on ELO rating
    getRankName(rating = null) {
        const currentRating = rating || this.playerRating;
        
        if (currentRating >= 1800) return { name: 'Master', color: '#ff6b6b', tier: 'S' };
        if (currentRating >= 1600) return { name: 'Expert', color: '#4ecdc4', tier: 'A' };
        if (currentRating >= 1400) return { name: 'Advanced', color: '#45b7d1', tier: 'B' };
        if (currentRating >= 1200) return { name: 'Intermediate', color: '#96ceb4', tier: 'C' };
        if (currentRating >= 1000) return { name: 'Novice', color: '#ffeaa7', tier: 'D' };
        if (currentRating >= 800) return { name: 'Beginner', color: '#dda0dd', tier: 'E' };
        return { name: 'Learning', color: '#fab1a0', tier: 'F' };
    }
    
    // Get stats for display
    getStats() {
        const gamesPlayed = Utils.loadGameData('gamesPlayed', 0);
        const wins = Utils.loadGameData('wins', 0);
        const winRate = gamesPlayed > 0 ? (wins / gamesPlayed * 100).toFixed(1) : 0;
        
        return {
            rating: this.playerRating,
            rank: this.getRankName(),
            gamesPlayed: gamesPlayed,
            wins: wins,
            winRate: winRate
        };
    }
    
    // Update game statistics
    updateStats(placement) {
        const gamesPlayed = Utils.loadGameData('gamesPlayed', 0) + 1;
        const wins = placement === 1 ? Utils.loadGameData('wins', 0) + 1 : Utils.loadGameData('wins', 0);
        
        Utils.saveGameData('gamesPlayed', gamesPlayed);
        Utils.saveGameData('wins', wins);
        
        // Track placement history
        const placementHistory = Utils.loadGameData('placementHistory', []);
        placementHistory.push({
            placement: placement,
            rating: this.playerRating,
            timestamp: Date.now()
        });
        
        // Keep only last 50 games
        if (placementHistory.length > 50) {
            placementHistory.shift();
        }
        
        Utils.saveGameData('placementHistory', placementHistory);
    }
    
    // Reset ELO and stats (for testing/debugging)
    reset() {
        this.playerRating = EloSystem.DEFAULT_RATING;
        Utils.saveGameData('playerElo', this.playerRating);
        Utils.saveGameData('gamesPlayed', 0);
        Utils.saveGameData('wins', 0);
        Utils.saveGameData('placementHistory', []);
    }
    
    // Apply penalty for refreshing during game or other violations
    applyPenalty(penaltyAmount) {
        console.log(`Applying ELO penalty: ${penaltyAmount} points`);
        
        const oldRating = this.playerRating;
        this.playerRating = Math.max(500, this.playerRating - penaltyAmount); // Minimum 500 ELO
        
        // Save the new rating
        this.savePlayerRating();
        
        // Record the penalty
        const penalties = Utils.loadGameData('eloPenalties', []);
        penalties.push({
            amount: penaltyAmount,
            reason: 'Game refresh violation',
            timestamp: Date.now(),
            oldRating: oldRating,
            newRating: this.playerRating
        });
        
        // Keep only last 20 penalties
        if (penalties.length > 20) {
            penalties.splice(0, penalties.length - 20);
        }
        
        Utils.saveGameData('eloPenalties', penalties);
        
        return {
            penaltyAmount: penaltyAmount,
            oldRating: oldRating,
            newRating: this.playerRating,
            reason: 'Game refresh violation'
        };
    }
    
    // Handle legitimate game exit (with grace period)
    handleLegitimateExit() {
        // Mark that player is exiting legitimately
        Utils.saveGameData('legitimateExitTime', Date.now());
        Utils.saveGameData('legitimateExit', true);
        
        // Clear any penalty flags
        Utils.saveGameData('gameLeftDuringPlay', false);
        Utils.saveGameData('gameLeftTime', 0);
    }
    
    // Check if exit was legitimate (within grace period)
    isLegitimateExit() {
        const legitimateExit = Utils.loadGameData('legitimateExit', false);
        const legitimateExitTime = Utils.loadGameData('legitimateExitTime', 0);
        const currentTime = Date.now();
        
        // If they marked a legitimate exit and returned within 2 minutes, it's probably okay
        if (legitimateExit && (currentTime - legitimateExitTime) < 120000) {
            // Clear the flag
            Utils.saveGameData('legitimateExit', false);
            Utils.saveGameData('legitimateExitTime', 0);
            return true;
        }
        
        return false;
    }
    
    // Get placement-based ELO rewards (for display purposes)
    static getPlacementRewards(totalPlayers) {
        const rewards = [];
        
        for (let i = 1; i <= totalPlayers; i++) {
            let baseReward;
            if (i === 1) baseReward = 35;
            else if (i === 2) baseReward = 15;
            else if (i === 3) baseReward = 10;
            else if (i <= totalPlayers / 2) baseReward = 5;
            else baseReward = 0;
            
            rewards.push({
                placement: i,
                minReward: Math.max(0, baseReward - 10),
                maxReward: baseReward + 5,
                description: i === 1 ? 'Winner' : 
                           i === 2 ? 'Runner-up' : 
                           i === 3 ? 'Third Place' : 
                           i <= totalPlayers / 2 ? 'Top Half' : 'Bottom Half'
            });
        }
        
        return rewards;
    }
}

// Export for global use
window.EloSystem = EloSystem;
