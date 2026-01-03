import React from 'react';
import '../style/AboutUsModal.css';

export default function AboutUsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-back-btn" onClick={onClose}>BACK</button>
                <div className="modal-header">ABOUT US</div>
                <div className="modal-body">
                    <p>
                        CodeClash Arena is a gamified competitive coding platform designed 
                        to make learning and practicing coding fun, interactive, and 
                        skill-focused. We combine real-time coding battles, clan-based 
                        strategies, and competitive team-vs-team challenges to transform 
                        traditional practice into an interactive experience. Whether you 
                        fight alone or with your team, CodeClash Arena helps you sharpen 
                        your skills and strategy through fair and exciting challenges.
                    </p>
                </div>
            </div>
        </div>
    );
}
