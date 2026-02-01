/**
 * Codeforces Submission Utility
 * Handles submission to Codeforces and verdict checking
 */

/**
 * Submit code to Codeforces by copying to clipboard and opening submit page
 * @param {number} contestId - Contest ID
 * @param {string} problemIndex - Problem index (A, B, C, etc.)
 * @param {string} sourceCode - Code to submit
 * @param {string} language - Programming language
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const submitCodeWithSession = async (contestId, problemIndex, sourceCode, language) => {
    return new Promise(async (resolve, reject) => {
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

            const languageNames = {
                'PYTHON': 'Python 3',
                'C++': 'GNU G++17',
                'JAVA': 'Java 11',
                'JAVASCRIPT': 'Node.js'
            };

            const programTypeId = languageMap[language.toUpperCase()];
            const langDisplay = languageNames[language.toUpperCase()] || language;
            
            if (!programTypeId) {
                reject(new Error(`Unsupported language: ${language}`));
                return;
            }
            
            // Copy code to clipboard for easy pasting
            try {
                await navigator.clipboard.writeText(sourceCode);
                console.log('✓ Code copied to clipboard');
            } catch (clipboardErr) {
                console.warn('Could not copy to clipboard:', clipboardErr);
            }
            
            // Open Codeforces submission page directly
            const submitUrl = `https://codeforces.com/problemset/submit/${contestId}/${problemIndex}`;
            const submitWindow = window.open(submitUrl, 'cf_submit', 'width=1200,height=900,scrollbars=yes');
            
            if (!submitWindow) {
                reject(new Error('Popup blocked! Please allow popups for this site.'));
                return;
            }

            console.log('Opened Codeforces submission page');
            
            // Show notification and return popup reference
            resolve({
                success: true,
                message: `Opening Codeforces submit page...\n\n✓ Code copied to clipboard!\n✓ Language: ${langDisplay}\n\nJust paste (Ctrl+V) and submit!`,
                popupWindow: submitWindow
            });

        } catch (error) {
            console.error('Submission error:', error);
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
 * @param {number} afterTimestamp - Only return submissions created after this timestamp (seconds)
 * @returns {Promise<Object|null>} Latest submission or null
 */
export const getLatestSubmission = async (cfHandle, contestId, problemIndex, afterTimestamp = 0) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=30`
    );
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error('Failed to fetch submissions');
    }
    
    console.log(`Checking submissions after timestamp: ${afterTimestamp} (${new Date(afterTimestamp * 1000).toISOString()})`);
    
    // Filter all submissions for this problem created after the timestamp
    const matchingSubmissions = data.result.filter(
      s => s.problem.contestId === contestId && 
           s.problem.index === problemIndex &&
           s.creationTimeSeconds > afterTimestamp
    );
    
    if (matchingSubmissions.length > 0) {
      console.log(`Found ${matchingSubmissions.length} matching submissions`);
      // Sort by creation time (newest first) and return the most recent
      matchingSubmissions.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);
      const latest = matchingSubmissions[0];
      console.log(`Latest submission: ID ${latest.id}, created at ${new Date(latest.creationTimeSeconds * 1000).toISOString()}, verdict: ${latest.verdict || 'PENDING'}`);
      return latest;
    }
    
    console.log('No matching submissions found yet');
    return null;
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
 * @param {number} afterTimestamp - Only check submissions created after this timestamp (seconds)
 * @returns {Promise<Object>} Submission with verdict
 */
export const pollForVerdict = async (
  cfHandle, 
  contestId, 
  problemIndex, 
  maxAttempts = 30, 
  interval = 3000,
  afterTimestamp = 0
) => {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const submission = await getLatestSubmission(cfHandle, contestId, problemIndex, afterTimestamp);
        
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
