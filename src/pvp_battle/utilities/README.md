# Utilities - PvP Battle

Helper functions and utility code for the PvP battle module.

## Purpose

This directory contains utility functions, helpers, and hooks used throughout the PvP battle module.

## Common Utilities

- **Battle Mechanics**: Initialize battles, manage turns, calculate scores
- **Real-time Helpers**: WebSocket connection management, message parsing, state synchronization
- **Matchmaking Helpers**: Find suitable opponents, rating calculations, ranking updates
- **Code Validation**: Execute opponent code, compare solutions, verify results
- **Timer Helpers**: Manage battle timers, track time remaining
- **API Utilities**: Functions for matchmaking, result submission, and leaderboard updates
- **Custom Hooks**: Reusable React hooks for battle state, opponent info, real-time updates

## Usage

Import utilities directly into components or pages that need them:

```javascript
import { initiateBattle, calculateScore } from './battleLogic';
import { useWebSocket, useBattleState } from './hooks';
```

## Best Practices

- Keep utilities pure and free of side effects when possible
- Document function parameters and return values
- Export utility functions for reusability
- Test utilities independently
- Handle WebSocket edge cases and connection failures
