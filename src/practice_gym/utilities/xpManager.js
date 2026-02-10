/**
 * XP Management Utility
 * Handle XP costs for AI hints and rewards
 */

import { supabase } from '../../supabaseclient';

/**
 * XP costs for different hint levels
 */
export const HINT_COSTS = {
  1: 50,   // Subtle hint
  2: 100,  // Detailed hint
  3: 150   // Algorithm steps
};

/**
 * Check if user has enough XP for a hint
 * @param {number} currentXP - User's current XP
 * @param {number} hintLevel - Hint level (1-3)
 * @returns {boolean}
 */
export const canAffordHint = (currentXP, hintLevel) => {
  return currentXP >= HINT_COSTS[hintLevel];
};

/**
 * Deduct XP from user's account
 * @param {string} userId - User's database ID
 * @param {number} xpAmount - Amount of XP to deduct
 * @returns {Promise<{success: boolean, newXP: number, error?: string}>}
 */
export const deductXP = async (userId, xpAmount) => {
  try {
    // First get current XP
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentXP = userData.xp || 0;
    const newXP = Math.max(0, currentXP - xpAmount);

    // Update XP
    const { error: updateError } = await supabase
      .from('users')
      .update({ xp: newXP })
      .eq('id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      newXP: newXP,
      deducted: xpAmount
    };
  } catch (error) {
    console.error('Error deducting XP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Award XP to user (for solving problems, etc.)
 * @param {string} userId - User's database ID
 * @param {number} xpAmount - Amount of XP to award
 * @returns {Promise<{success: boolean, newXP: number}>}
 */
export const awardXP = async (userId, xpAmount) => {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentXP = userData.xp || 0;
    const newXP = currentXP + xpAmount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ xp: newXP })
      .eq('id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      newXP: newXP,
      awarded: xpAmount
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
