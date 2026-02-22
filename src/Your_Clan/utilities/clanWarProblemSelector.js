// Clan War Problem Selection Logic (Node.js/Express style outline)
// Assumes you have axios or fetch for API calls


import axios from 'axios';

// Simple deterministic seeded random generator (Mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Create a numeric seed from sorted handles
function getSeedFromHandles(handles1, handles2) {
  const all = [...handles1, ...handles2].map(h => h.toLowerCase()).sort();
  // Simple hash
  let hash = 0;
  for (const str of all) {
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
  }
  return Math.abs(hash);
}

// 1. Fetch solved problems and ratings for all handles (with error handling)
async function fetchClanData(handles) {
  const solvedMap = {};
  const ratings = [];
  for (const handle of handles) {
    try {
      // Fetch solved problems
      const solvedRes = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
      const solved = new Set();
      solvedRes.data.result.forEach(sub => {
        if (sub.verdict === 'OK') {
          solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
      });
      solvedMap[handle] = solved;
    } catch (err) {
      console.error(`[ClanWar] Failed to fetch solved problems for handle '${handle}':`, err.message);
      solvedMap[handle] = new Set();
    }
    try {
      // Fetch rating
      const userRes = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      ratings.push(userRes.data.result[0].rating || 1200);
    } catch (err) {
      console.error(`[ClanWar] Failed to fetch rating for handle '${handle}':`, err.message);
      ratings.push(1200); // Default rating if error
    }
  }
  return { solvedMap, ratings };
}

// 2. Calculate stats (mean, median, Q1, Q3, stddev, IQR)
function getStats(ratings) {
  const sorted = [...ratings].sort((a,b)=>a-b);
  const n = sorted.length;
  const mean = sorted.reduce((a,b) => a+b,0)/n;
  const median = n%2===0 ? (sorted[n/2-1]+sorted[n/2])/2 : sorted[Math.floor(n/2)];
  // Q1: 25th percentile (lower quartile)
  const q1 = n%4===0 ? (sorted[n/4-1]+sorted[n/4])/2 : sorted[Math.floor(n/4)];
  // Q3: 75th percentile (upper quartile)
  const q3 = n%4===0 ? (sorted[n*3/4-1]+sorted[n*3/4])/2 : sorted[Math.floor(n*3/4)];
  // Standard deviation
  const variance = sorted.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const stddev = Math.sqrt(variance);
  const iqr = q3 - q1;
  // Q4 is the max (not standard, but for clarity)
  const q4 = sorted[n-1];
  return { mean, median, q1, q3, q4, stddev, iqr };
}

// 3. Fetch all problems (cache this!)
async function fetchAllProblems() {
  const res = await axios.get('https://codeforces.com/api/problemset.problems');
  return res.data.result.problems;
}

// 4. Select problems for each band (deterministic selection)
function selectProblems(problems, solvedSet, stats, seededRandom) {
  // You can adjust or add bands as needed, using all available stats
  const bands = [
    {name:'A', min:stats.q1-100, max:stats.q1+100},
    {name:'B', min:stats.median-100, max:stats.median+100},
    {name:'C', min:stats.mean-100, max:stats.mean+100},
    {name:'D', min:stats.q3-100, max:stats.q3+100},
    {name:'E', min:stats.q3+stats.iqr-100, max:stats.q3+stats.iqr+100},
    // Optionally, add a band for high difficulty using stddev or q4
    {name:'F', min:stats.mean+stats.stddev-100, max:stats.mean+stats.stddev+100}
  ];
  const selected = [];
  const usedTags = new Set();
  for (const band of bands) {
    // Filter by rating, unsolved, and topic diversity
    let pool = problems.filter(p => p.rating && p.rating>=band.min && p.rating<=band.max && !solvedSet.has(`${p.contestId}-${p.index}`));
    pool = pool.filter(p => !p.tags.some(tag => usedTags.has(tag)));
    // Prefer recent and rare
    pool.sort((a,b) => (a.solvedCount||0)-(b.solvedCount||0));
    if (pool.length === 0) {
      // If not enough unique problems, skip this band
      continue;
    }
    // Deterministic pick from top 10 (or less)
    const pickIdx = Math.floor(seededRandom() * Math.min(pool.length, 10));
    const chosen = pool[pickIdx];
    selected.push({
      ...chosen,
      title: chosen.name || `Problem ${chosen.contestId}-${chosen.index}` || 'Untitled',
      description: '',
      constraints: [],
      examples: [],
      tags: chosen.tags || [],
      id: `${chosen.contestId}-${chosen.index}`
    });
    chosen.tags.forEach(tag => usedTags.add(tag));
  }
  // Assign labels A, B, C, ... in order
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return selected.map((prob, idx) => ({ ...prob, label: labels[idx] || `P${idx+1}` }));
}

// 5. Main orchestrator (deterministic)
export async function generateClanWarProblems(handles1, handles2) {
  try {
    // Always sort handles for determinism
    const sortedHandles1 = [...handles1].map(h => h.toLowerCase()).sort();
    const sortedHandles2 = [...handles2].map(h => h.toLowerCase()).sort();
    const allHandles = [...sortedHandles1, ...sortedHandles2];
    const { solvedMap, ratings } = await fetchClanData(allHandles);
    const solvedSet = new Set();
    Object.values(solvedMap).forEach(set => set.forEach(pid => solvedSet.add(pid)));
    const stats = getStats(ratings);
    const problems = await fetchAllProblems();
    // Use a deterministic seeded random function
    const seed = getSeedFromHandles(handles1, handles2);
    const seededRandom = mulberry32(seed);
    return selectProblems(problems, solvedSet, stats, seededRandom);
  } catch (err) {
    console.error('[ClanWar] Error in generateClanWarProblems:', err.message, err.stack);
    throw err;
  }
}