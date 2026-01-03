import React from 'react';
import '../style/LearnMoreModal.css';

export default function LearnMoreModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-back-btn" onClick={onClose}>BACK</button>
                <div className="modal-header">Learn More</div>
                <div className="modal-body">
                    <p>
                        Start by joining a live coding battle where you solve real 
                        CodeForces problems in real time. Compete in 1v1 matches, earn 
                        trophies based on speed, accuracy, and consistency. Unlock 
                        powered hints with strategic placements. Progress through 
                        leagues, unlock advanced challenges, and level up while tracking 
                        your performance on leaderboards.
                    </p>
                </div>
            </div>
        </div>
    );
}
