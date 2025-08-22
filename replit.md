# Overview

Dark Poker is a professional casino-style poker game built with vanilla JavaScript, HTML, and CSS. The application features a complete Texas Hold'em poker implementation with AI opponents, an ELO rating system, and a modern dark-themed user interface. Players can engage in casual poker games against AI opponents of varying difficulties while tracking their skill progression through an integrated rating system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a single-page architecture with vanilla JavaScript and CSS. The frontend is organized into distinct screens managed by a central GameApp controller:

- **Screen-based Navigation**: Four main screens (main menu, queue, game, results) with modal overlays for settings and help
- **Component-based Structure**: Separate JavaScript classes for different game systems (PokerGame, AIPlayer, EloSystem)
- **CSS Modular Design**: Split stylesheets for main UI (`main.css`) and game-specific styling (`game.css`)

## Core Game Systems

### Poker Game Engine
The main game logic is handled by the `PokerGame` class which manages:
- Game state progression through phases (preflop, flop, turn, river, showdown)
- Player actions and betting rounds
- Hand evaluation and winner determination
- Pot management and chip distribution

### AI System
The `AIPlayer` class provides intelligent opponents with:
- Difficulty-based personality generation (easy, medium, hard)
- Decision-making based on hand strength, position, and betting patterns
- Configurable traits like aggressiveness, bluffFrequency, and tightness
- Realistic betting behaviors that adapt to game situations

### Rating System
The `EloSystem` class implements a chess-style rating system:
- Standard ELO calculation with K-factors for different game types
- Tournament-style scoring based on final placement
- Persistent rating storage using localStorage
- Dynamic opponent rating generation based on player skill level

## Data Management
- **Local Storage**: All game data (ELO rating, settings, username) persisted in browser localStorage
- **No Backend**: Fully client-side application with no server dependencies
- **Utility Functions**: Centralized data access through the Utils class for consistent data handling

## UI/UX Design Patterns
- **Dark Casino Theme**: Professional casino aesthetic with gold accents and dark backgrounds
- **Responsive Design**: Flexible layouts that adapt to different screen sizes
- **Animation System**: CSS-based animations for card dealing, pot updates, and UI transitions
- **Accessibility**: Font Awesome icons and clear visual hierarchy for better usability

# External Dependencies

## CDN-based Resources
- **Font Awesome 6.0.0**: Icon library for UI elements and visual indicators
- **Google Fonts**: Orbitron and Roboto font families for professional typography

## Browser APIs
- **localStorage**: For persistent game data storage (ELO ratings, settings, user preferences)
- **DOM APIs**: Standard browser APIs for UI manipulation and event handling

## No Backend Dependencies
The application is entirely client-side with no external services, databases, or API integrations required. All game logic, AI opponents, and data persistence are handled through browser-native technologies.