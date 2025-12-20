# Pages - PvP Battle

Main page components for the PvP battle module.

## Purpose

This directory contains the full page components that represent distinct routes/screens in the PvP battle system:

## Pages

- **Battle Lobby**: Browse active battles and find opponents
- **Battle Arena**: Main battle interface with code editors and live competition
- **Matchmaking**: Search for opponents with difficulty preferences
- **Battle Results**: Display winner, final scores, and detailed statistics
- **Battle History**: View past battles and performance trends

## Page Structure

Each page component should:
- Import necessary sub-components from the `components/` directory
- Import styling from the `style/` directory
- Use utilities from the `utilities/` directory for business logic
- Handle page-level state and routing
- Manage real-time WebSocket connections

## Navigation

Pages are typically connected through React Router or similar routing mechanism in the main application.
