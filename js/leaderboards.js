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
        const firstNames = [
            'Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Avery', 'Quinn',
            'Blake', 'Cameron', 'Drew', 'Sage', 'Rowan', 'Finley', 'Peyton', 'Hayden',
            'River', 'Dakota', 'Phoenix', 'Skyler', 'Raven', 'Storm', 'Winter', 'Scout',
            'Dallas', 'Justice', 'Emery', 'Remy', 'Kai', 'Briar', 'London', 'Parker',
            'Nova', 'Sage', 'Zion', 'Ari', 'Eden', 'Marlowe', 'Onyx', 'Sterling'
        ];
        
        const lastNames = [
            'Chen', 'Rodriguez', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson',
            'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
            'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker',
            'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
            'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts'
        ];

        for (let i = 0; i < 150; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${firstName} ${lastName}`;
            
            const ai = {
                name: name,
                wins: Math.floor(Math.random() * 500) + 10,
                totalGames: 0,
                xp: Math.floor(Math.random() * 50000) + 1000,
                level: 1,
                winRate: 0,
                lastActive: Date.now() - Math.random() * 86400000 * 30, // Last 30 days
                weeklyWins: Math.floor(Math.random() * 20),
                monthlyWins: Math.floor(Math.random() * 80)
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
        const competitiveNames = [
            'ProPlayer_1', 'PokerLegend', 'ChipMaster', 'RoyalFlush', 'AllInAce',
            'BluffKing', 'CardShark', 'PokerPro', 'TiltLess', 'NutHunter',
            'ValueTown', 'RangeBot', 'GTO_Master', 'SolverKing', 'MetaGame',
            'VarianceGod', 'ICM_Wizard', 'Nash_EQ', 'OptimalPlay', 'DeepStack',
            'ShortStack', 'LAGMaster', 'TAGPro', 'NittyGritty', 'ManiacMode'
        ];

        for (let i = 0; i < 25; i++) {
            const baseName = competitiveNames[i % competitiveNames.length];
            const suffix = i > competitiveNames.length - 1 ? `_${Math.floor(i / competitiveNames.length) + 1}` : '';
            const name = baseName + suffix;
            
            // High-ranked AI starts with higher ELO
            const elo = 1200 + Math.floor(Math.random() * 1000); // 1200-2200 ELO
            
            const ai = {
                name: name,
                rankedElo: elo,
                rank: this.getRankFromElo(elo),
                wins: Math.floor(Math.random() * 200) + 50,
                losses: Math.floor(Math.random() * 100) + 20,
                isActive: true,
                lastGameTime: Date.now() - Math.random() * 3600000 * 24, // Last 24 hours
                seasonWins: Math.floor(Math.random() * 50) + 10,
                seasonLosses: Math.floor(Math.random() * 30) + 5
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
            const xpGained = Math.floor(Math.random() * 50) + 10;
            
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
        }
        
        Utils.saveGameData('mainAI', mainAI);
        
        // Progress high-ranked AI
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
            
            ai.rankedElo = Math.max(0, ai.rankedElo + eloChange);
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
        
        // Add player if they are ranked
        if (playerRankedStats.isRanked) {
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
            
            const combinedList = [...highRankedAI, playerEntry];
            combinedList.sort((a, b) => b.rankedElo - a.rankedElo);
            return combinedList.slice(0, 25);
        }
        
        return highRankedAI.slice(0, 25);
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