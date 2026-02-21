

// Express route for clan war problem selection (ESM)
import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
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

    // Try to enrich each problem with full statement and samples from a public OJ API
    // Using the unofficial Codeforces API hosted at codeforces-api.vercel.app
    const enriched = await Promise.all(problems.map(async (p) => {
      try {
        const contestId = p.contestId || (p.id ? p.id.split('-')[0] : null);
        const index = p.index || (p.id ? p.id.split('-')[1] : null);
        if (!contestId || !index) return { ...p, link: p.link || `https://codeforces.com/problemset/problem/${p.contestId || contestId}/${p.index || index}` };

        const apiUrl = `https://codeforces-api.vercel.app/api/problem/${contestId}/${index}`;
        let data = {};
        try {
          const resp = await axios.get(apiUrl, { timeout: 10000 });
          data = resp.data || {};
        } catch (apiErr) {
          console.warn('[ClanWar] OJ API failed for', contestId, index, apiErr.message);
        }

        // Map potential fields from the OJ API to our frontend shape
        let statement = data.statement || data.body || data.html || data.description || p.description || '';
        let examples = data.examples || data.samples || (data.sampleTests ? data.sampleTests : p.examples || []);
        let constraints = data.constraints || data.notes || p.constraints || [];

        // If OJ API returned no statement, attempt server-side scrape from Codeforces
        if (!statement || statement.length < 20) {
          try {
            console.log('[ClanWar] OJ API returned no statement, scraping Codeforces page for', contestId, index);
            const scraped = await scrapeCodeforcesProblem(contestId, index);
            if (scraped && scraped.statement) {
              statement = scraped.statement;
            }
            if (scraped && Array.isArray(scraped.examples) && scraped.examples.length > 0) {
              examples = scraped.examples;
            }
            if (scraped && scraped.constraints) {
              constraints = Array.isArray(scraped.constraints) ? scraped.constraints : [scraped.constraints];
            }
          } catch (err) {
            console.warn('[ClanWar] Scraping fallback failed for', contestId, index, err.message);
          }
        }
        const timeLimit = data.timeLimit || data.time_limit || p.timeLimit || '';
        const memoryLimit = data.memoryLimit || data.memory_limit || p.memoryLimit || '';

        // If still no statement, provide a user-friendly fallback
        if (!statement || statement.length < 20) {
          statement = 'Problem statement is not available from the OJ API. You can view the full statement and test cases on Codeforces.';
        }

        return {
          ...p,
          title: p.title || data.title || p.name,
          description: statement,
          examples: Array.isArray(examples) ? examples : (examples ? [examples] : []),
          constraints: Array.isArray(constraints) ? constraints : (constraints ? [constraints] : []),
          timeLimit,
          memoryLimit,
          link: p.link || `https://codeforces.com/problemset/problem/${contestId}/${index}`,
          contestId: contestId,
          index: index
        };
      } catch (err) {
        console.warn('[ClanWar] Failed to enrich problem', p.id || p.contestId, err.message);
        // Always return a fallback object
        const contestId = p.contestId || (p.id ? p.id.split('-')[0] : null);
        const index = p.index || (p.id ? p.id.split('-')[1] : null);
        return {
          ...p,
          title: p.title || p.name || 'Unknown Problem',
          description: 'Problem statement is not available from the OJ API. You can view the full statement and test cases on Codeforces.',
          examples: [],
          constraints: [],
          link: p.link || (contestId && index ? `https://codeforces.com/problemset/problem/${contestId}/${index}` : '#'),
          contestId: contestId,
          index: index
        };
      }
    }));

    // Deduplicate problems by contestId-index
    const seen = new Set();
    const deduped = [];
    for (const prob of enriched) {
      const pid = `${prob.contestId || prob.id || ''}-${prob.index || ''}`;
      if (!seen.has(pid)) {
        seen.add(pid);
        deduped.push(prob);
      }
    }
    clanWarProblemsCache[clanWarId] = deduped;
    console.log('[ClanWar] Problems generated, enriched and cached for', clanWarId);
    // Log summary for debugging: title, statement length, examples count
    deduped.forEach((ep, idx) => {
      try {
        const title = ep.title || ep.name || `#${idx}`;
        const descLen = (ep.description || ep.statement || '').length;
        const exCount = Array.isArray(ep.examples) ? ep.examples.length : (ep.examples ? 1 : 0);
        console.log(`[ClanWar] Problem[${idx}] ${title} — descLen=${descLen}, examples=${exCount}, link=${ep.link}`);
      } catch (e) {
        console.log('[ClanWar] Problem logging error', e.message);
      }
    });
    res.json(deduped);
  } catch (err) {
    console.error('[ClanWar] ERROR:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

export default router;

/**
 * Scrape Codeforces problem page and extract statement and sample tests
 */
async function scrapeCodeforcesProblem(contestId, index) {
  try {
    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    const resp = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'CCA-Bot/1.0' } });
    const $ = load(resp.data);

    const stmt = $('.problem-statement').first();
    let statementText = '';
    if (stmt && stmt.length) {
      // remove script/style
      stmt.find('script, style').remove();
      statementText = stmt.text().trim().replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n\n');
    }

    const examples = [];
    const sample = $('.sample-test');
    if (sample && sample.length) {
      const inputs = sample.find('.input pre');
      const outputs = sample.find('.output pre');
      for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
        examples.push({ input: $(inputs[i]).text().trim(), output: $(outputs[i]).text().trim() });
      }
    }

    // Try to capture time/memory
    let timeLimit = '';
    const tEl = $('.time-limit').first();
    if (tEl && tEl.length) timeLimit = tEl.text().trim();

    let memoryLimit = '';
    const mEl = $('.memory-limit').first();
    if (mEl && mEl.length) memoryLimit = mEl.text().trim();

    return { statement: statementText, examples, timeLimit, memoryLimit };
  } catch (err) {
    console.warn('[ClanWar] scrapeCodeforcesProblem error:', err.message);
    return null;
  }
}
