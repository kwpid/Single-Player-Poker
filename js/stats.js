// Stats and XP System for Dark Poker

class StatsSystem {
    constructor() {
        this.initializeStats();
    }

    initializeStats() {
        // Initialize default stats if they don't exist
        const defaultStats = {
            // Casual stats
            casualWins: 0,
            casualLosses: 0,
            casualGamesPlayed: 0,
            
            // Ranked stats
            rankedWins: 0,
            rankedLosses: 0,
            rankedGamesPlayed: 0,
            
            // Overall stats
            totalWins: 0,
            totalLosses: 0,
            totalGamesPlayed: 0,
            
            // XP and Leveling (never resets)
            totalXP: 0,
            currentLevel: 1,
            
            // Peak achievements
            peakCasualElo: Utils.loadGameData('playerElo', 1000),
            peakRankedElo: 600, // Starting ranked ELO
            peakRank: 'Bronze I'
        };

        // Load existing stats or use defaults
        for (let [key, defaultValue] of Object.entries(defaultStats)) {
            if (!Utils.loadGameData(key)) {
                Utils.saveGameData(key, defaultValue);
            }
        }
        
        // Initialize match history if it doesn't exist
        if (!Utils.loadGameData('matchHistory')) {
            Utils.saveGameData('matchHistory', []);
        }
    }

    // XP System - 1.25x threshold progression
    calculateXPForLevel(level) {
        const baseXP = 100;
        return Math.floor(baseXP * Math.pow(1.25, level - 1));
    }

    calculateTotalXPForLevel(level) {
        let total = 0;
        for (let i = 1; i < level; i++) {
            total += this.calculateXPForLevel(i);
        }
        return total;
    }

    getCurrentLevel() {
        const totalXP = Utils.loadGameData('totalXP', 0);
        let level = 1;
        
        while (this.calculateTotalXPForLevel(level + 1) <= totalXP) {
            level++;
        }
        
        return level;
    }

    getXPProgress() {
        const totalXP = Utils.loadGameData('totalXP', 0);
        const currentLevel = this.getCurrentLevel();
        const currentLevelXP = this.calculateTotalXPForLevel(currentLevel);
        const nextLevelXP = this.calculateTotalXPForLevel(currentLevel + 1);
        
        return {
            currentLevel: currentLevel,
            currentXP: totalXP - currentLevelXP,
            neededXP: nextLevelXP - currentLevelXP,
            totalXP: totalXP,
            progress: ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        };
    }

    // Award XP based on placement and game mode
    awardXP(placement, totalPlayers, isRanked = false) {
        const baseXP = isRanked ? 50 : 25; // Ranked gives more XP
        let multiplier = 1;

        // XP based on placement
        switch (placement) {
            case 1: multiplier = 2.0; break; // 1st place
            case 2: multiplier = 1.5; break; // 2nd place  
            case 3: multiplier = 1.25; break; // 3rd place
            case 4: multiplier = 1.0; break; // 4th place
            default: multiplier = 0.75; break; // Lower places
        }

        const xpEarned = Math.floor(baseXP * multiplier);
        const currentXP = Utils.loadGameData('totalXP', 0);
        const newXP = currentXP + xpEarned;
        
        Utils.saveGameData('totalXP', newXP);
        
        // Update level
        const oldLevel = Utils.loadGameData('currentLevel', 1);
        const newLevel = this.getCurrentLevel();
        Utils.saveGameData('currentLevel', newLevel);
        
        return {
            xpEarned: xpEarned,
            totalXP: newXP,
            newLevel: newLevel,
            leveledUp: newLevel > oldLevel
        };
    }

    // Record a completed game in match history
    recordGame(gameData) {
        const matchHistory = Utils.loadGameData('matchHistory', []);
        
        const matchRecord = {
            id: Date.now() + Math.random(), // Unique ID
            timestamp: Date.now(),
            gameMode: gameData.gameMode || 'casual',
            placement: gameData.placement,
            totalPlayers: gameData.totalPlayers,
            startingChips: gameData.startingChips || 500,
            finalChips: gameData.finalChips || 0,
            eloChange: gameData.eloChange || 0,
            eloBefore: gameData.eloBefore || 1000,
            eloAfter: gameData.eloAfter || 1000,
            duration: gameData.duration || 0, // Game duration in seconds
            handsPlayed: gameData.handsPlayed || 0,
            biggestPot: gameData.biggestPot || 0,
            allInCount: gameData.allInCount || 0,
            foldCount: gameData.foldCount || 0,
            raiseCount: gameData.raiseCount || 0,
            callCount: gameData.callCount || 0
        };
        
        // Add to beginning of array (most recent first)
        matchHistory.unshift(matchRecord);
        
        // Keep only last 10 games to prevent excessive storage
        if (matchHistory.length > 10) {
            matchHistory.splice(10);
        }
        
        Utils.saveGameData('matchHistory', matchHistory);
        
        return matchRecord;
    }

    // Get match history (last N games, optionally filtered by game mode)
    getMatchHistory(limit = 5, gameMode = null) {
        const matchHistory = Utils.loadGameData('matchHistory', []);
        
        let filteredHistory = matchHistory;
        
        // Filter by game mode if specified
        if (gameMode && gameMode !== 'all') {
            filteredHistory = matchHistory.filter(match => match.gameMode === gameMode);
        }
        
        // Return last N games
        return filteredHistory.slice(0, limit);
    }

    // Get match history summary for stats display
    getMatchHistorySummary() {
        const allMatches = this.getMatchHistory(10, 'all');
        const casualMatches = this.getMatchHistory(10, 'casual');
        const rankedMatches = this.getMatchHistory(10, 'ranked');
        
        return {
            total: allMatches.length,
            casual: casualMatches.length,
            ranked: rankedMatches.length,
            recent: allMatches.slice(0, 5) // Last 5 games
        };
    }

    // Record game result
    recordGameResult(placement, totalPlayers, isRanked = false, playerElo = null) {
        const isWin = placement <= 3; // Top 3 considered wins
        
        // Update win/loss counts
        if (isRanked) {
            const rankedWins = Utils.loadGameData('rankedWins', 0);
            const rankedLosses = Utils.loadGameData('rankedLosses', 0);
            const rankedGamesPlayed = Utils.loadGameData('rankedGamesPlayed', 0);
            
            if (isWin) {
                Utils.saveGameData('rankedWins', rankedWins + 1);
            } else {
                Utils.saveGameData('rankedLosses', rankedLosses + 1);
            }
            Utils.saveGameData('rankedGamesPlayed', rankedGamesPlayed + 1);
            
            // Update peak ranked ELO
            if (playerElo) {
                const peakRankedElo = Utils.loadGameData('peakRankedElo', 600);
                if (playerElo > peakRankedElo) {
                    Utils.saveGameData('peakRankedElo', playerElo);
                }
            }
        } else {
            const casualWins = Utils.loadGameData('casualWins', 0);
            const casualLosses = Utils.loadGameData('casualLosses', 0);
            const casualGamesPlayed = Utils.loadGameData('casualGamesPlayed', 0);
            
            if (isWin) {
                Utils.saveGameData('casualWins', casualWins + 1);
            } else {
                Utils.saveGameData('casualLosses', casualLosses + 1);
            }
            Utils.saveGameData('casualGamesPlayed', casualGamesPlayed + 1);
            
            // Update peak casual ELO
            if (playerElo) {
                const peakCasualElo = Utils.loadGameData('peakCasualElo', 1000);
                if (playerElo > peakCasualElo) {
                    Utils.saveGameData('peakCasualElo', playerElo);
                }
            }
        }

        // Update total stats
        const totalWins = Utils.loadGameData('totalWins', 0);
        const totalLosses = Utils.loadGameData('totalLosses', 0);
        const totalGamesPlayed = Utils.loadGameData('totalGamesPlayed', 0);
        
        if (isWin) {
            Utils.saveGameData('totalWins', totalWins + 1);
        } else {
            Utils.saveGameData('totalLosses', totalLosses + 1);
        }
        Utils.saveGameData('totalGamesPlayed', totalGamesPlayed + 1);

        // Award XP
        return this.awardXP(placement, totalPlayers, isRanked);
    }

    // Get comprehensive stats for display
    getStats() {
        const casualWins = Utils.loadGameData('casualWins', 0);
        const casualLosses = Utils.loadGameData('casualLosses', 0);
        const casualGamesPlayed = Utils.loadGameData('casualGamesPlayed', 0);
        
        const rankedWins = Utils.loadGameData('rankedWins', 0);
        const rankedLosses = Utils.loadGameData('rankedLosses', 0);
        const rankedGamesPlayed = Utils.loadGameData('rankedGamesPlayed', 0);
        
        const totalWins = Utils.loadGameData('totalWins', 0);
        const totalLosses = Utils.loadGameData('totalLosses', 0);
        const totalGamesPlayed = Utils.loadGameData('totalGamesPlayed', 0);
        
        const peakCasualElo = Utils.loadGameData('peakCasualElo', 1000);
        const peakRankedElo = Utils.loadGameData('peakRankedElo', 600);
        const peakRank = Utils.loadGameData('peakRank', 'Bronze I');
        
        const xpProgress = this.getXPProgress();
        
        return {
            casual: {
                wins: casualWins,
                losses: casualLosses,
                gamesPlayed: casualGamesPlayed,
                winRate: casualGamesPlayed > 0 ? ((casualWins / casualGamesPlayed) * 100).toFixed(1) : 0
            },
            ranked: {
                wins: rankedWins,
                losses: rankedLosses,
                gamesPlayed: rankedGamesPlayed,
                winRate: rankedGamesPlayed > 0 ? ((rankedWins / rankedGamesPlayed) * 100).toFixed(1) : 0
            },
            overall: {
                wins: totalWins,
                losses: totalLosses,
                gamesPlayed: totalGamesPlayed,
                winRate: totalGamesPlayed > 0 ? ((totalWins / totalGamesPlayed) * 100).toFixed(1) : 0
            },
            peaks: {
                casualElo: peakCasualElo,
                rankedElo: peakRankedElo,
                rank: peakRank
            },
            progression: xpProgress
        };
    }

    // Update peak rank
    updatePeakRank(rankName) {
        const currentPeak = Utils.loadGameData('peakRank', 'Bronze I');
        const rankValues = {
            'Bronze I': 1, 'Bronze II': 2, 'Bronze III': 3,
            'Silver I': 4, 'Silver II': 5, 'Silver III': 6,
            'Gold I': 7, 'Gold II': 8, 'Gold III': 9,
            'Platinum I': 10, 'Platinum II': 11, 'Platinum III': 12,
            'Diamond I': 13, 'Diamond II': 14, 'Diamond III': 15,
            'Champion I': 16, 'Champion II': 17, 'Champion III': 18,
            'Grand Champion': 19
        };
        
        if (rankValues[rankName] > rankValues[currentPeak]) {
            Utils.saveGameData('peakRank', rankName);
        }
    }
}