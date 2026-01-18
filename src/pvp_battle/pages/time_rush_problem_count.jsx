import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/time_rush_problem_count.css';
import { supabase } from '../../supabaseclient';

const TimeRushProblemCount = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser, mode } = location.state || {};
    const [problemCount, setProblemCount] = useState(1);

    const incrementCount = () => {
        setProblemCount(prev => prev + 1);
    };

    const decrementCount = () => {
        if (problemCount > 1) {
            setProblemCount(prev => prev - 1);
        }
    };

    const handleGetStarted = async () => {
        try {
            // Update battle with problem count and send request
            const { error } = await supabase
                .from('onevonebattles')
                .update({
                    battle_mode: mode,
                    problem_count: problemCount,
                    status: 'request_sent'
                })
                .eq('onevone_battle_id', battleId);

            if (error) throw error;

            // Navigate to waiting page
            navigate('/waiting-page', {
                state: {
                    battleId,
                    opponent,
                    currentUser,
                    mode,
                    problemCount
                }
            });

        } catch (err) {
            console.error('Error sending battle request:', err);
            alert('Failed to send battle request. Please try again.');
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
                    
                    <button className="get-started-btn" onClick={handleGetStarted}>
                        <span className="play-icon">▶</span> GET STARTED
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeRushProblemCount;