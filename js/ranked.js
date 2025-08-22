// Ranked System for Dark Poker - Seasons, Placement Matches, Rank Tiers

class RankedSystem {
    static RANK_TIERS = {
        'Bronze I': { minElo: 0, maxElo: 199, color: '#cd7f32' },
        'Bronze II': { minElo: 200, maxElo: 299, color: '#cd7f32' },
        'Bronze III': { minElo: 300, maxElo: 399, color: '#cd7f32' },
        'Silver I': { minElo: 400, maxElo: 549, color: '#c0c0c0' },
        'Silver II': { minElo: 550, maxElo: 699, color: '#c0c0c0' },
        'Silver III': { minElo: 700, maxElo: 849, color: '#c0c0c0' },
        'Gold I': { minElo: 850, maxElo: 999, color: '#ffd700' },
        'Gold II': { minElo: 1000, maxElo: 1149, color: '#ffd700' },
        'Gold III': { minElo: 1150, maxElo: 1299, color: '#ffd700' },
        'Platinum I': { minElo: 1300, maxElo: 1399, color: '#e5e4e2' },
        'Platinum II': { minElo: 1400, maxElo: 1499, color: '#e5e4e2' },
        'Platinum III': { minElo: 1500, maxElo: 1599, color: '#e5e4e2' },
        'Diamond I': { minElo: 1600, maxElo: 1699, color: '#b9f2ff' },
        'Diamond II': { minElo: 1700, maxElo: 1799, color: '#b9f2ff' },
        'Diamond III': { minElo: 1800, maxElo: 1899, color: '#b9f2ff' },
        'Champion I': { minElo: 1900, maxElo: 1999, color: '#ff6b6b' },
        'Champion II': { minElo: 2000, maxElo: 2099, color: '#ff6b6b' },
        'Champion III': { minElo: 2100, maxElo: 2199, color: '#ff6b6b' },
        'Grand Champion': { minElo: 2200, maxElo: 9999, color: '#ff1744' }
    };

    constructor() {
        this.initializeRankedSystem();
    }

    initializeRankedSystem() {
        // Check if new season needs to start
        this.checkAndStartNewSeason();
        
        // Initialize ranked data if doesn't exist
        const defaultRankedData = {
            rankedElo: 600, // Starting ELO for ranked
            placementMatches: 0,
            placementWins: 0,
            isRanked: false,
            currentRank: 'Unranked',
            seasonNumber: this.getCurrentSeasonNumber(),
            lastSeasonReset: this.getCurrentMonthKey()
        };

        for (let [key, defaultValue] of Object.entries(defaultRankedData)) {
            if (Utils.loadGameData(key) === null) {
                Utils.saveGameData(key, defaultValue);
            }
        }
    }

    getCurrentMonthKey() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth() + 1}`; // e.g., "2025-8"
    }

    getCurrentSeasonNumber() {
        const now = new Date();
        return parseInt(`${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`); // e.g., 202508
    }

    checkAndStartNewSeason() {
        const currentMonthKey = this.getCurrentMonthKey();
        const lastSeasonReset = Utils.loadGameData('lastSeasonReset', currentMonthKey);
        
        if (lastSeasonReset !== currentMonthKey) {
            this.startNewSeason();
        }
    }

    startNewSeason() {
        const currentElo = Utils.loadGameData('rankedElo', 600);
        
        // Soft reset (similar to Rocket League)
        // Players lose some ELO but not a complete reset
        const newElo = Math.max(600, Math.floor(currentElo * 0.75));
        
        // Reset season data
        Utils.saveGameData('rankedElo', newElo);
        Utils.saveGameData('placementMatches', 0);
        Utils.saveGameData('placementWins', 0);
        Utils.saveGameData('isRanked', false);
        Utils.saveGameData('currentRank', 'Unranked');
        Utils.saveGameData('seasonNumber', this.getCurrentSeasonNumber());
        Utils.saveGameData('lastSeasonReset', this.getCurrentMonthKey());
        
        console.log(`🏆 New season started! ELO reset from ${currentElo} to ${newElo}`);
    }

    isInPlacementMatches() {
        return Utils.loadGameData('placementMatches', 0) < 5;
    }

    getPlacementProgress() {
        const matches = Utils.loadGameData('placementMatches', 0);
        const wins = Utils.loadGameData('placementWins', 0);
        
        return {
            matches: matches,
            wins: wins,
            remaining: 5 - matches,
            isComplete: matches >= 5
        };
    }

    getRankFromElo(elo) {
        for (let [rankName, tierInfo] of Object.entries(RankedSystem.RANK_TIERS)) {
            if (elo >= tierInfo.minElo && elo <= tierInfo.maxElo) {
                return {
                    name: rankName,
                    color: tierInfo.color,
                    minElo: tierInfo.minElo,
                    maxElo: tierInfo.maxElo
                };
            }
        }
        return {
            name: 'Grand Champion',
            color: '#ff1744',
            minElo: 2200,
            maxElo: 9999
        };
    }

    processRankedGameResult(placement, totalPlayers) {
        const placementMatches = Utils.loadGameData('placementMatches', 0);
        const placementWins = Utils.loadGameData('placementWins', 0);
        const currentElo = Utils.loadGameData('rankedElo', 600);
        
        // Record placement match
        const newPlacementMatches = placementMatches + 1;
        const newPlacementWins = placementWins + (placement <= 3 ? 1 : 0);
        
        Utils.saveGameData('placementMatches', newPlacementMatches);
        Utils.saveGameData('placementWins', newPlacementWins);
        
        // Calculate ELO change
        const isWin = placement <= 3;
        let eloChange = 0;
        
        if (this.isInPlacementMatches()) {
            // Larger ELO swings during placement
            switch (placement) {
                case 1: eloChange = 80; break;
                case 2: eloChange = 50; break;
                case 3: eloChange = 25; break;
                case 4: eloChange = -10; break;
                default: eloChange = -25; break;
            }
        } else {
            // Standard ELO calculation
            switch (placement) {
                case 1: eloChange = 35; break;
                case 2: eloChange = 20; break;
                case 3: eloChange = 10; break;
                case 4: eloChange = -5; break;
                default: eloChange = -15; break;
            }
        }
        
        const newElo = Math.max(0, currentElo + eloChange);
        Utils.saveGameData('rankedElo', newElo);
        
        // Update rank
        let newRank;
        if (newPlacementMatches >= 5) {
            // Placement complete, get actual rank
            const rankInfo = this.getRankFromElo(newElo);
            newRank = rankInfo.name;
            Utils.saveGameData('isRanked', true);
        } else {
            newRank = 'Unranked';
        }
        
        Utils.saveGameData('currentRank', newRank);
        
        return {
            eloChange: eloChange,
            newElo: newElo,
            oldElo: currentElo,
            newRank: newRank,
            placementProgress: this.getPlacementProgress(),
            isPlacementComplete: newPlacementMatches >= 5 && placementMatches < 5
        };
    }

    getRankedStats() {
        const rankedElo = Utils.loadGameData('rankedElo', 600);
        const currentRank = Utils.loadGameData('currentRank', 'Unranked');
        const seasonNumber = Utils.loadGameData('seasonNumber', this.getCurrentSeasonNumber());
        const isRanked = Utils.loadGameData('isRanked', false);
        const placementProgress = this.getPlacementProgress();
        
        return {
            elo: rankedElo,
            rank: currentRank,
            rankInfo: this.getRankFromElo(rankedElo),
            season: seasonNumber,
            isRanked: isRanked,
            placementProgress: placementProgress
        };
    }

    // Generate AI opponents within ELO range for ranked matches
    generateRankedAIRatings(playerElo, numOpponents = 4) {
        const ratings = [];
        const minElo = Math.max(0, playerElo - 150);
        const maxElo = Math.min(3000, playerElo + 150);
        
        for (let i = 0; i < numOpponents; i++) {
            const variation = (Math.random() - 0.5) * 300; // ±150 from player
            const aiElo = Math.max(minElo, Math.min(maxElo, playerElo + variation));
            ratings.push(Math.round(aiElo));
        }
        
        return ratings;
    }

    getSeasonInfo() {
        const seasonNumber = Utils.loadGameData('seasonNumber', this.getCurrentSeasonNumber());
        const currentMonthKey = this.getCurrentMonthKey();
        const [year, month] = currentMonthKey.split('-');
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        return {
            number: seasonNumber,
            name: `${monthNames[parseInt(month) - 1]} ${year}`,
            monthKey: currentMonthKey
        };
    }
}