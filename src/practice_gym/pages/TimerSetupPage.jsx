import { useState } from 'react';
import '../style/TimerSetupPage.css';

const TimerSetupPage = ({ problem, onStart, onCancel }) => {
  const [minutes, setMinutes] = useState(30);

  const handleStart = () => {
    const totalSeconds = minutes * 60;
    onStart(totalSeconds);
  };

  return (
    <div className="timer-setup-page">
      <div className="bg-overlay"></div>

      <div className="timer-setup-card">
        <h1 className="setup-title">
          <span>SET TIMER</span>
          <span className="underline"></span>
        </h1>

        <h2 className="problem-name">{problem?.title || 'Problem'}</h2>

        <div className="timer-input-section">
          <label className="timer-label">Choose Duration (minutes):</label>
          <div className="timer-controls">
            <button 
              className="timer-adjust-btn" 
              onClick={() => setMinutes(Math.max(1, minutes - 5))}
            >
              -5
            </button>
            <input
              type="number"
              className="timer-input"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="180"
            />
            <button 
              className="timer-adjust-btn" 
              onClick={() => setMinutes(Math.min(180, minutes + 5))}
            >
              +5
            </button>
          </div>
          <p className="timer-preview">Time: {minutes} minutes</p>
        </div>

        <div className="button-group">
          <button className="cancel-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button className="start-btn" onClick={handleStart}>
            START PROBLEM
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerSetupPage;
