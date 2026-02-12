import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/submit_page_real.css';
import trophyIcon from '../../assets/icons/trophy.png';
import { supabase } from '../../supabaseclient';

const SubmitPageReal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        battleId,
        won, 
        opponent,
        currentUserId, 
        opponentId
    } = location.state || {};

    const [loading, setLoading] = useState(true);
    const [resultData, setResultData] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                console.log('📊 Fetching local battle results...');
                console.log('Battle ID:', battleId, 'Won:', won, 'Opponent:', opponent);
                
                // Fetch both users' current data
                const [currentUserData, opponentData] = await Promise.all([
                    supabase.from('users').select('rating, xp, cf_handle').eq('id', currentUserId).single(),
                    supabase.from('users').select('rating, xp, cf_handle').eq('id', opponentId).single()
                ]);

                if (currentUserData.error || opponentData.error) {
                    throw new Error('Failed to fetch user data');
                }

                // Get battle details and rating changes from participants table
                const { data: participants } = await supabase
                    .from('onevone_participants')
                    .select('player_id, problem_solved, time_taken, rating_change, xp_change')
                    .eq('onevone_battle_id', battleId);

                if (!participants || participants.length === 0) {
                    throw new Error('No participant data found');
                }

                const currentUserParticipant = participants.find(p => p.player_id === currentUserId);
                const opponentParticipant = participants.find(p => p.player_id === opponentId);

                console.log('🔍 Current user participant:', currentUserParticipant);
                console.log('🔍 Opponent participant:', opponentParticipant);
                console.log('🔍 Rating change from DB:', currentUserParticipant?.rating_change);
                console.log('🔍 XP change from DB:', currentUserParticipant?.xp_change);

                // Get problem details
                const { data: battleData } = await supabase
                    .from('onevonebattles')
                    .select('problem_name, problem_contest_id, problem_index')
                    .eq('onevone_battle_id', battleId)
                    .single();
                
                const currentUserRatingChange = parseInt(currentUserParticipant?.rating_change) || 0;
                const currentUserXPChange = parseFloat(currentUserParticipant?.xp_change) || 0;

                setResultData({
                    won,
                    currentUserRating: currentUserData.data.rating,
                    opponentRating: opponentData.data.rating,
                    currentUserXP: currentUserData.data.xp,
                    opponentXP: opponentData.data.xp,
                    currentUserHandle: currentUserData.data.cf_handle,
                    opponentHandle: opponentData.data.cf_handle,
                    problemName: battleData?.problem_name || 'Unknown',
                    problemId: `${battleData?.problem_contest_id}${battleData?.problem_index}`,
                    currentUserRatingChange: currentUserRatingChange,
                    opponentRatingChange: parseInt(opponentParticipant?.rating_change) || 0,
                    currentUserXPChange: currentUserXPChange,
                    opponentXPChange: parseFloat(opponentParticipant?.xp_change) || 0
                });

                console.log('✅ Results loaded successfully');
                setLoading(false);
            } catch (error) {
                console.error('❌ Error fetching results:', error);
                setLoading(false);
            }
        };

        if (battleId && currentUserId && opponentId) {
            fetchResults();
        } else {
            console.warn('⚠️ Missing battle data, using fallback');
            // Fallback for old navigation format
            setResultData({
                won: won,
                opponentHandle: opponent,
                currentUserRatingChange: 0,
                currentUserXPChange: 0
            });
            setLoading(false);
        }
    }, [battleId, currentUserId, opponentId, won, opponent]);

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
                        Against: {resultData.opponentHandle || opponent}
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

export default SubmitPageReal;