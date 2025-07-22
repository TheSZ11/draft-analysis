import { scoringRules, fplDataTeamMapping } from './constants.js';

/**
 * Calculate historical fantasy points for a player based on scoring rules
 * @param {Object} player - Player object with stats
 * @param {Object} rules - Scoring rules object (defaults to scoringRules)
 * @returns {number} Total historical points
 */
export const calculateHistoricalPoints = (player, rules = scoringRules) => {
  let totalPoints = 0;
  
  // Handle both position-specific rules (like tests) and flat rules (like current implementation)
  const addPoints = (statName, statValue) => {
    if (statValue == null || isNaN(statValue)) return;
    
    let ruleValue = 0;
    if (rules[statName]) {
      // Check if it's position-specific rules (object with position keys)
      if (typeof rules[statName] === 'object' && player.position && rules[statName][player.position] != null) {
        ruleValue = rules[statName][player.position];
      } 
      // Check if it's flat rules (direct number)
      else if (typeof rules[statName] === 'number') {
        ruleValue = rules[statName];
      }
    }
    
    if (!isNaN(ruleValue)) {
      totalPoints += ruleValue * statValue;
    }
  };

  // Attacking stats
  addPoints('goals', player.goals);
  addPoints('assists', player.assists);
  addPoints('assistsSecond', player.assistsSecond);
  addPoints('shots', player.shots);
  addPoints('shotsOnTarget', player.shotsOnTarget);
  addPoints('keyPasses', player.keyPasses);

  // Defensive stats
  addPoints('tacklesWon', player.tacklesWon);
  addPoints('interceptions', player.interceptions);
  addPoints('dribbles', player.dribbles);
  addPoints('accCrosses', player.accCrosses);
  addPoints('blockedShots', player.blockedShots);
  addPoints('clearances', player.clearances);
  addPoints('recoveries', player.recoveries);
  addPoints('aerialsWon', player.aerialsWon);

  // Goalkeeper stats
  addPoints('cleanSheets', player.cleanSheets);
  addPoints('saves', player.saves);
  addPoints('pkSaves', player.pkSaves);
  addPoints('highClaims', player.highClaims);
  addPoints('goalsConceded', player.goalsConceded);

  // Positive actions
  addPoints('pkDrawn', player.pkDrawn);
  addPoints('foulsSuffered', player.foulsSuffered);

  // Negative actions
  addPoints('foulsCommitted', player.foulsCommitted);
  addPoints('yellowCards', player.yellowCards);
  addPoints('redCards', player.redCards);
  addPoints('pkMissed', player.pkMissed);
  addPoints('ownGoals', player.ownGoals);
  addPoints('dispossessed', player.dispossessed);
  addPoints('handBalls', player.handBalls);
  addPoints('offsides', player.offsides);
  addPoints('penalties', player.penalties);

  return totalPoints;
};

/**
 * Calculate replacement level thresholds by position
 * @param {Array} players - Array of players
 * @returns {Object} Replacement levels by position
 */
export const calculateReplacementLevels = (players) => {
  const positions = ['F', 'M', 'D', 'G'];
  const levels = {};
  
  positions.forEach(pos => {
    const positionPlayers = players
      .filter(p => p.position === pos)
      .sort((a, b) => b.historicalPoints - a.historicalPoints);
    
    // If only one player or no players, replacement level is 0
    if (positionPlayers.length <= 1) {
      levels[pos] = 0;
      return;
    }
    
    // Define replacement level as a player you could reasonably expect to be available
    // Use 15% depth for larger pool, minimum 12th player for smaller pools  
    const replacementIndex = Math.min(
      Math.max(12, Math.floor(positionPlayers.length * 0.15)), 
      positionPlayers.length - 1
    );
    levels[pos] = positionPlayers[replacementIndex]?.historicalPoints || 0;
  });
  
  return levels;
};

/**
 * Calculate Value Over Replacement Player (VORP)
 * @param {Object} player - Player object
 * @param {Object} levels - Replacement levels by position
 * @returns {number} VORP value
 */
export const calculateVORP = (player, levels) => {
  // Return 0 for invalid positions
  if (!levels[player.position]) {
    return 0;
  }
  
  const replacementLevel = levels[player.position] || 0;
  return (player.historicalPoints || 0) - replacementLevel;
};

/**
 * Create player tiers based on VORP drop-offs, organized by position
 * @param {Array} players - Array of players
 * @param {Object} levels - Replacement levels
 * @returns {Object} Object with position keys containing tier arrays
 */
export const createPlayerTiers = (players, levels) => {
  const positions = ['F', 'M', 'D', 'G'];
  const tiersByPosition = {};
  
  // Initialize empty arrays for each position
  positions.forEach(pos => {
    tiersByPosition[pos] = [];
  });
  
  // Group players by position first
  positions.forEach(position => {
    const positionPlayers = players
      .filter(p => p.position === position)
      .map(p => ({
        ...p,
        vorp: calculateVORP(p, levels),
        tier: null // Will be set below
      }))
      .sort((a, b) => b.vorp - a.vorp);
    
    // Create tiers for this position
    const tiers = ['ELITE', 'HIGH', 'MEDIUM', 'LOW'];
    const playersPerTier = Math.max(1, Math.floor(positionPlayers.length / tiers.length));
    
    positionPlayers.forEach((player, index) => {
      const tierIndex = Math.min(Math.floor(index / playersPerTier), tiers.length - 1);
      player.tier = tiers[tierIndex];
    });
    
    tiersByPosition[position] = positionPlayers;
  });
  
  return tiersByPosition;
};

/**
 * Calculate fixture difficulty for a team
 * @param {string} team - Team code
 * @param {string} opponent - Opponent team code  
 * @param {boolean} isHome - Whether playing at home
 * @returns {number} Difficulty score (1-5)
 */
export const calculateFixtureDifficulty = (team, opponent, isHome) => {
  // Basic difficulty calculation - can be enhanced with more sophisticated logic
  const teamStrengths = {
    'MCI': 5, 'LIV': 5, 'ARS': 4.5, 'CHE': 4, 'MUN': 4, 'TOT': 4,
    'NEW': 3.5, 'AVL': 3.5, 'BHA': 3, 'WHU': 3, 'FUL': 3, 'WOL': 3,
    'CRY': 2.5, 'EVE': 2.5, 'BOU': 2.5, 'BRE': 2.5, 'NFO': 2.5,
    'LEI': 2, 'SOU': 2, 'IPS': 1.5
  };
  
  const opponentStrength = teamStrengths[opponent] || 3;
  const homeAdvantage = isHome ? 0.5 : 0;
  
  // Convert to 1-5 scale (5 = hardest)
  return Math.min(5, Math.max(1, Math.round(opponentStrength - homeAdvantage)));
};

/**
 * Process raw player data into formatted player objects
 * @param {Array} rawData - Raw player data from API
 * @returns {Array} Processed player objects
 */
export const processPlayerData = (rawData) => {
  return rawData.map(player => {
    // Calculate points based on our rules
    const historicalPoints = calculateHistoricalPoints(player, scoringRules);
    
    // Calculate Fantasy Points per 90 (FP/90)
    const fp90 = (player.minutes > 0) ? (historicalPoints / player.minutes) * 90 : 0;
    
    // Convert team names to FPL codes for fixture matching
    const teamCode = fplDataTeamMapping[player.team] || player.team;
    
    return {
      id: player.id,
      name: player.name,
      team: teamCode,
      position: player.position,
      age: player.age,
      // New & improved metrics
      historicalPoints: Math.round(historicalPoints * 10) / 10,
      fp90: Math.round(fp90 * 100) / 100,
      // Raw stats for tooltips/display
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
  }).sort((a, b) => b.historicalPoints - a.historicalPoints); // Sort by historical points
};

/**
 * Get player tier by name from tier object
 * @param {string} playerName - Name of player
 * @param {Object} playerTiers - Object with position keys containing player arrays
 * @returns {string|null} Tier name or null if not found
 */
export const getPlayerTierByName = (playerName, playerTiers) => {
  const positions = ['F', 'M', 'D', 'G'];
  
  for (const position of positions) {
    if (playerTiers[position]) {
      const player = playerTiers[position].find(p => p.name === playerName);
      if (player) {
        return player.tier;
      }
    }
  }
  return null;
};

/**
 * Get tier color class for display
 * @param {string} tier - Tier name
 * @returns {string} CSS class string
 */
export const getTierColor = (tier) => {
  const colors = {
    'ELITE': 'bg-purple-500',
    'HIGH': 'bg-blue-500', 
    'MEDIUM': 'bg-green-500',
    'LOW': 'bg-yellow-500',
    'REPLACEMENT': 'bg-gray-500'
  };
  return colors[tier] || 'bg-gray-300';
}; 