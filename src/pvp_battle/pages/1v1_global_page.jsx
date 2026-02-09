import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/1v1_global_page.css';
import magnifyingGlassIcon from '../../assets/icons/magnifying_glass.png';
import swordsIcon from '../../assets/icons/swords.png';
import { supabase } from '../../supabaseclient';
import { 
    joinMatchmakingQueue, 
    findBestMatch, 
    createGlobalBattle,
    leaveMatchmakingQueue,
    subscribeToMatchmaking
} from '../utilities/globalMatchmaking';

const OneVOneGlobalPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser: stateCurrentUser } = location.state || {};
    
    const [searchStatus, setSearchStatus] = useState('Searching...');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        let matchmakingChannel = null;
        let matchmakingInterval = null;
        let matchmakingTimeout = null;

        const startMatchmaking = async () => {
            try {
                // Get currentUser from state or localStorage
                let currentUser = stateCurrentUser;
                if (!currentUser) {
                    currentUser = localStorage.getItem('currentUser');
                    console.log('Retrieved currentUser from localStorage:', currentUser);
                }

                if (!currentUser) {
                    console.error('No currentUser found! Redirecting...');
                    setSearchStatus('User not found. Redirecting...');
                    setTimeout(() => navigate('/playmode1v1'), 2000);
                    return;
                }

                console.log('Starting matchmaking for:', currentUser);

                // Get user data
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, cf_handle, rating')
                    .eq('cf_handle', currentUser)
                    .single();

                if (userError) {
                    console.error('Error fetching user:', userError);
                    setSearchStatus('Error loading user data');
                    setTimeout(() => navigate('/playmode1v1'), 3000);
                    return;
                }

                if (!userData) {
                    console.error('User not found in database');
                    setSearchStatus('User not found');
                    setTimeout(() => navigate('/playmode1v1'), 3000);
                    return;
                }

                setUserId(userData.id);
                const playerRating = userData.rating;

                console.log(`🔍 Starting matchmaking... User: ${userData.cf_handle}, Rating: ${playerRating}`);
                setSearchStatus('Joining matchmaking queue...');

                // Join matchmaking queue
                console.log('Calling joinMatchmakingQueue...');
                const queueEntry = await joinMatchmakingQueue(userData.id, userData.cf_handle, playerRating);
                console.log('✓ Joined queue:', queueEntry);
                
                setSearchStatus('Searching for opponent...');

                // Function to navigate to battle (defined HERE, before use)
                const navigateToBattle = async (battleId) => {
                    try {
                        console.log('🔍 Fetching opponent data for battle:', battleId);
                        setSearchStatus('Match found! Loading battle...');

                        // Get all participants for this battle
                        const { data: participants, error: participantsError } = await supabase
                            .from('onevone_participants')
                            .select('player_id')
                            .eq('onevone_battle_id', battleId);

                        if (participantsError || !participants || participants.length !== 2) {
                            console.error('Error fetching participants:', participantsError);
                            throw new Error('Failed to fetch battle participants');
                        }

                        console.log('Found participants:', participants);

                        // Find opponent's ID
                        const opponentId = participants.find(p => p.player_id !== userData.id)?.player_id;
                        
                        if (!opponentId) {
                            console.error('Opponent not found in participants!');
                            throw new Error('Opponent not found');
                        }

                        // Get opponent's user data
                        const { data: opponentData, error: opponentError } = await supabase
                            .from('users')
                            .select('cf_handle, rating')
                            .eq('id', opponentId)
                            .single();

                        if (opponentError || !opponentData) {
                            console.error('Error fetching opponent data:', opponentError);
                            throw new Error('Failed to fetch opponent data');
                        }

                        console.log('✓ Opponent found:', opponentData.cf_handle);

                        // Navigate to battle page
                        console.log('🚀 Navigating to battle page...');
                        navigate('/1v1-global-battle', {
                            state: {
                                battleId: battleId,
                                opponent: opponentData,
                                currentUser: userData.cf_handle
                            }
                        });
                    } catch (error) {
                        console.error('Error navigating to battle:', error);
                        setSearchStatus('Error loading battle. Redirecting...');
                        setTimeout(() => navigate('/playmode1v1'), 2000);
                    }
                };

                // Immediately check if already matched (in case we joined and someone was waiting)
                const { data: immediateCheck } = await supabase
                    .from('matchmaking_queue')
                    .select('status, battle_id')
                    .eq('user_id', userData.id)
                    .single();

                if (immediateCheck?.status === 'matched' && immediateCheck.battle_id) {
                    console.log('🎯 Already matched on join!');
                    await navigateToBattle(immediateCheck.battle_id);
                    return;
                }

                // Subscribe to matchmaking updates
                matchmakingChannel = subscribeToMatchmaking(userData.id, async (matchData) => {
                    console.log('📡 Subscription triggered! Status:', matchData.status);
                    
                    // Clear interval and timeout
                    if (matchmakingInterval) {
                        clearInterval(matchmakingInterval);
                        matchmakingInterval = null;
                    }
                    if (matchmakingTimeout) {
                        clearTimeout(matchmakingTimeout);
                        matchmakingTimeout = null;
                    }

                    if (matchData.battle_id) {
                        console.log('✅ Match found via subscription! Battle ID:', matchData.battle_id);
                        await navigateToBattle(matchData.battle_id);
                    }
                });

                // Aggressive polling: Check queue status every 1 second for fast match detection
                matchmakingInterval = setInterval(async () => {
                    try {
                        // First, check if we've been matched (primary detection method)
                        const { data: queueStatus } = await supabase
                            .from('matchmaking_queue')
                            .select('status, battle_id')
                            .eq('user_id', userData.id)
                            .maybeSingle();

                        if (queueStatus?.status === 'matched' && queueStatus.battle_id) {
                            console.log('✅ MATCHED! (detected via polling)');
                            clearInterval(matchmakingInterval);
                            matchmakingInterval = null;
                            if (matchmakingTimeout) {
                                clearTimeout(matchmakingTimeout);
                                matchmakingTimeout = null;
                            }
                            await navigateToBattle(queueStatus.battle_id);
                            return;
                        }

                        // If still searching, try to find a match
                        const opponent = await findBestMatch(userData.id, playerRating);
                        
                        if (opponent) {
                            console.log('🎮 Found opponent:', opponent.cf_handle, 'Rating:', opponent.rating);
                            setSearchStatus('Found opponent! Creating battle...');
                            
                            // Clear interval immediately to prevent duplicate attempts
                            clearInterval(matchmakingInterval);
                            matchmakingInterval = null;
                            
                            if (matchmakingTimeout) {
                                clearTimeout(matchmakingTimeout);
                                matchmakingTimeout = null;
                            }

                            // Create battle
                            console.log('🔨 Creating battle...');
                            const battle = await createGlobalBattle(
                                { user_id: userData.id, cf_handle: userData.cf_handle },
                                { user_id: opponent.user_id, cf_handle: opponent.cf_handle }
                            );

                            console.log('✅ Battle created! ID:', battle.onevone_battle_id);
                            
                            // Navigate immediately for the player who created the battle
                            await navigateToBattle(battle.onevone_battle_id);
                        }
                    } catch (error) {
                        console.error('Error in matchmaking interval:', error);
                        // Don't stop searching on error, just log it
                    }
                }, 1000); // Check every 1 second for faster detection

                // Timeout after 60 seconds
                matchmakingTimeout = setTimeout(() => {
                    if (matchmakingInterval) {
                        clearInterval(matchmakingInterval);
                        setSearchStatus('No opponents found. Try again later.');
                        leaveMatchmakingQueue(userData.id);
                        
                        setTimeout(() => {
                            navigate('/playmode1v1');
                        }, 3000);
                    }
                }, 60000);

            } catch (error) {
                console.error('❌ Matchmaking error:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details
                });
                
                // Show specific error message to user
                const errorMsg = error.message || 'Unknown error';
                setSearchStatus(`Error: ${errorMsg.substring(0, 50)}`);
                
                setTimeout(() => navigate('/playmode1v1'), 3000);
            }
        };

        // Start matchmaking immediately
        startMatchmaking();

        // Cleanup
        return () => {
            console.log('Cleanup: Removing from queue');
            if (matchmakingChannel) {
                supabase.removeChannel(matchmakingChannel);
            }
            if (matchmakingInterval) {
                clearInterval(matchmakingInterval);
            }
            if (matchmakingTimeout) {
                clearTimeout(matchmakingTimeout);
            }
            // Clean up queue entry when component unmounts
            if (userId) {
                leaveMatchmakingQueue(userId);
            }
        };
    }, [navigate]);
    
    return (
        <div className="one-v-one-global-page">
            <div className="page-container"></div>
            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => {
                    if (userId) {
                        leaveMatchmakingQueue(userId);
                    }
                    navigate('/playmode1v1');
                }}>Exit</button>
            </div>
            <div className="content-wrapper">
                <div className="content-wrapper">
                    <div className="search-card">
                        <h1 className="search-heading">{searchStatus.toUpperCase()}</h1>
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