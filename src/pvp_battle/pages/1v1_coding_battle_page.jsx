import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/1v1_coding_battle_page.css';
import logo from '../../assets/icons/cca.png';

const OneVOneCodingBattlePage = () => {
    const navigate = useNavigate();
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE\n##FROM HERE');

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setSelectedLanguage(newLanguage);
        setCode(`## WRITE YOUR ${newLanguage} CODE\n##FROM HERE`);
    };

    return (
        <div className="coding-battle-container">
            {/* Header Section */}
            <div className="battle-header">
                <img src={logo} alt="Logo" className="battle-logo" />
                
                <div className="battle-title-section">
                    <h1 className="battle-title">ALIF19 VS _RIUZEE</h1>
                    <div className="player-labels">
                        <span className="player-label">YOU</span>
                        <span className="player-label opponent-label">OPPONENT</span>
                    </div>
                </div>
                
                <button className="exit-btn" onClick={() => navigate('/playmode1v1')}>EXIT</button>
            </div>

            {/* Main Content */}
            <div className="battle-content">
                {/* Left Section - Problem */}
                <div className="problem-section">
                    <h2 className="problem-title">TWO SUM</h2>
                    
                    <div className="problem-statement">
                        <h3 className="statement-heading">Problem Statement :</h3>
                        <p className="statement-text">
                            Given an array of integers nums and an integer target, return the indices 
                            of the two numbers that add up to target.
                        </p>
                    </div>
                    
                    <div className="examples-section">
                        <h3 className="examples-heading">EXAMPLES :</h3>
                        <div className="example-box">
                            <p className="example-text">Input:</p>
                            <p className="example-text">nums = [2,7,11,15], target = 9</p>
                            <p className="example-text">Output: [0,1]</p>
                        </div>
                    </div>
                </div>

                {/* Vertical Separator */}
                <div className="vertical-separator"></div>

                {/* Right Section - Code Editor */}
                <div className="editor-section">
                    <div className="editor-controls">
                        <select 
                            className="language-selector"
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                        >
                            <option value="PYTHON">PYTHON</option>
                            <option value="JAVASCRIPT">JAVASCRIPT</option>
                            <option value="JAVA">JAVA</option>
                            <option value="C++">C++</option>
                        </select>
                        
                        <button className="submit-btn" onClick={() => navigate('/submit-page-real')}>SUBMIT</button>
                    </div>
                    
                    <textarea 
                        className="code-editor"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`## WRITE YOUR ${selectedLanguage} CODE\n##FROM HERE`}
                    ></textarea>
                    
                    <div className="editor-footer">
                        <button className="upload-btn">UPLOAD</button>
                        <span className="language-display">LANGUAGE : {selectedLanguage}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OneVOneCodingBattlePage;