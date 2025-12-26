import './App.css'
import { useState } from 'react'
import HomePage from './homepage_login_signup/pages/HomePage.jsx'
import LoginPage from './homepage_login_signup/pages/LoginPage.jsx'
import SignupPage from './homepage_login_signup/pages/SignupPage.jsx'
import FirstPage1v1 from './pvp_battle/pages/1v1_first_page.jsx'


function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleGetStarted = () => {
    setCurrentPage('login')
  }

  const handleLoginSuccess = () => {
    setCurrentPage('main')
  }

  const handleSignupClick = () => {
    setCurrentPage('signup')
  }

  const handleSignupSuccess = () => {
    setCurrentPage('main')
  }

  const handleBackToLogin = () => {
    setCurrentPage('login')
  }

  return (
    <>
      {currentPage === 'home' && <HomePage onGetStarted={handleGetStarted} />}
      {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} onSignupClick={handleSignupClick} onBack={() => setCurrentPage('home')} />}
      {currentPage === 'signup' && <SignupPage onSignupSuccess={handleSignupSuccess} onLoginClick={handleBackToLogin} onBack={() => setCurrentPage('login')} />}
      {currentPage === '1v1' && <FirstPage1v1 />}
      {currentPage === 'main' && (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#00d4ff',
          fontSize: '32px',
          fontFamily: 'PlayMeGame, sans-serif',
          position: 'relative'
        }}>
          <button 
            onClick={() => setCurrentPage('login')} 
            style={{
              position: 'fixed',
              top: '30px',
              left: '30px',
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.6)',
              color: '#ffffff',
              fontFamily: 'PlayMeGame, sans-serif',
              fontSize: '18px',
              padding: '10px 30px',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 100,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.9)';
              e.target.style.transform = 'translateX(-5px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            ← BACK
          </button>
          <div>
            <p>Main Page - Coming Soon!</p>
            <button 
              onClick={() => setCurrentPage('1v1')}
              style={{
                background: '#ffd700',
                border: 'none',
                color: '#1a1a2e',
                fontFamily: 'PlayMeGame, sans-serif',
                fontSize: '20px',
                padding: '15px 40px',
                borderRadius: '10px',
                cursor: 'pointer',
                marginTop: '30px',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
              }}
            >
              🎮 Test 1v1 Page
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
