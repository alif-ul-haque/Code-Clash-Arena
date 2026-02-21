/**
 * Rating System for 1v1 Battles
 * 
 * ELO-based system with attempt-based penalties
 * K = 32, Default Rating = 1200, Minimum Rating = 0
 */

import { supabase } from '../../supabaseclient';

// Constants
const ELO_K_FACTOR = 32;
const DEFAULT_RATING = 1200;
const MIN_RATING = 0;

// Penalty multiplier for no submissions
const NO_SUBMISSION_MULTIPLIER = 1.5;

// Both-exit fixed penalties
const BOTH_EXIT_PENALTY_NO_ATTEMPTS = 16;
const BOTH_EXIT_PENALTY_WITH_ATTEMPTS = 12;

// XP Rewards/Penalties (kept for backward compatibility)
const XP_REWARDS = {
    SUBMISSION: 0.5,
    WIN: 0.30,
    LOSE: 0.10,
    QUIT: -0.25
};

/**
 * Calculate expected score using ELO formula
 * EA = 1 / (1 + 10^((RB - RA) / 400))
 */
export const calculateExpectedScore = (ratingA, ratingB) => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Calculate base ELO change
 * R'A = RA + K * (S - EA)
 */
const calculateBaseEloChange = (ratingA, ratingB, isWinner) => {
    const expectedScore = calculateExpectedScore(ratingA, ratingB);
    const actualScore = isWinner ? 1 : 0;
    const change = ELO_K_FACTOR * (actualScore - expectedScore);
    return Math.round(change);
};

/**
 * Apply loss multiplier based on submission count
 * Only applies to LOSER's rating loss
 */
export const applyLossMultiplier = (baseLoss, submissionCount) => {
    if (submissionCount === 0) {
        return Math.round(baseLoss * NO_SUBMISSION_MULTIPLIER);
    }
    return baseLoss;
};

/**
 * Handle normal battle (one winner, one loser)
 * Winner gets normal ELO gain
 * Loser gets ELO loss with attempt-based multiplier
 */
export const handleNormalBattle = (playerA, playerB, winnerId, submissionCounts) => {
    const isAWinner = playerA.id === winnerId;
    const winner = isAWinner ? playerA : playerB;
    const loser = isAWinner ? playerB : playerA;
    
    const winnerSubmissions = submissionCounts[winner.id] || 0;
    const loserSubmissions = submissionCounts[loser.id] || 0;
    
    console.log(`⚔️ Normal Battle: ${winner.handle} (${winnerSubmissions} attempts) vs ${loser.handle} (${loserSubmissions} attempts)`);
    
    // Calculate winner's normal ELO gain
    const winnerChange = calculateBaseEloChange(winner.rating, loser.rating, true);
    
    // Calculate loser's base ELO loss
    const loserBaseChange = calculateBaseEloChange(loser.rating, winner.rating, false);
    
    // Apply attempt-based multiplier to loser ONLY
    const loserChange = applyLossMultiplier(loserBaseChange, loserSubmissions);
    
    console.log(`📊 Base changes: Winner +${winnerChange}, Loser ${loserBaseChange}`);
    if (loserSubmissions === 0) {
        console.log(`⚡ Loser made 0 submissions! Applying 1.5x penalty: ${loserBaseChange} → ${loserChange}`);
    }
    
    // Calculate new ratings (enforce minimum)
    const newWinnerRating = Math.max(MIN_RATING, winner.rating + winnerChange);
    const newLoserRating = Math.max(MIN_RATING, loser.rating + loserChange);
    
    return {
        [winner.id]: {
            oldRating: winner.rating,
            newRating: newWinnerRating,
            change: winnerChange
        },
        [loser.id]: {
            oldRating: loser.rating,
            newRating: newLoserRating,
            change: loserChange
        }
    };
};

/**
 * Handle both exit case (no winner)
 * Fixed penalties based on submission counts
 * NO ELO calculation - direct deduction
 */
export const handleBothExit = (playerA, playerB, submissionCounts) => {
    const playerASubmissions = submissionCounts[playerA.id] || 0;
    const playerBSubmissions = submissionCounts[playerB.id] || 0;
    
    console.log(`🚪 Both Exit: ${playerA.handle} (${playerASubmissions} attempts) vs ${playerB.handle} (${playerBSubmissions} attempts)`);
    
    // Determine penalty based on whether BOTH made 0 submissions
    let penalty;
    if (playerASubmissions === 0 && playerBSubmissions === 0) {
        penalty = -BOTH_EXIT_PENALTY_NO_ATTEMPTS; // -16
        console.log('⚠️ Both made 0 submissions → -16 penalty each');
    } else {
        penalty = -BOTH_EXIT_PENALTY_WITH_ATTEMPTS; // -12
        console.log('📝 At least one made submissions → -12 penalty each');
    }
    
    // Apply penalty to both players
    const newARating = Math.max(MIN_RATING, playerA.rating + penalty);
    const newBRating = Math.max(MIN_RATING, playerB.rating + penalty);
    
    return {
        [playerA.id]: {
            oldRating: playerA.rating,
            newRating: newARating,
            change: penalty
        },
        [playerB.id]: {
            oldRating: playerB.rating,
            newRating: newBRating,
            change: penalty
        }
    };
};

/**
 * Finalize battle and update ratings
 * Main function to call from battle pages
 * 
 * @param {Object} params
 * @param {string} params.playerAId - First player's user ID
 * @param {string} params.playerBId - Second player's user ID
 * @param {string|null} params.winnerId - Winner's ID (null if both exit)
 * @param {Object} params.submissionCounts - { playerId: count, ... }
 * @returns {Promise<Object>} Rating changes and player data
 */
export const finalizeBattle = async ({ playerAId, playerBId, winnerId, submissionCounts }) => {
    try {
        console.log('🏁 ========== FINALIZING BATTLE RATINGS ==========');
        console.log('Players:', playerAId, 'vs', playerBId);
        console.log('Winner:', winnerId || 'NONE (both exit)');
        console.log('Submission counts:', submissionCounts);
        
        // Fetch current ratings
        const [playerAData, playerBData] = await Promise.all([
            supabase.from('users').select('id, rating, cf_handle').eq('id', playerAId).single(),
            supabase.from('users').select('id, rating, cf_handle').eq('id', playerBId).single()
        ]);
        
        if (playerAData.error || playerBData.error) {
            throw new Error('Failed to fetch player ratings');
        }
        
        const playerA = {
            id: playerAData.data.id,
            rating: playerAData.data.rating || DEFAULT_RATING,
            handle: playerAData.data.cf_handle
        };
        
        const playerB = {
            id: playerBData.data.id,
            rating: playerBData.data.rating || DEFAULT_RATING,
            handle: playerBData.data.cf_handle
        };
        
        console.log(`📊 Current ratings: ${playerA.handle}=${playerA.rating}, ${playerB.handle}=${playerB.rating}`);
        
        let ratingChanges;
        
        // Determine which case to use
        if (winnerId) {
            // Normal battle - someone won
            console.log('⚔️ NORMAL BATTLE MODE');
            ratingChanges = handleNormalBattle(playerA, playerB, winnerId, submissionCounts);
        } else {
            // Both exit case
            console.log('🚪 BOTH EXIT MODE');
            ratingChanges = handleBothExit(playerA, playerB, submissionCounts);
        }
        
        // Update database
        await Promise.all([
            supabase.from('users').update({ rating: ratingChanges[playerA.id].newRating }).eq('id', playerA.id),
            supabase.from('users').update({ rating: ratingChanges[playerB.id].newRating }).eq('id', playerB.id)
        ]);
        
        console.log('✅ RATINGS UPDATED:');
        console.log(`   ${playerA.handle}: ${playerA.rating} → ${ratingChanges[playerA.id].newRating} (${ratingChanges[playerA.id].change >= 0 ? '+' : ''}${ratingChanges[playerA.id].change})`);
        console.log(`   ${playerB.handle}: ${playerB.rating} → ${ratingChanges[playerB.id].newRating} (${ratingChanges[playerB.id].change >= 0 ? '+' : ''}${ratingChanges[playerB.id].change})`);
        console.log('================================================');
        
        return {
            ratingChanges,
            players: {
                [playerA.id]: playerA,
                [playerB.id]: playerB
            }
        };
    } catch (error) {
        console.error('❌ Error finalizing battle:', error);
        throw error;
    }
};

/**
 * Add XP to a player (with minimum 0 enforcement)
 * @param {string} userId - User ID
 * @param {number} xpAmount - Amount to add (can be negative)
 * @param {string} reason - Reason for XP change
 */
export const addXP = async (userId, xpAmount, reason) => {
    try {
        console.log(`💎 Adding ${xpAmount} XP to user ${userId} (${reason})`);
        
        // Fetch current XP
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('xp, cf_handle')
            .eq('id', userId)
            .single();
        
        if (fetchError) {
            throw new Error('Failed to fetch user XP');
        }
        
        const currentXP = parseFloat(userData.xp) || 0;
        let newXP = currentXP + xpAmount;
        
        // Enforce minimum 0
        if (newXP < 0) {
            console.log('⚠️ XP would go below 0, setting to 0');
            newXP = 0;
        }
        
        console.log(`📊 ${userData.cf_handle} XP: ${currentXP.toFixed(2)} → ${newXP.toFixed(2)} (${xpAmount >= 0 ? '+' : ''}${xpAmount.toFixed(2)})`);
        
        // Update database
        const { error: updateError } = await supabase
            .from('users')
            .update({ xp: newXP })
            .eq('id', userId);
        
        if (updateError) {
            throw new Error('Failed to update XP');
        }
        
        console.log('✅ XP updated successfully');
        
        return {
            oldXP: currentXP,
            newXP: newXP,
            change: xpAmount
        };
    } catch (error) {
        console.error('❌ Error updating XP:', error);
        throw error;
    }
};

/**
 * Handle complete match outcome (ratings + XP)
 * LEGACY FUNCTION - kept for backward compatibility
 * Use finalizeBattle() for new code
 * 
 * @param {string} winnerId - Winner's user ID
 * @param {string} loserId - Loser's user ID
 * @param {number} winnerAttempts - Winner's submission count
 * @param {number} loserAttempts - Loser's submission count
 */
export const processMatchOutcome = async (winnerId, loserId, winnerAttempts = 1, loserAttempts = 0) => {
    try {
        console.log('🎮 Processing match outcome (legacy function)...');
        console.log('⚠️ Consider using finalizeBattle() instead');
        
        // Use new finalizeBattle function
        const result = await finalizeBattle({
            playerAId: winnerId,
            playerBId: loserId,
            winnerId: winnerId,
            submissionCounts: {
                [winnerId]: winnerAttempts,
                [loserId]: loserAttempts
            }
        });
        
        // Update XP
        const [winnerXP, loserXP] = await Promise.all([
            addXP(winnerId, XP_REWARDS.WIN, 'Win match'),
            addXP(loserId, XP_REWARDS.LOSE, 'Lose match')
        ]);
        
        console.log('✅ Match outcome processed successfully');
        
        return {
            ratings: {
                winner: result.ratingChanges[winnerId],
                loser: result.ratingChanges[loserId]
            },
            xp: {
                winner: winnerXP,
                loser: loserXP
            }
        };
    } catch (error) {
        console.error('❌ Error processing match outcome:', error);
        throw error;
    }
};

/**
 * Handle quit/exit from battle
 * LEGACY FUNCTION - use finalizeBattle() instead
 * 
 * @param {string} quitterId - User who quit
 * @param {string} winnerId - User who wins by forfeit
 */
export const processQuit = async (quitterId, winnerId) => {
    try {
        console.log('🚪 Processing quit (legacy function)...');
        console.log('⚠️ Consider using finalizeBattle() instead');
        
        // Use new finalizeBattle function (quitter = loser with 0 attempts)
        const result = await finalizeBattle({
            playerAId: winnerId,
            playerBId: quitterId,
            winnerId: winnerId,
            submissionCounts: {
                [winnerId]: 1, // Winner by forfeit
                [quitterId]: 0  // Quitter made no attempts
            }
        });
        
        // Update XP (quitter gets penalty, winner gets win bonus)
        const [quitterXP, winnerXP] = await Promise.all([
            addXP(quitterId, XP_REWARDS.QUIT, 'Quit match'),
            addXP(winnerId, XP_REWARDS.WIN, 'Win by forfeit')
        ]);
        
        console.log('✅ Quit processed successfully');
        
        return {
            ratings: {
                quitter: result.ratingChanges[quitterId],
                winner: result.ratingChanges[winnerId]
            },
            xp: {
                quitter: quitterXP,
                winner: winnerXP
            }
        };
    } catch (error) {
        console.error('❌ Error processing quit:', error);
        throw error;
    }
};

/**
 * Add submission XP (called on each code submission)
 * @param {string} userId - User ID
 */
export const addSubmissionXP = async (userId) => {
    return await addXP(userId, XP_REWARDS.SUBMISSION, 'Submission');
};

export { 
    XP_REWARDS, 
    ELO_K_FACTOR, 
    DEFAULT_RATING, 
    MIN_RATING,
    NO_SUBMISSION_MULTIPLIER,
    BOTH_EXIT_PENALTY_NO_ATTEMPTS,
    BOTH_EXIT_PENALTY_WITH_ATTEMPTS
};

