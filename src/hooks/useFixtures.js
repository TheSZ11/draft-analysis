import { useState, useCallback, useEffect } from 'react';
import { 
  fetchFixtures, 
  getTeamFixtureIndicators, 
  getUpcomingFixturesText, 
  getFixtureDifficultyScore 
} from '../utils/dataProcessing.js';
import fixtureData from '../fixtureData.json';

/**
 * Custom hook for managing fixture data and operations
 * @returns {Object} Fixture state and operations
 */
export const useFixtures = () => {
  const [fixtures, setFixtures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize fixture data
   */
  const initializeFixtures = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      const processedFixtures = fetchFixtures(fixtureData);
      setFixtures(processedFixtures);
      
    } catch (err) {
      console.error('Error initializing fixtures:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get fixtures for a specific team
   * @param {string} teamCode - Team code (e.g., 'LIV', 'MCI')
   * @returns {Array} Array of team fixtures
   */
  const getTeamFixtures = useCallback((teamCode) => {
    return fixtures[teamCode] || [];
  }, [fixtures]);

  /**
   * Get upcoming fixture indicators for a team
   * @param {string} teamCode - Team code
   * @param {number} count - Number of fixtures to return
   * @returns {Array} Array of upcoming fixtures
   */
  const getUpcomingIndicators = useCallback((teamCode, count = 3) => {
    return getTeamFixtureIndicators(teamCode, fixtures, count);
  }, [fixtures]);

  /**
   * Get upcoming fixtures as formatted text
   * @param {string} teamCode - Team code
   * @param {number} count - Number of fixtures to include
   * @returns {string} Formatted fixture text
   */
  const getUpcomingText = useCallback((teamCode, count = 3) => {
    return getUpcomingFixturesText(teamCode, fixtures, count);
  }, [fixtures]);

  /**
   * Get fixture difficulty score for a team
   * @param {string} teamCode - Team code
   * @param {number} gameweeks - Number of gameweeks to analyze
   * @returns {number} Average difficulty score (1-5)
   */
  const getDifficultyScore = useCallback((teamCode, gameweeks = 6) => {
    return getFixtureDifficultyScore(teamCode, fixtures, gameweeks);
  }, [fixtures]);

  /**
   * Get next fixture for a team
   * @param {string} teamCode - Team code
   * @returns {Object|null} Next fixture or null if none available
   */
  const getNextFixture = useCallback((teamCode) => {
    const teamFixtures = getTeamFixtures(teamCode);
    return teamFixtures.length > 0 ? teamFixtures[0] : null;
  }, [getTeamFixtures]);

  /**
   * Get fixtures for a specific gameweek
   * @param {number} gameweek - Gameweek number
   * @returns {Array} Array of fixtures for the gameweek
   */
  const getGameweekFixtures = useCallback((gameweek) => {
    if (!fixtures || typeof fixtures !== 'object' || !gameweek) {
      return [];
    }
    
    const gameweekFixtures = [];
    
    Object.entries(fixtures).forEach(([teamCode, teamFixtures]) => {
      if (!Array.isArray(teamFixtures)) return;
      
      const fixture = teamFixtures.find(f => f && f.matchweek === gameweek);
      if (fixture && fixture.home) { // Only add home fixtures to avoid duplicates
        gameweekFixtures.push({
          matchweek: gameweek,
          homeTeam: teamCode,
          awayTeam: fixture.opponent,
          difficulty: fixture.difficulty,
          ...fixture
        });
      }
    });
    
    return gameweekFixtures;
  }, [fixtures]);

  /**
   * Get teams with easiest fixtures in upcoming gameweeks
   * @param {number} gameweeks - Number of gameweeks to analyze
   * @param {number} limit - Number of teams to return
   * @returns {Array} Array of teams with difficulty scores
   */
  const getEasiestFixtures = useCallback((gameweeks = 6, limit = 5) => {
    const teamDifficulties = Object.keys(fixtures).map(teamCode => ({
      team: teamCode,
      difficulty: getDifficultyScore(teamCode, gameweeks),
      fixtures: getUpcomingIndicators(teamCode, gameweeks)
    }));
    
    return teamDifficulties
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, limit);
  }, [fixtures, getDifficultyScore, getUpcomingIndicators]);

  /**
   * Get teams with hardest fixtures in upcoming gameweeks
   * @param {number} gameweeks - Number of gameweeks to analyze
   * @param {number} limit - Number of teams to return
   * @returns {Array} Array of teams with difficulty scores
   */
  const getHardestFixtures = useCallback((gameweeks = 6, limit = 5) => {
    const teamDifficulties = Object.keys(fixtures).map(teamCode => ({
      team: teamCode,
      difficulty: getDifficultyScore(teamCode, gameweeks),
      fixtures: getUpcomingIndicators(teamCode, gameweeks)
    }));
    
    return teamDifficulties
      .sort((a, b) => b.difficulty - a.difficulty)
      .slice(0, limit);
  }, [fixtures, getDifficultyScore, getUpcomingIndicators]);

  /**
   * Check if fixture data is available for a team
   * @param {string} teamCode - Team code
   * @returns {boolean} Whether fixture data exists
   */
  const hasFixtureData = useCallback((teamCode) => {
    if (!teamCode || !fixtures || typeof fixtures !== 'object') return false;
    const teamFixtures = fixtures[teamCode];
    return Boolean(teamFixtures && Array.isArray(teamFixtures) && teamFixtures.length > 0);
  }, [fixtures]);

  /**
   * Get fixture statistics
   * @returns {Object} Fixture statistics
   */
  const getFixtureStats = useCallback(() => {
    if (!fixtures || typeof fixtures !== 'object') {
      return {
        totalTeams: 0,
        totalFixtures: 0,
        averageFixturesPerTeam: 0,
        averageDifficulty: 0,
        hasData: false
      };
    }
    
    const teams = Object.keys(fixtures);
    const totalFixtures = teams.reduce((sum, team) => {
      const teamFixtures = fixtures[team];
      return sum + (Array.isArray(teamFixtures) ? teamFixtures.length : 0);
    }, 0);
    const averageFixturesPerTeam = teams.length > 0 ? totalFixtures / teams.length : 0;
    
    const allDifficulties = teams.flatMap(team => {
      const teamFixtures = fixtures[team];
      if (!Array.isArray(teamFixtures)) return [];
      return teamFixtures
        .filter(fixture => fixture && typeof fixture.difficulty === 'number')
        .map(fixture => fixture.difficulty);
    });
    
    const averageDifficulty = allDifficulties.length > 0 
      ? allDifficulties.reduce((sum, diff) => sum + diff, 0) / allDifficulties.length 
      : 0;
    
    return {
      totalTeams: teams.length,
      totalFixtures,
      averageFixturesPerTeam: Math.round(averageFixturesPerTeam),
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      hasData: teams.length > 0
    };
  }, [fixtures]);

  /**
   * Reset fixture data
   */
  const resetFixtures = useCallback(() => {
    setFixtures({});
    setError(null);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initializeFixtures();
  }, [initializeFixtures]);

  return {
    // State
    fixtures,
    loading,
    error,
    
    // Setters (for direct updates when needed)
    setFixtures,
    setLoading,
    setError,
    
    // Operations
    initializeFixtures,
    getTeamFixtures,
    getUpcomingIndicators,
    getUpcomingText,
    getDifficultyScore,
    getNextFixture,
    getGameweekFixtures,
    getEasiestFixtures,
    getHardestFixtures,
    hasFixtureData,
    getFixtureStats,
    resetFixtures
  };
}; 