import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/FindingOpponent.css';
import { findMatch, leaveBattleQueue, subscribeToMatchmaking } from '../utilities/ClanBattleMatchmaking';
import { createClanBattle } from '../utilities/ClanBattleManager';
import getUserData from '../../mainpage_clan_battle/utilities/UserData';
import { supabase } from '../../supabaseclient';

export default function FindingOpponent() {
    const navigate = useNavigate();
    const [dots, setDots] = useState('');
    const [isCreatingBattle, setIsCreatingBattle] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState('');
    const isProcessingBattle = useRef(false);

    // Define handleMatchFound before useEffect to avoid hoisting issues
    const handleMatchFound = useCallback(async (opponentClanId) => {
        try {
            // Mark that we're processing the battle to prevent cleanup
            isProcessingBattle.current = true;
            
            // Get current user and queue data
            const { data: user } = await getUserData();
            
            // Get both clans' queue data to get selected members
            const { data: myQueue } = await supabase
                .from('clan_battle_queue')
                .select('selected_members')
                .eq('clan_id', user.clan_id)
                .single();

            const { data: opponentQueue } = await supabase
                .from('clan_battle_queue')
                .select('selected_members')
                .eq('clan_id', opponentClanId)
                .single();

            if (!myQueue || !opponentQueue) {
                console.error('Queue data not found');
                isProcessingBattle.current = false;
                navigate('/your-clan');
                return;
            }

            // Determine which clan should create the battle (use string comparison to ensure only one creates)
            const shouldCreate = user.clan_id < opponentClanId;
            
            let battleId = null;
            
            if (shouldCreate) {
                console.log('This clan will create the battle');
                setWaitingMessage('Creating battle...');
                // Create the battle
                const { success, battleId: createdBattleId, error } = await createClanBattle(
                    user.clan_id,
                    opponentClanId,
                    myQueue.selected_members,
                    opponentQueue.selected_members
                );

                if (success && createdBattleId) {
                    battleId = createdBattleId;
                } else {
                    console.error('Failed to create battle:', error);
                    alert('Failed to create battle. Please try again.');
                    navigate('/your-clan');
                    return;
                }
            } else {
                console.log('Waiting for opponent clan to create the battle...');
                setWaitingMessage('Waiting for opponent to prepare battlefield...');
                
                // Wait for the battle to be created by the opponent
                let attempts = 0;
                const maxAttempts = 15; // Wait up to 15 seconds
                
                while (attempts < maxAttempts && !battleId) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                    
                    // Update waiting message every 3 seconds
                    if (attempts % 3 === 0) {
                        setWaitingMessage(`Synchronizing with opponent... (${attempts}s)`);
                    }
                    
                    // Check if battle exists
                    const { data: existingBattle } = await supabase
                        .from('clan_battles')
                        .select('battle_id')
                        .or(`and(clan1_id.eq.${user.clan_id},clan2_id.eq.${opponentClanId}),and(clan1_id.eq.${opponentClanId},clan2_id.eq.${user.clan_id})`)
                        .in('status', ['preparing', 'in_progress'])
                        .single();
                    
                    if (existingBattle) {
                        battleId = existingBattle.battle_id;
                        console.log('Battle found:', battleId);
                        setWaitingMessage('Battle ready!');
                        break;
                    }
                    
                    attempts++;
                }
                
                if (!battleId) {
                    console.error('Battle was not created in time');
                    isProcessingBattle.current = false;
                    alert('Failed to join battle. Please try again.');
                    navigate('/your-clan');
                    return;
                }
            }

            if (battleId) {
                // Navigate to revealing warriors with battle data
                navigate('/your-clan/revealing-warriors', { 
                    state: { 
                        battleId,
                        opponentClanId 
                    } 
                });
            }
        } catch (error) {
            console.error('Error in handleMatchFound:', error);
            navigate('/your-clan');
        }
    }, [navigate]);

    useEffect(() => {
        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Poll for match every 2 seconds
        let pollInterval;
        async function pollForMatch() {
            if (isCreatingBattle) return; // Don't poll if already creating battle

            const { matched, opponentClanId, error } = await findMatch();
            
            if (error) {
                console.error('Error finding match:', error);
                return;
            }

            if (matched && opponentClanId) {
                setIsCreatingBattle(true);
                clearInterval(pollInterval);
                await handleMatchFound(opponentClanId);
            }
        }

        pollInterval = setInterval(pollForMatch, 2000);
        pollForMatch(); // Initial check

        // Subscribe to real-time matchmaking updates
        const channel = subscribeToMatchmaking(async (payload) => {
            console.log('Matchmaking update:', payload);
            if (payload.new?.status === 'matched') {
                const { data: user } = await getUserData();
                if (user && payload.new.clan_id === user.clan_id) {
                    setIsCreatingBattle(true);
                    clearInterval(pollInterval);
                    await handleMatchFound(payload.new.matched_with_clan_id);
                }
            }
        });

        // Cleanup on unmount
        return () => {
            clearInterval(dotsInterval);
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
            // Only leave queue if we're not in the middle of processing a battle
            if (!isProcessingBattle.current) {
                console.log('Leaving queue (cleanup)');
                leaveBattleQueue();
            } else {
                console.log('Skipping queue cleanup - battle is being processed');
            }
        };
    }, [navigate, isCreatingBattle, handleMatchFound]);

    return (
        <div className="finding-opponent-page">
            <div className="finding-overlay">
                <div className="magnifying-glass">
                    <div className="glass-lens"></div>
                    <div className="glass-handle"></div>
                    <div className="search-glow"></div>
                </div>

                <h1 className="finding-title">
                    {isCreatingBattle ? 'Match Found! Creating Battle' : `Finding Your Opponent${dots}`}
                </h1>
                <p className="finding-subtitle">
                    {isCreatingBattle ? (waitingMessage || 'Preparing the battlefield...') : 'Searching for worthy adversaries'}
                </p>

                <div className="scan-lines">
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                </div>
            </div>
        </div>
    );
}
