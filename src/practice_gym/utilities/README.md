# Utilities - Practice Gym

Helper functions and utility code for the practice gym module.

## Purpose

This directory contains utility functions, helpers, and hooks used throughout the practice gym module.

## Common Utilities

- **Code Execution Helpers**: Run code, validate solutions, handle execution errors
- **Problem Helpers**: Load problems, parse test cases, validate inputs
- **Scoring Helpers**: Calculate points, track progress, generate statistics
- **Storage Helpers**: Save code drafts, persist user progress
- **API Utilities**: Functions for fetching problems and submitting solutions
- **Custom Hooks**: Reusable React hooks for code editor state and problem management

## Usage

Import utilities directly into components or pages that need them:

```javascript
import { executeCode, validateSolution } from './codeExecution';
import { useProblem, useEditor } from './hooks';
```

## Best Practices

- Keep utilities pure and free of side effects when possible
- Document function parameters and return values
- Export utility functions for reusability
- Test utilities independently
