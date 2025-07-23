import React, { useEffect, useCallback } from 'react';
import { Search, TrendingUp, Users, Clock, Calendar, MapPin, Thermometer, Sun, Cloud, CloudRain, Target, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import { LEAGUE_CONFIG, createTeamTemplate } from './leagueConfig.js';
// getStrategicRecommendations is now provided by the playerData hook

// Import utility functions
import { ROSTER_CATEGORIES, fplDataTeamMapping } from './utils/constants.js';
import { 
  validateRosterMove, 
  generateComplianceReport, 
  validateLeagueCompliance,
  validateDraftMove,
  determineRosterCategory
} from './utils/rosterValidation.js';
import { 
  calculateHistoricalPoints,
  calculateReplacementLevels,
  createPlayerTiers,
  calculateVORP
} from './utils/playerCalculations.js';
import { 
  aiDraftPlayer
} from './utils/draftLogic.js';

// Import context providers and hooks
import { 
  DraftProvider, 
  PlayerProvider, 
  UIProvider, 
  FixtureProvider,
  useDraftContext,
  usePlayerContext,
  useUIContext,
  useFixtureContext
} from './contexts/index.js';

// Import components
import { 
  PlayerTooltip, 
  Header, 
  DraftBoard, 
  PlayerList, 
  SimulationResultsModal, 
  ComplianceReportModal 
} from './components/index.js';

// Inner component that uses contexts - contains the main app logic
const DraftTrackerContent = () => {
  // Get data from contexts instead of direct hooks
  const { 
    teams, 
    currentPick, 
    draftedPlayers, 
    getCurrentDraftTeam, 
    _draftPlayerToTeam, 
    _getDraftProgress,
    isSimulationMode,
    simulationTeams,
    userDraftPosition,
    _simulationResults,
    _showResultsModal,
    startSimulation: _startSimulationFromContext,
    resetSimulation: resetSimulationFromContext,
    _processAIPicks,
    _draftPlayerInSimulation,
    draftState,
    simulation
  } = useDraftContext();

  const { 
    _loading, 
    availablePlayers, 
    replacementLevels, 
    _playerTiers, 
    _strategicData,
    getAvailablePlayers: getFilteredPlayers, 
    getStrategicRecommendations: getHookRecommendations,
    _updateCalculations,
    playerData
  } = usePlayerContext();

  const { 
    searchTerm, 
    selectedPosition, 
    _hoveredPlayer, 
    _tooltipPosition, 
    _showComplianceReport, 
    _complianceReportData,
    _forceUpdate,
    handlePlayerHover: handlePlayerHoverHook,
    _clearPlayerHover,
    showComplianceReportModal,
    _hideComplianceReportModal,
    _triggerForceUpdate,
    _updateSearchTerm,
    _updateSelectedPosition,
    ui
  } = useUIContext();

  const { 
    fixtures, 
    _getUpcomingIndicators, 
    _getDifficultyScore,
    fixtureState
  } = useFixtureContext();
  
  // Roster management functions
  const movePlayerToCategory = useCallback((teamId, playerId, newCategory) => {
    const team = isSimulationMode 
      ? simulationTeams.find(t => t.id === teamId)
      : teams.find(t => t.id === teamId);
      
    if (!team) return;

    const player = team.picks.find(p => p.id === playerId);
    if (!player) return;

    // Check if move is valid with detailed error messages
    const moveValidation = validateRosterMove(team, player, newCategory);
    if (!moveValidation.isValid) {
      alert(`Cannot move ${player.name}: ${moveValidation.errors.join(', ')}`);
      return;
    }

    // Update the team using hook methods
    const newPicks = team.picks.map(p => 
      p.id === playerId 
        ? { ...p, rosterCategory: newCategory }
        : p
    );

    if (isSimulationMode) {
      const updatedTeams = simulationTeams.map(t => 
        t.id === teamId ? { ...t, picks: newPicks } : t
      );
      simulation.setSimulationTeams(updatedTeams);
    } else {
      draftState.updateTeamPicks(teamId, newPicks);
    }
  }, [isSimulationMode, simulationTeams, teams, simulation, draftState]);
  
  // Use league configuration scoring rules
  const scoringRules = LEAGUE_CONFIG.scoringRules;

  // Team mapping from fixture full names to FPL codes
  const _teamMapping = {
    "Liverpool": "LIV", "Manchester City": "MCI", "Arsenal": "ARS", 
    "Chelsea": "CHE", "Tottenham Hotspur": "TOT", "Manchester United": "MUN", 
    "Newcastle United": "NEW", "Brighton & Hove Albion": "BHA", "Aston Villa": "AVL", 
    "West Ham United": "WHU", "Wolverhampton Wanderers": "WOL", "Fulham": "FUL", 
    "Crystal Palace": "CRY", "Brentford": "BRF", "Nottingham Forest": "NOT", 
    "AFC Bournemouth": "BOU", "Everton": "EVE", "Leeds United": "LEE", 
    "Burnley": "BUR", "Sunderland": "SUN",
    // Additional mappings for fpl-data.json team names
    "Bournemouth": "BOU", "Brighton": "BHA", "Tottenham": "TOT", 
    "Manchester Utd": "MUN", "Newcastle Utd": "NEW", "West Ham": "WHU",
    "Nott'ham Forest": "NOT", "Wolves": "WOL", "Leicester City": "LEI",
    "Southampton": "SOU", "Ipswich Town": "IPS",
    // Additional mappings for fixture data variations
    "Nottingham Forest (Sky Sports)*": "NOT"
  };

  // Reverse mapping from fpl-data.json team names to FPL codes
  // Team mapping and difficulty colors are now imported from constants.js

  // Weather icons mapping (for future use)
  // const weatherIcons = {
  //   'sunny': Sun, 'clear': Sun, 'cloudy': Cloud, 'rain': CloudRain, 'overcast': Cloud
  // };







  // Calculate dynamic positional scarcity (legacy function - replaced by strategic recommendations)
  // const calculatePositionalScarcity = (availablePlayers, draftedPlayers) => {
  //   const positions = ['F', 'M', 'D', 'G'];
  //   const scarcity = {};
  //   
  //   positions.forEach(pos => {
  //     const available = availablePlayers.filter(p => p.position === pos).length;
  //     const drafted = draftedPlayers.filter(p => p.position === pos).length;
  //     const total = available + drafted;
  //     
  //     // Calculate scarcity as percentage of players remaining at position
  //     // Lower percentage = more scarce
  //     scarcity[pos] = total > 0 ? (available / total) * 100 : 100;
  //   });
  //   
  //   return scarcity;
  // };

  // Find value picks (legacy function - replaced by strategic recommendations)
  // const findValuePicks = (availablePlayers, replacementLevels) => {
  //   const playersWithVORP = availablePlayers.map(p => ({
  //     ...p,
  //     vorp: calculateVORP(p, replacementLevels)
  //   }));
  //   
  //   // Sort by VORP to identify the best value picks
  //   return playersWithVORP
  //     .sort((a, b) => b.vorp - a.vorp)
  //     .slice(0, 10); // Top 10 value picks
  // };

  // createPlayerTiers is now imported from utils/playerCalculations.js

  // Enhanced getFixtureDifficultyScore function (legacy - replaced by strategic system)
  // const getFixtureDifficultyScore = (playerTeam) => {
  //   // Player team is already in FPL code format (e.g., "LIV", "MCI")
  //   const teamFixtures = fixtures[playerTeam] || [];
  //   
  //   if (teamFixtures.length === 0) {
  //     return 3;
  //   }
  //   
  //   // Look at next 6 fixtures for short-term planning
  //   const upcomingFixtures = teamFixtures.slice(0, 6);
  //   const avgDifficulty = upcomingFixtures.reduce((sum, fixture) => sum + fixture.difficulty, 0) / upcomingFixtures.length;
  //   
  //   return avgDifficulty;
  // };

  const getRecommendations = useCallback(() => {
    const currentTeam = getCurrentTeam();
    if (!currentTeam || !currentTeam.positionLimits) return [];

    const available = getAvailablePlayers();
    const currentRound = Math.floor((currentPick - 1) / (isSimulationMode ? 10 : teams.length)) + 1;
    
    // Determine draft position (for simulation, use userDraftPosition; for normal mode, calculate)
    let draftPosition;
    if (isSimulationMode) {
      draftPosition = userDraftPosition;
    } else {
      // In normal mode, assume user is always team 1 (position 1)
      draftPosition = 1;
    }

    // Get strategic recommendations using the new system
    const strategicRecs = getHookRecommendations(
      currentTeam.picks || [],
      currentRound,
      draftPosition,
      available.filter(p => !p.isPositionFull), // Only include draftable players
      replacementLevels,
      isSimulationMode ? 10 : teams.length,
      fixtures // Pass fixtures for enhanced difficulty analysis
    );

    return strategicRecs?.recommendations || [];
  }, [getCurrentTeam, getAvailablePlayers, currentPick, isSimulationMode, teams.length, userDraftPosition, replacementLevels, fixtures, getHookRecommendations]);

  // Helper function to get upcoming fixtures text (legacy function)
  // const getUpcomingFixturesText = (playerTeam) => {
  //   // Player team is already in FPL code format
  //   const teamFixtures = fixtures[playerTeam] || [];
  //   
  //   return teamFixtures.slice(0, 3).map(fixture => 
  //     `${fixture.home ? 'vs' : '@'} ${fixture.opponent} (${fixture.difficulty})`
  //   ).join(', ');
  // };

  const fetchPlayerData = async () => {
    try {
        playerData.setLoading(true);

        const response = await fetch('/fpl-data.json');
        if (!response.ok) {
            throw new Error('Could not load player data file');
        }
        const data = await response.json();
        
        // New format: data is directly an array of players
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format - expected array of players');
        }

        const players = data.map(player => {
            // *** NEW: Calculate points based on our rules ***
            const historicalPoints = calculateHistoricalPoints(player, scoringRules);
            
            // *** NEW: Calculate Fantasy Points per 90 (FP/90) ***
            const fp90 = (player.minutes > 0) ? (historicalPoints / player.minutes) * 90 : 0;
            
            // Convert team names to FPL codes for fixture matching
            const teamCode = fplDataTeamMapping[player.team] || player.team;
            
            return {
                id: player.id,
                name: player.name,
                team: teamCode,
                position: player.position,
                age: player.age,
                // --- NEW & IMPROVED METRICS ---
                historicalPoints: Math.round(historicalPoints * 10) / 10,
                fp90: Math.round(fp90 * 100) / 100,
                // --- Raw stats for tooltips/display ---
                minutes: player.minutes || 0,
                goals: player.goals || 0,
                assists: player.assists || 0,
                assistsSecond: player.assistsSecond || 0,
                shots: player.shots || 0,
                shotsOnTarget: player.shotsOnTarget || 0,
                keyPasses: player.keyPasses || 0,
                tacklesWon: player.tacklesWon || 0,
                interceptions: player.interceptions || 0,
                dribbles: player.dribbles || 0,
                accCrosses: player.accCrosses || 0,
                foulsCommitted: player.foulsCommitted || 0,
                foulsSuffered: player.foulsSuffered || 0,
                offsides: player.offsides || 0,
                pkMissed: player.pkMissed || 0,
                pkDrawn: player.pkDrawn || 0,
                ownGoals: player.ownGoals || 0,
                dispossessed: player.dispossessed || 0,
                recoveries: player.recoveries || 0,
                aerialsWon: player.aerialsWon || 0,
                blockedShots: player.blockedShots || 0,
                clearances: player.clearances || 0,
                yellowCards: player.yellowCards || 0,
                redCards: player.redCards || 0,
                cleanSheets: player.cleanSheets || 0,
                saves: player.saves || 0,
                pkSaves: player.pkSaves || 0,
                highClaims: player.highClaims || 0,
                goalsConceded: player.goalsConceded || 0,
                handBalls: player.handBalls || 0,
                // Legacy fields for compatibility
                value: Math.round(historicalPoints * 10) / 10,
                points: Math.round(historicalPoints * 10) / 10,
                form: Math.round(fp90 * 10) / 10,
                price: 5, // Default price
                news: ''
            };
        }).sort((a, b) => b.historicalPoints - a.historicalPoints); // Sort by our new metric

        playerData.setAvailablePlayers(players);
        
        // Calculate VORP and tiers
        const levels = calculateReplacementLevels(players);
        const tiers = createPlayerTiers(players, levels);
        
        playerData.setReplacementLevels(levels);
        playerData.setPlayerTiers(tiers);
        
    } catch (err) {
        console.error('Error: ' + err.message + ' - Using sample data');
        playerData.setAvailablePlayers([]);
    } finally {
        playerData.setLoading(false);
    }
  };

  const initializeTeams = () => {
    const teamCount = 10;
    const newTeams = [];
    for (let i = 1; i <= teamCount; i++) {
      newTeams.push(createTeamTemplate(i, i === 1 ? 'Your Team' : `Team ${i}`));
    }
    draftState.setTeams(newTeams);
  };

  useEffect(() => {
    initializeTeams();
    fetchPlayerData();
    fixtureState.initializeFixtures();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate replacement levels when players are drafted
  useEffect(() => {
    if (availablePlayers.length > 0) {
      const available = availablePlayers.filter(player => !draftedPlayers.includes(player.name));
      const newLevels = calculateReplacementLevels(available);
      playerData.setReplacementLevels(newLevels);
      
      // Also update player tiers
      const newTiers = createPlayerTiers(available, newLevels);
      playerData.setPlayerTiers(newTiers);
    }
  }, [availablePlayers, draftedPlayers, playerData]);

  const getCurrentTeam = useCallback(() => {
    if (isSimulationMode) {
      return getCurrentDraftTeam(isSimulationMode, userDraftPosition, simulationTeams);
    } else {
      // Manual mode: use the teams from draft state
      return getCurrentDraftTeam(false, 1, teams);
    }
  }, [isSimulationMode, userDraftPosition, simulationTeams, teams, getCurrentDraftTeam]);

  const showTeamComplianceReport = useCallback((team) => {
    const report = generateComplianceReport(team);
    const compliance = validateLeagueCompliance(team);
    showComplianceReportModal({ report, compliance, team });
  }, [showComplianceReportModal]);

  const draftPlayer = (player) => {
    if (isSimulationMode) {
      // Handle simulation mode drafting
      const currentRound = Math.floor((currentPick - 1) / 10) + 1;
      const pickInRound = ((currentPick - 1) % 10) + 1;
      
      // Determine which team should pick in snake draft
      let _teamIndex;
      if (currentRound % 2 === 1) {
        _teamIndex = pickInRound - 1; // 1-10
      } else {
        _teamIndex = 10 - pickInRound; // 10-1
      }
      
      // Only allow user to draft when it's their turn (user is at userDraftPosition)
      if (pickInRound !== userDraftPosition) {
        console.log('Not your turn to draft!');
        return;
      }
      
      // Update user's team in simulation
      const userPickRound = Math.floor((currentPick - 1) / 10) + 1;
      const userTeam = simulationTeams[0];
      const rosterCategory = determineRosterCategory(userTeam, player);
      const playerWithCategory = { ...player, round: userPickRound, rosterCategory };
      
      const updatedUserTeam = simulationTeams.map(team =>
          team.id === 1
            ? { ...team, picks: [...team.picks, playerWithCategory] }
            : team
        );
      
      simulation.setSimulationTeams(updatedUserTeam);
      playerData.setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
      draftState.setDraftedPlayers(prev => [...prev, player.name]);
      draftState.setCurrentPick(prev => prev + 1);
      ui.setForceUpdate(prev => prev + 1);
      
              console.log(`You drafted ${player.name} (${player.position}) in round ${userPickRound}`);
      
      // After user pick, fast-forward AI picks to next user turn
      setTimeout(() => {
        advanceSimulationDraft(
          updatedUserTeam,
          availablePlayers.filter(p => p.id !== player.id),
          currentPick + 1,
          userDraftPosition,
          false
        );
      }, 50);
      return;
    } else {
      // Handle normal mode drafting
      const currentTeam = getCurrentTeam();
      
      if (!currentTeam) {
        alert('Please start a draft first by clicking "Start Draft"');
        return;
      }

      // Comprehensive draft validation
      const draftValidation = validateDraftMove(currentTeam, player);
      if (!draftValidation.isValid) {
        alert(`Cannot draft ${player.name}. ${draftValidation.errors.join(' ')}`);
        return;
      }

      const rosterCategory = determineRosterCategory(currentTeam, player);
      const playerWithCategory = { 
        ...player, 
        round: Math.floor((currentPick - 1) / teams.length) + 1,
        rosterCategory 
      };

      const updatedTeams = teams.map(team => {
        if (team.id === currentTeam.id) {
          return {
            ...team,
            picks: [...team.picks, playerWithCategory]
          };
        }
        return team;
      });

      draftState.setTeams(updatedTeams);
      draftState.setDraftedPlayers([...draftedPlayers, player.name]);
      draftState.setCurrentPick(currentPick + 1);
      playerData.setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    }
  };

  const getAvailablePlayers = useCallback(() => {
    const currentTeam = getCurrentTeam();
    return getFilteredPlayers(draftedPlayers, currentTeam, selectedPosition, searchTerm);
  }, [getCurrentTeam, draftedPlayers, selectedPosition, searchTerm, getFilteredPlayers]);

  const _handlePlayerHover = (player, event) => {
    handlePlayerHoverHook(player, event);
  };

  // PlayerTooltip component is now imported from components/

  const _getTeamFixtureIndicators = (playerTeam) => {
    // Player team is already in FPL code format
    const teamFixtures = fixtures[playerTeam] || [];
    return teamFixtures.slice(0, 3);
  };

  // Player tier functions are now imported from utils/playerCalculations.js

  // aiDraftPlayer is now imported from utils/draftLogic.js

  // Initialize simulation
  const _startSimulation = async () => {
    // Randomize user draft position (1-10)
    const randomPosition = Math.floor(Math.random() * 10) + 1;
    simulation.setUserDraftPosition(randomPosition);
    
    // Create simulation teams using correct league configuration
    const simTeams = Array.from({ length: 10 }, (_, i) => 
      createTeamTemplate(i + 1, i === 0 ? 'Your Team' : `AI Team ${i}`)
    );
    
    simulation.setSimulationTeams(simTeams);
    simulation.setIsSimulationMode(true);
    // setIsSimulationComplete(false);
    simulation.setSimulationResults(null);
    simulation.setShowResultsModal(false);
    draftState.setCurrentPick(1);
    draftState.setDraftedPlayers([]);
    
    // Reset available players to original state
    await fetchPlayerData();
    
    console.log(`Simulation started! Your draft position: ${randomPosition}`);
    console.log('Simulation teams created:', simTeams);
    
    // Fast-forward AI picks to user's first turn
    setTimeout(() => {
      const { updatedTeams, updatedAvailablePlayers, nextPick } = advanceSimulationDraft(
        simTeams,
        availablePlayers,
        1,
        randomPosition,
        false
      );
      simulation.setSimulationTeams(updatedTeams);
      playerData.setAvailablePlayers(updatedAvailablePlayers);
      draftState.setCurrentPick(nextPick);
    }, 100);
  };

  // Run AI picks for a round
  const _runAIRound = (currentPickNumber, userPosition, teams, availablePlayersList) => {
    const currentRound = Math.floor((currentPickNumber - 1) / 10) + 1;
    const pickInRound = ((currentPickNumber - 1) % 10) + 1;
    
    console.log(`runAIRound called: pick ${currentPickNumber}, round ${currentRound}, pickInRound ${pickInRound}, userPosition ${userPosition}`);
    
    // If it's user's turn, don't run AI
    if (pickInRound === userPosition) {
      console.log('Skipping - user turn');
      return;
    }
    
    // Determine which team should pick in snake draft
    let teamIndex;
    if (currentRound % 2 === 1) {
      teamIndex = pickInRound - 1; // 1-10
    } else {
      teamIndex = 10 - pickInRound; // 10-1
    }
    
    // Find the team that should pick using the same mapping logic
    const teamMapping = [];
    let aiTeamIndex = 1;
    
    for (let i = 0; i < 10; i++) {
      if (i === userPosition - 1) {
        teamMapping[i] = 0; // User's team (index 0)
      } else {
        teamMapping[i] = aiTeamIndex; // AI team (index 1-9)
        aiTeamIndex++;
      }
    }
    
    console.log(`teams length: ${teams.length}`);
    console.log(`teams indices:`, teams.map((team, index) => `${index}: ${team.name}`));
    
    console.log(`Team mapping for user position ${userPosition}:`, teamMapping);
    console.log(`Team index: ${teamIndex}, mapped to team: ${teamMapping[teamIndex]}`);
    
    const pickingTeam = teams[teamMapping[teamIndex]];
    
    console.log(`Team index: ${teamIndex}, Picking team:`, pickingTeam);
    console.log(`Available players: ${availablePlayersList.length}`);
    
    if (pickingTeam && availablePlayersList.length > 0) {
      // Calculate draft position - this is the team's permanent position in the draft order (1-10)
      // The team mapping maps pick positions to team indices, so we need to reverse that
      let draftPosition;
      if (currentRound % 2 === 1) {
        // Odd rounds: pick position = draft position  
        draftPosition = pickInRound;
      } else {
        // Even rounds: reverse order
        draftPosition = 11 - pickInRound;  // For 10 teams: pick 1 = pos 10, pick 2 = pos 9, etc.
      }
      
      const selectedPlayer = aiDraftPlayer(pickingTeam, availablePlayersList, replacementLevels, currentRound, draftPosition);
      
      if (!selectedPlayer) {
        console.log(`AI Team ${pickingTeam.name} could not find a valid player to draft in round ${currentRound}`);
        return;
      }
      
      console.log(`AI Team ${pickingTeam.name} drafting ${selectedPlayer.name} in round ${currentRound}`);
      
      // Update all states in one batch
      simulation.setSimulationTeams(prev => {
        const updated = prev.map(team => 
          team.id === pickingTeam.id 
            ? { ...team, picks: [...team.picks, { ...selectedPlayer, round: currentRound }] }
            : team
        );
        console.log('Updated simulation teams:', updated);
        return updated;
      });
      
              playerData.setAvailablePlayers(prev => prev.filter(p => p.id !== selectedPlayer.id));
        draftState.setDraftedPlayers(prev => [...prev, selectedPlayer.name]);
        draftState.setCurrentPick(prev => prev + 1);
        ui.setForceUpdate(prev => prev + 1); // Force re-render
      
      // Return updated teams and available players for the next AI pick
      const updatedTeams = teams.map(team => 
        team.id === pickingTeam.id 
          ? { ...team, picks: [...team.picks, { ...selectedPlayer, round: currentRound }] }
          : team
      );
      const updatedAvailablePlayers = availablePlayersList.filter(p => p.id !== selectedPlayer.id);
      
      return {
        updatedTeams,
        updatedAvailablePlayers
      };
    }
    
    return null; // Return null if no pick was made
  };

  // Complete simulation
  const completeSimulation = () => {
    const results = {
      teams: simulationTeams,
      userPosition: userDraftPosition,
      totalRounds: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers,
      analysis: {
        userTeam: simulationTeams[0],
        aiTeams: simulationTeams.slice(1),
        userVorp: simulationTeams[0].picks.reduce((sum, p) => sum + calculateVORP(p, replacementLevels), 0),
        averageAiVorp: simulationTeams.slice(1).reduce((sum, team) => 
          sum + team.picks.reduce((teamSum, p) => teamSum + calculateVORP(p, replacementLevels), 0), 0
        ) / 9
      }
    };
    
    simulation.setSimulationResults(results);
    // setIsSimulationComplete(true);
    simulation.setShowResultsModal(true);
    
    console.log('Simulation completed!', results);
  };

  // Reset simulation and all draft state
  const _resetSimulation = () => {
    // Reset simulation state
    resetSimulationFromContext();
    
    // Reset main draft state (teams, picks, etc.)
    draftState.resetDraft();
    
    // Reset UI state (position filters, search terms, etc.)
    ui.resetUIState();
    
    // Re-fetch player data
    playerData.initializePlayerData();
  };

  // Start manual draft mode
  const startDraft = () => {
    console.log('Starting manual draft...');
    
    // Create teams for manual draft (typically 10-12 teams)
    const teamCount = 10;
    const manualTeams = [];
    
    for (let i = 1; i <= teamCount; i++) {
      const team = createTeamTemplate(i, i === 1 ? 'Your Team' : `Team ${i}`);
      manualTeams.push(team);
    }
    
    console.log('Manual draft teams created:', manualTeams.length);
    
    // Initialize draft state
    draftState.initializeTeamsForDraft(manualTeams);
    
    // Reset other states
    draftState.setCurrentPick(1);
    draftState.setDraftedPlayers([]);
    ui.resetUIState();
    
    console.log('Manual draft initialized successfully');
  };
  
  // Reset manual draft
  const resetDraft = () => {
    console.log('Resetting manual draft...');
    
    // Reset draft state
    draftState.resetDraft();
    
    // Reset UI state
    ui.resetUIState();
    
    // Re-initialize player data
    playerData.initializePlayerData();
    
    console.log('Manual draft reset complete');
  };

  const currentTeam = getCurrentTeam();
  
  // Pure calculation for recommendations without side effects
  const _recommendations = React.useMemo(() => {
    return getRecommendations();
  }, [getRecommendations]);

  // Handle strategic data updates in useEffect to avoid setState during render
  React.useEffect(() => {
    if (currentTeam && currentTeam.picks !== undefined) {
      const currentRound = Math.floor((currentPick - 1) / (isSimulationMode ? 10 : teams.length)) + 1;
      const draftPosition = isSimulationMode ? userDraftPosition : 1;
      const available = getAvailablePlayers().filter(p => !p.isPositionFull);
      
      const strategicInfo = getHookRecommendations(
        currentTeam.picks || [],
        currentRound,
        draftPosition,
        available,
        replacementLevels,
        isSimulationMode ? 10 : teams.length,
        fixtures // Pass fixtures for enhanced difficulty analysis
      );
      
      playerData.setStrategicData(strategicInfo);
    }
  }, [currentTeam, currentPick, teams.length, isSimulationMode, userDraftPosition, availablePlayers, replacementLevels, fixtures, getAvailablePlayers, getHookRecommendations, playerData]);

  // Debug effect to monitor simulation teams
  useEffect(() => {
    if (isSimulationMode && simulationTeams.length > 0) {
      console.log('Simulation teams updated:', simulationTeams.map(team => ({
        name: team.name,
        picks: team.picks.length
      })));
    }
  }, [simulationTeams, isSimulationMode]);

  // Add this function to handle the simulation draft advancement with real-time UI updates
  const advanceSimulationDraft = (teams, availablePlayersList, currentPickNum, userPos, isUserAction = false) => {
    const totalTeams = teams.length;
    const totalRounds = LEAGUE_CONFIG.rosterLimits.maxTotalPlayers;
    const totalPicks = totalTeams * totalRounds;
    let pick = currentPickNum;
    let updatedTeams = [...teams];
    let updatedAvailablePlayers = [...availablePlayersList];

    const makeAIPick = (team, teamIndex, round, pick) => {
      // Calculate the draft position for this team
      const pickInRound = ((pick - 1) % totalTeams) + 1;
      let draftPosition;
      if (round % 2 === 1) {
        // Odd rounds: pick position = draft position  
        draftPosition = pickInRound;
      } else {
        // Even rounds: reverse order
        draftPosition = totalTeams + 1 - pickInRound;
      }
      
      const aiPick = aiDraftPlayer(team, updatedAvailablePlayers, replacementLevels, round, draftPosition);
      if (!aiPick) return false;
      
      // Determine roster category for AI pick
      const rosterCategory = determineRosterCategory(team, aiPick);
      const aiPickWithCategory = { ...aiPick, round, rosterCategory };
      
      // Update teams
      updatedTeams = updatedTeams.map((t, idx) =>
        idx === teamIndex ? { ...t, picks: [...t.picks, aiPickWithCategory] } : t
      );
      updatedAvailablePlayers = updatedAvailablePlayers.filter(p => p.id !== aiPick.id);
      
      // Update React state immediately for real-time UI updates
      simulation.setSimulationTeams([...updatedTeams]);
      playerData.setAvailablePlayers([...updatedAvailablePlayers]);
      draftState.setDraftedPlayers(prev => [...prev, aiPick.name]);
      draftState.setCurrentPick(pick + 1);
      ui.setForceUpdate(prev => prev + 1);
      
      console.log(`AI ${team.name} picks ${aiPick.name} (${aiPick.position}) - Round ${round}, Pick ${pick}`);
      console.log(`Team ${team.name} now has ${updatedTeams[teamIndex].picks.length} players:`, updatedTeams[teamIndex].picks.map(p => p.name));
      console.log(`Current simulation teams state:`, updatedTeams.map(t => `${t.name}: ${t.picks.length} players`));
      return true;
    };

    while (pick <= totalPicks) {
      const round = Math.floor((pick - 1) / totalTeams) + 1;
      const pickInRound = ((pick - 1) % totalTeams) + 1;
      
      // FIXED: Separate team selection from draft position
      const isUserTurn = pickInRound === userPos;
      
      let team, teamIndex;
      
      if (isUserTurn) {
        // User's turn - always use "Your Team" (index 0)
        team = updatedTeams[0];
        teamIndex = 0;
      } else {
        // AI turn - calculate which AI team should pick
        // Map draft position to AI team (excluding user position)
        let aiTeamNumber;
        if (pickInRound < userPos) {
          aiTeamNumber = pickInRound;
        } else {
          aiTeamNumber = pickInRound - 1;
        }
        teamIndex = aiTeamNumber; // AI teams are at indices 1-9
        team = updatedTeams[teamIndex];
      }
      
      console.log(`Pick ${pick}: Round ${round}, Position ${pickInRound}, Team: ${team.name} (index ${teamIndex}), User Position: ${userPos}, Is User Turn: ${isUserTurn}`);
      
      // If team is full, skip
      if (team.picks.length >= team.maxTotalPlayers) {
        console.log(`Team ${team.name} is full, skipping`);
        pick++;
        continue;
      }
      
      // If it's the user's turn and we're not processing a user action, break and wait
      if (isUserTurn && !isUserAction) {
        console.log('Breaking - waiting for user pick');
        break;
      }
      
      // If it's the user's turn and this is a user action, allow the pick
      if (isUserTurn && isUserAction) {
        console.log('User pick - breaking');
        break;
      }
      
      // AI pick
      console.log(`Making AI pick for ${team.name}`);
      if (makeAIPick(team, teamIndex, round, pick)) {
        pick++;
      } else {
        pick++;
      }
      continue;
    }
    
    // Check if simulation is complete
    setTimeout(() => {
      if (updatedTeams.every(team => team.picks.length >= team.maxTotalPlayers)) {
        console.log('Simulation complete!');
        completeSimulation();
      }
    }, 100);
    
    return { updatedTeams, updatedAvailablePlayers, nextPick: pick };
  };

  // Add this useEffect to fast-forward AI picks after player data is loaded
  useEffect(() => {
    if (isSimulationMode && availablePlayers.length > 0 && currentPick === 1 && simulationTeams.length > 0) {
      console.log('Starting simulation fast-forward...');
      console.log('User draft position:', userDraftPosition);
      console.log('Simulation teams:', simulationTeams.map((t, i) => `Index ${i}: ${t.name}`));
      
      setTimeout(() => {
        advanceSimulationDraft(
          simulationTeams,
          availablePlayers,
          1,
          userDraftPosition,
          false
        );
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulationMode, availablePlayers, currentPick, simulationTeams]);

  // Debug function to simulate a full draft and log all picks and errors
  function runDraftSimulationDebug() {
    const totalTeams = 10;
    const totalRounds = LEAGUE_CONFIG.rosterLimits.maxTotalPlayers;
    // Use the same player data and scoring as the app
    const playerData = [...availablePlayers];
    const replacementLevelsDebug = { ...replacementLevels };
    // Create fresh teams
    const debugTeams = Array.from({ length: totalTeams }, (_, i) => ({
      id: i + 1,
      name: i === 0 ? 'Your Team' : `AI Team ${i}`,
      picks: [],
      positionLimits: {
        F: { totalMax: 4, maxActive: 3 },
        M: { totalMax: 6, maxActive: 5 },
        D: { totalMax: 6, maxActive: 4 },
        G: { totalMax: 2, maxActive: 1 }
      },
      maxTotalPlayers: 15,
      maxActivePlayers: 11
    }));
    let available = [...playerData];
    let pickLog = [];
    for (let pick = 1; pick <= totalTeams * totalRounds; pick++) {
      const round = Math.floor((pick - 1) / totalTeams) + 1;
      const pickInRound = ((pick - 1) % totalTeams) + 1;
      let teamIndex = round % 2 === 1 ? pickInRound - 1 : totalTeams - pickInRound;
      const team = debugTeams[teamIndex];
      if (team.picks.length >= team.maxTotalPlayers) continue;
      // AI pick logic with roster/position enforcement
      const validPlayers = available.filter(player => {
        const posCount = team.picks.filter(p => p.position === player.position).length;
        const posLimit = team.positionLimits[player.position]?.totalMax || 0;
        if (posCount >= posLimit) return false;
        if (team.picks.length >= team.maxTotalPlayers) return false;
        return true;
      });
      if (validPlayers.length === 0) continue;
      // Pick best VORP
      validPlayers.sort((a, b) => calculateVORP(b, replacementLevelsDebug) - calculateVORP(a, replacementLevelsDebug));
      const pickPlayer = validPlayers[0];
      team.picks.push({ ...pickPlayer, round });
      available = available.filter(p => p.id !== pickPlayer.id);
      pickLog.push({
        round,
        pick: pickInRound,
        team: team.name,
        player: pickPlayer.name,
        position: pickPlayer.position,
        roster: {
          F: team.picks.filter(p => p.position === 'F').length,
          M: team.picks.filter(p => p.position === 'M').length,
          D: team.picks.filter(p => p.position === 'D').length,
          G: team.picks.filter(p => p.position === 'G').length,
          total: team.picks.length
        }
      });
      console.log(`Round ${round}, Pick ${pickInRound}, Team: ${team.name}, Player: ${pickPlayer.name} (${pickPlayer.position}), Roster:`, pickLog[pickLog.length - 1].roster);
    }
    // Check for errors
    let errors = [];
    // Roster limit violations
    debugTeams.forEach(team => {
      if (team.picks.length > team.maxTotalPlayers) errors.push(`${team.name} exceeded total roster limit: ${team.picks.length}`);
      ['F', 'M', 'D', 'G'].forEach(pos => {
        const count = team.picks.filter(p => p.position === pos).length;
        const limit = team.positionLimits[pos].totalMax;
        if (count > limit) errors.push(`${team.name} exceeded ${pos} limit: ${count}`);
      });
      if (team.picks.length < team.maxTotalPlayers) errors.push(`${team.name} has fewer than 15 players: ${team.picks.length}`);
    });
    // Duplicate picks
    const allPicks = debugTeams.flatMap(team => team.picks.map(p => p.id));
    const pickSet = new Set();
    allPicks.forEach(id => {
      if (pickSet.has(id)) errors.push(`Duplicate pick detected: Player ID ${id}`);
      pickSet.add(id);
    });
    // Output summary
    console.log('--- Draft Simulation Debug Summary ---');
    if (errors.length === 0) {
      console.log('No errors detected. All teams drafted correctly.');
    } else {
      console.error('Errors detected:');
      errors.forEach(e => console.error(e));
    }
    debugTeams.forEach(team => {
      console.log(`${team.name} (${team.picks.length}):`, team.picks.map(p => `${p.name} (${p.position})`).join(', '));
    });
    return { teams: debugTeams, pickLog, errors };
  }
  // Expose to window for manual testing
  if (typeof window !== 'undefined') {
    window.runDraftSimulationDebug = runDraftSimulationDebug;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header 
        currentTeam={getCurrentTeam()}
        startDraft={startDraft}
        resetDraft={resetDraft}
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Sidebar - Draft Board */}
        <DraftBoard 
          getCurrentTeam={getCurrentTeam}
          showTeamComplianceReport={showTeamComplianceReport}
          movePlayerToCategory={movePlayerToCategory}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Available Players Section */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-full">
              <PlayerList 
                draftPlayer={draftPlayer}
              />
            </div>
          </div>
        </div>
      </div>
      
      <PlayerTooltip />
      
      {/* Simulation Results Modal */}
      <SimulationResultsModal />
      
      {/* Compliance Report Modal */}
      <ComplianceReportModal />
    </div>
  );
};

// Main App component with context providers
const EnhancedFantasyDraftTracker = () => {
  return (
    <DraftProvider>
      <PlayerProvider>
        <UIProvider>
          <FixtureProvider>
            <DraftTrackerContent />
          </FixtureProvider>
        </UIProvider>
      </PlayerProvider>
    </DraftProvider>
  );
};

export default EnhancedFantasyDraftTracker;