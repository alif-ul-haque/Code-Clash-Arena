/**
 * Codeforces Submission Utility
 * Handles submission to Codeforces and verdict checking
 */

/**
 * Submit code to Codeforces using browser session cookies (like vjudge)
 * @param {number} contestId - Contest ID
 * @param {string} problemIndex - Problem index (A, B, C, etc.)
 * @param {string} sourceCode - Code to submit
 * @param {string} language - Programming language
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const submitCodeWithSession = async (contestId, problemIndex, sourceCode, language) => {
    return new Promise((resolve, reject) => {
        try {
            // Language mapping to Codeforces program type IDs
            const languageMap = {
                'PYTHON': '31',      // Python 3.8.10
                'PYTHON3': '31',
                'C++': '54',         // GNU G++17 7.3.0
                'CPP': '54',
                'JAVA': '60',        // Java 11.0.6
                'JAVASCRIPT': '55',  // Node.js 12.6.3
                'JS': '55'
            };

            const programTypeId = languageMap[language.toUpperCase()] || '31';

            // Create hidden iframe for submission
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'cf-submit-frame';
            document.body.appendChild(iframe);

            // Create form to submit to Codeforces
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `https://codeforces.com/problemset/submit?csrf_token=${Date.now()}`;
            form.target = 'cf-submit-frame';
            form.style.display = 'none';

            // Add form fields
            const fields = {
                'action': 'submitSolutionFormSubmitted',
                'submittedProblemIndex': problemIndex,
                'contestId': contestId.toString(),
                'programTypeId': programTypeId,
                'source': sourceCode,
                'tabSize': '4',
                'sourceFile': ''
            };

            Object.keys(fields).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = fields[key];
                form.appendChild(input);
            });

            document.body.appendChild(form);

            // Listen for iframe load (submission complete)
            let submitted = false;
            iframe.onload = () => {
                if (!submitted) {
                    submitted = true;
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        document.body.removeChild(form);
                    }, 1000);
                    
                    resolve({
                        success: true,
                        message: 'Code submitted successfully!'
                    });
                }
            };

            // Handle errors
            iframe.onerror = () => {
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                reject(new Error('Submission failed. Please check your Codeforces login.'));
            };

            // Submit form automatically
            form.submit();

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!submitted) {
                    document.body.removeChild(iframe);
                    document.body.removeChild(form);
                    reject(new Error('Submission timeout. Please try again.'));
                }
            }, 10000);

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Checks if user is logged into Codeforces
 * @param {string} cfHandle - User's Codeforces handle
 * @returns {Promise<boolean>} True if logged in
 */
export const checkCodeforcesLogin = async (cfHandle) => {
  try {
    // Try to fetch user's submissions to verify login
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=1`);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking Codeforces login:', error);
    return false;
  }
};

/**
 * Opens Codeforces problem page for manual submission
 * Since Codeforces doesn't have a public submission API, we open the submit page
 * @param {number} contestId - Contest ID
 * @param {string} problemIndex - Problem index (A, B, C, etc.)
 * @param {string} code - Source code to submit
 * @param {string} language - Programming language
 * @returns {Window} Reference to opened window
 */
export const openCodeforcesSubmitPage = (contestId, problemIndex, code, language) => {
  const submitUrl = `https://codeforces.com/problemset/submit/${contestId}/${problemIndex}`;
  
  // Copy code to clipboard for easy pasting
  navigator.clipboard.writeText(code).then(() => {
    console.log('Code copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy code:', err);
  });
  
  // Open Codeforces submit page
  const submitWindow = window.open(submitUrl, '_blank', 'width=1200,height=800');
  
  return submitWindow;
};

/**
 * Language mapping from our app to Codeforces language IDs
 */
const languageMapping = {
  'PYTHON': 'Python 3',
  'JAVASCRIPT': 'JavaScript',
  'JAVA': 'Java 11',
  'C++': 'GNU C++17'
};

/**
 * Gets recent submissions for a user and checks for the problem
 * @param {string} cfHandle - Codeforces handle
 * @param {number} contestId - Contest ID
 * @param {string} problemIndex - Problem index
 * @returns {Promise<Object|null>} Latest submission or null
 */
export const getLatestSubmission = async (cfHandle, contestId, problemIndex) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=10`
    );
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error('Failed to fetch submissions');
    }
    
    // Find submission for this problem
    const submission = data.result.find(
      s => s.problem.contestId === contestId && s.problem.index === problemIndex
    );
    
    return submission || null;
  } catch (error) {
    console.error('Error fetching latest submission:', error);
    return null;
  }
};

/**
 * Polls for submission verdict
 * @param {string} cfHandle - Codeforces handle
 * @param {number} contestId - Contest ID
 * @param {string} problemIndex - Problem index
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} interval - Polling interval in ms
 * @returns {Promise<Object>} Submission with verdict
 */
export const pollForVerdict = async (
  cfHandle, 
  contestId, 
  problemIndex, 
  maxAttempts = 30, 
  interval = 3000
) => {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const submission = await getLatestSubmission(cfHandle, contestId, problemIndex);
        
        if (!submission) {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            reject(new Error('No submission found'));
          }
          return;
        }
        
        // Check if verdict is ready (not null and not "TESTING")
        if (submission.verdict && submission.verdict !== 'TESTING') {
          clearInterval(pollInterval);
          resolve(submission);
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          reject(new Error('Verdict check timeout'));
        }
      } catch (error) {
        clearInterval(pollInterval);
        reject(error);
      }
    }, interval);
  });
};

/**
 * Checks if verdict is accepted
 * @param {string} verdict - Codeforces verdict
 * @returns {boolean} True if accepted
 */
export const isVerdictAccepted = (verdict) => {
  return verdict === 'OK';
};

/**
 * Gets human-readable verdict message
 * @param {string} verdict - Codeforces verdict
 * @returns {string} Readable message
 */
export const getVerdictMessage = (verdict) => {
  const verdictMessages = {
    'OK': 'Accepted',
    'WRONG_ANSWER': 'Wrong Answer',
    'TIME_LIMIT_EXCEEDED': 'Time Limit Exceeded',
    'MEMORY_LIMIT_EXCEEDED': 'Memory Limit Exceeded',
    'RUNTIME_ERROR': 'Runtime Error',
    'COMPILATION_ERROR': 'Compilation Error',
    'FAILED': 'Failed',
    'TESTING': 'Testing...'
  };
  
  return verdictMessages[verdict] || verdict;
};

/**
 * Validates Codeforces handle format
 * @param {string} handle - Codeforces handle
 * @returns {boolean} True if valid
 */
export const isValidHandle = (handle) => {
  // Codeforces handles: 3-24 characters, letters, digits, underscore, hyphen
  const handleRegex = /^[a-zA-Z0-9_-]{3,24}$/;
  return handleRegex.test(handle);
};

/**
 * Complete submission workflow with automatic verdict checking
 * @param {Object} params - Submission parameters
 * @returns {Promise<Object>} Result with verdict and status
 */
export const submitAndWaitForVerdict = async ({
  cfHandle,
  contestId,
  problemIndex,
  code,
  language
}) => {
  try {
    // Step 1: Validate handle
    if (!isValidHandle(cfHandle)) {
      throw new Error('Invalid Codeforces handle');
    }
    
    // Step 2: Check login status
    const isLoggedIn = await checkCodeforcesLogin(cfHandle);
    if (!isLoggedIn) {
      return {
        success: false,
        requiresLogin: true,
        message: 'Please log into Codeforces first'
      };
    }
    
    // Step 3: Open submit page (user must submit manually)
    const submitWindow = openCodeforcesSubmitPage(contestId, problemIndex, code, language);
    
    // Step 4: Wait a bit for user to submit
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 5: Start polling for verdict
    console.log('Checking for submission verdict...');
    const submission = await pollForVerdict(cfHandle, contestId, problemIndex);
    
    return {
      success: true,
      verdict: submission.verdict,
      verdictMessage: getVerdictMessage(submission.verdict),
      accepted: isVerdictAccepted(submission.verdict),
      timeConsumed: submission.timeConsumedMillis,
      memoryConsumed: submission.memoryConsumedBytes,
      submission: submission
    };
  } catch (error) {
    console.error('Submission workflow error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
