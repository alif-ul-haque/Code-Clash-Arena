# Utilities - Main Page & Clan Battle

Helper functions and utility code for the main page and clan battle module.

## Purpose

This directory contains utility functions, helpers, and hooks used throughout the main page and clan battle module.

## Common Utilities

- **Clan Helpers**: Clan creation, member management, clan stats calculations
- **Battle Helpers**: Battle matchmaking, score calculation, result determination
- **Data Formatters**: Format clan stats, battle results, timestamps
- **API Utilities**: Functions for making clan and battle-related API calls
- **Custom Hooks**: Reusable React hooks for clan and battle state management

## Usage

Import utilities directly into components or pages that need them:

```javascript
import { calculateClanRanking, getMemberStats } from './clanHelpers';
import { determineBattleWinner } from './battleLogic';
```

## Best Practices

- Keep utilities pure and free of side effects when possible
- Document function parameters and return values
- Export utility functions for reusability
- Test utilities independently
