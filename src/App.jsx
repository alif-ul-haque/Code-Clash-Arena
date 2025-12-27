import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './homepage_login_signup/pages/HomePage.jsx'
import LoginPage from './homepage_login_signup/pages/LoginPage.jsx'
import SignupPage from './homepage_login_signup/pages/SignupPage.jsx'
import FirstPage1v1 from './pvp_battle/pages/1v1_first_page.jsx'
import MainPage from './mainpage_clan_battle/pages/MainPage.jsx'
import PracticeDashboard from './practice_gym/pages/PracticeDashboard.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/1v1" element={<FirstPage1v1 />} />
        <Route path="/practice" element={<PracticeDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
