import { useState, useCallback, useEffect } from 'react';
import { 
  fetchPlayerData, 
  updatePlayerCalculations 
} from '../utils/dataProcessing.js';
import { 
  getAvailablePlayers as getFilteredPlayers
} from '../utils/draftLogic.js';
import { getStrategicRecommendations as getStratRecs } from '../draftStrategy.js';

/**
 * Custom hook for managing player data and analytics
 * @returns {Object} Player data state and operations
 */
export const usePlayerData = () => {
  const [loading, setLoading] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [replacementLevels, setReplacementLevels] = useState({});
  const [playerTiers, setPlayerTiers] = useState([]);
  const [strategicData, setStrategicData] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Initialize player data from API
   */
  const initializePlayerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPlayerData();
      
      setAvailablePlayers(data.players);
      setReplacementLevels(data.replacementLevels);
      setPlayerTiers(data.playerTiers);
      
    } catch (err) {
      console.error('Error initializing player data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update calculations when players are drafted
   * @param {Array} draftedPlayers - List of drafted player names
   */
  const updateCalculations = useCallback((draftedPlayers) => {
    if (availablePlayers.length === 0) return;
    
    const calculations = updatePlayerCalculations(availablePlayers, draftedPlayers);
    setReplacementLevels(calculations.replacementLevels);
    setPlayerTiers(calculations.playerTiers);
  }, [availablePlayers]);

  /**
   * Get strategic recommendations for current pick
   * @param {Object} currentTeam - Current team object
   * @param {number} currentPick - Current pick number
   * @param {boolean} isSimulationMode - Whether in simulation mode
   * @param {number} userDraftPosition - User's draft position
   * @param {Array} teams - Teams array
   * @param {Array} draftedPlayers - List of drafted player names
   * @returns {Array} Strategic recommendations
   */
  const getStrategicRecommendations = useCallback((
    currentRoster, 
    currentRound, 
    draftPosition, 
    availablePlayersList, 
    levels, 
    totalTeams = 10,
    fixtures = null
  ) => {
    try {
      return getStratRecs(
        currentRoster,
        currentRound,
        draftPosition,
        availablePlayersList,
        levels,
        totalTeams,
        fixtures
      );
    } catch (error) {
      console.error('Error getting strategic recommendations:', error);
      return { recommendations: [], insights: [], rosterAnalysis: null };
    }
  }, []);

  /**
   * Get available players with filtering and validation
   * @param {Array} draftedPlayers - List of drafted player names
   * @param {Object} currentTeam - Current team object
   * @param {string} selectedPosition - Selected position filter
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered available players
   */
  const getAvailablePlayers = useCallback((
    draftedPlayers = [],
    currentTeam = null,
    selectedPosition = 'ALL',
    searchTerm = ''
  ) => {
    return getFilteredPlayers(
      availablePlayers,
      draftedPlayers,
      currentTeam,
      selectedPosition,
      searchTerm,
      replacementLevels
    );
  }, [availablePlayers, replacementLevels]);

  /**
   * Find player by name
   * @param {string} playerName - Player name to find
   * @returns {Object|undefined} Player object
   */
  const findPlayerByName = useCallback((playerName) => {
    if (!Array.isArray(availablePlayers) || !playerName) return undefined;
    return availablePlayers.find(player => player && player.name === playerName);
  }, [availablePlayers]);

  /**
   * Get player statistics summary
   * @returns {Object} Player statistics
   */
  const getPlayerStats = useCallback(() => {
    if (!Array.isArray(availablePlayers) || availablePlayers.length === 0) {
      return {
        totalPlayers: 0,
        byPosition: { F: 0, M: 0, D: 0, G: 0 },
        averagePoints: 0,
        topPlayer: null
      };
    }

    const byPosition = availablePlayers.reduce((acc, player) => {
      if (player && player.position) {
        acc[player.position] = (acc[player.position] || 0) + 1;
      }
      return acc;
    }, { F: 0, M: 0, D: 0, G: 0 });

    const totalPoints = availablePlayers.reduce((sum, p) => sum + (p?.historicalPoints || 0), 0);
    const averagePoints = totalPoints / availablePlayers.length;
    const topPlayer = availablePlayers.reduce((top, player) => 
      (player?.historicalPoints || 0) > (top?.historicalPoints || 0) ? player : top, null
    );

    return {
      totalPlayers: availablePlayers.length,
      byPosition,
      averagePoints: Math.round(averagePoints * 10) / 10,
      topPlayer
    };
  }, [availablePlayers]);

  /**
   * Get player tier information
   * @param {string} playerName - Player name
   * @returns {Object} Tier information
   */
  const getPlayerTier = useCallback((playerName) => {
    if (!playerTiers || typeof playerTiers !== 'object' || !playerName) return null;
    
    // playerTiers is an object with position keys containing arrays of players
    for (const [_position, players] of Object.entries(playerTiers)) {
      if (Array.isArray(players)) {
        const foundPlayer = players.find(p => p && p.name === playerName);
        if (foundPlayer && foundPlayer.tier) {
          // Convert tier name to tier number
          const tierMap = { 'ELITE': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
          const tierNumber = tierMap[foundPlayer.tier] || 4;
          
          // Count total players in this tier across all positions
          const playersInSameTier = Object.values(playerTiers)
            .flat()
            .filter(p => p && p.tier === foundPlayer.tier).length;
          
          // Count total tiers (unique tier values)
          const allTiers = Object.values(playerTiers)
            .flat()
            .map(p => p && p.tier)
            .filter((tier, index, arr) => tier && arr.indexOf(tier) === index);
          
          return {
            tier: tierNumber,
            tierSize: playersInSameTier,
            totalTiers: allTiers.length
          };
        }
      }
    }
    return null;
  }, [playerTiers]);

  /**
   * Reset player data (useful for testing)
   */
  const resetPlayerData = useCallback(() => {
    setAvailablePlayers([]);
    setReplacementLevels({});
    setPlayerTiers([]);
    setStrategicData(null);
    setError(null);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initializePlayerData();
  }, [initializePlayerData]);

  return {
    // State
    loading,
    availablePlayers,
    replacementLevels,
    playerTiers,
    strategicData,
    error,
    
    // Setters (for direct updates when needed)
    setLoading,
    setAvailablePlayers,
    setReplacementLevels,
    setPlayerTiers,
    setStrategicData,
    
    // Operations
    initializePlayerData,
    updateCalculations,
    getStrategicRecommendations,
    getAvailablePlayers,
    findPlayerByName,
    getPlayerStats,
    getPlayerTier,
    resetPlayerData
  };
}; 