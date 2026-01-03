import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/battle_mode.css';

const BattleMode = () => {
    const navigate = useNavigate();

    return (
        <div className="battle-mode-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="mode-selection-card">
                    <h1 className="mode-heading">SELECT BATTLE MODE</h1>
                    
                    <div className="modes-container">
                        <div className="mode-card" onClick={() => navigate('/1v1-coding-battle')}>
                            <h2 className="mode-title">REAL MODE</h2>
                            <p className="mode-description">No time limit. First to solve wins!</p>
                        </div>
                        
                        <div className="mode-card" onClick={() => navigate('/time-rush-problem-count')}>
                            <h2 className="mode-title">TIME RUSH MODE</h2>
                            <p className="mode-description">Race against the clock!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleMode;