import { LEAGUE_CONFIG } from './leagueConfig.js';
import { analyzeUpcomingFixtures, calculateEnhancedFixtureDifficulty, getTeamStrength } from './utils/fixtureAnalysis.js';
import { predictPlayerMinutes, adjustPlayerForPredictedMinutes } from './utils/minutesPrediction.js';

// Draft Strategy Constants
export const DRAFT_POSITIONS = {
  EARLY: [1, 2, 3],
  MIDDLE: [4, 5, 6, 7],
  LATE: [8, 9, 10]
};

export const ROUND_PHASES = {
  EARLY: [1, 2, 3, 4],
  MID: [5, 6, 7, 8, 9, 10],
  LATE: [11, 12, 13, 14]
};

// Elite player thresholds based on actual data analysis
export const PLAYER_TIERS = {
  ELITE: { min: 500, max: 1000 },    // Lowered from 600 - top ~15 players
  HIGH: { min: 400, max: 499 },     // Players like Haaland (404 pts)
  MID: { min: 300, max: 399 },
  LOW: { min: 200, max: 299 },
  DEEP: { min: 0, max: 199 }
};

// Position scarcity weights (higher = more scarce)
export const POSITION_SCARCITY = {
  F: 1.3, // Forwards are most scarce at elite level
  G: 1.2, // Goalkeepers limited roster spots
  D: 0.9, // Defenders have good depth
  M: 0.8  // Midfielders have best depth
};

// Draft position strategies
export const getDraftPositionStrategy = (draftPosition, teams = 10) => {
  const positionType = DRAFT_POSITIONS.EARLY.includes(draftPosition) ? 'EARLY' :
                      DRAFT_POSITIONS.MIDDLE.includes(draftPosition) ? 'MIDDLE' : 'LATE';
  
  const strategies = {
    EARLY: {
      philosophy: "Secure elite talent early, don't worry about position balance",
      priorities: ['ELITE_TALENT', 'HIGH_CEILING', 'PROVEN_PERFORMERS'],
      rounds: {
        1: { focus: 'Best available elite player (Salah, Palmer, Bruno)', positions: ['F', 'M'] },
        2: { focus: 'Another elite talent, preferably different position', positions: ['F', 'M'] },
        3: { focus: 'High-tier player, start filling needs', positions: ['F', 'M', 'D'] },
        4: { focus: 'Address position gaps', positions: ['D', 'G', 'M'] }
      },
      advantages: ['First pick at elite players', 'Can afford to go BPA early'],
      disadvantages: ['Long waits between picks', 'Miss out on value in middle rounds']
    },
    
    MIDDLE: {
      philosophy: "Balance elite talent with value picks and position needs",
      priorities: ['VALUE_PICKS', 'POSITION_BALANCE', 'AVOID_RUNS'],
      rounds: {
        1: { focus: 'Best available elite talent', positions: ['F', 'M'] },
        2: { focus: 'Target falling elite players or top tier at scarce position', positions: ['F', 'M', 'D'] },
        3: { focus: 'Fill biggest need with quality', positions: ['D', 'M', 'F'] },
        4: { focus: 'Best value available', positions: ['ALL'] }
      },
      advantages: ['Balanced approach', 'Can capitalize on value', 'Moderate wait times'],
      disadvantages: ['Miss some elite talent', 'Must be more strategic']
    },
    
    LATE: {
      philosophy: "Target value and avoid position runs, focus on depth",
      priorities: ['AVOID_RUNS', 'VALUE_PICKS', 'DEPTH_STRATEGY'],
      rounds: {
        1: { focus: 'Best available talent, likely high-tier player', positions: ['M', 'F', 'D'] },
        2: { focus: 'Immediate turn - grab value or address scarcity', positions: ['F', 'G', 'D'] },
        3: { focus: 'Continue building core', positions: ['M', 'D'] },
        4: { focus: 'Address any glaring needs', positions: ['ALL'] }
      },
      advantages: ['Quick back-to-back picks', 'Can grab value/avoid runs', 'See others\' strategies'],
      disadvantages: ['Limited elite options', 'Must be very strategic about targets']
    }
  };
  
  return strategies[positionType];
};

// Round-specific strategy guidance
export const getRoundStrategy = (round, draftPosition, currentRoster) => {
  const phase = ROUND_PHASES.EARLY.includes(round) ? 'EARLY' :
               ROUND_PHASES.MID.includes(round) ? 'MID' : 'LATE';
  
  const rosterCounts = getRosterCounts(currentRoster);
  const positionStrategy = getDraftPositionStrategy(draftPosition);
  
  const strategies = {
    EARLY: {
      focus: 'Elite talent acquisition',
      approach: 'Go for ceiling, ignore late round needs',
      considerations: [
        'Target players with 500+ historical points',
        'Don\'t reach for position needs',
        'Focus on proven elite performers',
        'Consider upside for young elite players'
      ],
      positionWeights: { F: 1.2, M: 1.1, D: 0.9, G: 0.3 }
    },
    
    MID: {
      focus: 'Balance talent and roster construction',
      approach: 'Address position needs while maintaining quality',
      considerations: [
        'Ensure minimum position requirements can be met',
        'Target 300-500 point players',
        'Consider fixture difficulty',
        'Balance floor vs ceiling based on roster'
      ],
      positionWeights: { F: 1.1, M: 1.0, D: 1.0, G: 0.8 }
    },
    
    LATE: {
      focus: 'Depth and upside plays',
      approach: 'Fill out roster with value and potential',
      considerations: [
        'Target high-upside young players',
        'Ensure roster compliance',
        'Consider injury replacements',
        'Look for breakout candidates'
      ],
      positionWeights: { F: 1.0, M: 1.0, D: 1.0, G: 1.0 }
    }
  };
  
  return {
    ...strategies[phase],
    roundSpecific: positionStrategy.rounds[round] || { focus: 'Best value available', positions: ['ALL'] }
  };
};

// Enhanced roster analysis
export const analyzeRosterComposition = (roster, currentRound) => {
  const counts = getRosterCounts(roster);
  const totalPicks = roster.length;
  const remainingRounds = LEAGUE_CONFIG.rosterLimits.maxTotalPlayers - totalPicks;
  
  // Calculate position needs based on minimum requirements and total roster slots
  const positionNeeds = {};
  const urgentNeeds = [];
  const luxuryPositions = [];
  
  Object.entries(LEAGUE_CONFIG.positionLimits).forEach(([pos, limits]) => {
    const current = counts.active.byPosition[pos] + counts.reserve.byPosition[pos] + counts.injured_reserve.byPosition[pos];
    const minRequired = limits.minActive; // At minimum need this many for valid lineup
    const maxAllowed = limits.totalMax;
    const remainingSlots = maxAllowed - current;
    
    // Calculate urgency based on remaining rounds vs remaining needs
    const stillNeed = Math.max(0, minRequired - current);
    let urgency = stillNeed > 0 ? stillNeed / remainingRounds : 0;
    
    // CRITICAL: If we're in later rounds and still missing minimum requirements, make it URGENT
    // But different urgency thresholds for goalkeepers vs outfield players
    if (stillNeed > 0) {
      if (pos === 'G') {
        // Goalkeepers only become urgent very late in draft
        if (remainingRounds <= 2) {
          urgency = 1.0; // Maximum urgency only in final rounds
        } else if (remainingRounds <= 4) {
          urgency = Math.max(urgency, 0.6);
        }
      } else {
        // Outfield players become urgent earlier
        if (remainingRounds <= 6) {
          urgency = Math.max(urgency, 0.8);
        }
        if (remainingRounds <= 3) {
          urgency = 1.0;
        }
      }
    }
    
    positionNeeds[pos] = {
      current,
      minRequired,
      maxAllowed,
      remainingSlots,
      stillNeed,
      urgency,
      isFull: current >= maxAllowed,
      isUrgent: urgency > 0.3, // Need to address soon (more aggressive threshold)
      isLuxury: current >= minRequired && remainingSlots > remainingRounds / 2
    };
    
    if (positionNeeds[pos].isUrgent) {
      urgentNeeds.push(pos);
    }
    if (positionNeeds[pos].isLuxury) {
      luxuryPositions.push(pos);
    }
  });
  
  // Roster strength analysis
  const averagePoints = totalPicks > 0 ? 
    roster.reduce((sum, player) => sum + (player.historicalPoints || 0), 0) / totalPicks : 0;
  
  const eliteCount = roster.filter(p => (p.historicalPoints || 0) >= PLAYER_TIERS.ELITE.min).length;
  const highCount = roster.filter(p => (p.historicalPoints || 0) >= PLAYER_TIERS.HIGH.min).length;
  
  return {
    counts,
    positionNeeds,
    urgentNeeds,
    luxuryPositions,
    remainingRounds,
    averagePoints,
    eliteCount,
    highCount,
    needsGoalkeeper: positionNeeds.G?.stillNeed > 0,
    rosterStrength: eliteCount >= 2 ? 'STRONG' : eliteCount >= 1 ? 'MODERATE' : 'WEAK',
    phase: currentRound <= 4 ? 'BUILDING' : currentRound <= 10 ? 'FILLING' : 'COMPLETING'
  };
};

// Calculate position need score
export const calculatePositionNeedScore = (position, rosterAnalysis, round, draftPosition) => {
  const positionNeed = rosterAnalysis.positionNeeds[position];
  if (!positionNeed) return 0;
  
  // For very early picks, still consider position needs but with reduced weight
  if (round <= 2) {
    // Strong penalty if position is completely full
    if (positionNeed.isFull) {
      return -50; // Strong penalty for drafting to full position
    }
    // Small bonus for urgent needs even early (like if no goalkeeper at all)
    if (positionNeed.isUrgent && positionNeed.stillNeed > 0) {
      return 10; // Small bonus for urgent position needs
    }
    return 0; // Otherwise ignore position needs
  }
  
  // Base need score
  let needScore = 0;
  
  // Urgent needs get high priority
  if (positionNeed.isUrgent) {
    needScore += 50;
  }
  
  // CRITICAL: Missing minimum requirements get reasonable bonus (not massive for goalkeepers)
  if (positionNeed.stillNeed > 0 && positionNeed.current === 0) {
    // Different bonuses by position - goalkeepers get much less since they should be drafted late
    if (position === 'G') {
      needScore += 30; // Small bonus for missing goalkeeper
    } else {
      needScore += 100; // Larger bonus for missing outfield players
    }
  }
  
  // Scale by how many rounds left vs slots remaining
  if (positionNeed.stillNeed > 0) {
    const urgencyMultiplier = Math.min(3, positionNeed.stillNeed / rosterAnalysis.remainingRounds);
    needScore += 20 * urgencyMultiplier;
  }
  
  // Reduce score if position is full or luxury
  if (positionNeed.isFull) {
    needScore = -30; // Penalty for drafting to full position
  } else if (positionNeed.isLuxury) {
    needScore -= 10; // Small penalty for luxury picks
  }
  
  // Progressive weighting: very low early, higher later
  const needWeight = round <= 3 ? 0.1 : round <= 6 ? 0.4 : round <= 10 ? 0.7 : 1.0;
  
  return needScore * needWeight;
};

// Enhanced recommendation scoring with fixture analysis and minutes prediction
export const calculateAdvancedPlayerScore = (player, rosterAnalysis, round, draftPosition, availablePlayers, replacementLevels, fixtures = null) => {
  // NEW: Minutes prediction - predict playing time for more accurate projections
  const minutesPrediction = predictPlayerMinutes(player);
  const adjustedStats = adjustPlayerForPredictedMinutes(player, minutesPrediction);
  
  // Use adjusted points for VORP calculation when minutes prediction is confident
  const useAdjustedPoints = minutesPrediction.confidence > 0.6;
  const effectivePoints = useAdjustedPoints ? adjustedStats.adjustedPoints : player.historicalPoints;
  
  // Base talent score - use minutes-adjusted points for more accuracy
  const vorp = (effectivePoints || 0) - (replacementLevels[player.position] || 0);
  const talentWeight = round <= 2 ? 0.80 : round <= 4 ? 0.70 : 0.65; // Slightly reduced to make room for minutes factor
  const talentScore = vorp * talentWeight;
  
  // NEW: Minutes prediction bonus/penalty - crucial for late-round picks
  const minutesWeight = round <= 4 ? 0.05 : round <= 8 ? 0.10 : 0.15; // Higher weight in later rounds
  const minutesBonus = calculateMinutesBonus(player, minutesPrediction, round) * minutesWeight;
  
  // Position need score - reasonable scaling for later rounds
  const positionWeight = round <= 2 ? 0.05 : round <= 4 ? 0.1 : round <= 8 ? 0.15 : 0.20; // Slightly reduced
  const positionNeedScore = calculatePositionNeedScore(player.position, rosterAnalysis, round, draftPosition) * positionWeight;
  
  // Scarcity bonus - consistent weight
  const scarcityBonus = calculateScarcityBonus(player, availablePlayers, round) * 0.08; // Slightly reduced
  
  // Round-specific bonus - higher impact for early rounds
  const roundWeight = round <= 2 ? 0.08 : round <= 4 ? 0.06 : 0.04; // Slightly reduced
  const roundBonus = calculateRoundSpecificBonus(player, round, rosterAnalysis) * roundWeight;
  
  // Fixture difficulty bonus - becomes more important in later rounds
  const fixtureWeight = round <= 4 ? 0.04 : round <= 8 ? 0.08 : 0.12; // Slightly reduced
  const fixtureBonus = calculateFixtureBonus(player, fixtures, round) * fixtureWeight;
  
  const totalScore = talentScore + minutesBonus + positionNeedScore + scarcityBonus + roundBonus + fixtureBonus;
  
  return {
    totalScore,
    breakdown: {
      talent: talentScore,
      minutes: minutesBonus,
      positionNeed: positionNeedScore,
      scarcity: scarcityBonus,
      round: roundBonus,
      fixture: fixtureBonus,
      vorp,
      // Additional context
      projectedMinutes: minutesPrediction.predictedMinutes,
      minutesConfidence: minutesPrediction.confidence,
      playingStatus: minutesPrediction.playingStatus
    }
  };
};

// Calculate scarcity bonus for a player
export const calculateScarcityBonus = (player, availablePlayers, round) => {
  const positionPlayers = availablePlayers.filter(p => p.position === player.position);
  const tierPlayers = positionPlayers.filter(p => 
    (p.historicalPoints || 0) >= (player.historicalPoints || 0) * 0.9
  );
  
  // If there are very few players of similar quality available, bonus increases
  const scarcityRatio = tierPlayers.length / positionPlayers.length;
  const baseScarcity = (1 - scarcityRatio) * 30;
  
  // Position-specific scarcity multiplier - reduced for defenders early
  let positionMultiplier = POSITION_SCARCITY[player.position] || 1.0;
  
  // Early rounds: reduce defender scarcity bonus, increase forward bonus
  if (round <= 3) {
    if (player.position === 'D') {
      positionMultiplier *= 0.3; // Much lower defender scarcity value early
    } else if (player.position === 'F') {
      positionMultiplier *= 1.3; // Higher forward scarcity value early  
    }
  }
  
  // Early rounds matter less for scarcity overall
  const roundMultiplier = round <= 2 ? 0.3 : round <= 4 ? 0.6 : round <= 8 ? 0.8 : 1.0;
  
  return baseScarcity * positionMultiplier * roundMultiplier;
};

// Calculate round-specific bonus
export const calculateRoundSpecificBonus = (player, round, rosterAnalysis) => {
  let bonus = 0;
  const playerPoints = player.historicalPoints || 0;
  
  // First pick should heavily favor elite forwards and midfielders
  if (round === 1) {
    if ((player.position === 'F' || player.position === 'M') && playerPoints >= PLAYER_TIERS.HIGH.min) {
      bonus += 50; // Massive bonus for elite F/M in round 1
    } else if (player.position === 'D' && playerPoints >= PLAYER_TIERS.HIGH.min) {
      bonus -= 20; // Penalty for defenders in round 1, even elite ones
    }
  }
  
  // Early rounds: Major bonus for elite F/M, smaller for elite D
  if (round <= 3) {
    if (playerPoints >= PLAYER_TIERS.ELITE.min) {
      if (player.position === 'F' || player.position === 'M') {
        bonus += 40; // Large bonus for elite F/M
      } else if (player.position === 'D') {
        bonus += 10; // Small bonus for elite D
      }
    } else if (playerPoints >= PLAYER_TIERS.HIGH.min) {
      if (player.position === 'F' || player.position === 'M') {
        bonus += 25; // Good bonus for high-tier F/M
      } else if (player.position === 'D') {
        bonus += 5; // Small bonus for high-tier D
      }
    }
  }
  
  // Mid rounds: Bonus for proven performers
  if (round >= 4 && round <= 8 && playerPoints >= PLAYER_TIERS.HIGH.min) {
    bonus += 15;
  }
  
  // Late rounds: Bonus for upside plays (young players with decent points)
  if (round >= 9 && player.age <= 24 && playerPoints >= PLAYER_TIERS.MID.min) {
    bonus += 12;
  }
  
  // Goalkeeper timing bonus
  if (player.position === 'G') {
    if (round >= 8 && round <= 12) {
      bonus += 15; // Sweet spot for goalkeepers
    } else if (round <= 6) {
      bonus -= 25; // Strong penalty for early GK
    }
  }
  
  return bonus;
};

// Calculate minutes prediction bonus/penalty for a player
export const calculateMinutesBonus = (player, minutesPrediction, round) => {
  if (!minutesPrediction || round <= 2) {
    return 0; // No minutes adjustment for very early picks
  }
  
  const { predictedMinutes, minutesPerGame, confidence, playingStatus } = minutesPrediction;
  
  // Base bonus/penalty based on projected playing time
  let minutesScore = 0;
  
  // Playing status bonuses/penalties
  switch (playingStatus) {
    case 'starter': // 70+ minutes per game
      minutesScore = 25;
      break;
    case 'regular': // 50-70 minutes per game  
      minutesScore = 15;
      break;
    case 'rotation': // 30-50 minutes per game
      minutesScore = -5;
      break;
    case 'fringe': // <30 minutes per game
      minutesScore = -25;
      break;
    default:
      minutesScore = 0;
  }
  
  // Additional adjustment based on actual projected minutes
  if (predictedMinutes > 2800) { // 74+ min/game
    minutesScore += 10;
  } else if (predictedMinutes > 2500) { // 66+ min/game
    minutesScore += 5;
  } else if (predictedMinutes < 1800) { // <47 min/game
    minutesScore -= 15;
  } else if (predictedMinutes < 1200) { // <32 min/game
    minutesScore -= 30;
  }
  
  // Scale bonus by confidence - low confidence predictions get smaller impact
  minutesScore *= confidence;
  
  // Later rounds care more about minutes certainty
  if (round >= 8) {
    // Penalty for uncertain minutes in late rounds
    if (confidence < 0.6) {
      minutesScore -= 10;
    }
  }
  
  // Cap the minutes bonus to prevent it from overwhelming other factors
  return Math.max(-40, Math.min(35, Math.round(minutesScore * 10) / 10));
};

// Calculate fixture-based bonus for a player
export const calculateFixtureBonus = (player, fixtures, round) => {
  // Early rounds: fixtures matter less since we're focusing on talent
  if (round <= 3 || !fixtures || !player.team) {
    return 0;
  }
  
  // Get team fixtures for the player's team
  const teamFixtures = fixtures[player.team];
  if (!Array.isArray(teamFixtures) || teamFixtures.length === 0) {
    return 0;
  }
  
  try {
    // Analyze upcoming fixtures for this player's position
    const fixtureAnalysis = analyzeUpcomingFixtures(
      teamFixtures.map(fixture => ({
        ...fixture,
        team: player.team // Ensure team code is included
      })),
      player.position,
      6 // Look at next 6 gameweeks
    );
    
    // Base fixture score ranges from -8 to +8
    let fixtureBonus = fixtureAnalysis.fixtureScore;
    
    // Position-specific adjustments
    if (player.position === 'D' || player.position === 'G') {
      // Defenders and goalkeepers benefit more from easy fixtures (clean sheets)
      fixtureBonus += fixtureAnalysis.cleanSheetExpected * 10; // Up to 8 extra points for high clean sheet probability
    } else if (player.position === 'F') {
      // Forwards benefit more from attacking opportunities
      fixtureBonus += fixtureAnalysis.attackingExpected * 8; // Up to ~12 extra points for high attacking potential
    } else if (player.position === 'M') {
      // Midfielders benefit from both but to a lesser extent
      fixtureBonus += (fixtureAnalysis.cleanSheetExpected * 3) + (fixtureAnalysis.attackingExpected * 5);
    }
    
    // Scale bonus based on confidence
    fixtureBonus *= fixtureAnalysis.confidence;
    
    // Cap the fixture bonus to prevent it from overwhelming other factors
    return Math.max(-20, Math.min(25, Math.round(fixtureBonus * 10) / 10));
    
  } catch (error) {
    console.warn(`Error calculating fixture bonus for ${player.name}:`, error);
    return 0;
  }
};

// Get strategic recommendations for current pick
export const getStrategicRecommendations = (
  currentRoster, 
  round, 
  draftPosition, 
  availablePlayers, 
  replacementLevels,
  teams = 10,
  fixtures = null
) => {
  const rosterAnalysis = analyzeRosterComposition(currentRoster, round);
  const positionStrategy = getDraftPositionStrategy(draftPosition, teams);
  const roundStrategy = getRoundStrategy(round, draftPosition, currentRoster);
  
  // Special case for absolute first pick of the draft (round 1, no players drafted yet)
  const isVeryFirstPick = round === 1 && currentRoster.length === 0;
  
  // Score all available players
  const scoredPlayers = availablePlayers.map(player => {
    let scoring;
    
    // PROPER GOALKEEPER TIMING: No goalkeepers before round 10, optimal timing rounds 10-13
    if (player.position === 'G') {
      const vorp = calculateVORP(player, replacementLevels);
      const positionNeed = rosterAnalysis.positionNeeds.G;
      const hasNoGK = positionNeed && positionNeed.current === 0;
      const hasMultipleGK = positionNeed && positionNeed.current >= 1;
      
      let penaltyScore = 0;
      let positionBonusScore = 0;
      
      if (round < 10) {
        // Never draft goalkeepers before round 10
        penaltyScore = -500; // Massive penalty
      } else if (round >= 10 && round <= 13 && hasNoGK) {
        // Optimal goalkeeper rounds when we need one
        positionBonusScore = 30; // Small bonus for good timing
      } else if (hasMultipleGK) {
        // Already have a goalkeeper, don't need another
        penaltyScore = -300; // Heavy penalty for multiple goalkeepers
      } else if (round > 13 && hasNoGK) {
        // Getting late, need to draft one soon
        positionBonusScore = 50; // Stronger bonus for urgency
      }
      
      // Add fixture and minutes bonus for goalkeepers in later rounds
      const fixtureBonus = calculateFixtureBonus(player, fixtures, round);
      const minutesPrediction = predictPlayerMinutes(player);
      const minutesBonus = calculateMinutesBonus(player, minutesPrediction, round);
      
      scoring = {
        totalScore: vorp + penaltyScore + positionBonusScore + fixtureBonus + minutesBonus,
        breakdown: {
          talent: vorp,
          minutes: minutesBonus,
          positionNeed: positionBonusScore,
          scarcity: 0,
          round: penaltyScore,
          fixture: fixtureBonus,
          vorp,
          projectedMinutes: minutesPrediction.predictedMinutes,
          minutesConfidence: minutesPrediction.confidence,
          playingStatus: minutesPrediction.playingStatus
        }
      };
    } else if (isVeryFirstPick) {
      // For the very first pick, use pure talent with position penalties
      const vorp = calculateVORP(player, replacementLevels);
      let pureScore = vorp;
      
      // Heavy penalties for non-ideal first picks
      if (player.position === 'G') {
        pureScore -= 100; // Massive penalty for GK first pick
      } else if (player.position === 'D') {
        pureScore -= 50; // Large penalty for defender first pick
      }
      
      // Bonus for elite forwards/midfielders
      if ((player.position === 'F' || player.position === 'M') && 
          (player.historicalPoints || 0) >= PLAYER_TIERS.HIGH.min) {
        pureScore += 30;
      }
      
      scoring = {
        totalScore: pureScore,
        breakdown: {
          talent: pureScore,
          minutes: 0, // No minutes bonus for first pick
          positionNeed: 0,
          scarcity: 0,
          round: 0,
          fixture: 0, // No fixture bonus for first pick
          vorp,
          projectedMinutes: 0,
          minutesConfidence: 0,
          playingStatus: 'N/A'
        }
      };
    } else {
      // Normal strategic scoring for all other picks
      scoring = calculateAdvancedPlayerScore(
        player, 
        rosterAnalysis, 
        round, 
        draftPosition, 
        availablePlayers, 
        replacementLevels,
        fixtures
      );
    }
    
    return {
      ...player,
      playerName: player.name, // Add playerName for AI draft logic compatibility
      strategicScore: scoring.totalScore,
      scoring: scoring.breakdown,
      vorp: scoring.breakdown.vorp,
      tier: getPlayerTier(player.historicalPoints || 0),
      recommendation: generateRecommendationReason(player, rosterAnalysis, round, scoring)
    };
  }).sort((a, b) => b.strategicScore - a.strategicScore);
  
  // Generate strategic insights
  const insights = generateStrategicInsights(rosterAnalysis, roundStrategy, positionStrategy, round);
  
  return {
    recommendations: scoredPlayers.slice(0, 15),
    insights,
    rosterAnalysis,
    strategy: {
      position: positionStrategy,
      round: roundStrategy
    }
  };
};

// Generate recommendation reason for a player
export const generateRecommendationReason = (player, rosterAnalysis, round, scoring) => {
  const reasons = [];
  
  // Talent-based reasons
  if (scoring.talent > 50) {
    reasons.push(`Elite talent (${scoring.vorp.toFixed(1)} VORP)`);
  } else if (scoring.talent > 30) {
    reasons.push(`High-quality player`);
  }
  
  // Position need reasons
  if (scoring.positionNeed > 15) {
    reasons.push(`Fills urgent ${player.position} need`);
  } else if (scoring.positionNeed > 5) {
    reasons.push(`Addresses roster need`);
  } else if (scoring.positionNeed < -10) {
    reasons.push(`⚠️ Position depth already strong`);
  }
  
  // Scarcity reasons
  if (scoring.scarcity > 8) {
    reasons.push(`Limited quality ${player.position}s remaining`);
  }
  
  // Minutes prediction reasons (NEW)
  if (scoring.minutes > 15) {
    reasons.push(`💪 Guaranteed starter (${scoring.playingStatus})`);
  } else if (scoring.minutes > 5) {
    reasons.push(`✅ Regular minutes expected`);
  } else if (scoring.minutes < -15) {
    reasons.push(`⚠️ Limited playing time risk`);
  } else if (scoring.minutes < -5) {
    reasons.push(`🔶 Rotation/bench player`);
  }

  // Fixture-based reasons
  if (scoring.fixture > 10) {
    reasons.push(`🟢 Excellent upcoming fixtures`);
  } else if (scoring.fixture > 5) {
    reasons.push(`✅ Good fixture run`);
  } else if (scoring.fixture < -10) {
    reasons.push(`🔴 Difficult fixtures ahead`);
  } else if (scoring.fixture < -5) {
    reasons.push(`⚠️ Tough upcoming matches`);
  }
  
  // Round-specific reasons
  if (round <= 4 && player.tier === 'ELITE') {
    reasons.push('Perfect timing for elite talent');
  } else if (round >= 9 && player.age <= 24) {
    reasons.push('High upside young player');
  } else if (player.position === 'G' && round >= 8 && round <= 12) {
    reasons.push('Optimal goalkeeper timing');
  }
  
  return reasons.join(' • ') || 'Solid value pick';
};

// Generate strategic insights for the current situation
export const generateStrategicInsights = (rosterAnalysis, roundStrategy, positionStrategy, round) => {
  const insights = [];
  
  // Urgent needs
  if (rosterAnalysis.urgentNeeds.length > 0) {
    insights.push({
      type: 'URGENT',
      message: `Must address ${rosterAnalysis.urgentNeeds.join(', ')} positions soon`,
      priority: 'HIGH'
    });
  }
  
  // Round-specific advice
  if (round <= 4) {
    if (rosterAnalysis.eliteCount < 2) {
      insights.push({
        type: 'STRATEGY',
        message: 'Focus on securing elite talent (500+ points)',
        priority: 'HIGH'
      });
    }
  } else if (round >= 9) {
    if (rosterAnalysis.needsGoalkeeper) {
      insights.push({
        type: 'TIMING',
        message: 'Good time to draft your goalkeeper',
        priority: 'MEDIUM'
      });
    }
  }
  
  // Roster strength insights
  if (rosterAnalysis.rosterStrength === 'WEAK' && round > 6) {
    insights.push({
      type: 'WARNING',
      message: 'Consider taking proven performers over upside plays',
      priority: 'MEDIUM'
    });
  }
  
  // Position-specific insights
  const fullPositions = Object.entries(rosterAnalysis.positionNeeds)
    .filter(([_, need]) => need.isFull)
    .map(([pos, _]) => pos);
  
  if (fullPositions.length > 0) {
    insights.push({
      type: 'INFO',
      message: `${fullPositions.join(', ')} positions are full`,
      priority: 'LOW'
    });
  }
  
  return insights;
};

// Helper functions
export const getPlayerTier = (historicalPoints) => {
  if (historicalPoints >= PLAYER_TIERS.ELITE.min) return 'ELITE';
  if (historicalPoints >= PLAYER_TIERS.HIGH.min) return 'HIGH';
  if (historicalPoints >= PLAYER_TIERS.MID.min) return 'MID';
  if (historicalPoints >= PLAYER_TIERS.LOW.min) return 'LOW';
  return 'DEEP';
};

export const calculateVORP = (player, replacementLevels) => {
  const replacementLevel = replacementLevels[player.position] || 0;
  return (player.historicalPoints || 0) - replacementLevel;
};

export const getRosterCounts = (roster) => {
  const counts = {
    active: { total: 0, byPosition: { D: 0, M: 0, F: 0, G: 0 } },
    reserve: { total: 0, byPosition: { D: 0, M: 0, F: 0, G: 0 } },
    injured_reserve: { total: 0, byPosition: { D: 0, M: 0, F: 0, G: 0 } },
    total: 0
  };

  roster.forEach(player => {
    const category = player.rosterCategory || 'active';
    counts[category].total++;
    counts[category].byPosition[player.position]++;
    counts.total++;
  });

  return counts;
}; 