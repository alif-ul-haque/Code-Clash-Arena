import { useState } from 'react'
import '../style/LoginPage.css'
import ccaLogo from '../../assets/icons/cca.png'
import Button from '../../assets/components/Button.jsx'
import showIcon from '../../assets/icons/show.png'
import loginIcon from '../../assets/icons/login__0.png';
import bgImage from '../../assets/images/10002.jpg'

export default function LoginPage({ onLoginSuccess, onBack }) {
    const [showPassword, setShowPassword] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)
    const [usernameFocused, setUsernameFocused] = useState(false)
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (formData.username && formData.password) {
            onLoginSuccess()
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="login-page" style={{ backgroundImage: `url(${bgImage})` }}>
            {/* Background Overlay */}
            <div className="background-overlay"></div>
            
            {/* Back Button - Top Left of Page */}
            <button className="back-button-page" onClick={onBack}>
                ← Back
            </button>
            {/* Corner Decorations */}
            <div className="corner-decoration top-left">
                <div className="deco-box large"></div>
                <div className="deco-box small"></div>
            </div>
            <div className="corner-decoration top-right">
                <div className="deco-box large"></div>
                <div className="deco-box small"></div>
            </div>
            <div className="corner-decoration bottom-left">
                <div className="deco-box large"></div>
                <div className="deco-box small"></div>
            </div>
            <div className="corner-decoration bottom-right">
                <div className="deco-box large"></div>
                <div className="deco-box small"></div>
            </div>

            {/* Login Card */}
            <div className="login-card">
                {/* Logo */}
                <img src={ccaLogo} alt="Code Clash Arena" className="login-logo" />

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    {/* Username Input */}
                    <div className="input-wrapper">
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="login-input"
                            id="username"
                            onFocus={() => setUsernameFocused(true)}
                            onBlur={() => setUsernameFocused(false)}
                            required
                        />
                        <label htmlFor="username" className={`floating-label ${(usernameFocused || formData.username) ? 'floated' : ''}`}>Username or Email</label>
                        <svg className="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>

                    {/* Password Input */}
                    <div className="input-wrapper password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="login-input"
                            id="password"
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            required
                        />
                        <label htmlFor="password" className={`floating-label ${(passwordFocused || formData.password) ? 'floated' : ''}`}>Password</label>
                        {passwordFocused && (
                            <div 
                                className="input-icon clickable eye-icon" 
                                onClick={() => setShowPassword(!showPassword)}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {showPassword ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Login Button */}
                    <div className="button-wrapper">
                        <Button
                            text="Log In"
                            backgroundColor="#F1CA76"
                            fontSize="22px"
                            height="55px"
                            width="200px"
                            showIcon={true}
                            icon={loginIcon}
                        />
                    </div>
                </form>

                {/* Sign Up Link */}
                <div className="signup-section">
                    <p className="signup-text">Don't have an account?</p>
                    <p className="signup-link">Sign Up</p>
                </div>
            </div>
        </div>
    )
}
