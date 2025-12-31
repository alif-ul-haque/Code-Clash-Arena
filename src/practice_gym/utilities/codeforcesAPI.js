const BASE_URL = 'https://codeforces.com/api';

export const codeforcesAPI = {
  // Get user information
  async getUserInfo(handle) {
    try {
      const response = await fetch(`${BASE_URL}/user.info?handles=${handle}`);
      const data = await response.json();
      if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch user info');
      return data.result[0];
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  },

  // Get user submissions
  async getUserStatus(handle) {
    try {
      const response = await fetch(`${BASE_URL}/user.status?handle=${handle}&from=1&count=10000`);
      const data = await response.json();
      if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch user submissions');
      return data.result;
    } catch (error) {
      console.error('Error fetching user status:', error);
      throw error;
    }
  },

  // Get all problems
  async getProblems() {
    try {
      const response = await fetch(`${BASE_URL}/problemset.problems`);
      const data = await response.json();
      if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch problems');
      return data.result;
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
  },

  // Get user rating history
  async getUserRating(handle) {
    try {
      const response = await fetch(`${BASE_URL}/user.rating?handle=${handle}`);
      const data = await response.json();
      if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch user rating');
      return data.result;
    } catch (error) {
      console.error('Error fetching user rating:', error);
      throw error;
    }
  }
};

// Calculate user statistics
export const calculateUserStats = (submissions) => {
  const solvedProblems = new Set();
  let totalAttempts = 0;
  let successfulAttempts = 0;

  submissions.forEach(submission => {
    if (submission.verdict === 'OK') {
      solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
      successfulAttempts++;
    }
    totalAttempts++;
  });

  const accuracy = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;

  return {
    problemsSolved: solvedProblems.size,
    accuracy: accuracy,
    solvedSet: solvedProblems
  };
};

// Calculate day streak
export const calculateDayStreak = (submissions) => {
  if (!submissions.length) return 0;

  const solvedDates = [...new Set(
    submissions
      .filter(s => s.verdict === 'OK')
      .map(s => new Date(s.creationTimeSeconds * 1000).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));

  if (!solvedDates.length) return 0;

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Check if last solved date is today or yesterday
  if (solvedDates[0] !== today && solvedDates[0] !== yesterday) {
    return 0;
  }

  let currentDate = new Date();
  for (let date of solvedDates) {
    if (date === currentDate.toDateString()) {
      streak++;
      currentDate = new Date(currentDate - 86400000);
    } else {
      break;
    }
  }

  return streak;
};

// Get problem statistics from problemStatistics array
const getProblemSolvedCount = (problemStats, contestId, index) => {
  const stat = problemStats.find(
    s => s.contestId === contestId && s.index === index
  );
  if (!stat) return 'N/A';
  
  const count = stat.solvedCount;
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
};

// Get recommended problems based on user rating
export const getRecommendedProblems = (problemsData, userRating, solvedProblems, count = 20) => {
  const targetRating = userRating || 1200;
  const ratingRange = [targetRating - 200, targetRating + 400];

  const { problems, problemStatistics } = problemsData;

  const unsolvedProblems = problems.filter(problem => {
    const problemId = `${problem.contestId}-${problem.index}`;
    return (
      problem.rating &&
      problem.rating >= ratingRange[0] &&
      problem.rating <= ratingRange[1] &&
      !solvedProblems.has(problemId) &&
      problem.type === 'PROGRAMMING'
    );
  });

  // Sort by rating and return random selection
  return unsolvedProblems
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(p => ({
      id: `${p.contestId}-${p.index}`,
      title: p.name,
      tag: p.tags[0] || 'General',
      tags: p.tags,
      rating: p.rating.toString(),
      solved: getProblemSolvedCount(problemStatistics, p.contestId, p.index),
      contestId: p.contestId,
      index: p.index
    }));
};

// Filter problems by various criteria
export const filterProblems = (problemsData, filters, solvedProblems) => {
  const { problems, problemStatistics } = problemsData;
  
  let filteredProblems = problems.filter(problem => {
    const problemId = `${problem.contestId}-${problem.index}`;
    
    // Filter out solved problems if needed
    if (filters.hideSolved && solvedProblems.has(problemId)) {
      return false;
    }
    
    // Filter by rating range
    if (problem.rating) {
      if (filters.minRating && problem.rating < filters.minRating) return false;
      if (filters.maxRating && problem.rating > filters.maxRating) return false;
    } else if (filters.minRating || filters.maxRating) {
      return false; // Exclude problems without rating if rating filter is applied
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => problem.tags.includes(tag));
      if (!hasTag) return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!problem.name.toLowerCase().includes(query)) return false;
    }
    
    // Only programming problems
    if (problem.type !== 'PROGRAMMING') return false;
    
    return true;
  });

  // Sort by rating
  filteredProblems.sort((a, b) => {
    if (!a.rating) return 1;
    if (!b.rating) return -1;
    return a.rating - b.rating;
  });

  return filteredProblems
    .slice(0, filters.limit || 20)
    .map(p => ({
      id: `${p.contestId}-${p.index}`,
      title: p.name,
      tag: p.tags[0] || 'General',
      tags: p.tags,
      rating: p.rating ? p.rating.toString() : 'N/A',
      solved: getProblemSolvedCount(problemStatistics, p.contestId, p.index),
      contestId: p.contestId,
      index: p.index
    }));
};

// Get all unique tags from problems
export const getAllTags = (problemsData) => {
  const { problems } = problemsData;
  const tagsSet = new Set();
  
  problems.forEach(problem => {
    if (problem.tags) {
      problem.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  
  return Array.from(tagsSet).sort();
};

// LocalStorage helpers for tracking solved problems locally
export const getLocalSolvedProblems = () => {
  try {
    const solved = localStorage.getItem('cca_solved_problems');
    return solved ? new Set(JSON.parse(solved)) : new Set();
  } catch (error) {
    console.error('Error reading solved problems from localStorage:', error);
    return new Set();
  }
};

export const addLocalSolvedProblem = (problemId) => {
  try {
    const solved = getLocalSolvedProblems();
    solved.add(problemId);
    localStorage.setItem('cca_solved_problems', JSON.stringify([...solved]));
  } catch (error) {
    console.error('Error saving solved problem to localStorage:', error);
  }
};

export const mergeLocalAndCFSolved = (cfSolvedSet) => {
  const localSolved = getLocalSolvedProblems();
  return new Set([...cfSolvedSet, ...localSolved]);
};
