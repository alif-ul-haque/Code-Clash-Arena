import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/submit_page_time_mode.css';
import trophyIcon from '../../assets/icons/trophy.png';
import { supabase } from '../../supabaseclient';

const SubmitPageTimeMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        battleId,
        won,
        opponent,
        currentUserId,
        opponentId,
        problemsSolved,
        totalProblems
    } = location.state || {};

    const [loading, setLoading] = useState(true);
    const [resultData, setResultData] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                console.log('📊 Fetching TIME RUSH results...');
                
                if (!battleId || !currentUserId || !opponentId) {
                    throw new Error('Missing battle data');
                }

                // Fetch both users' data
                const [currentUserData, opponentData] = await Promise.all([
                    supabase.from('users').select('rating, xp, cf_handle').eq('id', currentUserId).single(),
                    supabase.from('users').select('rating, xp, cf_handle').eq('id', opponentId).single()
                ]);

                if (currentUserData.error || opponentData.error) {
                    throw new Error('Failed to fetch user data');
                }

                // Get participant data with rating/XP changes
                const { data: participants } = await supabase
                    .from('onevone_participants')
                    .select('player_id, problem_solved, rating_change, xp_change')
                    .eq('onevone_battle_id', battleId);

                if (!participants || participants.length === 0) {
                    throw new Error('No participant data found');
                }

                const currentUserParticipant = participants.find(p => p.player_id === currentUserId);
                const opponentParticipant = participants.find(p => p.player_id === opponentId);

                console.log('🔍 Current user data:', currentUserParticipant);
                console.log('🔍 Opponent data:', opponentParticipant);

                const currentUserRatingChange = parseInt(currentUserParticipant?.rating_change) || 0;
                const currentUserXPChange = parseFloat(currentUserParticipant?.xp_change) || 0;

                setResultData({
                    won,
                    currentUserHandle: currentUserData.data.cf_handle,
                    opponentHandle: opponentData.data.cf_handle,
                    currentUserRating: currentUserData.data.rating,
                    currentUserXP: currentUserData.data.xp,
                    currentUserRatingChange,
                    currentUserXPChange,
                    problemsSolved: currentUserParticipant?.problem_solved || 0,
                    totalProblems: totalProblems || 3
                });

                console.log('✅ Results loaded successfully');
                setLoading(false);
            } catch (error) {
                console.error('❌ Error fetching results:', error);
                
                // Fallback data
                setResultData({
                    won: won || false,
                    opponentHandle: opponent,
                    problemsSolved: problemsSolved || 0,
                    totalProblems: totalProblems || 3,
                    currentUserRatingChange: 0,
                    currentUserXPChange: 0
                });
                setLoading(false);
            }
        };

        fetchResults();
    }, [battleId, currentUserId, opponentId, won, opponent, problemsSolved, totalProblems]);

    if (loading) {
        return (
            <div className="submit-time-container">
                <div className="blur-background"></div>
                <div className="content-wrapper">
                    <div className="result-card">
                        <h1 className="result-heading">LOADING RESULTS...</h1>
                    </div>
                </div>
            </div>
        );
    }

    if (!resultData) {
        return (
            <div className="submit-time-container">
                <div className="blur-background"></div>
                <div className="content-wrapper">
                    <div className="result-card">
                        <h1 className="result-heading">ERROR LOADING RESULTS</h1>
                        <button className="lobby-btn" onClick={() => navigate('/1v1-local')}>
                            GET BACK TO LOBBY
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-time-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="result-card">
                    <div className="corner-circle"></div>
                    <h1 className="result-heading">
                        {resultData.won ? 'CONGRATULATIONS' : 'BETTER LUCK'}
                        <br/>
                        {resultData.won ? 'YOU WON! 🎉' : 'NEXT TIME! 😭'}
                    </h1>
                    
                    <p className="opponent-text">
                        Against: {resultData.opponentHandle || opponent}
                    </p>
                    
                    <div className="problem-solved-box">
                        <span className="problem-text">
                            Problems Solved: {resultData.problemsSolved}/{resultData.totalProblems}
                        </span>
                    </div>
                    
                    <div 
                        className="penalty-box" 
                        style={{
                            background: resultData.won ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            border: resultData.won ? '2px solid #22c55e' : '2px solid #ef4444'
                        }}
                    >
                        <img src={trophyIcon} alt="trophy" className="penalty-trophy-icon" />
                        <span 
                            className="penalty-text"
                            style={{ color: resultData.won ? '#22c55e' : '#ef4444' }}
                        >
                            {resultData.currentUserRatingChange >= 0 ? '+' : ''}{resultData.currentUserRatingChange}
                        </span>
                    </div>
                    
                    <button className="lobby-btn" onClick={() => navigate('/1v1-local')}>
                        GET BACK TO LOBBY
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitPageTimeMode;