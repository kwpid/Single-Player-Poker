// Leaderboard System with AI progression for Dark Poker

class LeaderboardSystem {
    constructor() {
        this.initializeLeaderboards();
        this.startAIProgression();
    }

    initializeLeaderboards() {
        // Initialize main AI pool for stats leaderboards
        if (!Utils.loadGameData('mainAI')) {
            this.generateMainAI();
        }
        
        // Initialize high-ranked AI pool for competitive leaderboards
        if (!Utils.loadGameData('highRankedAI')) {
            this.generateHighRankedAI();
        }
        
        // Initialize leaderboard data tracking
        this.initializeLeaderboardData();
    }

    generateMainAI() {
        const mainAI = [];
        // Use casual names from AINameGenerator for stats leaderboards
        const casualNames = AINameGenerator.casualNames;
        
        for (let i = 0; i < 150; i++) {
            let name = casualNames[i % casualNames.length];
            
            // Add number suffix for uniqueness if we have more AI than names
            if (i >= casualNames.length) {
                const suffix = Math.floor(i / casualNames.length) + 1;
                name = `${name}${suffix}`;
            }
            
            // Ensure all AI have 3k+ wins and lots of XP
            const wins = 3000 + Math.floor(Math.random() * 7000); // 3000-10000 wins
            const xp = 50000 + Math.floor(Math.random() * 200000); // 50k-250k XP
            
            const ai = {
                name: name,
                wins: wins,
                totalGames: 0,
                xp: xp,
                level: 1,
                winRate: 0,
                lastActive: Date.now() - Math.random() * 86400000 * 30, // Last 30 days
                weeklyWins: Math.floor(Math.random() * 50) + 20, // 20-70 weekly wins
                monthlyWins: Math.floor(Math.random() * 200) + 100 // 100-300 monthly wins
            };
            
            // Calculate total games and win rate
            ai.totalGames = Math.floor(ai.wins / (0.3 + Math.random() * 0.4)); // 30-70% win rate
            ai.winRate = ((ai.wins / ai.totalGames) * 100).toFixed(1);
            
            // Calculate level from XP (same formula as player)
            ai.level = this.calculateLevelFromXP(ai.xp);
            
            mainAI.push(ai);
        }
        
        // Sort by wins for initial leaderboard
        mainAI.sort((a, b) => b.wins - a.wins);
        
        Utils.saveGameData('mainAI', mainAI);
    }

    generateHighRankedAI() {
        const highRankedAI = [];
        // Use competitive names from AINameGenerator for competitive leaderboards
        const competitiveNames = AINameGenerator.competitiveNames;
        
        // Only create Grand Champion level AI (2200+ ELO)
        for (let i = 0; i < 25; i++) {
            let name = competitiveNames[i % competitiveNames.length];
            
            // Add number suffix for uniqueness if we have more AI than names
            if (i >= competitiveNames.length) {
                const suffix = Math.floor(i / competitiveNames.length) + 1;
                name = `${name}${suffix}`;
            }
            
            // Ensure all competitive AI are Grand Champions with very high ELO
            const elo = 2200 + Math.floor(Math.random() * 3000); // 2200-5200 ELO (Grand Champion only)
            
            const ai = {
                name: name,
                rankedElo: elo,
                rank: this.getRankFromElo(elo), // This will always be 'Grand Champion'
                wins: Math.floor(Math.random() * 500) + 200, // 200-700 wins
                losses: Math.floor(Math.random() * 200) + 50, // 50-250 losses
                isActive: true,
                lastGameTime: Date.now() - Math.random() * 3600000 * 24, // Last 24 hours
                seasonWins: Math.floor(Math.random() * 100) + 50, // 50-150 season wins
                seasonLosses: Math.floor(Math.random() * 50) + 20 // 20-70 season losses
            };
            
            ai.totalGames = ai.wins + ai.losses;
            ai.winRate = ((ai.wins / ai.totalGames) * 100).toFixed(1);
            
            highRankedAI.push(ai);
        }
        
        // Sort by ELO
        highRankedAI.sort((a, b) => b.rankedElo - a.rankedElo);
        
        Utils.saveGameData('highRankedAI', highRankedAI);
    }

    calculateLevelFromXP(xp) {
        let level = 1;
        let requiredXP = 100; // Base XP for level 1
        let totalRequired = 0;
        
        while (totalRequired + requiredXP <= xp) {
            totalRequired += requiredXP;
            level++;
            requiredXP = Math.floor(100 * Math.pow(1.25, level - 1));
        }
        
        return level;
    }

    getRankFromElo(elo) {
        const rankTiers = {
            'Bronze I': { minElo: 0, maxElo: 199 },
            'Bronze II': { minElo: 200, maxElo: 299 },
            'Bronze III': { minElo: 300, maxElo: 399 },
            'Silver I': { minElo: 400, maxElo: 549 },
            'Silver II': { minElo: 550, maxElo: 699 },
            'Silver III': { minElo: 700, maxElo: 849 },
            'Gold I': { minElo: 850, maxElo: 999 },
            'Gold II': { minElo: 1000, maxElo: 1149 },
            'Gold III': { minElo: 1150, maxElo: 1299 },
            'Platinum I': { minElo: 1300, maxElo: 1399 },
            'Platinum II': { minElo: 1400, maxElo: 1499 },
            'Platinum III': { minElo: 1500, maxElo: 1599 },
            'Diamond I': { minElo: 1600, maxElo: 1699 },
            'Diamond II': { minElo: 1700, maxElo: 1799 },
            'Diamond III': { minElo: 1800, maxElo: 1899 },
            'Champion I': { minElo: 1900, maxElo: 1999 },
            'Champion II': { minElo: 2000, maxElo: 2099 },
            'Champion III': { minElo: 2100, maxElo: 2199 },
            'Grand Champion': { minElo: 2200, maxElo: 9999 }
        };
        
        for (let [rankName, tierInfo] of Object.entries(rankTiers)) {
            if (elo >= tierInfo.minElo && elo <= tierInfo.maxElo) {
                return rankName;
            }
        }
        return 'Grand Champion';
    }

    initializeLeaderboardData() {
        const currentTime = Date.now();
        const weekAgo = currentTime - (7 * 24 * 60 * 60 * 1000);
        const monthAgo = currentTime - (30 * 24 * 60 * 60 * 1000);
        
        // Initialize time tracking for resets
        if (!Utils.loadGameData('lastWeeklyReset')) {
            Utils.saveGameData('lastWeeklyReset', weekAgo);
        }
        
        if (!Utils.loadGameData('lastMonthlyReset')) {
            Utils.saveGameData('lastMonthlyReset', monthAgo);
        }
    }

    // AI progression system - runs while player is active
    startAIProgression() {
        setInterval(() => {
            this.progressAI();
        }, 30000); // Update every 30 seconds
    }

    progressAI() {
        // Progress main AI
        const mainAI = Utils.loadGameData('mainAI', []);
        
        // Randomly select a few AI to have activity
        const activeAICount = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < activeAICount; i++) {
            const randomIndex = Math.floor(Math.random() * mainAI.length);
            const ai = mainAI[randomIndex];
            
            // Simulate a game result
            const won = Math.random() < 0.5;
            const xpGained = Math.floor(Math.random() * 100) + 50; // Higher XP gains
            
            if (won) {
                ai.wins++;
                ai.weeklyWins++;
                ai.monthlyWins++;
            }
            
            ai.totalGames++;
            ai.xp += xpGained;
            ai.level = this.calculateLevelFromXP(ai.xp);
            ai.winRate = ((ai.wins / ai.totalGames) * 100).toFixed(1);
            ai.lastActive = Date.now();
            
            // Ensure minimum stats are maintained
            if (ai.wins < 3000) ai.wins = 3000;
            if (ai.xp < 50000) ai.xp = 50000;
        }
        
        Utils.saveGameData('mainAI', mainAI);
        
        // Progress high-ranked AI - ensure they stay at Grand Champion level
        const highRankedAI = Utils.loadGameData('highRankedAI', []);
        
        const activeCompetitiveAI = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < activeCompetitiveAI; i++) {
            const randomIndex = Math.floor(Math.random() * highRankedAI.length);
            const ai = highRankedAI[randomIndex];
            
            // Simulate ranked game
            const placement = Math.floor(Math.random() * 5) + 1;
            const won = placement <= 3;
            
            let eloChange = 0;
            switch (placement) {
                case 1: eloChange = 25; break;
                case 2: eloChange = 15; break;
                case 3: eloChange = 8; break;
                case 4: eloChange = -5; break;
                case 5: eloChange = -15; break;
            }
            
            ai.rankedElo = Math.max(2200, ai.rankedElo + eloChange); // Never drop below Grand Champion
            ai.rank = this.getRankFromElo(ai.rankedElo);
            
            if (won) {
                ai.wins++;
                ai.seasonWins++;
            } else {
                ai.losses++;
                ai.seasonLosses++;
            }
            
            ai.totalGames = ai.wins + ai.losses;
            ai.winRate = ((ai.wins / ai.totalGames) * 100).toFixed(1);
            ai.lastGameTime = Date.now();
        }
        
        // Sort by ELO
        highRankedAI.sort((a, b) => b.rankedElo - a.rankedElo);
        Utils.saveGameData('highRankedAI', highRankedAI);
    }

    // Get leaderboard data for different categories
    getStatsLeaderboard(category = 'wins', timeframe = 'allTime') {
        const mainAI = Utils.loadGameData('mainAI', []);
        const playerStats = new StatsSystem().getStats();
        
        // Add player to the list
        const playerEntry = {
            name: Utils.loadGameData('username', 'Player'),
            isPlayer: true
        };
        
        let sortedList = [...mainAI];
        
        if (category === 'wins') {
            playerEntry.wins = playerStats.overall.wins;
            playerEntry.totalGames = playerStats.overall.gamesPlayed;
            playerEntry.winRate = playerStats.overall.winRate;
            
            switch (timeframe) {
                case 'weekly':
                    playerEntry.weeklyWins = this.getPlayerWeeklyWins();
                    sortedList.sort((a, b) => (b.weeklyWins || 0) - (a.weeklyWins || 0));
                    break;
                case 'monthly':
                    playerEntry.monthlyWins = this.getPlayerMonthlyWins();
                    sortedList.sort((a, b) => (b.monthlyWins || 0) - (a.monthlyWins || 0));
                    break;
                default: // allTime
                    sortedList.sort((a, b) => b.wins - a.wins);
            }
        } else if (category === 'xp') {
            playerEntry.xp = playerStats.progression.totalXP;
            playerEntry.level = playerStats.progression.currentLevel;
            sortedList.sort((a, b) => b.xp - a.xp);
        }
        
        // Add player and sort
        sortedList.push(playerEntry);
        
        if (category === 'wins') {
            if (timeframe === 'weekly') {
                sortedList.sort((a, b) => (b.weeklyWins || 0) - (a.weeklyWins || 0));
            } else if (timeframe === 'monthly') {
                sortedList.sort((a, b) => (b.monthlyWins || 0) - (a.monthlyWins || 0));
            } else {
                sortedList.sort((a, b) => b.wins - a.wins);
            }
        } else if (category === 'xp') {
            sortedList.sort((a, b) => b.xp - a.xp);
        }
        
        return sortedList.slice(0, 25); // Top 25
    }

    getCompetitiveLeaderboard() {
        const highRankedAI = Utils.loadGameData('highRankedAI', []);
        const rankedSystem = new RankedSystem();
        const playerRankedStats = rankedSystem.getRankedStats();
        
        // Filter to only show Grand Champions
        const grandChampions = highRankedAI.filter(ai => ai.rank === 'Grand Champion');
        
        // Add player if they are ranked and are Grand Champion
        if (playerRankedStats.isRanked && playerRankedStats.rank === 'Grand Champion') {
            const playerEntry = {
                name: Utils.loadGameData('username', 'Player'),
                rankedElo: playerRankedStats.elo,
                rank: playerRankedStats.rank,
                isPlayer: true,
                wins: Utils.loadGameData('rankedWins', 0),
                losses: Utils.loadGameData('rankedLosses', 0),
                totalGames: Utils.loadGameData('rankedGamesPlayed', 0)
            };
            playerEntry.winRate = playerEntry.totalGames > 0 ? ((playerEntry.wins / playerEntry.totalGames) * 100).toFixed(1) : 0;
            
            const combinedList = [...grandChampions, playerEntry];
            combinedList.sort((a, b) => b.rankedElo - a.rankedElo);
            return combinedList.slice(0, 25);
        }
        
        // Only return Grand Champions
        return grandChampions.slice(0, 25);
    }

    getPlayerWeeklyWins() {
        // For now, return a random value. In a real implementation, 
        // you'd track wins by date
        return Math.floor(Math.random() * 20);
    }

    getPlayerMonthlyWins() {
        // For now, return a random value. In a real implementation,
        // you'd track wins by date
        return Math.floor(Math.random() * 80);
    }

    // Reset leaderboards periodically
    checkAndResetLeaderboards() {
        const currentTime = Date.now();
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        const monthInMs = 30 * 24 * 60 * 60 * 1000;
        
        const lastWeeklyReset = Utils.loadGameData('lastWeeklyReset', currentTime);
        const lastMonthlyReset = Utils.loadGameData('lastMonthlyReset', currentTime);
        
        // Weekly reset
        if (currentTime - lastWeeklyReset >= weekInMs) {
            this.resetWeeklyStats();
            Utils.saveGameData('lastWeeklyReset', currentTime);
        }
        
        // Monthly reset
        if (currentTime - lastMonthlyReset >= monthInMs) {
            this.resetMonthlyStats();
            Utils.saveGameData('lastMonthlyReset', currentTime);
        }
    }

    // Regenerate leaderboards with new AI names (useful for updates)
    regenerateLeaderboards() {
        // Clear existing data
        Utils.saveGameData('mainAI', null);
        Utils.saveGameData('highRankedAI', null);
        
        // Regenerate with new names
        this.generateMainAI();
        this.generateHighRankedAI();
        
        console.log('Leaderboards regenerated with new AI names');
    }

    // Force refresh leaderboards (useful for manual updates)
    forceRefreshLeaderboards() {
        this.regenerateLeaderboards();
        return {
            mainAI: Utils.loadGameData('mainAI', []),
            highRankedAI: Utils.loadGameData('highRankedAI', [])
        };
    }

    resetWeeklyStats() {
        const mainAI = Utils.loadGameData('mainAI', []);
        mainAI.forEach(ai => {
            ai.weeklyWins = 0;
        });
        Utils.saveGameData('mainAI', mainAI);
    }

    resetMonthlyStats() {
        const mainAI = Utils.loadGameData('mainAI', []);
        mainAI.forEach(ai => {
            ai.monthlyWins = 0;
        });
        Utils.saveGameData('mainAI', mainAI);
    }
}