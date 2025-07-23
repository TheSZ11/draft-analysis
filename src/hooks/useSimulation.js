import { useState, useCallback } from 'react';
import { LEAGUE_CONFIG } from '../leagueConfig.js';
import { 
  aiDraftPlayer, 
  calculateDraftPosition 
} from '../utils/draftLogic.js';
import { 
  determineRosterCategory,
  validateDraftMove 
} from '../utils/rosterValidation.js';

/**
 * Custom hook for managing simulation mode state and operations
 * @returns {Object} Simulation state and operations
 */
export const useSimulation = () => {
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationTeams, setSimulationTeams] = useState([]);
  const [userDraftPosition, setUserDraftPosition] = useState(1);
  const [simulationResults, setSimulationResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  /**
   * Start simulation mode
   * @param {number} position - User's draft position (1-10). If not provided, will be randomized.
   * @param {Array} teams - Regular teams to use as template
   */
  const startSimulation = useCallback((position = null, _teams = []) => {
    // Generate random draft position if none provided
    const finalPosition = position ?? Math.floor(Math.random() * 10) + 1;
    
    console.log(`Starting simulation with draft position: ${finalPosition}/10`);
    setUserDraftPosition(finalPosition);
    
    // Create 10 simulation teams
    const simTeams = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: i === 0 ? 'Your Team' : `AI Team ${i}`,
      picks: [],
      ...LEAGUE_CONFIG.rosterLimits,
      positionLimits: { ...LEAGUE_CONFIG.positionLimits }
    }));
    
    setSimulationTeams(simTeams);
    setIsSimulationMode(true);
    setSimulationResults(null);
    setShowResultsModal(false);
  }, []);

  /**
   * Stop simulation mode and return to normal mode
   */
  const stopSimulation = useCallback(() => {
    setIsSimulationMode(false);
    setSimulationTeams([]);
    setSimulationResults(null);
    setShowResultsModal(false);
  }, []);

  /**
   * Reset simulation to start over
   */
  const resetSimulation = useCallback(() => {
    // Fully reset simulation mode to allow starting fresh
    setIsSimulationMode(false);
    setSimulationTeams([]);
    setSimulationResults(null);
    setShowResultsModal(false);
    setUserDraftPosition(1);
  }, []);

  /**
   * Make an AI pick for simulation
   * @param {Object} team - Team making the pick
   * @param {Array} availablePlayers - Available players
   * @param {Object} replacementLevels - Replacement levels
   * @param {number} currentRound - Current round
   * @param {number} draftPosition - Team's draft position
   * @param {Array} draftedPlayers - List of drafted player names
   * @returns {Object|null} Selected player or null
   */
  const makeAIPick = useCallback((
    team, 
    availablePlayers, 
    replacementLevels, 
    currentRound, 
    draftPosition,
    draftedPlayers = []
  ) => {
    return aiDraftPlayer(
      team,
      availablePlayers,
      replacementLevels,
      currentRound,
      draftPosition,
      draftedPlayers,
      true, // isSimulationMode
      10 // totalTeams
    );
  }, []);

  /**
   * Draft a player in simulation mode
   * @param {Object} player - Player to draft
   * @param {number} round - Current round
   * @param {Array} draftedPlayers - Current drafted players list
   * @returns {Object} Updated state information
   */
  const draftPlayerInSimulation = useCallback((player, round, draftedPlayers = []) => {
    if (!Array.isArray(simulationTeams) || simulationTeams.length === 0) {
      throw new Error('User team not found in simulation');
    }
    
    const userTeam = simulationTeams[0]; // User is always team 0
    
    if (!userTeam) {
      throw new Error('User team not found in simulation');
    }

    if (!player || !player.name) {
      throw new Error('Invalid player provided');
    }

    // CRITICAL: Validate the user's draft pick against roster rules
    const draftValidation = validateDraftMove(userTeam, player);
    if (!draftValidation.isValid) {
      throw new Error(`Illegal draft pick: ${draftValidation.errors.join(', ')}`);
    }

    // Determine roster category
    const rosterCategory = determineRosterCategory(userTeam, player);
    const playerWithCategory = { ...player, round, rosterCategory };

    // Update simulation teams
    const updatedTeams = simulationTeams.map(team =>
      team.id === 1 // User team ID is 1
        ? { ...team, picks: [...(team.picks || []), playerWithCategory] }
        : team
    );

    setSimulationTeams(updatedTeams);

    return {
      updatedTeams,
      playerWithCategory,
      newDraftedPlayers: [...(draftedPlayers || []), player.name]
    };
  }, [simulationTeams]);

  /**
   * Process AI picks in simulation
   * @param {number} currentPick - Current pick number
   * @param {Array} availablePlayers - Available players
   * @param {Object} replacementLevels - Replacement levels
   * @param {Array} draftedPlayers - Current drafted players
   * @returns {Object} Updated state
   */
  const processAIPicks = useCallback((
    currentPick, 
    availablePlayers, 
    replacementLevels, 
    draftedPlayers = []
  ) => {
    if (!Array.isArray(simulationTeams) || !Array.isArray(availablePlayers) || !Array.isArray(draftedPlayers)) {
      return {
        updatedTeams: simulationTeams || [],
        updatedDraftedPlayers: draftedPlayers || [],
        updatedAvailablePlayers: availablePlayers || [],
        nextPick: currentPick || 1
      };
    }
    
    let updatedTeams = [...simulationTeams];
    let updatedDraftedPlayers = [...draftedPlayers];
    let updatedAvailablePlayers = [...availablePlayers];
    let pick = currentPick;

    const totalTeams = 10;
    const totalRounds = LEAGUE_CONFIG.rosterLimits.maxTotalPlayers;
    const totalPicks = totalTeams * totalRounds;

    while (pick <= totalPicks) {
      const round = Math.floor((pick - 1) / totalTeams) + 1;
      const pickInRound = ((pick - 1) % totalTeams) + 1;
      
      // Check if it's user's turn
      const isUserTurn = pickInRound === userDraftPosition;
      if (isUserTurn) {
        break; // Stop and wait for user input
      }

      // Calculate which team should pick
      let teamIndex;
      if (round % 2 === 1) {
        teamIndex = pickInRound - 1; // Odd rounds: 1-10
      } else {
        teamIndex = totalTeams - pickInRound; // Even rounds: 10-1
      }

      // Map team index to actual team (user is always at position 0)
      const teamMapping = [];
      let aiTeamIndex = 1;
      
      for (let i = 0; i < totalTeams; i++) {
        if (i === userDraftPosition - 1) {
          teamMapping[i] = 0; // User's team
        } else {
          teamMapping[i] = aiTeamIndex; // AI team
          aiTeamIndex++;
        }
      }

      const mappedTeamIndex = teamMapping[teamIndex];
      const team = updatedTeams[mappedTeamIndex];

      if (!team || team.picks.length >= team.maxTotalPlayers) {
        pick++;
        continue;
      }

      // Calculate draft position for this team
      const draftPosition = calculateDraftPosition(pickInRound, round, totalTeams);

      // Make AI pick
      const selectedPlayer = makeAIPick(
        team,
        updatedAvailablePlayers,
        replacementLevels,
        round,
        draftPosition,
        updatedDraftedPlayers
      );

      if (selectedPlayer) {
        // CRITICAL: Double-check AI pick validation (should already be validated in aiDraftPlayer)
        const aiDraftValidation = validateDraftMove(team, selectedPlayer);
        if (!aiDraftValidation.isValid) {
          console.error(`AI made illegal pick: ${selectedPlayer.name} for ${team.name}. Errors: ${aiDraftValidation.errors.join(', ')}`);
          // Skip this pick and continue - this should not happen if aiDraftPlayer is working correctly
          pick++;
          continue;
        }

        // Update team
        const rosterCategory = determineRosterCategory(team, selectedPlayer);
        const playerWithCategory = { ...selectedPlayer, round, rosterCategory };

        updatedTeams = updatedTeams.map((t, idx) =>
          idx === mappedTeamIndex 
            ? { ...t, picks: [...t.picks, playerWithCategory] } 
            : t
        );

        // Update drafted players and available players
        updatedDraftedPlayers.push(selectedPlayer.name);
        updatedAvailablePlayers = updatedAvailablePlayers.filter(p => p.id !== selectedPlayer.id);
      }

      pick++;
    }

    // Update state
    setSimulationTeams(updatedTeams);

    return {
      updatedTeams,
      updatedDraftedPlayers,
      updatedAvailablePlayers,
      nextPick: pick
    };
  }, [simulationTeams, userDraftPosition, makeAIPick]);

  /**
   * Complete simulation and generate results
   */
  const completeSimulation = useCallback(() => {
    if (!Array.isArray(simulationTeams) || simulationTeams.length === 0) return;

    const userTeam = simulationTeams[0];
    if (!userTeam) return;

    // Generate simulation results
    const results = {
      timestamp: new Date().toISOString(),
      userTeam,
      allTeams: simulationTeams,
      userDraftPosition,
      totalPicks: Array.isArray(userTeam.picks) ? userTeam.picks.length : 0,
      summary: {
        userRanking: calculateUserRanking(),
        bestPick: findBestPick(),
        worstPick: findWorstPick(),
        positionBalance: analyzePositionBalance()
      }
    };

    setSimulationResults(results);
    setShowResultsModal(true);
  }, [simulationTeams, userDraftPosition]);

  /**
   * Calculate user's ranking among all teams (placeholder implementation)
   * @returns {number} User's ranking (1-10)
   */
  const calculateUserRanking = useCallback(() => {
    if (simulationTeams.length === 0) return 1;

    const teamScores = simulationTeams.map(team => {
      const totalPoints = team.picks.reduce((sum, player) => sum + (player.historicalPoints || 0), 0);
      return { teamId: team.id, score: totalPoints };
    });

    teamScores.sort((a, b) => b.score - a.score);
    const userRank = teamScores.findIndex(team => team.teamId === 1) + 1;
    
    return userRank;
  }, [simulationTeams]);

  /**
   * Find user's best pick (placeholder implementation)
   * @returns {Object|null} Best pick
   */
  const findBestPick = useCallback(() => {
    const userTeam = simulationTeams[0];
    if (!userTeam || userTeam.picks.length === 0) return null;

    return userTeam.picks.reduce((best, player) => 
      (player.historicalPoints || 0) > (best?.historicalPoints || 0) ? player : best, null
    );
  }, [simulationTeams]);

  /**
   * Find user's worst pick (placeholder implementation)
   * @returns {Object|null} Worst pick
   */
  const findWorstPick = useCallback(() => {
    const userTeam = simulationTeams[0];
    if (!userTeam || userTeam.picks.length === 0) return null;

    return userTeam.picks.reduce((worst, player) => 
      (player.historicalPoints || 0) < (worst?.historicalPoints || 0) ? player : worst, 
      userTeam.picks[0]
    );
  }, [simulationTeams]);

  /**
   * Analyze position balance (placeholder implementation)
   * @returns {Object} Position balance analysis
   */
  const analyzePositionBalance = useCallback(() => {
    const userTeam = simulationTeams[0];
    if (!userTeam) return {};

    const positionCounts = userTeam.picks.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, { F: 0, M: 0, D: 0, G: 0 });

    return positionCounts;
  }, [simulationTeams]);

  /**
   * Get user's team from simulation
   * @returns {Object|null} User's team
   */
  const getUserTeam = useCallback(() => {
    return simulationTeams[0] || null;
  }, [simulationTeams]);

  /**
   * Check if simulation is complete
   * @returns {boolean} Whether simulation is complete
   */
  const isSimulationComplete = useCallback(() => {
    if (!Array.isArray(simulationTeams) || simulationTeams.length === 0) {
      return false;
    }
    return simulationTeams.every(team => 
      team && 
      Array.isArray(team.picks) && 
      team.picks.length >= (team.maxTotalPlayers || 15)
    );
  }, [simulationTeams]);

  return {
    // State
    isSimulationMode,
    simulationTeams,
    userDraftPosition,
    simulationResults,
    showResultsModal,
    
    // Setters (for direct updates when needed)
    setIsSimulationMode,
    setSimulationTeams,
    setUserDraftPosition,
    setSimulationResults,
    setShowResultsModal,
    
    // Operations
    startSimulation,
    stopSimulation,
    resetSimulation,
    makeAIPick,
    draftPlayerInSimulation,
    processAIPicks,
    completeSimulation,
    getUserTeam,
    isSimulationComplete
  };
}; 