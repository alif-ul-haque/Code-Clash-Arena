import React, { useState } from 'react';
import '../style/time_rush_problem_count.css';

const TimeRushProblemCount = () => {
    const [problemCount, setProblemCount] = useState(1);

    const incrementCount = () => {
        setProblemCount(prev => prev + 1);
    };

    const decrementCount = () => {
        if (problemCount > 1) {
            setProblemCount(prev => prev - 1);
        }
    };

    return (
        <div className="time-rush-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="problem-count-card">
                    <h1 className="problem-heading">NUMBER OF PROBLEMS</h1>
                    
                    <div className="counter-section">
                        <span className="counter-label">PROBLEMS :</span>
                        <div className="counter-box">
                            <span className="counter-value">{problemCount}</span>
                            <button className="increment-btn" onClick={incrementCount}>+</button>
                        </div>
                    </div>
                    
                    <button className="get-started-btn">
                        <span className="play-icon">▶</span> GET STARTED
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeRushProblemCount;