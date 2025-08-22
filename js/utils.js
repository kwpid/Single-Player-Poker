// Utility functions for the poker game

// Card utilities
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = RANK_VALUES[rank];
    }
    
    toString() {
        return `${this.rank}${this.suit}`;
    }
    
    isRed() {
        return this.suit === '♥' || this.suit === '♦';
    }
    
    isBlack() {
        return this.suit === '♠' || this.suit === '♣';
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
        this.shuffle();
    }
    
    reset() {
        this.cards = [];
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }
    
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    deal() {
        return this.cards.pop();
    }
    
    isEmpty() {
        return this.cards.length === 0;
    }
}

// Hand evaluation utilities
class HandEvaluator {
    static HAND_RANKINGS = {
        'ROYAL_FLUSH': 10,
        'STRAIGHT_FLUSH': 9,
        'FOUR_OF_A_KIND': 8,
        'FULL_HOUSE': 7,
        'FLUSH': 6,
        'STRAIGHT': 5,
        'THREE_OF_A_KIND': 4,
        'TWO_PAIR': 3,
        'ONE_PAIR': 2,
        'HIGH_CARD': 1
    };

    static evaluateHand(cards) {
        if (cards.length < 5) {
            throw new Error('Hand must contain at least 5 cards');
        }
        
        // Get all possible 5-card combinations
        const combinations = this.getCombinations(cards, 5);
        let bestHand = null;
        let bestRank = 0;
        
        for (let combo of combinations) {
            const hand = this.evaluateFiveCards(combo);
            if (hand.rank > bestRank) {
                bestRank = hand.rank;
                bestHand = hand;
            } else if (hand.rank === bestRank && this.compareHands(hand, bestHand) > 0) {
                bestHand = hand;
            }
        }
        
        return bestHand;
    }
    
    static evaluateFiveCards(cards) {
        const sorted = [...cards].sort((a, b) => b.value - a.value);
        const ranks = sorted.map(card => card.value);
        const suits = sorted.map(card => card.suit);
        
        const isFlush = suits.every(suit => suit === suits[0]);
        const isStraight = this.isStraight(ranks);
        const rankCounts = this.countRanks(ranks);
        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        
        let handType, tiebreakers;
        
        if (isFlush && isStraight && ranks[0] === 14 && ranks[1] === 13) {
            handType = 'ROYAL_FLUSH';
            tiebreakers = [];
        } else if (isFlush && isStraight) {
            handType = 'STRAIGHT_FLUSH';
            tiebreakers = [ranks[0]];
        } else if (counts[0] === 4) {
            handType = 'FOUR_OF_A_KIND';
            const fourOfAKind = this.getRankByCount(rankCounts, 4);
            const kicker = this.getRankByCount(rankCounts, 1);
            tiebreakers = [fourOfAKind, kicker];
        } else if (counts[0] === 3 && counts[1] === 2) {
            handType = 'FULL_HOUSE';
            const three = this.getRankByCount(rankCounts, 3);
            const pair = this.getRankByCount(rankCounts, 2);
            tiebreakers = [three, pair];
        } else if (isFlush) {
            handType = 'FLUSH';
            tiebreakers = ranks;
        } else if (isStraight) {
            handType = 'STRAIGHT';
            tiebreakers = [ranks[0]];
        } else if (counts[0] === 3) {
            handType = 'THREE_OF_A_KIND';
            const three = this.getRankByCount(rankCounts, 3);
            const kickers = Object.keys(rankCounts).filter(r => rankCounts[r] === 1).map(Number).sort((a, b) => b - a);
            tiebreakers = [three, ...kickers];
        } else if (counts[0] === 2 && counts[1] === 2) {
            handType = 'TWO_PAIR';
            const pairs = Object.keys(rankCounts).filter(r => rankCounts[r] === 2).map(Number).sort((a, b) => b - a);
            const kicker = this.getRankByCount(rankCounts, 1);
            tiebreakers = [...pairs, kicker];
        } else if (counts[0] === 2) {
            handType = 'ONE_PAIR';
            const pair = this.getRankByCount(rankCounts, 2);
            const kickers = Object.keys(rankCounts).filter(r => rankCounts[r] === 1).map(Number).sort((a, b) => b - a);
            tiebreakers = [pair, ...kickers];
        } else {
            handType = 'HIGH_CARD';
            tiebreakers = ranks;
        }
        
        return {
            type: handType,
            rank: this.HAND_RANKINGS[handType],
            tiebreakers,
            cards: sorted
        };
    }
    
    static isStraight(ranks) {
        // Check for Ace-low straight (A, 5, 4, 3, 2)
        if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
            return true;
        }
        
        // Check for regular straight
        for (let i = 0; i < ranks.length - 1; i++) {
            if (ranks[i] - ranks[i + 1] !== 1) {
                return false;
            }
        }
        return true;
    }
    
    static countRanks(ranks) {
        const counts = {};
        for (let rank of ranks) {
            counts[rank] = (counts[rank] || 0) + 1;
        }
        return counts;
    }
    
    static getRankByCount(rankCounts, count) {
        for (let rank in rankCounts) {
            if (rankCounts[rank] === count) {
                return Number(rank);
            }
        }
        return null;
    }
    
    static compareHands(hand1, hand2) {
        if (hand1.rank !== hand2.rank) {
            return hand1.rank - hand2.rank;
        }
        
        // Compare tiebreakers
        for (let i = 0; i < Math.max(hand1.tiebreakers.length, hand2.tiebreakers.length); i++) {
            const tb1 = hand1.tiebreakers[i] || 0;
            const tb2 = hand2.tiebreakers[i] || 0;
            if (tb1 !== tb2) {
                return tb1 - tb2;
            }
        }
        
        return 0; // Hands are equal
    }
    
    static getCombinations(arr, r) {
        const result = [];
        const backtrack = (start, current) => {
            if (current.length === r) {
                result.push([...current]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                current.push(arr[i]);
                backtrack(i + 1, current);
                current.pop();
            }
        };
        
        backtrack(0, []);
        return result;
    }
    
    static getHandName(handType) {
        const names = {
            'ROYAL_FLUSH': 'Royal Flush',
            'STRAIGHT_FLUSH': 'Straight Flush',
            'FOUR_OF_A_KIND': 'Four of a Kind',
            'FULL_HOUSE': 'Full House',
            'FLUSH': 'Flush',
            'STRAIGHT': 'Straight',
            'THREE_OF_A_KIND': 'Three of a Kind',
            'TWO_PAIR': 'Two Pair',
            'ONE_PAIR': 'One Pair',
            'HIGH_CARD': 'High Card'
        };
        return names[handType] || 'Unknown';
    }
}

// DOM utilities
function createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
}

function formatMoney(amount) {
    return amount.toLocaleString();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function playSound(type) {
    // Simple sound feedback using Web Audio API
    if (!localStorage.getItem('soundEnabled') || localStorage.getItem('soundEnabled') === 'true') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'click':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'chip':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'card':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'win':
                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    }
}

function animateChips(fromElement, toElement, amount) {
    if (!localStorage.getItem('animationsEnabled') || localStorage.getItem('animationsEnabled') === 'true') {
        const chip = createElement('div', 'flying-chip', `$${formatMoney(amount)}`);
        document.body.appendChild(chip);
        
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        chip.style.position = 'fixed';
        chip.style.left = fromRect.left + 'px';
        chip.style.top = fromRect.top + 'px';
        chip.style.zIndex = '9999';
        chip.style.background = 'var(--accent-gold)';
        chip.style.color = 'var(--bg-primary)';
        chip.style.padding = '0.25rem 0.5rem';
        chip.style.borderRadius = '15px';
        chip.style.fontSize = '0.8rem';
        chip.style.fontWeight = 'bold';
        chip.style.transition = 'all 0.8s ease-out';
        chip.style.pointerEvents = 'none';
        
        setTimeout(() => {
            chip.style.left = toRect.left + (toRect.width / 2) + 'px';
            chip.style.top = toRect.top + (toRect.height / 2) + 'px';
            chip.style.opacity = '0';
            chip.style.transform = 'scale(0.5)';
        }, 50);
        
        setTimeout(() => {
            document.body.removeChild(chip);
        }, 900);
    }
}

// Local storage utilities
function saveGameData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save game data:', error);
    }
}

function loadGameData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Failed to load game data:', error);
        return defaultValue;
    }
}

// Export for use in other modules
window.Utils = {
    Card,
    Deck,
    HandEvaluator,
    createElement,
    formatMoney,
    formatTime,
    playSound,
    animateChips,
    saveGameData,
    loadGameData,
    SUITS,
    RANKS,
    RANK_VALUES
};
