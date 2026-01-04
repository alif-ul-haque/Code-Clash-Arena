import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/PracticeDashboard.css'
import ccaLogo from '../../assets/icons/cca.png'
//import bg from '../../assets/images/bg.png'
import ProblemPage from './ProblemPage.jsx'
import SuccessPage from './SuccessPage.jsx'
import AIAssistancePage from './AIAssistancePage.jsx'
import ExitConfirmationPage from './ExitConfirmationPage.jsx'
import TimerSetupPage from './TimerSetupPage.jsx'
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { 
  codeforcesAPI, 
  calculateUserStats, 
  calculateDayStreak, 
  getRecommendedProblems,
  filterProblems,
  getAllTags,
  mergeLocalAndCFSolved,
  addLocalSolvedProblem
} from '../utilities/codeforcesAPI.js'

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Codeforces data states
  const [cfHandle] = useState('Scomrades'); // Hardcoded username for now
  const [userStats, setUserStats] = useState({
    rating: 0,
    dayStreak: 0,
    problemsSolved: 0,
    accuracy: 0
  });
  const [problems, setProblems] = useState([]);
  const [allProblemsData, setAllProblemsData] = useState(null);
  const [solvedProblemsSet, setSolvedProblemsSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [hideSolved, setHideSolved] = useState(true);

  // Particle configuration
  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "bubble",
        },
      },
      modes: {
        bubble: {
          distance: 150,
          size: 20,
          duration: 2,
          opacity: 1,
        },
      },
    },
    particles: {
      color: {
        value: ["#61dafb", "#f9ca24", "#6c5ce7", "#00b894", "#fd79a8"],
      },
      links: {
        enable: false,
      },
      move: {
        direction: "bottom",
        enable: true,
        outModes: {
          default: "out",
        },
        random: false,
        speed: 2,
        straight: true,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 80,
      },
      opacity: {
        value: 0.7,
        random: true,
        anim: {
          enable: true,
          speed: 1,
          opacity_min: 0.3,
          sync: false,
        },
      },
      shape: {
        type: "char",
        options: {
          char: {
            value: ["function", "const", "let", "=>", "{}", "[]", "if", "else", "for", "while", "class", "return", "===", "!=", "&&", "||", "++", "--", "async", "await"],
            font: "playMeGame",
            style: "",
            weight: "600",
            fill: true,
          },
        },
      },
      size: {
        value: 12,
        random: {
          enable: true,
          minimumValue: 8,
        },
      },
    },
    detectRetina: true,
  };

  // Fetch Codeforces data on component mount
  useEffect(() => {
    const fetchCodeforcesData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user info
        const userInfo = await codeforcesAPI.getUserInfo(cfHandle);
        
        // Fetch user submissions
        const submissions = await codeforcesAPI.getUserStatus(cfHandle);
        
        // Fetch all problems
        const allProblems = await codeforcesAPI.getProblems();
        
        // Calculate statistics
        const stats = calculateUserStats(submissions);
        const dayStreak = calculateDayStreak(submissions);
        
        // Get solved problems set (merge Codeforces + local)
        const cfSolvedSet = stats.solvedSet;
        const mergedSolvedSet = mergeLocalAndCFSolved(cfSolvedSet);
        setSolvedProblemsSet(mergedSolvedSet);
        
        // Store all problems data for filtering
        setAllProblemsData(allProblems);
        
        // Get available tags
        const tags = getAllTags(allProblems);
        setAvailableTags(tags);
        
        // Get recommended problems
        const recommendedProblems = getRecommendedProblems(
          allProblems, 
          userInfo.rating, 
          mergedSolvedSet, 
          20
        );
        
        setUserStats({
          rating: userInfo.rating,
          dayStreak: dayStreak,
          problemsSolved: mergedSolvedSet.size,
          accuracy: stats.accuracy
        });
        
        setProblems(recommendedProblems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Codeforces data:', err);
        setError(err.message || 'Failed to fetch data from Codeforces');
        setLoading(false);
      }
    };

    fetchCodeforcesData();
  }, [cfHandle]);

  // Apply filters when filter criteria changes
  useEffect(() => {
    if (!allProblemsData) return;

    const filters = {
      searchQuery,
      minRating: minRating ? parseInt(minRating) : null,
      maxRating: maxRating ? parseInt(maxRating) : null,
      tags: selectedTags,
      hideSolved,
      limit: 20
    };

    const filteredProblems = filterProblems(allProblemsData, filters, solvedProblemsSet);
    setProblems(filteredProblems);
  }, [searchQuery, minRating, maxRating, selectedTags, hideSolved, allProblemsData, solvedProblemsSet]);

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

  const handleNavigateWithTransition = (path) => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(path);
    }, 1000);
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

  const handleProblemSolved = () => {
    if (selectedProblem) {
      // Mark problem as solved locally
      addLocalSolvedProblem(selectedProblem.id);
      
      // Update solved problems set
      const newSolvedSet = new Set(solvedProblemsSet);
      newSolvedSet.add(selectedProblem.id);
      setSolvedProblemsSet(newSolvedSet);
      
      // Update stats
      setUserStats(prev => ({
        ...prev,
        problemsSolved: newSolvedSet.size
      }));
    }
    
    setShowSuccess(true);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setMinRating('');
    setMaxRating('');
    setSelectedTags([]);
    setHideSolved(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-bg"></div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Codeforces data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-bg"></div>
        <div className="error-container">
          <h2 className="error-title">⚠️ Error</h2>
          <p className="error-text">{error}</p>
          <p className="error-hint">Please check your internet connection or try again later.</p>
          <button className="btn exit" onClick={() => navigate('/main')}>Go Back</button>
        </div>
      </div>
    );
  }

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
      onSubmit={handleProblemSolved}
      onHelp={() => setShowAIHelp(true)}
      code={userCode}
      onCodeChange={setUserCode}
    />;
  }

  return (
    <div className={`dashboard ${isTransitioning ? 'page-transition-out' : ''}`}>
      <div className="dashboard-bg"></div>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesOptions}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />

      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo-placeholder">
          <img src={ccaLogo} alt="Code Clash Arena Logo" className="logo" />
        </div>

        <h1 className="practice-gym-title">Practice Gym</h1>

        <div className="top-actions">
          <button className="btn practice">Let's Practice</button>
          <button className="btn exit" onClick={() => handleNavigateWithTransition('/main')}>EXIT</button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="stats-panel">
        <div className="stat">
          <span className="label">CODEFORCES HANDLE:</span>
          <span className="value">{cfHandle}</span>
        </div>

        <div className="stat">
          <span className="label">YOUR RATING:</span>
          <span className="value">{userStats.rating}</span>
        </div>

        <div className="stat">
          <span className="label">PROBLEMS SOLVED:</span>
          <span className="value">{userStats.problemsSolved}</span>
        </div>

        <div className="stat">
          <span className="label">DAY STREAK:</span>
          <span className="value">{userStats.dayStreak}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-header">
          <button 
            className="btn filter-toggle" 
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '▲ Hide Filters' : '▼ Show Filters'}
          </button>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {(searchQuery || minRating || maxRating || selectedTags.length > 0) && (
            <button className="btn clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label className="filter-label">Rating Range:</label>
              <div className="rating-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="rating-input"
                  min="800"
                  max="3500"
                  step="100"
                />
                <span className="rating-separator">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="rating-input"
                  min="800"
                  max="3500"
                  step="100"
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={hideSolved}
                  onChange={(e) => setHideSolved(e.target.checked)}
                  className="filter-checkbox"
                />
                Hide solved problems
              </label>
            </div>

            <div className="filter-group">
              <label className="filter-label">Tags:</label>
              <div className="tags-container">
                {availableTags.slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="selected-tags-info">
                  Selected: {selectedTags.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Problems List */}
      <div className="problem-list">
        {problems.length === 0 ? (
          <div className="no-problems">
            <p>No problems found matching your filters.</p>
            <button className="btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          problems.map(problem => (
            <ProblemItem
              key={problem.id}
              problem={problem}
              onClick={() => handleProblemClick(problem)}
              isSolved={solvedProblemsSet.has(problem.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ProblemItem = ({ problem, onClick, isSolved }) => {
  return (
    <div className="problem-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="left">
        <div className={`check ${isSolved ? 'solved' : ''}`}>✔</div>
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
