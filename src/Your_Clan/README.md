# Your Clan Battle System

Complete gamified clan battle experience with smooth animations and LeetCode-style problem solving interface.

## Flow

1. **YourClanTeam** (`/your-clan`)
   - View team members with online status
   - Invite friends to join
   - Start battle button

2. **FindingOpponent** (`/your-clan/finding-opponent`)
   - Animated magnifying glass searching (Clash of Clans style)
   - Moves in random patterns with rotation
   - Auto-navigates after 4 seconds

3. **RevealingWarriors** (`/your-clan/revealing-warriors`)
   - Shows opponent clan silhouettes (?)
   - Dramatic reveal animation with flip effect
   - VS indicator with pulse animation
   - Auto-navigates after 4.5 seconds

4. **BattleArena** (`/your-clan/battle-arena`)
   - Team scores header (Your Clan vs Enemy Clan)
   - 5 problems list with:
     - Difficulty badges (Easy/Medium/Hard)
     - Points display
     - Teammate indicators (who's solving what)
     - Solved status with checkmarks
   - Click any problem to enter solving mode

5. **ProblemSolving** (`/your-clan/problem/:problemId`)
   - **LeetCode-style resizable layout**
   - Left side: Problem statement with examples and constraints
   - Right side: Code editor with language selection
   - Draggable divider to resize panels
   - Run and Submit buttons
   - Back to Arena button

## Features

- **Color Palette**: Teal/Green (#00FF7F), Golden (#FFD700), Teal backgrounds
- **Smooth Animations**: 
  - Card appear/slide animations
  - Magnifying glass movement
  - Warrior reveal flips
  - Pulsing effects
  - Shimmer effects on buttons
- **Responsive Design**: Mobile/tablet optimized
- **Gaming Aesthetic**: Clash of Clans inspired UI with modern touches

## Components

All pages are self-contained with their CSS in the `style/` folder:
- `YourClanTeam.jsx` + `YourClanTeam.css`
- `FindingOpponent.jsx` + `FindingOpponent.css`
- `RevealingWarriors.jsx` + `RevealingWarriors.css`
- `BattleArena.jsx` + `BattleArena.css`
- `ProblemSolving.jsx` + `ProblemSolving.css`

## Routes

```jsx
/your-clan                          → YourClanTeam
/your-clan/finding-opponent         → FindingOpponent
/your-clan/revealing-warriors       → RevealingWarriors
/your-clan/battle-arena             → BattleArena
/your-clan/problem/:problemId       → ProblemSolving
```

## Usage

From MainPage, click "Your Clan" button to start the battle flow.
