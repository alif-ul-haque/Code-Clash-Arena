/**
 * Fetches problem details from Codeforces using CORS proxy with multiple fallbacks
 * @param {number} contestId - Contest ID (e.g., 2185)
 * @param {string} problemIndex - Problem index (e.g., 'A', 'B', 'C')
 * @returns {Promise<Object>} Problem details including name, statement, examples, constraints
 */
export const fetchCodeforcesProblem = async (contestId, problemIndex) => {
  try {
    console.log(`Fetching problem ${contestId}${problemIndex}...`);
    
    // Fetch problem metadata using Codeforces API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const apiResponse = await fetch('https://codeforces.com/api/problemset.problems', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const apiData = await apiResponse.json();
    
    if (apiData.status !== 'OK') {
      throw new Error('Failed to fetch problems from Codeforces API');
    }

    // Find the specific problem
    const problem = apiData.result.problems.find(
      p => p.contestId === contestId && p.index === problemIndex
    );

    if (!problem) {
      throw new Error(`Problem ${contestId}${problemIndex} not found`);
    }

    console.log('Problem metadata found:', problem.name);

    // Try multiple CORS proxies in order
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    const targetUrl = `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`;
    let html = null;
    let lastError = null;

    // Try each proxy
    for (const proxy of corsProxies) {
      try {
        console.log(`Trying CORS proxy: ${proxy.slice(0, 30)}...`);
        const proxyController = new AbortController();
        const proxyTimeoutId = setTimeout(() => proxyController.abort(), 15000); // 15 second timeout
        
        const url = proxy.includes('corsproxy.io') 
          ? proxy + encodeURIComponent(targetUrl)
          : proxy.includes('allorigins')
          ? proxy + encodeURIComponent(targetUrl)
          : proxy + targetUrl;
          
        const htmlResponse = await fetch(url, {
          signal: proxyController.signal
        });
        clearTimeout(proxyTimeoutId);
        
        if (htmlResponse.ok) {
          html = await htmlResponse.text();
          console.log('HTML fetched successfully!');
          break;
        }
      } catch (proxyError) {
        console.warn(`Proxy ${proxy} failed:`, proxyError.message);
        lastError = proxyError;
        continue;
      }
    }

    // If we couldn't fetch HTML, return basic problem info from API
    if (!html) {
      console.warn('Could not fetch HTML, using API data only');
      return {
        name: problem.name,
        contestId: problem.contestId,
        index: problem.index,
        rating: problem.rating,
        tags: problem.tags,
        statement: `Problem: ${problem.name}\n\nRating: ${problem.rating}\n\nTags: ${problem.tags.join(', ')}\n\nPlease visit Codeforces for full problem details.`,
        inputSpec: 'See problem on Codeforces',
        outputSpec: 'See problem on Codeforces',
        examples: [{
          input: 'See problem on Codeforces',
          output: 'See problem on Codeforces'
        }],
        constraints: `Visit: https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
        timeLimit: '1 second',
        memoryLimit: '256 megabytes'
      };
    }

    // Parse problem statement and examples from HTML
    const parsedData = parseCodeforcesProblemHTML(html);

    const result = {
      name: problem.name,
      contestId: problem.contestId,
      index: problem.index,
      rating: problem.rating,
      tags: problem.tags,
      statement: parsedData.statement,
      inputSpec: parsedData.inputSpec,
      outputSpec: parsedData.outputSpec,
      examples: parsedData.examples,
      constraints: parsedData.constraints,
      timeLimit: parsedData.timeLimit,
      memoryLimit: parsedData.memoryLimit
    };
    
    console.log('Problem parsed successfully!');
    return result;
  } catch (error) {
    console.error('Error fetching Codeforces problem:', error);
    throw error;
  }
};

/**
 * Parses Codeforces problem HTML to extract statement and examples
 * @param {string} html - HTML content from Codeforces problem page
 * @returns {Object} Parsed problem data
 */
const parseCodeforcesProblemHTML = (html) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract problem statement
    const statementDiv = doc.querySelector('.problem-statement');
    
    if (!statementDiv) {
      console.warn('Problem statement div not found');
      return getDefaultProblemData();
    }
    
    // Extract time and memory limits
    const timeLimitElement = doc.querySelector('.time-limit');
    const memoryLimitElement = doc.querySelector('.memory-limit');
    
    const timeLimit = timeLimitElement 
      ? timeLimitElement.textContent.replace('time limit per test', '').trim() 
      : '1 second';
    const memoryLimit = memoryLimitElement 
      ? memoryLimitElement.textContent.replace('memory limit per test', '').trim() 
      : '256 megabytes';

    // Extract main problem statement
    let statement = '';
    const statementParagraphs = statementDiv.querySelectorAll('.header + div p, .header ~ div p');
    if (statementParagraphs && statementParagraphs.length > 0) {
      statement = Array.from(statementParagraphs)
        .map(p => p.textContent.trim())
        .filter(text => text.length > 0)
        .join('\n\n');
    }
    
    // Fallback: get all text content from statement div
    if (!statement) {
      const headerDiv = statementDiv.querySelector('.header');
      if (headerDiv && headerDiv.nextElementSibling) {
        statement = headerDiv.nextElementSibling.textContent.trim();
      }
    }

    // Extract input specification
    let inputSpec = '';
    const inputHeader = Array.from(doc.querySelectorAll('.section-title')).find(
      el => el.textContent.trim() === 'Input'
    );
    if (inputHeader && inputHeader.nextElementSibling) {
      inputSpec = inputHeader.nextElementSibling.textContent.trim();
    }

    // Extract output specification
    let outputSpec = '';
    const outputHeader = Array.from(doc.querySelectorAll('.section-title')).find(
      el => el.textContent.trim() === 'Output'
    );
    if (outputHeader && outputHeader.nextElementSibling) {
      outputSpec = outputHeader.nextElementSibling.textContent.trim();
    }

    // Extract examples
    const examples = [];
    const sampleTests = doc.querySelector('.sample-test');
    
    if (sampleTests) {
      const inputs = sampleTests.querySelectorAll('.input pre');
      const outputs = sampleTests.querySelectorAll('.output pre');
      
      for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
        examples.push({
          input: inputs[i].textContent.trim(),
          output: outputs[i].textContent.trim()
        });
      }
    }

    // Extract constraints/notes
    let constraints = '';
    const noteHeader = Array.from(doc.querySelectorAll('.section-title')).find(
      el => el.textContent.trim() === 'Note'
    );
    if (noteHeader && noteHeader.nextElementSibling) {
      constraints = noteHeader.nextElementSibling.textContent.trim();
    }

    return {
      statement: statement || 'Problem statement could not be parsed.',
      inputSpec,
      outputSpec,
      examples: examples.length > 0 ? examples : [{ input: 'Example not available', output: 'Example not available' }],
      constraints,
      timeLimit,
      memoryLimit
    };
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return getDefaultProblemData();
  }
};

/**
 * Returns default problem data as fallback
 * @returns {Object} Default problem structure
 */
const getDefaultProblemData = () => {
  return {
    statement: 'Failed to parse problem statement. Please refresh the page.',
    inputSpec: '',
    outputSpec: '',
    examples: [],
    constraints: '',
    timeLimit: '1 second',
    memoryLimit: '256 megabytes'
  };
};

/**
 * Gets a random Codeforces problem within a rating range
 * @param {number} minRating - Minimum problem rating
 * @param {number} maxRating - Maximum problem rating
 * @returns {Promise<Object>} Random problem details
 */
export const getRandomCodeforcesProblem = async (minRating = 800, maxRating = 1600) => {
  try {
    const response = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error('Failed to fetch problems');
    }

    // Filter problems by rating
    const filteredProblems = data.result.problems.filter(
      p => p.rating >= minRating && p.rating <= maxRating
    );

    if (filteredProblems.length === 0) {
      throw new Error('No problems found in the specified rating range');
    }

    // Select random problem
    const randomProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
    
    // Fetch full problem details
    return await fetchCodeforcesProblem(randomProblem.contestId, randomProblem.index);
  } catch (error) {
    console.error('Error getting random problem:', error);
    throw error;
  }
};
