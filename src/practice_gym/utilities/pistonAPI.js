const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mapping for Piston API
const LANGUAGE_MAP = {
  'Python': { language: 'python', version: '3.10.0' },
  'C++': { language: 'c++', version: '10.2.0' },
  'Java': { language: 'java', version: '15.0.2' },
  'JavaScript': { language: 'javascript', version: '18.15.0' },
  'C': { language: 'c', version: '10.2.0' },
  'C#': { language: 'csharp', version: '6.12.0' },
  'Go': { language: 'go', version: '1.16.2' },
  'Rust': { language: 'rust', version: '1.68.2' },
  'Ruby': { language: 'ruby', version: '3.0.1' },
  'PHP': { language: 'php', version: '8.2.3' }
};

export const pistonAPI = {
  // Execute code
  async executeCode(language, code, stdin = '') {
    try {
      const languageConfig = LANGUAGE_MAP[language];
      
      if (!languageConfig) {
        throw new Error(`Language "${language}" is not supported`);
      }

      const response = await fetch(`${PISTON_API_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: languageConfig.language,
          version: languageConfig.version,
          files: [
            {
              content: code
            }
          ],
          stdin: stdin,
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: -1,
          run_memory_limit: -1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error executing code:', error);
      throw error;
    }
  },

  // Get available runtimes
  async getRuntimes() {
    try {
      const response = await fetch(`${PISTON_API_URL}/runtimes`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching runtimes:', error);
      throw error;
    }
  }
};

// Analyze execution result and return verdict
export const getVerdict = (result) => {
  // Check for compilation error
  if (result.compile && result.compile.code !== 0) {
    return {
      status: 'Compilation Error',
      statusClass: 'ce',
      message: result.compile.stderr || result.compile.output || 'Compilation failed',
      details: result.compile
    };
  }

  // Check for runtime error
  if (result.run && result.run.code !== 0) {
    // Check if it's a timeout
    if (result.run.signal === 'SIGTERM' || result.run.signal === 'SIGKILL') {
      return {
        status: 'Time Limit Exceeded',
        statusClass: 'tle',
        message: 'Your code took too long to execute',
        output: result.run.stdout || '',
        error: result.run.stderr || '',
        details: result.run
      };
    }

    return {
      status: 'Runtime Error',
      statusClass: 're',
      message: result.run.stderr || 'Runtime error occurred',
      output: result.run.stdout || '',
      error: result.run.stderr || '',
      details: result.run
    };
  }

  // Successful execution
  if (result.run) {
    return {
      status: 'Executed Successfully',
      statusClass: 'success',
      message: 'Code executed without errors',
      output: result.run.stdout || '(no output)',
      error: result.run.stderr || '',
      details: result.run
    };
  }

  return {
    status: 'Unknown Error',
    statusClass: 'error',
    message: 'An unknown error occurred',
    details: result
  };
};

// Compare output with expected output
export const checkTestCase = (actualOutput, expectedOutput) => {
  const actual = actualOutput.trim();
  const expected = expectedOutput.trim();
  
  if (actual === expected) {
    return {
      passed: true,
      status: 'Accepted',
      statusClass: 'ac'
    };
  } else {
    return {
      passed: false,
      status: 'Wrong Answer',
      statusClass: 'wa',
      expected: expected,
      actual: actual
    };
  }
};

// Run code against multiple test cases
export const runTestCases = async (language, code, testCases) => {
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    try {
      const result = await pistonAPI.executeCode(language, code, testCase.input);
      const verdict = getVerdict(result);
      
      if (verdict.statusClass === 'success' && testCase.output) {
        // Check against expected output
        const check = checkTestCase(verdict.output, testCase.output);
        results.push({
          testCaseNumber: i + 1,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: verdict.output,
          ...check
        });
      } else {
        // Compilation or runtime error
        results.push({
          testCaseNumber: i + 1,
          input: testCase.input,
          passed: false,
          ...verdict
        });
      }
    } catch (error) {
      results.push({
        testCaseNumber: i + 1,
        input: testCase.input,
        passed: false,
        status: 'Error',
        statusClass: 'error',
        message: error.message
      });
    }
  }
  
  return results;
};

export const getSupportedLanguages = () => {
  return Object.keys(LANGUAGE_MAP);
};
