/**
 * AI Hint Generation using Groq API
 * Fast and free inference with Llama 3 models
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'gsk_your_api_key_here';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate hint using Groq API
 * @param {Object} problem - Problem details
 * @param {number} hintLevel - 1 (subtle), 2 (detailed), 3 (algorithm)
 * @param {string} userCode - User's current code attempt
 * @returns {Promise<{success: boolean, hint: string, level: number}>}
 */
export const generateHint = async (problem, hintLevel = 1, userCode = '') => {
  const prompts = {
    1: {
      system: "You are a helpful programming tutor who gives subtle hints without revealing solutions. Guide students to discover answers themselves.",
      user: `Problem: ${problem.name || problem.title}

${problem.statement || problem.description}

Give a subtle hint about what approach or data structure to consider. DO NOT provide code or detailed steps. Just point the student in the right direction.

Keep it under 100 words and use an emoji at the start.`
    },
    2: {
      system: "You are a programming tutor who provides detailed guidance while encouraging independent thinking.",
      user: `Problem: ${problem.name || problem.title}

${problem.statement || problem.description}

${userCode ? `Student's attempt so far:\n${userCode}\n\n` : ''}

Provide a more detailed hint explaining the algorithm approach and key insights needed to solve this. You can mention specific techniques or data structures, but DON'T write actual code.

Keep it under 200 words.`
    },
    3: {
      system: "You are a programming tutor who provides comprehensive explanations with pseudocode.",
      user: `Problem: ${problem.name || problem.title}

${problem.statement || problem.description}

Provide a step-by-step algorithm explanation with pseudocode. Break down the solution approach clearly. You can use pseudocode notation but NOT actual programming language syntax.

Format as numbered steps with pseudocode blocks.`
    }
  };

  try {
    const selectedPrompt = prompts[hintLevel];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and capable model
        messages: [
          {
            role: 'system',
            content: selectedPrompt.system
          },
          {
            role: 'user',
            content: selectedPrompt.user
          }
        ],
        max_tokens: hintLevel === 1 ? 150 : hintLevel === 2 ? 300 : 500,
        temperature: 0.7,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate hint');
    }

    const data = await response.json();
    const hint = data.choices[0].message.content;

    return {
      success: true,
      hint: hint.trim(),
      level: hintLevel
    };
  } catch (error) {
    console.error('Groq API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate hint',
      hint: getFallbackHint(hintLevel)
    };
  }
};

/**
 * Fallback hints when API fails
 */
const getFallbackHint = (level) => {
  const fallbacks = {
    1: "💡 Think about the time complexity required. What data structure allows fast lookups? Consider the problem constraints carefully.",
    2: "🔍 Break the problem into smaller steps:\n1. Understand what you're looking for\n2. Think about what information you need to track\n3. Consider if you've seen similar patterns before\n4. What's the most efficient way to store and retrieve data?",
    3: "📝 General approach:\n1. Read and understand all inputs\n2. Identify the key operation you need to perform\n3. Choose appropriate data structures\n4. Implement your logic step by step\n5. Handle edge cases\n6. Test with examples"
  };
  
  return fallbacks[level] || fallbacks[1];
};

/**
 * Pre-generated hints for common Codeforces problems
 * These are served instantly without API calls
 */
export const preGeneratedHints = {
  // Two Sum pattern (1A Theatre Square and similar)
  '1A': {
    level1: "💡 This is a pure math problem. Think about how many tiles you need in each dimension separately, then multiply.",
    level2: "🔍 You need to cover an n×m area with a×a tiles. Use ceiling division: ⌈n/a⌉ × ⌈m/a⌉. In code, ceiling division of x/y = (x + y - 1) / y",
    level3: "📝 Algorithm:\n1. Calculate tiles needed for width: tiles_width = (n + a - 1) / a\n2. Calculate tiles needed for height: tiles_height = (m + a - 1) / a\n3. Total tiles = tiles_width × tiles_height\n\nNote: Use integer division, not floating point."
  },
  
  '4A': {
    level1: "💡 Think about the definition of 'even'. When can a number be split into two even numbers? What's the smallest even number?",
    level2: "🔍 For a watermelon to be divisible into two even parts, its weight must be even AND greater than 2 (since 2 cannot be split into two positive even numbers).",
    level3: "📝 Solution:\nIF weight > 2 AND weight is even:\n    PRINT 'YES'\nELSE:\n    PRINT 'NO'\n\nEdge case: w=2 gives 'NO' because 2=1+1 (both odd)"
  },

  '71A': {
    level1: "💡 What should you do when a word is longer than 10 characters? Think about what information you keep and what you remove.",
    level2: "🔍 For words longer than 10 characters, abbreviate as: first_letter + number_of_letters_between + last_letter. Example: 'localization' → 'l10n' (l + 10 letters between + n)",
    level3: "📝 Algorithm:\nFOR each word:\n    IF length > 10:\n        result = first_char + (length-2) + last_char\n    ELSE:\n        result = word\n    PRINT result"
  }
};

/**
 * Get hint with fallback to pre-generated hints
 * @param {Object} problem - Problem details  
 * @param {number} hintLevel - Hint level (1-3)
 * @param {string} userCode - User's code
 * @returns {Promise<{success: boolean, hint: string, level: number, isPreGenerated: boolean}>}
 */
export const getSmartHint = async (problem, hintLevel = 1, userCode = '') => {
  const problemId = `${problem.contestId}${problem.index}`;
  
  // Try pre-generated hints first (instant, free)
  const preGenerated = preGeneratedHints[problemId];
  if (preGenerated && preGenerated[`level${hintLevel}`]) {
    return {
      success: true,
      hint: preGenerated[`level${hintLevel}`],
      level: hintLevel,
      isPreGenerated: true
    };
  }
  
  // Fall back to AI generation
  const result = await generateHint(problem, hintLevel, userCode);
  return {
    ...result,
    isPreGenerated: false
  };
};
