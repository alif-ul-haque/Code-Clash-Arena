const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

// Store user sessions (in production, use Redis or database)
const userSessions = new Map();

/**
 * LOGIN ENDPOINT
 * Logs user into Codeforces and stores session cookies
 */
app.post('/api/codeforces/login', async (req, res) => {
    try {
        const { handle, password } = req.body;
        
        if (!handle || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Handle and password required' 
            });
        }

        // Step 1: Get login page to extract CSRF token
        const loginPageResponse = await axios.get('https://codeforces.com/enter', {
            maxRedirects: 0,
            validateStatus: () => true
        });
        
        const cookies = loginPageResponse.headers['set-cookie'] || [];
        const cookieString = cookies.map(c => c.split(';')[0]).join('; ');
        
        // Extract CSRF token from HTML
        const csrfMatch = loginPageResponse.data.match(/csrf='([^']+)'/);
        if (!csrfMatch) {
            throw new Error('Could not extract CSRF token');
        }
        const csrf = csrfMatch[1];

        // Step 2: Submit login form
        const formData = new FormData();
        formData.append('csrf_token', csrf);
        formData.append('action', 'enter');
        formData.append('handleOrEmail', handle);
        formData.append('password', password);
        formData.append('remember', 'on');

        const loginResponse = await axios.post('https://codeforces.com/enter', formData, {
            headers: {
                ...formData.getHeaders(),
                'Cookie': cookieString,
                'Referer': 'https://codeforces.com/enter'
            },
            maxRedirects: 0,
            validateStatus: () => true
        });

        // Get session cookies from login response
        const sessionCookies = loginResponse.headers['set-cookie'] || [];
        const fullCookieString = [...cookies, ...sessionCookies]
            .map(c => c.split(';')[0])
            .join('; ');

        // Verify login by checking profile
        const profileCheck = await axios.get(`https://codeforces.com/profile/${handle}`, {
            headers: { 'Cookie': fullCookieString }
        });

        // Check if we can see "Logout" button (means logged in)
        if (profileCheck.data.includes('logout')) {
            // Store session
            userSessions.set(handle, {
                cookies: fullCookieString,
                csrf: csrf,
                timestamp: Date.now()
            });

            res.json({ 
                success: true, 
                message: 'Login successful',
                handle: handle
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed: ' + error.message 
        });
    }
});

/**
 * SUBMIT ENDPOINT
 * Submits code to Codeforces problem
 */
app.post('/api/codeforces/submit', async (req, res) => {
    try {
        const { handle, contestId, problemIndex, code, language } = req.body;

        // Check if user has active session
        const session = userSessions.get(handle);
        if (!session) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not logged in. Please login first.' 
            });
        }

        // Check if session is expired (24 hours)
        if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
            userSessions.delete(handle);
            return res.status(401).json({ 
                success: false, 
                message: 'Session expired. Please login again.' 
            });
        }

        // Map language to Codeforces program type ID
        const languageMap = {
            'PYTHON': '31',      // Python 3
            'PYTHON3': '31',
            'PYTHON2': '7',
            'C++': '54',         // GNU G++17 7.3.0
            'CPP': '54',
            'C++17': '54',
            'JAVA': '60',        // Java 11
            'JAVASCRIPT': '55',  // Node.js
            'JS': '55',
            'C': '43'            // GNU GCC C11
        };

        const programTypeId = languageMap[language.toUpperCase()] || '31';

        // Get submit page to get fresh CSRF
        const submitPageUrl = `https://codeforces.com/problemset/submit`;
        const submitPageResponse = await axios.get(submitPageUrl, {
            headers: { 'Cookie': session.cookies }
        });

        // Extract CSRF from submit page
        const csrfMatch = submitPageResponse.data.match(/csrf='([^']+)'/);
        if (!csrfMatch) {
            throw new Error('Could not extract CSRF token from submit page');
        }
        const submitCsrf = csrfMatch[1];

        // Prepare submission form
        const formData = new FormData();
        formData.append('csrf_token', submitCsrf);
        formData.append('action', 'submitSolutionFormSubmitted');
        formData.append('contestId', contestId);
        formData.append('submittedProblemIndex', problemIndex);
        formData.append('programTypeId', programTypeId);
        formData.append('source', code);
        formData.append('tabSize', '4');
        formData.append('sourceFile', '');

        // Submit solution
        const submitResponse = await axios.post(
            'https://codeforces.com/problemset/submit',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Cookie': session.cookies,
                    'Referer': submitPageUrl
                },
                maxRedirects: 0,
                validateStatus: () => true
            }
        );

        // Check if submission was successful
        if (submitResponse.status === 302 || submitResponse.data.includes('submitted successfully')) {
            res.json({ 
                success: true, 
                message: 'Code submitted successfully!',
                contestId: contestId,
                problemIndex: problemIndex
            });
        } else if (submitResponse.data.includes('You have submitted exactly the same code before')) {
            res.status(400).json({ 
                success: false, 
                message: 'You have submitted exactly the same code before' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Submission failed. Please try again.' 
            });
        }

    } catch (error) {
        console.error('Submit error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Submission failed: ' + error.message 
        });
    }
});

/**
 * CHECK SESSION ENDPOINT
 * Checks if user has active session
 */
app.get('/api/codeforces/check-session/:handle', (req, res) => {
    const { handle } = req.params;
    const session = userSessions.get(handle);
    
    if (session && Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
        res.json({ 
            success: true, 
            loggedIn: true,
            message: 'Session active' 
        });
    } else {
        res.json({ 
            success: true, 
            loggedIn: false,
            message: 'No active session' 
        });
    }
});

/**
 * LOGOUT ENDPOINT
 */
app.post('/api/codeforces/logout', (req, res) => {
    const { handle } = req.body;
    userSessions.delete(handle);
    res.json({ success: true, message: 'Logged out' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Codeforces Submit Server running on http://localhost:${PORT}`);
    console.log(`📝 Endpoints:`);
    console.log(`   POST /api/codeforces/login - Login to Codeforces`);
    console.log(`   POST /api/codeforces/submit - Submit code`);
    console.log(`   GET  /api/codeforces/check-session/:handle - Check session`);
    console.log(`   POST /api/codeforces/logout - Logout`);
});
