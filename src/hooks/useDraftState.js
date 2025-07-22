import { useState, useCallback } from 'react';
import { getCurrentTeam } from '../utils/draftLogic.js';
import { determineRosterCategory, validateDraftMove } from '../utils/rosterValidation.js';
import { LEAGUE_CONFIG } from '../leagueConfig.js';

export const useDraftState = () => {
  const [teams, setTeams] = useState([]);
  const [currentPick, setCurrentPick] = useState(1);
  const [draftedPlayers, setDraftedPlayers] = useState([]);
  const [userDraftPosition, setUserDraftPosition] = useState(1);

  /**
   * Initialize teams for the draft
   * @param {Array} teamList - Array of team objects
   */
  const initializeTeamsForDraft = useCallback((teamList) => {
    setTeams(teamList);
    setCurrentPick(1);
    setDraftedPlayers([]);
  }, []);

  /**
   * Get the current team that should be picking
   * @param {boolean} isSimulationMode - Whether in simulation mode
   * @param {number} userDraftPosition - User's draft position
   * @param {Array} simulationTeams - Simulation teams array
   * @returns {Object|null} Current team
   */
  const getCurrentDraftTeam = useCallback((
    isSimulationMode = false, 
    userDraftPos = userDraftPosition, 
    simulationTeams = []
  ) => {
    if (isSimulationMode && simulationTeams.length > 0) {
      // In simulation mode, always return the first team (user's team)
      return simulationTeams[0];
    }
    
    return getCurrentTeam(
      currentPick, 
      teams, 
      isSimulationMode, 
      userDraftPos, 
      simulationTeams
    );
  }, [currentPick, teams, userDraftPosition]);

  /**
   * Draft a player to a team
   * @param {Object} player - Player to draft
   * @param {Object} team - Team drafting the player
   * @param {number} round - Current round
   * @returns {Object} Player with roster category
   */
  const draftPlayerToTeam = useCallback((player, team, round) => {
    // Validate the draft move
    const draftValidation = validateDraftMove(team, player);
    if (!draftValidation.isValid) {
      throw new Error(`Cannot draft player: ${draftValidation.errors.join(', ')}`);
    }

    // Determine roster category
    const rosterCategory = determineRosterCategory(team, player);
    const playerWithCategory = { ...player, round, rosterCategory };

    // Update team picks
    const updatedTeams = teams.map(t => 
      t.id === team.id 
        ? { ...t, picks: [...t.picks, playerWithCategory] }
        : t
    );

    setTeams(updatedTeams);
    setDraftedPlayers(prev => [...prev, player.name]);
    setCurrentPick(prev => prev + 1);

    return playerWithCategory;
  }, [teams]);

  /**
   * Reset draft to initial state
   */
  const resetDraft = useCallback(() => {
    setTeams([]);
    setCurrentPick(1);
    setDraftedPlayers([]);
  }, []);

  /**
   * Get draft progress information
   * @returns {Object} Draft progress data
   */
  const getDraftProgress = useCallback(() => {
    const teamsLength = teams?.length || 0;
    if (teamsLength === 0) {
      return {
        currentPick: 1,
        totalPicks: 0,
        totalPossible: 0,
        currentRound: 1,
        round: 1,
        pickInRound: 1,
        percentage: 0,
        progressPercentage: 0,
        isDraftComplete: false,
        totalRounds: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers
      };
    }
    
    // Calculate total possible picks based on team max players
    const totalPossible = teams.reduce((sum, team) => sum + (team.maxTotalPlayers || LEAGUE_CONFIG.rosterLimits.maxTotalPlayers), 0);
    const totalPicks = teams.reduce((sum, team) => sum + (team.picks?.length || 0), 0);
    const currentRound = Math.floor((currentPick - 1) / teamsLength) + 1;
    const pickInRound = ((currentPick - 1) % teamsLength) + 1;
    const progressPercentage = Math.round((currentPick - 1) / (teamsLength * LEAGUE_CONFIG.rosterLimits.maxTotalPlayers) * 100);
    const percentage = Math.round(totalPicks / totalPossible * 100);

    return {
      currentPick,
      totalPicks,
      totalPossible,
      currentRound,
      round: currentRound,
      pickInRound,
      percentage,
      progressPercentage,
      isDraftComplete: currentPick > totalPossible,
      totalRounds: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers
    };
  }, [currentPick, teams]);

  /**
   * Check if a player is already drafted
   * @param {string} playerName - Player name to check
   * @returns {boolean} Whether player is drafted
   */
  const isPlayerDrafted = useCallback((playerName) => {
    return draftedPlayers.includes(playerName);
  }, [draftedPlayers]);

  /**
   * Get team by ID
   * @param {number} teamId - Team ID to find
   * @returns {Object|null} Team object or null
   */
  const getTeamById = useCallback((teamId) => {
    return teams.find(team => team.id === teamId) || null;
  }, [teams]);

  /**
   * Update picks for a specific team
   * @param {number} teamId - Team ID to update
   * @param {Array|Function} newPicks - New picks array or function that receives current picks
   */
  const updateTeamPicks = useCallback((teamId, newPicks) => {
    setTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { 
            ...team, 
            picks: typeof newPicks === 'function' 
              ? newPicks(team.picks) 
              : newPicks 
          }
        : team
    ));
  }, []);

  return {
    // State
    teams,
    currentPick,
    draftedPlayers,
    userDraftPosition,
    
    // Setters (for direct state updates when needed)
    setTeams,
    setCurrentPick,
    setDraftedPlayers,
    setUserDraftPosition,
    
    // Operations
    initializeTeamsForDraft,
    getCurrentDraftTeam,
    draftPlayerToTeam,
    resetDraft,
    getDraftProgress,
    isPlayerDrafted,
    getTeamById,
    updateTeamPicks
  };
}; 