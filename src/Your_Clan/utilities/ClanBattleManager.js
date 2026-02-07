import { supabase } from '../../supabaseclient';
import getUserData from '../../mainpage_clan_battle/utilities/UserData';

/**
 * Create a new clan battle
 * @param {string} clan1Id - First clan ID
 * @param {string} clan2Id - Second clan ID
 * @param {Array} clan1Members - Array of user IDs from clan 1
 * @param {Array} clan2Members - Array of user IDs from clan 2
 * @returns {Promise<{success: boolean, battleId: string|null, error: any}>}
 */
export async function createClanBattle(clan1Id, clan2Id, clan1Members, clan2Members) {
    try {
        // First, check if a battle already exists for these two clans
        const { data: existingBattle } = await supabase
            .from('clan_battles')
            .select('battle_id')
            .or(`and(clan1_id.eq.${clan1Id},clan2_id.eq.${clan2Id}),and(clan1_id.eq.${clan2Id},clan2_id.eq.${clan1Id})`)
            .in('status', ['preparing', 'in_progress'])
            .single();

        // If battle already exists, return it
        if (existingBattle) {
            console.log('Battle already exists, using existing battle:', existingBattle.battle_id);
            return { success: true, battleId: existingBattle.battle_id, error: null };
        }

        // Create battle record
        const { data: battle, error: battleError } = await supabase
            .from('clan_battles')
            .insert({
                clan1_id: clan1Id,
                clan2_id: clan2Id,
                status: 'preparing',
                duration_seconds: 120 // 2 minutes
            })
            .select()
            .single();

        if (battleError) {
            console.error('Error creating battle:', battleError);
            // Check again if battle was created by other user (race condition)
            const { data: raceCheckBattle } = await supabase
                .from('clan_battles')
                .select('battle_id')
                .or(`and(clan1_id.eq.${clan1Id},clan2_id.eq.${clan2Id}),and(clan1_id.eq.${clan2Id},clan2_id.eq.${clan1Id})`)
                .in('status', ['preparing', 'in_progress'])
                .single();
            
            if (raceCheckBattle) {
                console.log('Battle created by another user, using it:', raceCheckBattle.battle_id);
                return { success: true, battleId: raceCheckBattle.battle_id, error: null };
            }
            
            return { success: false, battleId: null, error: battleError };
        }

        // Add participants
        const participants = [
            ...clan1Members.map(userId => ({
                battle_id: battle.battle_id,
                user_id: userId,
                clan_id: clan1Id
            })),
            ...clan2Members.map(userId => ({
                battle_id: battle.battle_id,
                user_id: userId,
                clan_id: clan2Id
            }))
        ];

        const { error: participantsError } = await supabase
            .from('clan_battle_participants')
            .insert(participants);

        if (participantsError) {
            console.error('Error adding participants:', participantsError);
            // Rollback - delete battle
            await supabase.from('clan_battles').delete().eq('battle_id', battle.battle_id);
            return { success: false, battleId: null, error: participantsError };
        }

        // Generate battle problems (5 hardcoded problems)
        const problems = generateBattleProblems(battle.battle_id);
        const { error: problemsError } = await supabase
            .from('clan_battle_problems')
            .insert(problems);

        if (problemsError) {
            console.error('Error creating problems:', problemsError);
        }

        // Clear both clans from queue
        await supabase
            .from('clan_battle_queue')
            .delete()
            .in('clan_id', [clan1Id, clan2Id]);

        return { success: true, battleId: battle.battle_id, error: null };
    } catch (error) {
        console.error('Error in createClanBattle:', error);
        return { success: false, battleId: null, error };
    }
}

/**
 * Generate hardcoded battle problems
 * @param {string} battleId - Battle ID
 * @returns {Array} Array of problem objects
 */
function generateBattleProblems(battleId) {
    const problems = [
        {
            battle_id: battleId,
            problem_index: 0,
            problem_title: "Two Sum",
            problem_description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            difficulty: "Easy",
            test_cases: JSON.stringify([
                { input: "[2,7,11,15], 9", output: "[0,1]" },
                { input: "[3,2,4], 6", output: "[1,2]" }
            ])
        },
        {
            battle_id: battleId,
            problem_index: 1,
            problem_title: "Palindrome Number",
            problem_description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
            difficulty: "Easy",
            test_cases: JSON.stringify([
                { input: "121", output: "true" },
                { input: "-121", output: "false" },
                { input: "10", output: "false" }
            ])
        },
        {
            battle_id: battleId,
            problem_index: 2,
            problem_title: "Valid Parentheses",
            problem_description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            difficulty: "Medium",
            test_cases: JSON.stringify([
                { input: "\"()\"", output: "true" },
                { input: "\"()[]{}\"", output: "true" },
                { input: "\"(]\"", output: "false" }
            ])
        },
        {
            battle_id: battleId,
            problem_index: 3,
            problem_title: "Longest Substring Without Repeating Characters",
            problem_description: "Given a string s, find the length of the longest substring without repeating characters.",
            difficulty: "Medium",
            test_cases: JSON.stringify([
                { input: "\"abcabcbb\"", output: "3" },
                { input: "\"bbbbb\"", output: "1" },
                { input: "\"pwwkew\"", output: "3" }
            ])
        },
        {
            battle_id: battleId,
            problem_index: 4,
            problem_title: "Median of Two Sorted Arrays",
            problem_description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
            difficulty: "Hard",
            test_cases: JSON.stringify([
                { input: "[1,3], [2]", output: "2.0" },
                { input: "[1,2], [3,4]", output: "2.5" }
            ])
        }
    ];

    return problems;
}

/**
 * Get battle details
 * @param {string} battleId - Battle ID
 * @returns {Promise<{battle: any, error: any}>}
 */
export async function getBattle(battleId) {
    try {
        if (!battleId) {
            // Try to get current user's active battle
            const { data: user } = await getUserData();
            if (!user || !user.clan_id) {
                return { battle: null, error: 'No user or clan' };
            }

            const { data: battles } = await supabase
                .from('clan_battles')
                .select('*')
                .or(`clan1_id.eq.${user.clan_id},clan2_id.eq.${user.clan_id}`)
                .in('status', ['preparing', 'in_progress'])
                .order('created_at', { ascending: false })
                .limit(1);

            if (battles && battles.length > 0) {
                battleId = battles[0].battle_id;
            } else {
                return { battle: null, error: 'No active battle' };
            }
        }

        const { data: battle, error } = await supabase
            .from('clan_battles')
            .select('*')
            .eq('battle_id', battleId)
            .single();

        if (error) {
            console.error('Error fetching battle:', error);
            return { battle: null, error };
        }

        return { battle, error: null };
    } catch (error) {
        console.error('Error in getBattle:', error);
        return { battle: null, error };
    }
}

/**
 * Get battle participants
 * @param {string} battleId - Battle ID
 * @returns {Promise<{participants: Array, error: any}>}
 */
export async function getBattleParticipants(battleId) {
    try {
        const { data: participants, error } = await supabase
            .from('clan_battle_participants')
            .select(`
                *,
                users:user_id (
                    cf_handle,
                    rating,
                    level
                )
            `)
            .eq('battle_id', battleId);

        if (error) {
            console.error('Error fetching participants:', error);
            return { participants: [], error };
        }

        return { participants, error: null };
    } catch (error) {
        console.error('Error in getBattleParticipants:', error);
        return { participants: [], error };
    }
}

/**
 * Start the battle (change status to in_progress)
 * Only updates if battle is still in 'preparing' status
 * @param {string} battleId - Battle ID
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function startBattle(battleId) {
    try {
        // Only update if status is 'preparing' to avoid resetting start_time
        const { error } = await supabase
            .from('clan_battles')
            .update({ 
                status: 'in_progress',
                start_time: new Date().toISOString()
            })
            .eq('battle_id', battleId)
            .eq('status', 'preparing'); // Only update if currently preparing

        if (error) {
            console.error('Error starting battle:', error);
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('Error in startBattle:', error);
        return { success: false, error };
    }
}

/**
 * Subscribe to battle events
 * @param {string} battleId - Battle ID
 * @param {Function} callback - Callback function
 * @returns {Object} Supabase channel
 */
export function subscribeToBattleEvents(battleId, callback) {
    const channel = supabase
        .channel(`battle_${battleId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'clan_battles',
                filter: `battle_id=eq.${battleId}`
            },
            callback
        )
        .subscribe();

    return channel;
}

/**
 * Submit a solution for a problem
 * @param {string} battleId - Battle ID
 * @param {number} problemIndex - Problem index (0-4)
 * @param {string} code - User's code
 * @param {string} language - Programming language
 * @returns {Promise<{success: boolean, points: number, error: any}>}
 */
export async function submitSolution(battleId, problemIndex, code, language) {
    try {
        // Get current user
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { success: false, points: 0, error: userError || 'User not found' };
        }

        // Check if user hasn't solved a problem yet (one problem per player rule)
        const { data: participant, error: participantError } = await supabase
            .from('clan_battle_participants')
            .select('problems_solved')
            .eq('battle_id', battleId)
            .eq('user_id', user.id)
            .single();

        if (participantError) {
            return { success: false, points: 0, error: 'Participant not found' };
        }

        if (participant.problems_solved >= 1) {
            return { success: false, points: 0, error: 'You can only solve one problem per battle' };
        }

        // Get battle start time to calculate elapsed time
        const { data: battle, error: battleError } = await supabase
            .from('clan_battles')
            .select('start_time')
            .eq('battle_id', battleId)
            .single();

        if (battleError || !battle) {
            return { success: false, points: 0, error: 'Battle not found' };
        }

        const startTime = new Date(battle.start_time);
        const currentTime = new Date();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

        // Calculate points based on problem difficulty and time
        const points = calculatePoints(problemIndex, elapsedSeconds);

        // Create submission record (auto-accepted for now)
        const { error: submissionError } = await supabase
            .from('clan_battle_submissions')
            .insert({
                battle_id: battleId,
                user_id: user.id,
                problem_index: problemIndex,
                code: code,
                language: language,
                verdict: 'accepted'
            });

        if (submissionError) {
            console.error('Error creating submission:', submissionError);
            return { success: false, points: 0, error: submissionError };
        }

        // Update participant: increment problems_solved and add points
        const { error: updateError } = await supabase
            .from('clan_battle_participants')
            .update({
                problems_solved: 1,
                total_time: points
            })
            .eq('battle_id', battleId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error updating participant:', updateError);
            return { success: false, points: 0, error: updateError };
        }

        return { success: true, points: points, error: null };
    } catch (error) {
        console.error('Error in submitSolution:', error);
        return { success: false, points: 0, error };
    }
}

/**
 * Calculate points based on problem difficulty and elapsed time
 * Top problems are easier, bottom problems are harder
 * Points decrease over time (5 minutes = 300 seconds)
 * @param {number} problemIndex - Problem index (0-4)
 * @param {number} elapsedSeconds - Time elapsed since battle start
 * @returns {number} Points awarded
 */
function calculatePoints(problemIndex, elapsedSeconds) {
    // Base points by problem index (0=easiest at top, 4=hardest at bottom)
    const basePoints = {
        0: 50,   // Easy
        1: 75,   // Easy-Medium
        2: 100,  // Medium
        3: 125,  // Medium-Hard
        4: 150   // Hard
    };

    const base = basePoints[problemIndex] || 100;

    // Time factor: points decrease linearly over 5 minutes (300 seconds)
    // At 0s: 100% points, at 300s: 50% points
    const maxTime = 300; // 5 minutes
    const minMultiplier = 0.5; // Minimum 50% of base points
    const timeMultiplier = Math.max(minMultiplier, 1 - (elapsedSeconds / maxTime) * (1 - minMultiplier));

    const finalPoints = Math.round(base * timeMultiplier);
    
    console.log(`Problem ${problemIndex}: Base=${base}, Elapsed=${elapsedSeconds}s, Multiplier=${timeMultiplier.toFixed(2)}, Final=${finalPoints}`);
    
    return finalPoints;
}

/**
 * Complete the battle and determine winner
 * @param {string} battleId - Battle ID
 * @returns {Promise<{success: boolean, winnerId: string|null, error: any}>}
 */
export async function completeBattle(battleId) {
    try {
        // Get all participants grouped by clan
        const { data: participants, error: participantsError } = await supabase
            .from('clan_battle_participants')
            .select('clan_id, problems_solved, total_time')
            .eq('battle_id', battleId);

        if (participantsError || !participants) {
            return { success: false, winnerId: null, error: participantsError };
        }

        // Calculate clan scores
        const clanScores = {};
        participants.forEach(p => {
            if (!clanScores[p.clan_id]) {
                clanScores[p.clan_id] = {
                    problemsSolved: 0,
                    totalPoints: 0
                };
            }
            clanScores[p.clan_id].problemsSolved += p.problems_solved;
            clanScores[p.clan_id].totalPoints += p.total_time; // total_time stores points
        });

        // Determine winner
        let winnerId = null;
        const clans = Object.keys(clanScores);
        
        if (clans.length === 2) {
            const [clan1, clan2] = clans;
            const score1 = clanScores[clan1];
            const score2 = clanScores[clan2];

            // Winner by problems solved first, then by points
            if (score1.problemsSolved > score2.problemsSolved) {
                winnerId = clan1;
            } else if (score2.problemsSolved > score1.problemsSolved) {
                winnerId = clan2;
            } else {
                // Equal problems solved, compare points
                if (score1.totalPoints > score2.totalPoints) {
                    winnerId = clan1;
                } else if (score2.totalPoints > score1.totalPoints) {
                    winnerId = clan2;
                }
                // If still equal, it's a draw (winnerId stays null)
            }
        }

        // Update battle status and winner
        const { error: updateError } = await supabase
            .from('clan_battles')
            .update({
                status: 'completed',
                winner_clan_id: winnerId,
                end_time: new Date().toISOString()
            })
            .eq('battle_id', battleId);

        if (updateError) {
            console.error('Error updating battle:', updateError);
            return { success: false, winnerId: null, error: updateError };
        }

        // Update winner clan's war_won count
        if (winnerId) {
            const { error: clanUpdateError } = await supabase.rpc('increment_clan_wins', {
                p_clan_id: winnerId
            });

            // If RPC doesn't exist, do it manually
            if (clanUpdateError) {
                console.warn('RPC not found, updating manually');
                const { data: clan } = await supabase
                    .from('clans')
                    .select('war_won')
                    .eq('clan_id', winnerId)
                    .single();

                if (clan) {
                    await supabase
                        .from('clans')
                        .update({ war_won: (clan.war_won || 0) + 1 })
                        .eq('clan_id', winnerId);
                }
            }
        }

        return { success: true, winnerId, error: null };
    } catch (error) {
        console.error('Error in completeBattle:', error);
        return { success: false, winnerId: null, error };
    }
}

