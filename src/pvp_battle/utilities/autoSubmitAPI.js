/**
 * Automatic Codeforces Submission API
 * Communicates with backend server for automatic code submission
 */

const API_BASE_URL = 'http://localhost:3001/api/codeforces';

/**
 * Login to Codeforces via backend server
 * @param {string} handle - Codeforces handle
 * @param {string} password - Codeforces password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const loginToCodeforces = async (handle, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ handle, password })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Login API error:', error);
        return {
            success: false,
            message: 'Failed to connect to submission server: ' + error.message
        };
    }
};

/**
 * Check if user has active session on backend
 * @param {string} handle - Codeforces handle
 * @returns {Promise<{success: boolean, loggedIn: boolean}>}
 */
export const checkSession = async (handle) => {
    try {
        const response = await fetch(`${API_BASE_URL}/check-session/${handle}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Check session error:', error);
        return { success: false, loggedIn: false };
    }
};

/**
 * Submit code to Codeforces automatically
 * @param {Object} params - Submission parameters
 * @param {string} params.handle - Codeforces handle
 * @param {number} params.contestId - Contest ID
 * @param {string} params.problemIndex - Problem index (A, B, C, etc.)
 * @param {string} params.code - Code to submit
 * @param {string} params.language - Programming language
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const submitToCodeforces = async ({ handle, contestId, problemIndex, code, language }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                handle,
                contestId,
                problemIndex,
                code,
                language
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Submit API error:', error);
        return {
            success: false,
            message: 'Failed to submit code: ' + error.message
        };
    }
};

/**
 * Logout from Codeforces backend session
 * @param {string} handle - Codeforces handle
 * @returns {Promise<{success: boolean}>}
 */
export const logoutFromCodeforces = async (handle) => {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ handle })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false };
    }
};
