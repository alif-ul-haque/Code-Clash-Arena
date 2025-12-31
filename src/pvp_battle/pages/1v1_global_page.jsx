import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/1v1_global_page.css';
import magnifyingGlassIcon from '../../assets/icons/magnifying_glass.png';
import swordsIcon from '../../assets/icons/swords.png';

const OneVOneGlobalPage = () => {
    const navigate = useNavigate();
    
    return (
        <div className="one-v-one-global-page">
            <div className="page-container"></div>  {/* Blurred background */}
            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => navigate('/playmode1v1')}>Exit</button>
            </div>
            <div className="content-wrapper">
                <div className="content-wrapper">
                    <div className="search-card">
                        <h1 className="search-heading">SEARCHING FOR AN OPPONENT</h1>
                        <p className="animated-dots">••••••••••••••••••••••••</p>
                        <div className="search-icon">
                            <img src={magnifyingGlassIcon} alt="search" />
                            <img src={swordsIcon} alt="swords" className="swords-overlay" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OneVOneGlobalPage;