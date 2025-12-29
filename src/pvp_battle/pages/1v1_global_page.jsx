import React from 'react';
import '../style/1v1_global_page.css';
import magnifyingGlassIcon from '../../assets/icons/magnifying_glass.png';
import swordsIcon from '../../assets/icons/swords.png';

const OneVOneGlobalPage = () => {
    return (
        <div className="one-v-one-global-page">
            <div className="page-container"></div>  {/* Blurred background */}
            <div className="content-wrapper">
                <div className="content-wrapper">
                    <div className="search-card">
                        <h1 className="search-heading">SEARCHING FOR A OPPONENT</h1>
                        <p className="animated-dots">••••••••••••••••••••••••</p>
                        <div className="search-icon">
                            <img src={magnifyingGlassIcon} alt="search" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OneVOneGlobalPage;