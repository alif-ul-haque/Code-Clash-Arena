import './App.css'
import { useState } from 'react'
import HomePage from './homepage_login_signup/pages/HomePage.jsx'
import LoginPage from './homepage_login_signup/pages/LoginPage.jsx'


function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleGetStarted = () => {
    setCurrentPage('login')
  }

  const handleLoginSuccess = () => {
    setCurrentPage('main')
    // You can add your main page logic here later
  }

  return (
    <>
      {currentPage === 'home' && <HomePage onGetStarted={handleGetStarted} />}
      {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentPage('home')} />}
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
          Main Page - Coming Soon!
        </div>
      )}
    </>
  )
}

export default App
