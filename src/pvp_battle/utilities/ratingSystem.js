/**
 * Rating and XP System for 1v1 Battles
 * 
 * Rating: ELO-based system (K=32, default starting rating = 1200)
 * XP: Activity-based system (submission, win, lose, quit)
 */

import { supabase } from '../../supabaseclient';

// Constants
const ELO_K_FACTOR = 32;
const DEFAULT_RATING = 1200;

// XP Rewards/Penalties
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
const calculateExpectedScore = (playerRating, opponentRating) => {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

/**
 * Calculate new rating using ELO formula
 * R'A = RA + K * (S - EA)
 * S = 1 if win, 0 if loss
 */
const calculateNewRating = (currentRating, expectedScore, actualScore) => {
    const newRating = currentRating + ELO_K_FACTOR * (actualScore - expectedScore);
    return Math.round(newRating); // Round to integer
};

/**
 * Update ratings for both players after a match
 * @param {string} winnerId - Winner's user ID
 * @param {string} loserId - Loser's user ID
 * @returns {Promise<Object>} Updated ratings
 */
export const updateRatingsAfterMatch = async (winnerId, loserId) => {
    try {
        console.log('🏆 Updating ratings for winner:', winnerId, 'loser:', loserId);
        
        // Fetch current ratings for both players
        const [winnerData, loserData] = await Promise.all([
            supabase.from('users').select('rating, cf_handle').eq('id', winnerId).single(),
            supabase.from('users').select('rating, cf_handle').eq('id', loserId).single()
        ]);
        
        if (winnerData.error || loserData.error) {
            throw new Error('Failed to fetch player ratings');
        }
        
        const winnerRating = winnerData.data.rating || DEFAULT_RATING;
        const loserRating = loserData.data.rating || DEFAULT_RATING;
        
        console.log(`📊 Current ratings: ${winnerData.data.cf_handle}=${winnerRating}, ${loserData.data.cf_handle}=${loserRating}`);
        
        // Calculate expected scores
        const winnerExpected = calculateExpectedScore(winnerRating, loserRating);
        const loserExpected = calculateExpectedScore(loserRating, winnerRating);
        
        console.log(`📈 Expected scores: Winner=${winnerExpected.toFixed(3)}, Loser=${loserExpected.toFixed(3)}`);
        
        // Calculate new ratings (winner S=1, loser S=0)
        const newWinnerRating = calculateNewRating(winnerRating, winnerExpected, 1);
        const newLoserRating = calculateNewRating(loserRating, loserExpected, 0);
        
        const winnerChange = newWinnerRating - winnerRating;
        const loserChange = newLoserRating - loserRating;
        
        console.log(`✨ Rating changes: Winner ${winnerRating} → ${newWinnerRating} (${winnerChange >= 0 ? '+' : ''}${winnerChange})`);
        console.log(`✨ Rating changes: Loser ${loserRating} → ${newLoserRating} (${loserChange >= 0 ? '+' : ''}${loserChange})`);
        
        // Update database
        await Promise.all([
            supabase.from('users').update({ rating: newWinnerRating }).eq('id', winnerId),
            supabase.from('users').update({ rating: newLoserRating }).eq('id', loserId)
        ]);
        
        console.log('✅ Ratings updated successfully');
        
        return {
            winner: {
                oldRating: winnerRating,
                newRating: newWinnerRating,
                change: winnerChange
            },
            loser: {
                oldRating: loserRating,
                newRating: newLoserRating,
                change: loserChange
            }
        };
    } catch (error) {
        console.error('❌ Error updating ratings:', error);
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
 * @param {string} winnerId - Winner's user ID
 * @param {string} loserId - Loser's user ID
 */
export const processMatchOutcome = async (winnerId, loserId) => {
    try {
        console.log('🎮 Processing match outcome...');
        
        // Update ratings (ELO)
        const ratingChanges = await updateRatingsAfterMatch(winnerId, loserId);
        
        // Update XP
        const [winnerXP, loserXP] = await Promise.all([
            addXP(winnerId, XP_REWARDS.WIN, 'Win match'),
            addXP(loserId, XP_REWARDS.LOSE, 'Lose match')
        ]);
        
        console.log('✅ Match outcome processed successfully');
        
        return {
            ratings: ratingChanges,
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
 * @param {string} quitterId - User who quit
 * @param {string} winnerId - User who wins by forfeit
 */
export const processQuit = async (quitterId, winnerId) => {
    try {
        console.log('🚪 Processing quit: quitter=', quitterId, 'winner=', winnerId);
        
        // Quitter loses, winner wins
        const ratingChanges = await updateRatingsAfterMatch(winnerId, quitterId);
        
        // Update XP (quitter gets penalty, winner gets win bonus)
        const [quitterXP, winnerXP] = await Promise.all([
            addXP(quitterId, XP_REWARDS.QUIT, 'Quit match'),
            addXP(winnerId, XP_REWARDS.WIN, 'Win by forfeit')
        ]);
        
        console.log('✅ Quit processed successfully');
        
        return {
            ratings: ratingChanges,
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

export { XP_REWARDS, ELO_K_FACTOR, DEFAULT_RATING };
