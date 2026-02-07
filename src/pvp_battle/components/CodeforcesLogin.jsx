import React, { useState } from 'react';
import { loginToCodeforces, checkSession } from '../utilities/autoSubmitAPI';
import './CodeforcesLogin.css';

/**
 * Login component for Codeforces auto-submit
 * Users login once, session lasts 24 hours
 */
const CodeforcesLogin = ({ cfHandle, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check session on mount
    React.useEffect(() => {
        if (cfHandle) {
            checkExistingSession();
        }
    }, [cfHandle]);

    const checkExistingSession = async () => {
        const result = await checkSession(cfHandle);
        setIsLoggedIn(result.loggedIn);
        if (result.loggedIn) {
            setMessage('✅ Already logged in!');
            onLoginSuccess?.();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!password) {
            setMessage('❌ Please enter your password');
            return;
        }

        setLoading(true);
        setMessage('🔄 Logging in...');

        try {
            const result = await loginToCodeforces(cfHandle, password);
            
            if (result.success) {
                setMessage('✅ Login successful!');
                setIsLoggedIn(true);
                setPassword(''); // Clear password
                onLoginSuccess?.();
            } else {
                setMessage('❌ ' + result.message);
            }
        } catch (error) {
            setMessage('❌ Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    if (isLoggedIn) {
        return (
            <div className="cf-login-status logged-in">
                <span className="status-icon">✓</span>
                <span className="status-text">Codeforces Connected</span>
            </div>
        );
    }

    return (
        <div className="cf-login-container">
            <div className="cf-login-box">
                <h3 className="login-title">🔐 Codeforces Login Required</h3>
                <p className="login-desc">
                    Login once to enable automatic submission<br/>
                    <small>(Session lasts 24 hours)</small>
                </p>
                
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>Handle:</label>
                        <input 
                            type="text" 
                            value={cfHandle} 
                            disabled 
                            className="cf-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Password:</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Codeforces password"
                            className="cf-input"
                            disabled={loading}
                        />
                    </div>
                    
                    {message && (
                        <div className={`login-message ${message.includes('✅') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? 'LOGGING IN...' : 'LOGIN'}
                    </button>
                </form>
                
                <div className="login-info">
                    <small>
                        ⚠️ Make sure the submit server is running:<br/>
                        <code>cd server && npm start</code>
                    </small>
                </div>
            </div>
        </div>
    );
};

export default CodeforcesLogin;
