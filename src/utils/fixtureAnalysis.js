/**
 * Enhanced Fixture Analysis Module
 * Provides sophisticated fixture difficulty calculations for player recommendations
 */

// Enhanced team strength ratings based on 2024-25 season performance and squad strength
// Scale: 1-5 with sub-ratings for offensive and defensive strength
export const TEAM_STRENGTH_RATINGS = {
  // Tier 1: Elite Teams (4.5-5.0)
  'MCI': { 
    overall: 5.0, 
    offensive: 5.0, 
    defensive: 4.8, 
    home: 5.0, 
    away: 4.9,
    form: 0.0, // Will be updated based on recent results
    squad_depth: 5.0
  },
  'ARS': { 
    overall: 4.9, 
    offensive: 4.8, 
    defensive: 4.9, 
    home: 5.0, 
    away: 4.7,
    form: 0.0,
    squad_depth: 4.8
  },
  'LIV': { 
    overall: 4.8, 
    offensive: 4.9, 
    defensive: 4.6, 
    home: 4.9, 
    away: 4.7,
    form: 0.0,
    squad_depth: 4.7
  },
  
  // Tier 2: Strong Teams (4.0-4.4)
  'CHE': { 
    overall: 4.3, 
    offensive: 4.4, 
    defensive: 4.2, 
    home: 4.4, 
    away: 4.1,
    form: 0.0,
    squad_depth: 4.5
  },
  'MUN': { 
    overall: 4.1, 
    offensive: 4.0, 
    defensive: 4.2, 
    home: 4.3, 
    away: 3.8,
    form: 0.0,
    squad_depth: 4.3
  },
  'TOT': { 
    overall: 4.0, 
    offensive: 4.3, 
    defensive: 3.6, 
    home: 4.2, 
    away: 3.8,
    form: 0.0,
    squad_depth: 4.0
  },
  
  // Tier 3: Mid-Upper Teams (3.5-3.9)
  'NEW': { 
    overall: 3.8, 
    offensive: 3.6, 
    defensive: 4.0, 
    home: 4.0, 
    away: 3.5,
    form: 0.0,
    squad_depth: 3.5
  },
  'AVL': { 
    overall: 3.7, 
    offensive: 3.8, 
    defensive: 3.6, 
    home: 3.9, 
    away: 3.4,
    form: 0.0,
    squad_depth: 3.6
  },
  'WHU': { 
    overall: 3.6, 
    offensive: 3.5, 
    defensive: 3.7, 
    home: 3.8, 
    away: 3.3,
    form: 0.0,
    squad_depth: 3.4
  },
  'BHA': { 
    overall: 3.6, 
    offensive: 3.4, 
    defensive: 3.8, 
    home: 3.7, 
    away: 3.4,
    form: 0.0,
    squad_depth: 3.5
  },
  
  // Tier 4: Mid Teams (3.0-3.4)
  'FUL': { 
    overall: 3.4, 
    offensive: 3.5, 
    defensive: 3.3, 
    home: 3.6, 
    away: 3.1,
    form: 0.0,
    squad_depth: 3.2
  },
  'WOL': { 
    overall: 3.2, 
    offensive: 3.0, 
    defensive: 3.4, 
    home: 3.4, 
    away: 2.9,
    form: 0.0,
    squad_depth: 3.0
  },
  'EVE': { 
    overall: 3.1, 
    offensive: 2.9, 
    defensive: 3.3, 
    home: 3.3, 
    away: 2.8,
    form: 0.0,
    squad_depth: 3.0
  },
  'CRY': { 
    overall: 3.1, 
    offensive: 3.0, 
    defensive: 3.2, 
    home: 3.3, 
    away: 2.8,
    form: 0.0,
    squad_depth: 2.9
  },
  'BOU': { 
    overall: 3.0, 
    offensive: 3.2, 
    defensive: 2.8, 
    home: 3.2, 
    away: 2.7,
    form: 0.0,
    squad_depth: 2.8
  },
  
  // Tier 5: Lower Mid Teams (2.5-2.9)
  'BRE': { 
    overall: 2.9, 
    offensive: 3.1, 
    defensive: 2.7, 
    home: 3.1, 
    away: 2.6,
    form: 0.0,
    squad_depth: 2.7
  },
  'NFO': { 
    overall: 2.8, 
    offensive: 2.7, 
    defensive: 2.9, 
    home: 3.0, 
    away: 2.5,
    form: 0.0,
    squad_depth: 2.6
  },
  
  // Tier 6: Struggling/Promoted Teams (2.0-2.4)
  'SOU': { 
    overall: 2.4, 
    offensive: 2.3, 
    defensive: 2.5, 
    home: 2.6, 
    away: 2.1,
    form: 0.0,
    squad_depth: 2.3
  },
  'LEI': { 
    overall: 2.3, 
    offensive: 2.5, 
    defensive: 2.1, 
    home: 2.5, 
    away: 2.0,
    form: 0.0,
    squad_depth: 2.4
  },
  'IPS': { 
    overall: 2.2, 
    offensive: 2.1, 
    defensive: 2.3, 
    home: 2.4, 
    away: 1.9,
    form: 0.0,
    squad_depth: 2.0
  },
  
  // Additional teams (if they appear in fixture data)
  'SUN': { 
    overall: 2.1, 
    offensive: 2.0, 
    defensive: 2.2, 
    home: 2.3, 
    away: 1.8,
    form: 0.0,
    squad_depth: 1.9
  },
  'LEE': { 
    overall: 2.2, 
    offensive: 2.3, 
    defensive: 2.1, 
    home: 2.4, 
    away: 1.9,
    form: 0.0,
    squad_depth: 2.1
  },
  'BUR': { 
    overall: 2.0, 
    offensive: 1.9, 
    defensive: 2.1, 
    home: 2.2, 
    away: 1.7,
    form: 0.0,
    squad_depth: 1.8
  }
};

// Position-specific fixture impact weights
export const POSITION_FIXTURE_WEIGHTS = {
  F: {
    offensive_weight: 0.7,
    defensive_weight: 0.3,
    clean_sheet_impact: 0.0, // Forwards don't get clean sheet points
    goal_scoring_multiplier: 1.2
  },
  M: {
    offensive_weight: 0.5,
    defensive_weight: 0.5,
    clean_sheet_impact: 0.2, // Small clean sheet bonus
    goal_scoring_multiplier: 1.0
  },
  D: {
    offensive_weight: 0.2,
    defensive_weight: 0.8,
    clean_sheet_impact: 0.8, // Major clean sheet impact
    goal_scoring_multiplier: 0.8
  },
  G: {
    offensive_weight: 0.0,
    defensive_weight: 1.0,
    clean_sheet_impact: 1.0, // Maximum clean sheet impact
    goal_scoring_multiplier: 0.0
  }
};

/**
 * Calculate enhanced fixture difficulty for a team's upcoming fixtures
 * @param {string} teamCode - Team code (e.g., 'LIV')
 * @param {string} opponentCode - Opponent team code
 * @param {boolean} isHome - Whether playing at home
 * @param {string} playerPosition - Player position (F, M, D, G)
 * @param {Object} options - Additional options
 * @returns {Object} Enhanced difficulty analysis
 */
export const calculateEnhancedFixtureDifficulty = (teamCode, opponentCode, isHome = true, playerPosition = 'M', _options = {}) => {
  const teamStrength = TEAM_STRENGTH_RATINGS[teamCode];
  const opponentStrength = TEAM_STRENGTH_RATINGS[opponentCode];
  const positionWeights = POSITION_FIXTURE_WEIGHTS[playerPosition];
  
  if (!teamStrength || !opponentStrength || !positionWeights) {
    console.warn(`Missing strength data for teams: ${teamCode} vs ${opponentCode}`);
    return {
      difficulty: 3,
      cleanSheetProbability: 0.3,
      goalScoringProbability: 0.4,
      attackingReturn: 0.5,
      defensiveReturn: 0.5,
      confidence: 0.5
    };
  }
  
  // Base opponent strength (for difficulty calculation)
  const baseOpponentStrength = isHome ? opponentStrength.away : opponentStrength.home;
  
  // Calculate position-specific factors
  const relevantOpponentOffensive = opponentStrength.offensive * positionWeights.defensive_weight;
  const relevantOpponentDefensive = opponentStrength.defensive * positionWeights.offensive_weight;
  const relevantTeamOffensive = (isHome ? teamStrength.home : teamStrength.away) * positionWeights.offensive_weight;
  const relevantTeamDefensive = (isHome ? teamStrength.home : teamStrength.away) * positionWeights.defensive_weight;
  
  // Difficulty score (1-5, where 5 is hardest)
  // Higher opponent strength = higher difficulty
  const rawDifficulty = baseOpponentStrength;
  const difficulty = Math.max(1, Math.min(5, Math.round(rawDifficulty * 10) / 10));
  
  // Clean sheet probability (important for defenders and goalkeepers)
  // Based on team's defensive strength vs opponent's offensive strength
  const defensiveAdvantage = relevantTeamDefensive - relevantOpponentOffensive;
  const cleanSheetBase = 0.25 + (defensiveAdvantage * 0.15); // Base 25% chance
  const cleanSheetProbability = Math.max(0.05, Math.min(0.8, cleanSheetBase));
  
  // Goal scoring probability (important for forwards and attacking midfielders)
  // Based on team's offensive strength vs opponent's defensive strength
  const offensiveAdvantage = relevantTeamOffensive - relevantOpponentDefensive;
  const goalScoringBase = 0.35 + (offensiveAdvantage * 0.2); // Base 35% chance
  const goalScoringProbability = Math.max(0.1, Math.min(0.9, goalScoringBase));
  
  // Expected attacking returns (goals, assists, key passes)
  // Lower for difficult fixtures, higher for easier ones
  const attackingReturn = Math.max(0.2, Math.min(1.5, 1.0 - (difficulty - 3) * 0.2));
  
  // Expected defensive returns (tackles, interceptions, clearances)
  // Higher when opponent is stronger (more defending required)
  const defensiveReturn = Math.max(0.5, Math.min(1.8, 0.8 + (difficulty - 3) * 0.25));
  
  // Confidence in prediction (higher for more extreme matchups)
  const strengthDifference = Math.abs(teamStrength.overall - opponentStrength.overall);
  const confidence = Math.min(1.0, 0.6 + strengthDifference * 0.15);
  
  return {
    difficulty,
    cleanSheetProbability: Math.round(cleanSheetProbability * 1000) / 1000,
    goalScoringProbability: Math.round(goalScoringProbability * 1000) / 1000,
    attackingReturn: Math.round(attackingReturn * 100) / 100,
    defensiveReturn: Math.round(defensiveReturn * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    factors: {
      teamStrength: isHome ? teamStrength.home : teamStrength.away,
      opponentStrength: baseOpponentStrength,
      homeAdvantage: isHome,
      positionRelevance: positionWeights
    }
  };
};

/**
 * Calculate fixture difficulty score for multiple upcoming fixtures
 * @param {Array} fixtures - Array of fixture objects
 * @param {string} playerPosition - Player position
 * @param {number} gameweeks - Number of gameweeks to analyze
 * @returns {Object} Comprehensive fixture analysis
 */
export const analyzeUpcomingFixtures = (fixtures, playerPosition = 'M', gameweeks = 6) => {
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    return {
      averageDifficulty: 3,
      fixtureScore: 0,
      cleanSheetExpected: 0,
      attackingExpected: 0,
      defensiveExpected: 0,
      confidence: 0.5,
      breakdown: []
    };
  }
  
  const relevantFixtures = fixtures.slice(0, gameweeks);
  const analyses = relevantFixtures.map(fixture => {
    if (!fixture || !fixture.opponent) {
      return null;
    }
    
    // Handle the case where team code might not be available in fixture
    const teamCode = fixture.team || 'MCI'; // Fallback to avoid errors
    
    return calculateEnhancedFixtureDifficulty(
      teamCode,
      fixture.opponent,
      fixture.home || false,
      playerPosition
    );
  }).filter(Boolean);
  
  if (analyses.length === 0) {
    return {
      averageDifficulty: 3,
      fixtureScore: 0,
      cleanSheetExpected: 0,
      attackingExpected: 0,
      defensiveExpected: 0,
      confidence: 0.5,
      breakdown: []
    };
  }
  
  // Calculate averages
  const averageDifficulty = analyses.reduce((sum, a) => sum + a.difficulty, 0) / analyses.length;
  const cleanSheetExpected = analyses.reduce((sum, a) => sum + a.cleanSheetProbability, 0);
  const attackingExpected = analyses.reduce((sum, a) => sum + a.attackingReturn, 0);
  const defensiveExpected = analyses.reduce((sum, a) => sum + a.defensiveReturn, 0);
  const averageConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
  
  // Fixture score: positive for easy fixtures, negative for difficult ones
  // Scale: -10 (very difficult) to +10 (very easy)
  const fixtureScore = (3 - averageDifficulty) * 4; // Convert 1-5 scale to -8 to +8 scale
  
  return {
    averageDifficulty: Math.round(averageDifficulty * 10) / 10,
    fixtureScore: Math.round(fixtureScore * 10) / 10,
    cleanSheetExpected: Math.round(cleanSheetExpected * 100) / 100,
    attackingExpected: Math.round(attackingExpected * 100) / 100,
    defensiveExpected: Math.round(defensiveExpected * 100) / 100,
    confidence: Math.round(averageConfidence * 100) / 100,
    breakdown: analyses
  };
};

/**
 * Get team strength rating for a specific team
 * @param {string} teamCode - Team code
 * @returns {Object|null} Team strength object or null if not found
 */
export const getTeamStrength = (teamCode) => {
  return TEAM_STRENGTH_RATINGS[teamCode] || null;
};

/**
 * Compare two teams' relative strengths
 * @param {string} teamA - First team code
 * @param {string} teamB - Second team code
 * @param {boolean} teamAHome - Whether team A is playing at home
 * @returns {Object} Comparison analysis
 */
export const compareTeamStrengths = (teamA, teamB, teamAHome = true) => {
  const strengthA = getTeamStrength(teamA);
  const strengthB = getTeamStrength(teamB);
  
  if (!strengthA || !strengthB) {
    return null;
  }
  
  const teamAStrength = teamAHome ? strengthA.home : strengthA.away;
  const teamBStrength = teamAHome ? strengthB.away : strengthB.home;
  
  const difference = teamAStrength - teamBStrength;
  const favoredTeam = difference > 0.1 ? teamA : difference < -0.1 ? teamB : 'EVEN';
  
  return {
    teamAStrength,
    teamBStrength,
    difference: Math.round(difference * 100) / 100,
    favoredTeam,
    confidence: Math.min(1.0, Math.abs(difference) * 0.5)
  };
}; 