import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './homepage_login_signup/pages/HomePage.jsx'
import LoginPage from './homepage_login_signup/pages/LoginPage.jsx'
import SignupPage from './homepage_login_signup/pages/SignupPage.jsx'
import FirstPage1v1 from './pvp_battle/pages/1v1_first_page.jsx'
import PlayModePage1v1 from './pvp_battle/pages/1v1_playmode_page.jsx'
import MainPage from './mainpage_clan_battle/pages/MainPage.jsx'
import PracticeDashboard from './practice_gym/pages/PracticeDashboard.jsx'
import OneVOneGlobalPage from './pvp_battle/pages/1v1_global_page.jsx';
import OneVOneLocalPage from './pvp_battle/pages/1v1_local_page.jsx';
import BattleMode from './pvp_battle/pages/battle_mode.jsx'
import TimeRushProblemCount from './pvp_battle/pages/time_rush_problem_count.jsx'
import WaitingPage from './pvp_battle/pages/waiting_page.jsx'
import OneVOneCodingBattle from './pvp_battle/pages/1v1_coding_battle_page.jsx';
import SubmitPageReal from './pvp_battle/pages/submit_page_real.jsx'
import OneVOneCodingTimeRushMode from './pvp_battle/pages/1v1_coding_timeRush_mode.jsx' 
import SubmitPageTimeMode from './pvp_battle/pages/submit_page_time_mode.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/1v1" element={<FirstPage1v1 />} />
        <Route path="/playmode1v1" element={<PlayModePage1v1 />} />
        <Route path="/1v1-global" element={<OneVOneGlobalPage />} />
        <Route path="/1v1-local" element={<OneVOneLocalPage />} />
        <Route path="/battle-mode" element={<BattleMode />} />
        <Route path="/time-rush-problem-count" element={<TimeRushProblemCount />} />
        <Route path="/waiting-page" element={<WaitingPage />} />
        <Route path="/1v1-coding-battle" element={<OneVOneCodingBattle />} />
        <Route path="/submit-page-real" element={<SubmitPageReal />} />
        <Route path="/1v1-coding-timeRush-mode" element={<OneVOneCodingTimeRushMode />} />
        <Route path="/submit-page-time-mode" element={<SubmitPageTimeMode />} />
        <Route path="/practice" element={<PracticeDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
