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

    // Try multiple CORS proxies in order (most reliable first)
    const targetUrl = `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`;
    const corsProxies = [
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
    ];
    
    let html = null;
    let lastError = null;

    // Try each proxy
    for (let i = 0; i < corsProxies.length; i++) {
      try {
        const proxyUrl = corsProxies[i];
        console.log(`[Attempt ${i + 1}/${corsProxies.length}] Fetching HTML...`);
        
        const proxyController = new AbortController();
        const proxyTimeoutId = setTimeout(() => proxyController.abort(), 20000); // 20 second timeout
        
        const htmlResponse = await fetch(proxyUrl, {
          signal: proxyController.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        clearTimeout(proxyTimeoutId);
        
        if (htmlResponse.ok) {
          html = await htmlResponse.text();
          
          // Verify HTML contains problem content
          if (html && html.includes('problem-statement')) {
            console.log(`✓ HTML fetched successfully (${Math.round(html.length / 1024)}KB)`);
            break;
          } else {
            console.warn('HTML fetched but does not contain problem statement');
            html = null;
          }
        } else {
          console.warn(`HTTP ${htmlResponse.status}: ${htmlResponse.statusText}`);
        }
      } catch (proxyError) {
        console.warn(`Proxy failed: ${proxyError.message}`);
        lastError = proxyError;
        continue;
      }
    }
    
    console.log(html ? '✓ Problem HTML ready for parsing' : '✗ All proxies failed');

    // If we couldn't fetch HTML, return basic problem info from API
    if (!html) {
      console.error('⚠️ All CORS proxies failed. Cannot fetch problem HTML.');
      console.log('Returning API metadata only (no problem statement available)');
      
      return {
        name: problem.name,
        contestId: problem.contestId,
        index: problem.index,
        rating: problem.rating,
        tags: problem.tags,
        statement: `⚠️ Unable to fetch full problem details due to network restrictions.\n\nProblem Name: ${problem.name}\nDifficulty Rating: ${problem.rating || 'Not rated'}\nTags: ${problem.tags.join(', ')}\n\nDue to CORS limitations, please visit the link below for the complete problem statement, input/output format, and examples:\n\nhttps://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
        inputSpec: 'Visit Codeforces link above for input format',
        outputSpec: 'Visit Codeforces link above for output format',
        examples: [{
          input: 'Visit Codeforces link above',
          output: 'Visit Codeforces link above'
        }],
        constraints: `Full problem: https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
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
    console.log('Parsing HTML for problem details...');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract problem statement
    const statementDiv = doc.querySelector('.problem-statement');
    
    if (!statementDiv) {
      console.error('❌ .problem-statement div not found in HTML');
      console.log('HTML preview:', html.substring(0, 500));
      return getDefaultProblemData();
    }
    
    console.log('✓ Found .problem-statement div');
    
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
        .map(p => {
          // Get HTML content and process .tex-span elements
          let html = p.innerHTML;
          
          // Replace .tex-span elements with their text content (removing $ delimiters)
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          
          // Find all .tex-span elements and replace with plain text
          const texSpans = tempDiv.querySelectorAll('.tex-span');
          texSpans.forEach(span => {
            let mathText = span.textContent.trim();
            // Remove $ delimiters if present
            mathText = mathText.replace(/^\$+|\$+$/g, '');
            span.replaceWith(mathText);
          });
          
          return tempDiv.textContent.trim();
        })
        .filter(text => text.length > 0)
        .join('\n\n');
    }
    
    // Fallback: get all text content from statement div
    if (!statement) {
      const headerDiv = statementDiv.querySelector('.header');
      if (headerDiv && headerDiv.nextElementSibling) {
        const contentDiv = headerDiv.nextElementSibling;
        
        // Process .tex-span elements
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentDiv.innerHTML;
        const texSpans = tempDiv.querySelectorAll('.tex-span');
        texSpans.forEach(span => {
          let mathText = span.textContent.trim();
          mathText = mathText.replace(/^\$+|\$+$/g, '');
          span.replaceWith(mathText);
        });
        
        statement = tempDiv.textContent.trim();
      }
    }
    
    // Clean up any remaining $ signs
    statement = statement.replace(/\$+/g, '');

    // Extract input specification
    let inputSpec = '';
    const inputHeader = Array.from(doc.querySelectorAll('.section-title')).find(
      el => el.textContent.trim() === 'Input'
    );
    if (inputHeader && inputHeader.nextElementSibling) {
      const inputDiv = inputHeader.nextElementSibling;
      
      // Process .tex-span elements
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = inputDiv.innerHTML;
      const texSpans = tempDiv.querySelectorAll('.tex-span');
      texSpans.forEach(span => {
        let mathText = span.textContent.trim();
        mathText = mathText.replace(/^\$+|\$+$/g, '');
        span.replaceWith(mathText);
      });
      
      inputSpec = tempDiv.textContent.trim();
      inputSpec = inputSpec.replace(/\$+/g, '');
    }

    // Extract output specification
    let outputSpec = '';
    const outputHeader = Array.from(doc.querySelectorAll('.section-title')).find(
      el => el.textContent.trim() === 'Output'
    );
    if (outputHeader && outputHeader.nextElementSibling) {
      const outputDiv = outputHeader.nextElementSibling;
      
      // Process .tex-span elements
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = outputDiv.innerHTML;
      const texSpans = tempDiv.querySelectorAll('.tex-span');
      texSpans.forEach(span => {
        let mathText = span.textContent.trim();
        mathText = mathText.replace(/^\$+|\$+$/g, '');
        span.replaceWith(mathText);
      });
      
      outputSpec = tempDiv.textContent.trim();
      outputSpec = outputSpec.replace(/\$+/g, '');
    }

    // Extract examples
    const examples = [];
    const sampleTests = doc.querySelector('.sample-test');
    
    if (sampleTests) {
      const inputs = sampleTests.querySelectorAll('.input pre');
      const outputs = sampleTests.querySelectorAll('.output pre');
      
      console.log(`Found ${inputs.length} sample inputs and ${outputs.length} sample outputs`);
      
      for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
        examples.push({
          input: inputs[i].textContent.trim(),
          output: outputs[i].textContent.trim()
        });
      }
    } else {
      console.warn('⚠️ No .sample-test section found');
    }

    // Extract constraints/notes
    let constraints = '';
    const noteHeader = Array.from(doc.querySelectorAll('.section-title')).find(
      el => el.textContent.trim() === 'Note'
    );
    if (noteHeader && noteHeader.nextElementSibling) {
      const noteDiv = noteHeader.nextElementSibling;
      
      // Process .tex-span elements
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = noteDiv.innerHTML;
      const texSpans = tempDiv.querySelectorAll('.tex-span');
      texSpans.forEach(span => {
        let mathText = span.textContent.trim();
        mathText = mathText.replace(/^\$+|\$+$/g, '');
        span.replaceWith(mathText);
      });
      
      constraints = tempDiv.textContent.trim();
      constraints = constraints.replace(/\$+/g, '');
    }

    const result = {
      statement: statement || 'Problem statement could not be parsed.',
      inputSpec: inputSpec || 'Not specified',
      outputSpec: outputSpec || 'Not specified',
      examples: examples.length > 0 ? examples : [{ input: 'No examples available', output: 'No examples available' }],
      constraints: constraints || 'No additional notes',
      timeLimit,
      memoryLimit
    };
    
    console.log(`✓ Parsed successfully: ${examples.length} examples, statement length: ${statement.length} chars`);
    return result;
  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
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
