// AI Player Logic for Poker Game

class AIPlayer {
    constructor(name, difficulty = 'medium') {
        this.name = name;
        this.chips = 500;
        this.hand = [];
        this.folded = false;
        this.allIn = false;
        this.currentBet = 0;
        this.totalBetThisHand = 0;
        this.difficulty = difficulty;
        this.personality = this.generatePersonality();
        this.handStrength = 0;
        this.position = 0;
        
        // AI decision factors
        this.aggressiveness = this.personality.aggressiveness;
        this.bluffFrequency = this.personality.bluffFrequency;
        this.tightness = this.personality.tightness;
    }
    
    generatePersonality() {
        const personalities = {
            easy: {
                aggressiveness: 0.2 + Math.random() * 0.3, // 0.2-0.5
                bluffFrequency: 0.1 + Math.random() * 0.2, // 0.1-0.3
                tightness: 0.6 + Math.random() * 0.3,      // 0.6-0.9
                foldThreshold: 0.3,
                raiseThreshold: 0.7
            },
            medium: {
                aggressiveness: 0.3 + Math.random() * 0.4, // 0.3-0.7
                bluffFrequency: 0.2 + Math.random() * 0.3, // 0.2-0.5
                tightness: 0.4 + Math.random() * 0.4,      // 0.4-0.8
                foldThreshold: 0.25,
                raiseThreshold: 0.65
            },
            hard: {
                aggressiveness: 0.4 + Math.random() * 0.4, // 0.4-0.8
                bluffFrequency: 0.3 + Math.random() * 0.4, // 0.3-0.7
                tightness: 0.2 + Math.random() * 0.4,      // 0.2-0.6
                foldThreshold: 0.2,
                raiseThreshold: 0.6
            }
        };
        
        return personalities[this.difficulty] || personalities.medium;
    }
    
    // Evaluate hand strength (0-1 scale)
    evaluateHandStrength(communityCards = []) {
        if (this.hand.length < 2) return 0;
        
        const allCards = [...this.hand, ...communityCards];
        
        if (allCards.length < 2) {
            // Pre-flop hand evaluation
            return this.evaluatePreFlop();
        } else if (allCards.length >= 5) {
            // Post-flop evaluation using HandEvaluator
            try {
                const bestHand = Utils.HandEvaluator.evaluateHand(allCards);
                return this.convertHandRankToStrength(bestHand.rank);
            } catch (error) {
                return this.evaluatePreFlop();
            }
        } else {
            // Partial evaluation for flop/turn
            return this.evaluatePartialHand(allCards);
        }
    }
    
    evaluatePreFlop() {
        if (this.hand.length < 2) return 0;
        
        const card1 = this.hand[0];
        const card2 = this.hand[1];
        
        // High pairs
        if (card1.value === card2.value) {
            if (card1.value >= 10) return 0.9; // TT, JJ, QQ, KK, AA
            if (card1.value >= 7) return 0.7;  // 77, 88, 99
            return 0.5; // Low pairs
        }
        
        // High cards
        const highCard = Math.max(card1.value, card2.value);
        const lowCard = Math.min(card1.value, card2.value);
        
        // Ace with high card
        if (highCard === 14 && lowCard >= 10) {
            return card1.suit === card2.suit ? 0.8 : 0.75; // AK, AQ, AJ, AT
        }
        
        // Broadway cards
        if (highCard >= 10 && lowCard >= 10) {
            return card1.suit === card2.suit ? 0.65 : 0.6;
        }
        
        // Suited connectors
        if (card1.suit === card2.suit && Math.abs(card1.value - card2.value) <= 2) {
            return 0.55;
        }
        
        // Face cards
        if (highCard >= 11) {
            return 0.45;
        }
        
        return Math.max(0.1, (highCard + lowCard) / 28); // Basic high card value
    }
    
    evaluatePartialHand(allCards) {
        // Simplified evaluation for incomplete hands
        const suits = {};
        const ranks = {};
        
        allCards.forEach(card => {
            suits[card.suit] = (suits[card.suit] || 0) + 1;
            ranks[card.value] = (ranks[card.value] || 0) + 1;
        });
        
        let strength = 0.3; // Base strength
        
        // Check for pairs, trips, etc.
        const rankCounts = Object.values(ranks).sort((a, b) => b - a);
        if (rankCounts[0] >= 3) strength += 0.4; // Three of a kind or better
        else if (rankCounts[0] >= 2) strength += 0.25; // Pair
        
        // Check for flush draws
        const maxSuitCount = Math.max(...Object.values(suits));
        if (maxSuitCount >= 4) strength += 0.2; // Flush draw
        
        // Check for straight draws (simplified)
        const sortedRanks = Object.keys(ranks).map(Number).sort((a, b) => a - b);
        if (sortedRanks.length >= 3) {
            let consecutive = 1;
            for (let i = 1; i < sortedRanks.length; i++) {
                if (sortedRanks[i] - sortedRanks[i-1] === 1) {
                    consecutive++;
                } else {
                    consecutive = 1;
                }
            }
            if (consecutive >= 3) strength += 0.15; // Straight draw
        }
        
        return Math.min(1, strength);
    }
    
    convertHandRankToStrength(handRank) {
        // Convert HandEvaluator rank (1-10) to strength (0-1)
        const strengthMap = {
            1: 0.1,  // High card
            2: 0.25, // One pair
            3: 0.4,  // Two pair
            4: 0.55, // Three of a kind
            5: 0.65, // Straight
            6: 0.75, // Flush
            7: 0.85, // Full house
            8: 0.92, // Four of a kind
            9: 0.97, // Straight flush
            10: 1.0  // Royal flush
        };
        
        return strengthMap[handRank] || 0.1;
    }
    
    // Main decision making function
    makeDecision(gameState) {
        const { currentBet, potSize, communityCards, numPlayersInHand, bettingRound } = gameState;
        
        this.handStrength = this.evaluateHandStrength(communityCards);
        
        const callAmount = currentBet - this.currentBet;
        const potOdds = potSize > 0 ? callAmount / (potSize + callAmount) : 1;
        
        // Calculate decision factors
        const positionFactor = this.calculatePositionFactor(numPlayersInHand);
        const aggressionFactor = this.calculateAggressionFactor(bettingRound, potSize);
        const bluffFactor = this.shouldBluff(bettingRound, numPlayersInHand);
        
        // Adjust hand strength based on factors
        let adjustedStrength = this.handStrength;
        adjustedStrength += positionFactor * 0.1;
        adjustedStrength += aggressionFactor * 0.05;
        if (bluffFactor) adjustedStrength += 0.15;
        
        adjustedStrength = Math.min(1, Math.max(0, adjustedStrength));
        
        // Make decision based on adjusted strength
        if (callAmount === 0) {
            // Can check
            if (adjustedStrength > this.personality.raiseThreshold + (Math.random() - 0.5) * 0.2) {
                return this.decideRaiseAmount(potSize, bettingRound);
            } else {
                return { action: 'check' };
            }
        } else {
            // Need to call, raise, or fold
            if (callAmount >= this.chips) {
                // All-in situation
                if (adjustedStrength > 0.6) {
                    return { action: 'call', amount: this.chips };
                } else {
                    return { action: 'fold' };
                }
            }
            
            // Safety check: ensure callAmount is valid
            if (callAmount < 0) {
                return { action: 'check' };
            }
            
            if (adjustedStrength < this.personality.foldThreshold) {
                return { action: 'fold' };
            } else if (adjustedStrength > this.personality.raiseThreshold) {
                return this.decideRaiseAmount(potSize, bettingRound);
            } else if (potOdds < adjustedStrength || callAmount <= this.chips * 0.1) {
                // Ensure call amount doesn't exceed chips
                const safeCallAmount = Math.min(callAmount, this.chips);
                return { action: 'call', amount: safeCallAmount };
            } else {
                return { action: 'fold' };
            }
        }
    }
    
    calculatePositionFactor(numPlayersInHand) {
        // Later position is better (higher factor)
        return (this.position / numPlayersInHand) * 0.5;
    }
    
    calculateAggressionFactor(bettingRound, potSize) {
        // More aggressive on later streets with bigger pots
        let factor = 0;
        if (bettingRound === 'turn') factor += 0.2;
        if (bettingRound === 'river') factor += 0.3;
        if (potSize > this.chips * 0.5) factor += 0.1;
        
        return factor * this.aggressiveness;
    }
    
    shouldBluff(bettingRound, numPlayersInHand) {
        // Bluff more against fewer players and on later streets
        const bluffChance = this.bluffFrequency * (1 - (numPlayersInHand - 2) * 0.2);
        const streetMultiplier = bettingRound === 'river' ? 1.5 : bettingRound === 'turn' ? 1.2 : 1.0;
        
        return Math.random() < (bluffChance * streetMultiplier);
    }
    
    decideRaiseAmount(potSize, bettingRound) {
        const minRaise = Math.max(50, potSize * 0.3);
        const maxRaise = Math.min(this.chips, potSize * 1.2);
        
        // Ensure minRaise doesn't exceed what AI can afford
        const adjustedMinRaise = Math.min(minRaise, this.chips);
        const adjustedMaxRaise = Math.min(maxRaise, this.chips);
        
        // If AI can't afford minimum raise, they should fold or call
        if (adjustedMinRaise > this.chips) {
            return { action: 'fold' };
        }
        
        let raiseSize;
        if (this.handStrength > 0.8) {
            // Strong hand - bet for value
            raiseSize = adjustedMinRaise + (adjustedMaxRaise - adjustedMinRaise) * 0.6;
        } else if (this.handStrength < 0.3) {
            // Bluff - smaller size
            raiseSize = adjustedMinRaise + (adjustedMaxRaise - adjustedMinRaise) * 0.3;
        } else {
            // Medium strength - variable sizing
            raiseSize = adjustedMinRaise + (adjustedMaxRaise - adjustedMinRaise) * this.aggressiveness;
        }
        
        // Add some randomness
        raiseSize *= (0.8 + Math.random() * 0.4);
        raiseSize = Math.round(raiseSize / 25) * 25; // Round to nearest 25
        
        // Final safety checks
        raiseSize = Math.max(adjustedMinRaise, Math.min(adjustedMaxRaise, raiseSize));
        raiseSize = Math.max(0, Math.min(this.chips, raiseSize)); // Never negative, never more than chips
        
        return {
            action: 'raise',
            amount: raiseSize
        };
    }
    
    // Reset for new hand
    newHand() {
        this.hand = [];
        this.folded = false;
        this.allIn = false;
        this.currentBet = 0;
        this.totalBetThisHand = 0;
        this.handStrength = 0;
    }
    
    // Add delay for realistic decision making
    async makeDecisionWithDelay(gameState) {
        const baseDelay = 1000; // 1 second base
        const randomDelay = Math.random() * 2000; // 0-2 seconds random
        const strengthDelay = (1 - this.handStrength) * 1000; // Think longer with weak hands
        
        const totalDelay = baseDelay + randomDelay + strengthDelay;
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.makeDecision(gameState));
            }, Math.min(totalDelay, 4000)); // Cap at 4 seconds
        });
    }
}

// AI Name Generator
class AINameGenerator {
    // Professional/Competitive AI names
    static competitiveNames = [
              "zippersman","xxkirtoxx1","togoz","MyWorld_21","JuicyJamz","qozz","JuiceWrldMoonlight","boopsma1","UnstoppableAnarchy","smollost43432X","Xx_MilkShake17Xx","vibeless19","x23","flwr","powf","sinless","mattyboy784","xkirt0","BigHeavy00","JpingMagz","easilymossedkid20","unknown_magz","284962G7","juli23_zae","J_Y3E","easilymossedkid19","uqz","poofusure","QTW1NN","circuIator","grandsontoldmetoplay","RoboStud22","GlobalWRA893","gaslightying","ii_cantsackii","ItsMeDooDoos","Bxx_Duck","XxFrench_Fr1ezX","Revruics","rxd_deer","lqzt_sou1z","arrowstops","HeartlessTierra","thefabisasoXD","ii_cantrunnerii","roblox_user_78045342","unlocked1_2","jalenHurts_RB7","QzccMustDestroy","globalseller","RisingPhoenix","snagz","umppz2",
      "LilTycoon94","EpicGamer_072","xXBuildBroXx","AquaDude33","FlamezKnight","CookieNomNom","PixelSurge","HyperNova_99","TacoSlayer42","NinjaSocks","DankDestroyer","SlippyPenguin7","ToxicDriftX","CoolBanana_05","WolfStorm88","Jumpman_14","EliteSniper_RBLX","KrazyKoala123","CodeRedYT","MysticSlayer", "L",
    "kupid",
    "l0st",
    "jayleng",
    "weweewew",
    "RisingPhoinex87",
    "dr.1",
    "prot",
    "hunt",
    "kif",
    "?",
    "rivverott",
    "1x Dark",
    "Moxxy!",
    "ä",
    "شغثغخ",
    "dark!",
    "Vortex",
    "FlickMaster17",
    "r",
    "Skywave!",
    "R3tr0",
    "TurboClash893",
    "Zynk",
    "Null_Force",
    "Orbital",
    "Boosted",
    "GravyTrain",
    "NitroNinja",
    "PixelPlay",
    "PhantomX",
    "Fury",
    "Zero!",
    "Moonlight",
    "QuickTap",
    "v1per",
    "Slugger",
    "MetaDrift",
    "Hydra",
    "Neo!",
    "ShadowDart",
    "SlipStream",
    "F1ick",
    "Karma",
    "Sparkz",
    "Glitch",
    "Dash7",
    "Ignite",
    "Cyclone",
    "Nova",
    "Opt1c",
    "Viral",
    "Stormz",
    "PyroBlast",
    "Bl1tz",
    "Echo",
    "Hover",
    "PulseRider"
    ];
    
    // Casual/Friendly AI names
    static casualNames = [
        "L",
    "kupid",
    "l0st",
    "jayleng",
    "weweewew",
    "RisingPhoinex87",
    "dr.1",
    "prot",
    "hunt",
    "kif",
    "?",
    "rivverott",
    "1x Dark",
    "Moxxy!",
    "ä",
    "شغثغخ",
    "dark!",
    "Vortex",
    "FlickMaster17",
    "r",
    "Skywave!",
    "R3tr0",
    "TurboClash893",
    "Zynk",
    "Null_Force",
    "Orbital",
    "Boosted",
    "GravyTrain",
    "NitroNinja",
    "PixelPlay",
    "PhantomX",
    "Fury",
    "Zero!",
    "Moonlight",
    "QuickTap",
    "v1per",
    "Slugger",
    "MetaDrift",
    "Hydra",
    "Neo!",
    "ShadowDart",
    "SlipStream",
    "F1ick",
    "Karma",
    "Sparkz",
    "Glitch",
    "Dash7",
    "Ignite",
    "Cyclone",
    "Nova",
    "Opt1c",
    "Viral",
    "Stormz",
    "PyroBlast",
    "Bl1tz",
    "Echo",
    "Hover",
    "PulseRider", "yumi", "drali", "wez", "brickbybrick", "Rw9", "dark", "mawykzy!", "Speed", ".", "koto", "dani", "Qwert (OG)", "dr.k", "Void", "moon.", "Lru", "Kha0s", "rising.", "?", "dynamo", "f", "Hawk!", "newpo", "zen", "v", "a7md", "sieko", "Mino", "dyinq", "toxin", "Bez", "velocity", "Chronic", "Flinch", "vatsi", "Xyzle", "ca$h", "Darkmode", "nu3.", "LetsG0Brand0n", "VAWQK.", "helu30", "wizz", "Sczribbles.", "7up", "unkown", "t0es", "Jynx.", "Zapz", "Aur0", "Knight", "Cliqz", "Pyro.", "dash!", "ven", "flow.", "zenith", "volty", "Aqua!", "Styx", "cheeseboi", "Heat.", "Slyde", "fl1p", "Otto", "jetz", "Crisp", "snailracer", "Flickz", "tempo", "Blaze.", "skyfall", "steam", "storm", "rek:3", "vyna1", "deltairlines", "ph", "trace", "avidic", "tekk!", "fluwo", "climp?", "zark", "diza", "O", "Snooze", "gode", "cola", "hush(!)", "sh4oud", "vvv", "critt", "darkandlost2009", "pulse jubbo", "pl havicic", "ryft.", "Lyric", "dryft.", "horiz", "zeno", "octane", "wavetidess", "loster", "mamba", "Jack", "innadeze", "s", "offtenlost", "bivo", "Trace", "Talon", ".", "{?}", "rraze", "Dark{?}", "zenhj", "rinshoros bf", "Cipher", "nova", "juzz", "officer", "strike", "Titan", "comp", "pahnton", "Mirage", "space", "boltt", "reeper", "piza", "cheese.", "frostbite", "warthunderisbest", "eecipe", "quantum", "vexz", "zylo", "frzno", "blurr", "scythe!", "wvr", "nxt", "griz", "jolt", "sift", "kryo", "wvn", "brixx", "twixt", "nyx", "slyth", "drex", "qwi", "voxx", "triz", "jynx", "plyx", "kryp", "zex", "brix", "twixz", "vyn", "sypher", "jyn", "qry", "neoo", "kwpid"

    ];
    
    static getRandomName() {
        // 70% chance for competitive names, 30% for casual names
        const nameList = Math.random() < 0.7 ? this.competitiveNames : this.casualNames;
        const name = nameList[Math.floor(Math.random() * nameList.length)];
        
        // Add a number suffix for uniqueness (20% chance)
        const number = Math.random() < 0.2 ? Math.floor(Math.random() * 99) + 1 : '';
        
        return number ? `${name}${number}` : name;
    }
    
    static generateUniqueNames(count) {
        const names = new Set();
        while (names.size < count) {
            names.add(this.getRandomName());
        }
        return Array.from(names);
    }
}

// Export for global use
window.AIPlayer = AIPlayer;
window.AINameGenerator = AINameGenerator;
