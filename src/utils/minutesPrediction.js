/**
 * Minutes Prediction Model
 * Predicts playing time based on age, team context, competition, and historical patterns
 */

import { getTeamStrength } from './fixtureAnalysis.js';

// Age curves for different positions (peak minutes expectation by age)
// Based on historical data - when players typically peak and decline
export const POSITION_AGE_CURVES = {
  F: {
    // Forwards: Peak 24-28, gradual decline after 30
    peakAge: 26,
    peakMinutes: 0.95, // 95% of possible minutes at peak
    ageFactors: {
      18: 0.30, 19: 0.45, 20: 0.60, 21: 0.75, 22: 0.85, 23: 0.90, 24: 0.93,
      25: 0.95, 26: 0.96, 27: 0.95, 28: 0.93, 29: 0.90, 30: 0.86, 31: 0.80,
      32: 0.72, 33: 0.65, 34: 0.55, 35: 0.45, 36: 0.35, 37: 0.25, 38: 0.15
    }
  },
  M: {
    // Midfielders: Longer peak 25-30, slower decline (stamina/experience)
    peakAge: 27,
    peakMinutes: 0.96,
    ageFactors: {
      18: 0.25, 19: 0.40, 20: 0.55, 21: 0.70, 22: 0.80, 23: 0.87, 24: 0.92,
      25: 0.95, 26: 0.96, 27: 0.97, 28: 0.96, 29: 0.94, 30: 0.91, 31: 0.87,
      32: 0.82, 33: 0.75, 34: 0.67, 35: 0.58, 36: 0.45, 37: 0.32, 38: 0.20
    }
  },
  D: {
    // Defenders: Latest peak 26-31, experience matters most
    peakAge: 28,
    peakMinutes: 0.97,
    ageFactors: {
      18: 0.20, 19: 0.35, 20: 0.50, 21: 0.65, 22: 0.75, 23: 0.83, 24: 0.89,
      25: 0.93, 26: 0.96, 27: 0.97, 28: 0.98, 29: 0.97, 30: 0.96, 31: 0.94,
      32: 0.90, 33: 0.85, 34: 0.78, 35: 0.70, 36: 0.60, 37: 0.45, 38: 0.30
    }
  },
  G: {
    // Goalkeepers: Very late peak, experience crucial, longer careers
    peakAge: 29,
    peakMinutes: 0.98,
    ageFactors: {
      18: 0.10, 19: 0.15, 20: 0.25, 21: 0.35, 22: 0.45, 23: 0.60, 24: 0.75,
      25: 0.85, 26: 0.92, 27: 0.96, 28: 0.98, 29: 0.99, 30: 0.98, 31: 0.97,
      32: 0.95, 33: 0.92, 34: 0.88, 35: 0.82, 36: 0.75, 37: 0.65, 38: 0.50
    }
  }
};

// Team depth impact - stronger teams have more competition for places
export const TEAM_DEPTH_FACTORS = {
  // Elite teams: High competition, harder to get minutes
  elite: {
    teamCodes: ['MCI', 'ARS', 'LIV'],
    depthMultiplier: 0.85, // 15% penalty for squad depth
    competitionFactor: 1.3 // More competition for starting spots
  },
  // Strong teams: Moderate competition
  strong: {
    teamCodes: ['CHE', 'MUN', 'TOT'],
    depthMultiplier: 0.90,
    competitionFactor: 1.15
  },
  // Mid-upper teams: Some depth but opportunities available
  midUpper: {
    teamCodes: ['NEW', 'AVL', 'WHU', 'BHA'],
    depthMultiplier: 0.95,
    competitionFactor: 1.05
  },
  // Mid teams: Limited depth, easier to get minutes
  mid: {
    teamCodes: ['FUL', 'WOL', 'EVE', 'CRY', 'BOU'],
    depthMultiplier: 1.00,
    competitionFactor: 1.0
  },
  // Weaker teams: High minutes if you're decent
  weak: {
    teamCodes: ['BRE', 'NFO', 'SOU', 'LEI', 'IPS', 'SUN', 'LEE', 'BUR'],
    depthMultiplier: 1.05,
    competitionFactor: 0.90
  }
};

// Playing style impact on minutes distribution
export const PLAYING_STYLE_FACTORS = {
  // Teams that rotate heavily (European competitions, many games)
  highRotation: {
    teams: ['MCI', 'ARS', 'LIV', 'CHE'],
    rotationFactor: 0.88 // More rotation = fewer minutes for any individual
  },
  // Teams with clear first XI
  lowRotation: {
    teams: ['BOU', 'CRY', 'EVE', 'FUL', 'IPS', 'LEI', 'SOU'],
    rotationFactor: 1.05 // Less rotation = more minutes for starters
  }
};

// Injury risk factors that affect minutes prediction
export const INJURY_RISK_FACTORS = {
  // High-risk positions/playing styles
  high: {
    positions: ['F'], // Forwards get fouled more
    riskMultiplier: 0.93
  },
  medium: {
    positions: ['M', 'D'],
    riskMultiplier: 0.96
  },
  low: {
    positions: ['G'],
    riskMultiplier: 0.99
  }
};

/**
 * Get team depth category for a team
 * @param {string} teamCode - Team code
 * @returns {Object} Team depth information
 */
export const getTeamDepthCategory = (teamCode) => {
  for (const [category, info] of Object.entries(TEAM_DEPTH_FACTORS)) {
    if (info.teamCodes.includes(teamCode)) {
      return { category, ...info };
    }
  }
  // Default to mid category if team not found
  return { category: 'mid', ...TEAM_DEPTH_FACTORS.mid };
};

/**
 * Get age factor for minutes prediction
 * @param {number} age - Player age
 * @param {string} position - Player position
 * @returns {number} Age factor (0-1)
 */
export const getAgeFactor = (age, position) => {
  const curve = POSITION_AGE_CURVES[position];
  if (!curve) {
    console.warn(`No age curve found for position: ${position}`);
    return 0.80; // Conservative default
  }
  
  // Clamp age to reasonable bounds
  const clampedAge = Math.max(18, Math.min(38, age));
  
  return curve.ageFactors[clampedAge] || curve.ageFactors[38]; // Use minimum if age not found
};

/**
 * Calculate competition penalty based on historical performance relative to team level
 * @param {Object} player - Player object with stats
 * @param {string} teamCode - Team code
 * @returns {number} Competition factor (0.5-1.2)
 */
export const calculateCompetitionFactor = (player, teamCode) => {
  const teamStrength = getTeamStrength(teamCode);
  const playerQuality = (player.historicalPoints || 0);
  
  if (!teamStrength) {
    return 1.0; // Default if no team data
  }
  
  // Estimate if player is above/below team level
  // Elite players should have 400+ points, good players 250+, etc.
  const teamExpectedPoints = teamStrength.overall * 100; // Rough scaling
  
  let qualityRatio = playerQuality / teamExpectedPoints;
  
  // Clamp to reasonable bounds
  qualityRatio = Math.max(0.3, Math.min(2.0, qualityRatio));
  
  // Convert to competition factor
  // Better players get more minutes even on strong teams
  // Weaker players get fewer minutes on strong teams
  if (qualityRatio >= 1.5) {
    return 1.15; // Star player - plays regardless
  } else if (qualityRatio >= 1.0) {
    return 1.05; // Good fit for team level
  } else if (qualityRatio >= 0.7) {
    return 0.95; // Slightly below team level
  } else if (qualityRatio >= 0.5) {
    return 0.85; // Squad player
  } else {
    return 0.70; // Fringe player
  }
};

/**
 * Predict minutes for a player based on multiple factors
 * @param {Object} player - Player object
 * @param {Object} options - Prediction options
 * @returns {Object} Minutes prediction analysis
 */
export const predictPlayerMinutes = (player, options = {}) => {
  const {
    seasonLength = 38, // Premier League games
    maxMinutesPerGame = 90,
    includeEuropeanCompetition = false
  } = options;
  
  // Basic validation
  if (!player || !player.position || !player.team || !player.age) {
    return {
      predictedMinutes: player.minutes || 1500, // Conservative fallback
      minutesPerGame: 60,
      confidence: 0.3,
      factors: { error: 'Missing player data' }
    };
  }
  
  // Base expected minutes (if player was guaranteed starter)
  const totalPossibleMinutes = seasonLength * maxMinutesPerGame;
  const europeanBonus = includeEuropeanCompetition ? 0.15 : 0;
  const baseMinutes = totalPossibleMinutes * (1 + europeanBonus);
  
  // Age factor
  const ageFactor = getAgeFactor(player.age, player.position);
  
  // Team depth factor
  const teamDepth = getTeamDepthCategory(player.team);
  const depthFactor = teamDepth.depthMultiplier;
  
  // Competition factor (player quality relative to team)
  const competitionFactor = calculateCompetitionFactor(player, player.team);
  
  // Playing style factor
  let styleFactor = 1.0;
  if (PLAYING_STYLE_FACTORS.highRotation.teams.includes(player.team)) {
    styleFactor = PLAYING_STYLE_FACTORS.highRotation.rotationFactor;
  } else if (PLAYING_STYLE_FACTORS.lowRotation.teams.includes(player.team)) {
    styleFactor = PLAYING_STYLE_FACTORS.lowRotation.rotationFactor;
  }
  
  // Injury risk factor
  const injuryRisk = INJURY_RISK_FACTORS.high.positions.includes(player.position) ? INJURY_RISK_FACTORS.high.riskMultiplier :
                    INJURY_RISK_FACTORS.medium.positions.includes(player.position) ? INJURY_RISK_FACTORS.medium.riskMultiplier :
                    INJURY_RISK_FACTORS.low.riskMultiplier;
  
  // Historical minutes factor (players who played more historically likely to continue)
  const historicalMinutes = player.minutes || 0;
  const lastSeasonFactor = Math.min(1.2, Math.max(0.6, historicalMinutes / 2500)); // Scale based on last season
  
  // Combine all factors
  const combinedFactor = ageFactor * depthFactor * competitionFactor * styleFactor * injuryRisk * lastSeasonFactor;
  
  // Calculate predicted minutes
  const predictedMinutes = Math.round(baseMinutes * combinedFactor);
  const minutesPerGame = Math.round((predictedMinutes / seasonLength) * 10) / 10;
  
  // Calculate confidence based on factor consistency
  const factorVariance = Math.abs(ageFactor - 0.85) + Math.abs(competitionFactor - 1.0) + Math.abs(lastSeasonFactor - 1.0);
  const confidence = Math.max(0.4, Math.min(0.95, 0.85 - factorVariance * 0.3));
  
  // Determine playing status
  let playingStatus = 'starter';
  if (minutesPerGame < 30) {
    playingStatus = 'fringe';
  } else if (minutesPerGame < 50) {
    playingStatus = 'rotation';
  } else if (minutesPerGame < 70) {
    playingStatus = 'regular';
  }
  
  return {
    predictedMinutes: Math.max(0, predictedMinutes),
    minutesPerGame: Math.max(0, minutesPerGame),
    confidence: Math.round(confidence * 100) / 100,
    playingStatus,
    factors: {
      age: ageFactor,
      teamDepth: depthFactor,
      competition: competitionFactor,
      playingStyle: styleFactor,
      injuryRisk: injuryRisk,
      historical: lastSeasonFactor,
      combined: combinedFactor
    },
    analysis: {
      teamCategory: teamDepth.category,
      expectedRole: playingStatus,
      riskLevel: minutesPerGame < 45 ? 'high' : minutesPerGame < 65 ? 'medium' : 'low'
    }
  };
};

/**
 * Adjust player historical points based on predicted minutes
 * @param {Object} player - Player object
 * @param {Object} minutesPrediction - Minutes prediction from predictPlayerMinutes
 * @returns {Object} Adjusted player statistics
 */
export const adjustPlayerForPredictedMinutes = (player, minutesPrediction) => {
  if (!player.historicalPoints || !player.minutes || !minutesPrediction.predictedMinutes) {
    return {
      adjustedPoints: player.historicalPoints || 0,
      adjustedPP90: player.fp90 || 0,
      minutesMultiplier: 1.0,
      confidence: 0.5
    };
  }
  
  // Calculate minutes multiplier
  const minutesMultiplier = minutesPrediction.predictedMinutes / Math.max(1, player.minutes);
  
  // Adjusted points = current points per 90 * predicted minutes / 90
  const adjustedPP90 = player.fp90 || ((player.historicalPoints / Math.max(1, player.minutes)) * 90);
  const adjustedPoints = (adjustedPP90 * minutesPrediction.predictedMinutes) / 90;
  
  // For very low minutes predictions, apply additional penalty for uncertainty
  let uncertaintyPenalty = 1.0;
  if (minutesPrediction.minutesPerGame < 30) {
    uncertaintyPenalty = 0.85; // 15% penalty for very limited minutes
  } else if (minutesPrediction.minutesPerGame < 50) {
    uncertaintyPenalty = 0.93; // 7% penalty for rotation risk
  }
  
  return {
    adjustedPoints: Math.round(adjustedPoints * uncertaintyPenalty * 10) / 10,
    adjustedPP90: Math.round(adjustedPP90 * 100) / 100,
    minutesMultiplier: Math.round(minutesMultiplier * 100) / 100,
    confidence: minutesPrediction.confidence,
    playingStatus: minutesPrediction.playingStatus
  };
};

/**
 * Batch predict minutes for multiple players
 * @param {Array} players - Array of player objects
 * @param {Object} options - Prediction options
 * @returns {Array} Players with minutes predictions
 */
export const batchPredictMinutes = (players, options = {}) => {
  if (!Array.isArray(players)) {
    return [];
  }
  
  return players.map(player => {
    try {
      const minutesPrediction = predictPlayerMinutes(player, options);
      const adjustedStats = adjustPlayerForPredictedMinutes(player, minutesPrediction);
      
      return {
        ...player,
        minutesPrediction,
        adjustedStats,
        // Add convenience properties
        projectedMinutes: minutesPrediction.predictedMinutes,
        projectedPoints: adjustedStats.adjustedPoints,
        minutesConfidence: minutesPrediction.confidence
      };
    } catch (error) {
      console.warn(`Error predicting minutes for ${player.name}:`, error);
      return {
        ...player,
        minutesPrediction: { predictedMinutes: player.minutes || 1500, confidence: 0.3 },
        adjustedStats: { adjustedPoints: player.historicalPoints || 0, confidence: 0.3 }
      };
    }
  });
}; 