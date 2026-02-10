import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/submit_page_real.css';
import trophyIcon from '../../assets/icons/trophy.png';
import { supabase } from '../../supabaseclient';

const GlobalBattleResultPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        winner, 
        currentUserId, 
        opponentId,
        currentUserHandle,
        opponentHandle,
        battleId
    } = location.state || {};

    const [loading, setLoading] = useState(true);
    const [resultData, setResultData] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Fetch both users' current ratings to show changes
                const [currentUserData, opponentData] = await Promise.all([
                    supabase.from('users').select('rating, xp, cf_handle').eq('id', currentUserId).single(),
                    supabase.from('users').select('rating, xp, cf_handle').eq('id', opponentId).single()
                ]);

                if (currentUserData.error || opponentData.error) {
                    throw new Error('Failed to fetch user data');
                }

                const won = winner === 'you';
                const winnerId = won ? currentUserId : opponentId;
                const loserId = won ? opponentId : currentUserId;

                // Get battle details to see timing and rating changes
                const { data: participants } = await supabase
                    .from('onevone_participants')
                    .select('player_id, problem_solved, time_taken, rating_change, xp_change')
                    .eq('onevone_battle_id', battleId);

                const winnerParticipant = participants?.find(p => p.player_id === winnerId);
                const loserParticipant = participants?.find(p => p.player_id === loserId);
                
                const currentUserParticipant = participants?.find(p => p.player_id === currentUserId);
                const opponentParticipant = participants?.find(p => p.player_id === opponentId);

                console.log('🔍 Debug - Participants data:', participants);
                console.log('🔍 Current user participant:', currentUserParticipant);
                console.log('🔍 Rating change from DB:', currentUserParticipant?.rating_change);
                console.log('🔍 XP change from DB:', currentUserParticipant?.xp_change);

                // Get problem details
                const { data: battleData } = await supabase
                    .from('onevonebattles')
                    .select('problem_name, problem_contest_id, problem_index')
                    .eq('onevone_battle_id', battleId)
                    .single();

                setResultData({
                    won,
                    currentUserRating: currentUserData.data.rating,
                    opponentRating: opponentData.data.rating,
                    currentUserXP: currentUserData.data.xp,
                    opponentXP: opponentData.data.xp,
                    currentUserHandle: currentUserData.data.cf_handle,
                    opponentHandle: opponentData.data.cf_handle,
                    winnerTime: winnerParticipant?.time_taken || 0,
                    loserTime: loserParticipant?.time_taken || 0,
                    problemName: battleData?.problem_name || 'Unknown',
                    problemId: `${battleData?.problem_contest_id}${battleData?.problem_index}`,
                    currentUserRatingChange: currentUserParticipant?.rating_change || 0,
                    opponentRatingChange: opponentParticipant?.rating_change || 0,
                    currentUserXPChange: currentUserParticipant?.xp_change || 0,
                    opponentXPChange: opponentParticipant?.xp_change || 0
                });

                setLoading(false);
            } catch (error) {
                console.error('Error fetching results:', error);
                setLoading(false);
            }
        };

        if (battleId && currentUserId && opponentId) {
            fetchResults();
        }
    }, [battleId, currentUserId, opponentId, winner]);

    if (loading) {
        return (
            <div className="submit-page-container">
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
            <div className="submit-page-container">
                <div className="blur-background"></div>
                <div className="content-wrapper">
                    <div className="result-card">
                        <h1 className="result-heading">ERROR LOADING RESULTS</h1>
                        <button className="lobby-btn" onClick={() => navigate('/playmode1v1')}>
                            GET BACK TO LOBBY
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-page-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="result-card">
                    <div className="corner-circle"></div>
                    <h1 className="result-heading">
                        {resultData.won ? 'CONGRATULATIONS' : 'BETTER LUCK'}<br/>
                        {resultData.won ? 'YOU WON!' : 'NEXT TIME!'}
                    </h1>
                    
                    <p className="opponent-text">
                        Against: {resultData.opponentHandle}
                    </p>
                    
                    <div className="trophy-box" style={{
                        background: resultData.won ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: resultData.won ? '2px solid #22c55e' : '2px solid #ef4444'
                    }}>
                        <img src={trophyIcon} alt="trophy" className="trophy-icon-real" />
                        <span className="points-text" style={{ 
                            color: resultData.won ? '#22c55e' : '#ef4444'
                        }}>
                            {resultData.currentUserRatingChange >= 0 ? '+' : ''}{resultData.currentUserRatingChange}
                        </span>
                    </div>
                    
                    <button className="lobby-btn" onClick={() => navigate('/playmode1v1')}>
                        GET BACK TO LOBBY
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalBattleResultPage;
