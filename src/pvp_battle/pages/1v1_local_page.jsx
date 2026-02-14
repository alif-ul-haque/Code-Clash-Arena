import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/1v1_local_page.css';
import logo from '../../assets/icons/cca.png';
import trophyIcon from '../../assets/icons/trophy.png';
import { supabase } from '../../supabaseclient';

// Problem selection function for REAL MODE (same logic as global battle)
const selectProblemForLocalBattle = async (cfHandle1, cfHandle2, avgRating) => {
    try {
        console.log(`🎯 UNIVERSAL SELECTION: Picking ONE problem for avg rating ${avgRating}`);
        
        // Calculate difficulty range based on average rating
        const targetRating = Math.max(800, Math.min(2400, avgRating));
        const minRating = targetRating - 200;
        const maxRating = targetRating + 200;
        console.log(`📊 Difficulty range: ${minRating} - ${maxRating}`);
        
        // Fetch problems from Codeforces
        const response = await fetch('https://codeforces.com/api/problemset.problems');
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error('Failed to fetch problems from Codeforces');
        }
        
        // Filter problems by rating range and type
        const validProblems = data.result.problems.filter(
            p => p.rating >= minRating && 
                 p.rating <= maxRating && 
                 p.contestId && 
                 p.index &&
                 p.type === 'PROGRAMMING'
        );
        
        if (validProblems.length === 0) {
            throw new Error('No problems found in rating range');
        }
        
        console.log(`📝 Found ${validProblems.length} problems in range ${minRating}-${maxRating}`);
        
        // Fetch submissions for BOTH players
        const [player1Submissions, player2Submissions] = await Promise.all([
            fetch(`https://codeforces.com/api/user.status?handle=${cfHandle1}&from=1&count=10000`)
                .then(r => r.json())
                .catch(() => ({ status: 'FAILED', result: [] })),
            fetch(`https://codeforces.com/api/user.status?handle=${cfHandle2}&from=1&count=10000`)
                .then(r => r.json())
                .catch(() => ({ status: 'FAILED', result: [] }))
        ]);
        
        // Get solved problem IDs for both players
        const player1Solved = new Set();
        const player2Solved = new Set();
        
        if (player1Submissions.status === 'OK') {
            player1Submissions.result.forEach(sub => {
                if (sub.verdict === 'OK') {
                    player1Solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                }
            });
        }
        
        if (player2Submissions.status === 'OK') {
            player2Submissions.result.forEach(sub => {
                if (sub.verdict === 'OK') {
                    player2Solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                }
            });
        }
        
        console.log(`✓ ${cfHandle1} solved: ${player1Solved.size}, ${cfHandle2} solved: ${player2Solved.size}`);
        
        // Filter problems that NEITHER player has solved
        const unsolvedProblems = validProblems.filter(p => {
            const problemId = `${p.contestId}-${p.index}`;
            return !player1Solved.has(problemId) && !player2Solved.has(problemId);
        });
        
        let selectedProblem;
        
        if (unsolvedProblems.length === 0) {
            console.log('⚠️ No unsolved problems found, picking from all valid problems');
            selectedProblem = validProblems[Math.floor(Math.random() * validProblems.length)];
        } else {
            console.log(`✓ Found ${unsolvedProblems.length} unsolved problems`);
            selectedProblem = unsolvedProblems[Math.floor(Math.random() * unsolvedProblems.length)];
        }
        
        console.log(`🎲 SELECTED: ${selectedProblem.name} (${selectedProblem.contestId}${selectedProblem.index}, rating: ${selectedProblem.rating})`);
        console.log(`✅ This SAME problem will be given to BOTH players`);
        
        return selectedProblem;
    } catch (error) {
        console.error('Error selecting problem:', error);
        throw error;
    }
};

// Multi-problem selection for TIME RUSH MODE
const selectMultipleProblems = async (cfHandle1, cfHandle2, avgRating, count) => {
    try {
        console.log(`🎯 TIME RUSH: Selecting ${count} problems for avg rating ${avgRating}`);
        
        const targetRating = Math.max(800, Math.min(2400, avgRating));
        const minRating = targetRating - 200;
        const maxRating = targetRating + 200;
        console.log(`📊 Difficulty range: ${minRating} - ${maxRating}`);
        
        // Fetch problems from Codeforces
        const response = await fetch('https://codeforces.com/api/problemset.problems');
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error('Failed to fetch problems from Codeforces');
        }
        
        // Filter valid problems
        const validProblems = data.result.problems.filter(
            p => p.rating >= minRating && 
                 p.rating <= maxRating && 
                 p.contestId && 
                 p.index &&
                 p.type === 'PROGRAMMING'
        );
        
        if (validProblems.length === 0) {
            throw new Error('No problems found in rating range');
        }
        
        console.log(`📝 Found ${validProblems.length} problems in range`);
        
        // Fetch submissions for BOTH players
        const [player1Submissions, player2Submissions] = await Promise.all([
            fetch(`https://codeforces.com/api/user.status?handle=${cfHandle1}&from=1&count=10000`)
                .then(r => r.json())
                .catch(() => ({ status: 'FAILED', result: [] })),
            fetch(`https://codeforces.com/api/user.status?handle=${cfHandle2}&from=1&count=10000`)
                .then(r => r.json())
                .catch(() => ({ status: 'FAILED', result: [] }))
        ]);
        
        // Get solved problem IDs
        const player1Solved = new Set();
        const player2Solved = new Set();
        
        if (player1Submissions.status === 'OK') {
            player1Submissions.result.forEach(sub => {
                if (sub.verdict === 'OK') {
                    player1Solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                }
            });
        }
        
        if (player2Submissions.status === 'OK') {
            player2Submissions.result.forEach(sub => {
                if (sub.verdict === 'OK') {
                    player2Solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                }
            });
        }
        
        // Filter unsolved problems
        let availableProblems = validProblems.filter(p => {
            const problemId = `${p.contestId}-${p.index}`;
            return !player1Solved.has(problemId) && !player2Solved.has(problemId);
        });
        
        if (availableProblems.length === 0) {
            console.log('⚠️ No unsolved problems, using all valid problems');
            availableProblems = validProblems;
        }
        
        // Select N unique random problems
        const selectedProblems = [];
        const usedIndices = new Set();
        
        for (let i = 0; i < count; i++) {
            if (availableProblems.length === 0) break;
            
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * availableProblems.length);
            } while (usedIndices.has(randomIndex) && usedIndices.size < availableProblems.length);
            
            usedIndices.add(randomIndex);
            const problem = availableProblems[randomIndex];
            selectedProblems.push({
                name: problem.name,
                contestId: problem.contestId,
                index: problem.index,
                rating: problem.rating,
                tags: problem.tags || []
            });
            
            console.log(`✓ Problem ${i + 1}: ${problem.name} (${problem.contestId}${problem.index})`);
        }
        
        console.log(`✅ Selected ${selectedProblems.length} problems for TIME RUSH MODE`);
        return selectedProblems;
        
    } catch (error) {
        console.error('Error selecting multiple problems:', error);
        throw error;
    }
};

const OneVOneLocalPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('friends');

    // State to store user data fetched from database
    const [userData, setUserData] = useState({
        username: "Loading...",
        rating: 0
    });

    // State to store friends list fetched from database
    const [friendsList, setFriendsList] = useState([]);

    // State to track if data is still loading
    const [isLoading, setIsLoading] = useState(true);

    // State to store any errors that occur
    const [error, setError] = useState(null);

    // State for incoming battle requests
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    // State for battle history fetched from database
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Function to create a new battle when challenging a friend
    const handleChallenge = async (friend) => {
        try {
            // Get current user's ID
            const loggedInUser = localStorage.getItem('loggedInUser');
            const { data: currentUser } = await supabase
                .from('users')
                .select('id')
                .eq('cf_handle', loggedInUser)
                .single();

            const { data: opponentUser } = await supabase
                .from('users')
                .select('id')
                .eq('cf_handle', friend.cf_handle)
                .single();

            // Create a new battle entry
            const { data: newBattle, error: battleError } = await supabase
                .from('onevonebattles')
                .insert({
                    battlefield: 'local',
                    battle_mode: null, // Will be set when mode is selected
                    problem_count: 1,
                    status: 'waiting',
                    trophy_reward: 115,
                    // start_time will be set when battle is ACCEPTED, not when created
                    invited_player_id: opponentUser.id // Track who is being invited
                })
                .select()
                .single();

            if (battleError) throw battleError;

            // Add both participants to the battle
            const { error: participantsError } = await supabase
                .from('onevone_participants')
                .insert([
                    {
                        onevone_battle_id: newBattle.onevone_battle_id,
                        player_id: currentUser.id,
                        problem_solved: 0,
                        time_taken: 0
                    },
                    {
                        onevone_battle_id: newBattle.onevone_battle_id,
                        player_id: opponentUser.id,
                        problem_solved: 0,
                        time_taken: 0
                    }
                ]);

            if (participantsError) throw participantsError;

            // Navigate to battle mode selection with battle data
            navigate('/battle-mode', {
                state: {
                    battleId: newBattle.onevone_battle_id,
                    opponent: friend,
                    currentUser: loggedInUser
                }
            });

        } catch (err) {
            console.error('Error creating battle:', err);
            alert('Failed to create battle. Please try again.');
        }
    };

    // useEffect: Runs once when component loads to fetch data from database
    useEffect(() => {
        // Async function to fetch user data and friends from Supabase
        const fetchData = async () => {
            try {
                setIsLoading(true); // Set loading to true while fetching

                // Get logged-in user's cf_handle from localStorage
                const loggedInUser = localStorage.getItem('loggedInUser');
                
                if (!loggedInUser) {
                    setError('No user logged in');
                    setIsLoading(false);
                    return;
                }

                // FETCH USER DATA
                // Query the 'users' table in Supabase database
                const { data: user, error: userError } = await supabase
                    .from('users') // Access the 'users' table
                    .select('cf_handle, rating') // Get only username and rating columns
                    .eq('cf_handle', loggedInUser) // Filter: WHERE username = logged-in user
                    .single(); // Return single object (not array)

                // If there was an error fetching user, throw it
                if (userError) throw userError;

                // If user data was found, update the state
                if (user) {
                    setUserData({
                        cf_handle: user.cf_handle,
                        rating: user.rating || 0 // Use 0 if rating is null
                    });
                }

                // FETCH FRIENDS LIST
                // Step 1: Get logged-in user's id from users table
                const { data: currentUserData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('cf_handle', loggedInUser)
                    .single();

                const userId = currentUserData.id;
                setCurrentUserId(userId);

                // Step 2: Get friend IDs from friends table
                const { data: friendData } = await supabase
                    .from('friends')
                    .select('f_id')
                    .eq('u_id', userId);

                // Step 3: Get detailed friend information from users table
                const friendIds = friendData.map(f => f.f_id);

                const { data: friendsInfo } = await supabase
                    .from('users')
                    .select('cf_handle, email, xp, rating, id')
                    .in('id', friendIds);

                // Store friends info in state
                if (friendsInfo) {
                    setFriendsList(friendsInfo);
                }

                // Check for existing incoming battle requests
                await checkIncomingRequests(userId);

            } catch (err) {
                // Handle any errors that occurred
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                // Always set loading to false when done (success or error)
                setIsLoading(false);
            }
        };

        // Call the function to fetch data
        fetchData();
    }, []); // Empty array means run only once when component mounts

    // Fetch battle history from database
    useEffect(() => {
        const fetchBattleHistory = async () => {
            if (!currentUserId) return;
            
            setHistoryLoading(true);
            try {
                console.log('📊 Fetching battle history for user:', currentUserId);

                // Get all battles where current user participated
                const { data: userParticipations, error: participationError } = await supabase
                    .from('onevone_participants')
                    .select(`
                        onevone_battle_id,
                        problem_solved,
                        time_taken,
                        rating_change,
                        onevonebattles (
                            onevone_battle_id,
                            battle_mode,
                            status,
                            trophy_reward,
                            start_time,
                            end_time
                        )
                    `)
                    .eq('player_id', currentUserId)
                    .order('onevonebattles(start_time)', { ascending: false })
                    .limit(20);

                if (participationError) {
                    console.error('Error fetching battle history:', participationError);
                    return;
                }

                console.log('✓ User participations:', userParticipations);

                // For each battle, get opponent information
                const historyPromises = userParticipations.map(async (participation) => {
                    if (!participation.onevonebattles) return null;

                    const battleId = participation.onevone_battle_id;

                    // Get opponent's data (the other participant in the same battle)
                    const { data: allParticipants, error: opponentError } = await supabase
                        .from('onevone_participants')
                        .select(`
                            player_id,
                            problem_solved,
                            time_taken,
                            users (
                                cf_handle
                            )
                        `)
                        .eq('onevone_battle_id', battleId);

                    if (opponentError || !allParticipants) {
                        console.error('Error fetching opponents:', opponentError);
                        return null;
                    }

                    // Find opponent (the participant who is not the current user)
                    const opponent = allParticipants.find(p => p.player_id !== currentUserId);
                    const currentUserData = allParticipants.find(p => p.player_id === currentUserId);

                    if (!opponent || !currentUserData) return null;

                    // Determine win/loss status
                    let status = 'DRAW';
                    let trophyChange = 0;

                    // Check if battle is completed
                    if (participation.onevonebattles.status === 'completed') {
                        // Compare problem_solved, then time_taken
                        if (currentUserData.problem_solved > opponent.problem_solved) {
                            status = 'WON';
                            trophyChange = participation.onevonebattles.trophy_reward || 150;
                        } else if (currentUserData.problem_solved < opponent.problem_solved) {
                            status = 'LOST';
                            trophyChange = -(participation.onevonebattles.trophy_reward || 50);
                        } else {
                            // Same problems solved, check time
                            if (currentUserData.time_taken < opponent.time_taken) {
                                status = 'WON';
                                trophyChange = participation.onevonebattles.trophy_reward || 150;
                            } else if (currentUserData.time_taken > opponent.time_taken) {
                                status = 'LOST';
                                trophyChange = -(participation.onevonebattles.trophy_reward || 50);
                            } else {
                                status = 'DRAW';
                                trophyChange = 0;
                            }
                        }
                    } else if (participation.onevonebattles.status === 'abandoned') {
                        status = 'ABANDONED';
                        trophyChange = 0;
                    }

                    // Use rating_change if available
                    if (participation.rating_change) {
                        trophyChange = participation.rating_change;
                        status = trophyChange > 0 ? 'WON' : trophyChange < 0 ? 'LOST' : 'DRAW';
                    }

                    return {
                        id: battleId,
                        username: opponent.users?.cf_handle || 'Unknown',
                        mode: participation.onevonebattles.battle_mode || 'REAL MODE',
                        status: status,
                        trophy: trophyChange >= 0 ? `+${trophyChange}` : `${trophyChange}`
                    };
                });

                const resolvedHistory = await Promise.all(historyPromises);
                const filteredHistory = resolvedHistory.filter(h => h !== null);

                console.log('✅ Battle history fetched:', filteredHistory);
                setHistoryData(filteredHistory);

            } catch (err) {
                console.error('Error fetching battle history:', err);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchBattleHistory();
    }, [currentUserId]); // Re-fetch when currentUserId changes

    // Subscribe to incoming battle requests in real-time
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel('incoming-battle-requests')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'onevone_participants',
                    filter: `player_id=eq.${currentUserId}`
                },
                async (payload) => {
                    // New battle participant entry - check if it's a request
                    await checkIncomingRequests(currentUserId);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'onevonebattles'
                },
                async (payload) => {
                    // Battle status changed - refresh requests
                    await checkIncomingRequests(currentUserId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    // Function to check for incoming battle requests
    const checkIncomingRequests = async (userId) => {
        try {
            // Get battles where current user is the INVITED player (not the sender)
            const { data: pendingBattles } = await supabase
                .from('onevonebattles')
                .select('*')
                .eq('invited_player_id', userId)
                .eq('status', 'request_sent');

            if (!pendingBattles || pendingBattles.length === 0) {
                setIncomingRequests([]);
                return;
            }

            // For each pending battle, get the challenger's info
            const requestsWithDetails = await Promise.all(
                pendingBattles.map(async (battle) => {
                    // Get both participants
                    const { data: participants } = await supabase
                        .from('onevone_participants')
                        .select('player_id')
                        .eq('onevone_battle_id', battle.onevone_battle_id);

                    // Find the sender (the one who is NOT current user)
                    const senderId = participants.find(p => p.player_id !== userId)?.player_id;

                    if (!senderId) return null;

                    // Get sender's details
                    const { data: senderInfo } = await supabase
                        .from('users')
                        .select('cf_handle, rating')
                        .eq('id', senderId)
                        .single();

                    return {
                        battleId: battle.onevone_battle_id,
                        mode: battle.battle_mode,
                        opponent: senderInfo,
                        timestamp: battle.start_time
                    };
                })
            );

            setIncomingRequests(requestsWithDetails.filter(r => r !== null));

        } catch (err) {
            console.error('Error checking incoming requests:', err);
        }
    };

    // Function to accept battle request
    const handleAcceptRequest = async (battleId, opponent) => {
        try {
            // Navigate to battle page
            const loggedInUser = localStorage.getItem('loggedInUser');
            const { data: battle } = await supabase
                .from('onevonebattles')
                .select('battle_mode, problem_count')
                .eq('onevone_battle_id', battleId)
                .single();

            // For REAL MODE, select and store problem BEFORE activating battle
            if (battle.battle_mode === 'REAL MODE') {
                console.log('🎲 Selecting random problem for REAL MODE...');
                
                // Get both players' data
                const [currentUserData, opponentUserData] = await Promise.all([
                    supabase.from('users').select('rating, cf_handle').eq('cf_handle', loggedInUser).single(),
                    supabase.from('users').select('rating, cf_handle').eq('cf_handle', opponent.cf_handle).single()
                ]);
                
                if (currentUserData.error || opponentUserData.error) {
                    throw new Error('Failed to fetch user data');
                }
                
                const avgRating = Math.round((currentUserData.data.rating + opponentUserData.data.rating) / 2);
                console.log(`📊 Average rating: ${avgRating}`);
                
                // Select problem universally
                const selectedProblem = await selectProblemForLocalBattle(
                    currentUserData.data.cf_handle,
                    opponentUserData.data.cf_handle,
                    avgRating
                );
                
                // Update battle with selected problem AND set to active
                const battleStartTime = new Date();
                console.log('🕐 Setting battle start time:', battleStartTime.toISOString());
                
                const { error: updateError } = await supabase
                    .from('onevonebattles')
                    .update({
                        status: 'active',
                        start_time: battleStartTime.toISOString(), // Store as ISO string
                        problem_name: selectedProblem.name,
                        problem_contest_id: selectedProblem.contestId,
                        problem_index: selectedProblem.index,
                        problem_rating: selectedProblem.rating,
                        problem_tags: JSON.stringify(selectedProblem.tags || [])
                    })
                    .eq('onevone_battle_id', battleId);
                
                if (updateError) throw updateError;
                
                console.log('✅ Problem stored in database, battle activated');
                console.log('🕐 Start time set to:', battleStartTime.toISOString());
            } else if (battle.battle_mode === 'TIME RUSH MODE') {
                // For TIME RUSH MODE, select MULTIPLE problems
                console.log(`🎲 Selecting ${battle.problem_count} random problems for TIME RUSH MODE...`);
                
                // Get both players' data
                const [currentUserData, opponentUserData] = await Promise.all([
                    supabase.from('users').select('rating, cf_handle').eq('cf_handle', loggedInUser).single(),
                    supabase.from('users').select('rating, cf_handle').eq('cf_handle', opponent.cf_handle).single()
                ]);
                
                if (currentUserData.error || opponentUserData.error) {
                    throw new Error('Failed to fetch user data');
                }
                
                const avgRating = Math.round((currentUserData.data.rating + opponentUserData.data.rating) / 2);
                console.log(`📊 Average rating: ${avgRating}`);
                
                // Select multiple problems
                const selectedProblems = await selectMultipleProblems(
                    currentUserData.data.cf_handle,
                    opponentUserData.data.cf_handle,
                    avgRating,
                    battle.problem_count
                );
                
                // Store problems as JSON array in problem_tags column (reusing existing column)
                const battleStartTime = new Date();
                console.log('🕐 Setting battle start time:', battleStartTime.toISOString());
                
                const { error: updateError } = await supabase
                    .from('onevonebattles')
                    .update({
                        status: 'active',
                        start_time: battleStartTime.toISOString(), // Store as ISO string
                        problem_tags: JSON.stringify(selectedProblems)
                    })
                    .eq('onevone_battle_id', battleId);
                
                if (updateError) throw updateError;
                
                console.log('✅ Problems stored in database, battle activated');
                console.log('🕐 Start time set to:', battleStartTime.toISOString());
            } else {
                // For other modes, just update status to active
                const { error } = await supabase
                    .from('onevonebattles')
                    .update({ status: 'active' })
                    .eq('onevone_battle_id', battleId);
                
                if (error) throw error;
            }

            // Navigate to appropriate page based on battle mode
            if (battle.battle_mode === 'TIME RUSH MODE') {
                navigate('/1v1-coding-timeRush-mode', {
                    state: {
                        battleId,
                        opponent,
                        currentUser: loggedInUser,
                        mode: battle.battle_mode,
                        problemCount: battle.problem_count
                    }
                });
            } else {
                // Real Mode
                navigate('/1v1-coding-battle', {
                    state: {
                        battleId,
                        opponent,
                        currentUser: loggedInUser,
                        mode: battle.battle_mode
                    }
                });
            }

        } catch (err) {
            console.error('Error accepting request:', err);
            alert('Failed to accept battle request: ' + err.message);
        }
    };

    // Function to decline battle request
    const handleDeclineRequest = async (battleId) => {
        try {
            // Update battle status to 'declined'
            const { error } = await supabase
                .from('onevonebattles')
                .update({ status: 'declined' })
                .eq('onevone_battle_id', battleId);

            if (error) throw error;

            // Remove from incoming requests
            setIncomingRequests(prev => prev.filter(r => r.battleId !== battleId));

        } catch (err) {
            console.error('Error declining request:', err);
            alert('Failed to decline battle request.');
        }
    };

    // History data is now fetched from database via useEffect

    return (
        <div className="local-battle-container">
            <img src={logo} alt="Code Clash Arena Logo" className="local-logo" />

            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => navigate('/playmode1v1')}>Exit</button>
            </div>

            {/* Incoming Battle Requests Notification */}
            {incomingRequests.length > 0 && (
                <div className="battle-request-overlay">
                    <div className="battle-request-modal">
                        <h2 className="request-title">INCOMING BATTLE REQUEST!</h2>
                        {incomingRequests.map((request, index) => (
                            <div key={index} className="request-card">
                                <p className="request-from">
                                    <strong>{request.opponent.cf_handle}</strong> challenges you!
                                </p>
                                <p className="request-mode">Mode: {request.mode}</p>
                                <p className="request-rating">Rating: {request.opponent.rating}</p>
                                <div className="request-actions">
                                    <button 
                                        className="accept-btn"
                                        onClick={() => handleAcceptRequest(request.battleId, request.opponent)}
                                    >
                                        ACCEPT
                                    </button>
                                    <button 
                                        className="decline-btn"
                                        onClick={() => handleDeclineRequest(request.battleId)}
                                    >
                                        DECLINE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="user-info-banner">
                <div className="user-info-left">
                    <h2 className="username">{isLoading ? "Loading..." : userData.cf_handle}</h2>
                    <p className="tagline">Ready to Clash?</p>
                </div>

                <div className="user-info-right">
                    <h2 className="rating-number">{isLoading ? "..." : userData.rating}</h2>
                    <p className="rating-label">rating</p>
                </div>
            </div>

            {/* Show error message if something went wrong */}
            {error && (
                <div style={{
                    color: 'red',
                    background: 'rgba(255, 0, 0, 0.1)',
                    padding: '10px',
                    borderRadius: '5px',
                    margin: '10px 0',
                    textAlign: 'center'
                }}>
                    Error loading data: {error}
                </div>
            )}

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            {activeTab === 'friends' && (
                <div className="friends-list">
                    {/* Show loading message while fetching friends */}
                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                            Loading friends...
                        </div>
                    )}

                    {/* Show message if no friends found */}
                    {!isLoading && friendsList.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                            No friends found. Add some friends to start battling!
                        </div>
                    )}

                    {/* Display each friend from database */}
                    {!isLoading && friendsList.map((friend, index) => (
                        <div key={index} className="friend-card">
                            <span className="friend-bullet">•</span>
                            <span className="friend-name">{friend.cf_handle}</span>
                            <button className="view-details-btn">VIEW DETAILS</button>

                            <div className="details-overlay"></div>

                            <div className="details-popup">
                                <p className="popup-text">XP Earned:</p>
                                <p className="popup-value">{friend.xp || 0}</p>
                                <p className="popup-text">Trophy: {friend.trophy || 0}</p>
                            </div>
                            <div className="status-container">
                                <div className="status-indicator"></div>
                                <span className="status-text">active</span>
                            </div>
                            <button className="challenge-btn" onClick={() => handleChallenge(friend)}>challenge!</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="history-list">
                    {/* Show loading message while fetching history */}
                    {historyLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                            Loading battle history...
                        </div>
                    )}

                    {/* Show message if no history found */}
                    {!historyLoading && historyData.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                            No battle history yet. Start challenging friends!
                        </div>
                    )}

                    {/* Display battle history from database */}
                    {!historyLoading && historyData.map((match) => (
                        <div key={match.id} className={`history-card ${match.status.toLowerCase()}`}>
                            <span className="history-username">{match.username}</span>
                            <span className="history-mode">{match.mode}</span>
                            <span className="history-status">{match.status}</span>
                            <span className="history-trophy">
                                {match.trophy} <img src={trophyIcon} alt="trophy" className="trophy-icon" />
                            </span>
                        </div>
                    ))}
                </div>
            )}



        </div>
    );
};

export default OneVOneLocalPage;
