import { useState, useEffect } from 'react'
import '../style/PracticeDashboard.css'
import ccaLogo from '../../assets/icons/cca.png'
import bg from '../../assets/images/bg.png'
import ProblemPage from './ProblemPage.jsx'
import SuccessPage from './SuccessPage.jsx'
import AIAssistancePage from './AIAssistancePage.jsx'
import ExitConfirmationPage from './ExitConfirmationPage.jsx'
import TimerSetupPage from './TimerSetupPage.jsx'

const Dashboard = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);

  const problems = [
    { id: 1, title: "Theatre Square", tag: "math", rating: "1000", solved: "156.4k" },
    { id: 2, title: "Watermelon", tag: "Brute Force", rating: "800", solved: "100.1k" },
    { id: 3, title: "Way Too Long Words", tag: "Implementation", rating: "1000", solved: "130k" },
    { id: 4, title: "String Task", tag: "String", rating: "1100", solved: "80.5k" }
  ];

  // Timer countdown effect - runs in parent to persist across page changes
  useEffect(() => {
    if (!timerActive || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 0) {
          setTimerActive(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const handleProblemClick = (problem) => {
    setSelectedProblem(problem);
    setShowTimerSetup(true);
  };

  const handleTimerStart = (seconds) => {
    setTimeLeft(seconds);
    setTimerActive(true);
    setShowTimerSetup(false);
  };

  const handleTimerCancel = () => {
    setShowTimerSetup(false);
    setSelectedProblem(null);
  };

  const handleExitProblem = () => {
    setShowExitConfirm(false);
    setSelectedProblem(null);
    setTimeLeft(null);
    setTimerActive(false);
  };

  if (showSuccess) {
    return <SuccessPage onBack={() => {
      setShowSuccess(false);
      setSelectedProblem(null);
      setTimeLeft(null);
      setTimerActive(false);
    }} />;
  }

  if (showTimerSetup) {
    return <TimerSetupPage 
      problem={selectedProblem}
      onStart={handleTimerStart}
      onCancel={handleTimerCancel}
    />;
  }

  if (showExitConfirm) {
    return <ExitConfirmationPage 
      onExit={handleExitProblem}
      onBack={() => setShowExitConfirm(false)}
    />;
  }

  if (showAIHelp) {
    return <AIAssistancePage 
      problem={selectedProblem} 
      onBack={() => setShowAIHelp(false)} 
    />;
  }

  if (selectedProblem && timeLeft !== null) {
    return <ProblemPage 
      problem={selectedProblem}
      timeLeft={timeLeft}
      onBack={() => setShowExitConfirm(true)}
      onSubmit={() => setShowSuccess(true)}
      onHelp={() => setShowAIHelp(true)}
    />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-bg"></div>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo-placeholder">
          <img src={ccaLogo} alt="Code Clash Arena Logo" className="logo" />
        </div>

        <h1 className="practice-gym-title">Practice Gym</h1>

        <div className="top-actions">
          <button className="btn practice">Let's Practice</button>
          <button className="btn exit">EXIT</button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="stats-panel">
        <div className="stat">
          <span className="label">YOUR RATING:</span>
          <span className="value">1245</span>
        </div>

        <div className="stat">
          <span className="label">DAY STREAK:</span>
          <span className="value">2</span>
        </div>

        <div className="stat">
          <span className="label">PROBLEMS SOLVED:</span>
          <span className="value">47</span>
        </div>

        <div className="stat">
          <span className="label">ACCURACY:</span>
          <span className="value">78%</span>
        </div>
      </div>

      {/* Problems List */}
      <div className="problem-list">
        {problems.map(problem => (
          <ProblemItem
            key={problem.id}
            problem={problem}
            onClick={() => handleProblemClick(problem)}
          />
        ))}
      </div>
    </div>
  );
};

const ProblemItem = ({ problem, onClick }) => {
  return (
    <div className="problem-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="left">
        <div className="check">✔</div>
        <div>
          <h3>{problem.title}</h3>
          <p>{problem.tag}</p>
        </div>
      </div>

      <div className="right">
        <span className="rating">{problem.rating}</span>
        <span className="solved">👥 {problem.solved}</span>
      </div>
    </div>
  );
};

export default Dashboard;
