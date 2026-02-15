

// Express route for clan war problem selection (ESM)
import express from 'express';
import { generateClanWarProblems } from '../src/Your_Clan/utilities/clanWarProblemSelector.js';
const router = express.Router();


// In-memory cache for clan war problems (keyed by deterministic clan war ID)
const clanWarProblemsCache = {};

// Helper to create a deterministic clan war ID from handles
function getClanWarId(handles1, handles2) {
  const all = [...handles1, ...handles2].map(h => h.toLowerCase()).sort();
  return all.join('-');
}

// POST /api/clanwar/problems
// Expects: { handles1: [string], handles2: [string] }
router.post('/problems', async (req, res) => {
  try {
    console.log('[ClanWar] /api/clanwar/problems called');
    console.log('Request body:', req.body);
    const { handles1, handles2 } = req.body;
    if (!Array.isArray(handles1) || !Array.isArray(handles2)) {
      console.error('[ClanWar] handles1 or handles2 not arrays:', handles1, handles2);
      return res.status(400).json({ error: 'handles1 and handles2 must be arrays' });
    }
    const clanWarId = getClanWarId(handles1, handles2);
    console.log('[ClanWar] clanWarId:', clanWarId);
    // If already generated, return cached problems
    if (clanWarProblemsCache[clanWarId]) {
      console.log('[ClanWar] Returning cached problems for', clanWarId);
      return res.json(clanWarProblemsCache[clanWarId]);
    }
    // Otherwise, generate and cache
    console.log('[ClanWar] Generating new problems for', clanWarId);
    const problems = await generateClanWarProblems(handles1, handles2);
    clanWarProblemsCache[clanWarId] = problems;
    console.log('[ClanWar] Problems generated and cached for', clanWarId);
    res.json(problems);
  } catch (err) {
    console.error('[ClanWar] ERROR:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

export default router;
