import leagueRules from '../league-rules-parsed.json';

// Convert league rules to the format expected by the app
export const LEAGUE_CONFIG = {
  // Basic league info
  info: leagueRules.leagueInfo,
  
  // Position limits (convert from league rules format to app format)
  positionLimits: {
    D: {
      minActive: leagueRules.rosterRequirements.positions.defender.minActive,
      maxActive: leagueRules.rosterRequirements.positions.defender.maxActive,
      totalMax: leagueRules.rosterRequirements.positions.defender.totalMax
    },
    M: {
      minActive: leagueRules.rosterRequirements.positions.midfielder.minActive,
      maxActive: leagueRules.rosterRequirements.positions.midfielder.maxActive,
      totalMax: leagueRules.rosterRequirements.positions.midfielder.totalMax
    },
    F: {
      minActive: leagueRules.rosterRequirements.positions.forward.minActive,
      maxActive: leagueRules.rosterRequirements.positions.forward.maxActive,
      totalMax: leagueRules.rosterRequirements.positions.forward.totalMax
    },
    G: {
      minActive: leagueRules.rosterRequirements.positions.goalkeeper.minActive,
      maxActive: leagueRules.rosterRequirements.positions.goalkeeper.maxActive,
      totalMax: leagueRules.rosterRequirements.positions.goalkeeper.totalMax
    }
  },
  
  // Roster limits
  rosterLimits: {
    maxTotalPlayers: leagueRules.rosterRequirements.totalPlayers.maximum,
    maxActivePlayers: leagueRules.rosterRequirements.activePlayers.maximum,
    maxReservePlayers: leagueRules.rosterRequirements.reservePlayers.maximum,
    maxInjuredReservePlayers: leagueRules.rosterRequirements.injuryReservePlayers.maximum
  },
  
  // Scoring rules converted to app format
  scoringRules: {
    // Goalkeepers
    assists: { G: leagueRules.scoringRules.goalkeeper.assists_total, D: leagueRules.scoringRules.outfielder.defender.assists_total, M: leagueRules.scoringRules.outfielder.default.assists_total, F: leagueRules.scoringRules.outfielder.default.assists_total },
    assistsSecond: { G: leagueRules.scoringRules.goalkeeper.assists_second, D: leagueRules.scoringRules.outfielder.default.assists_second, M: leagueRules.scoringRules.outfielder.default.assists_second, F: leagueRules.scoringRules.outfielder.default.assists_second },
    keyPasses: { G: leagueRules.scoringRules.goalkeeper.key_passes, D: leagueRules.scoringRules.outfielder.default.key_passes, M: leagueRules.scoringRules.outfielder.default.key_passes, F: leagueRules.scoringRules.outfielder.default.key_passes },
    shotsOnTarget: { G: leagueRules.scoringRules.goalkeeper.shots_on_target, D: leagueRules.scoringRules.outfielder.default.shots_on_target, M: leagueRules.scoringRules.outfielder.default.shots_on_target, F: leagueRules.scoringRules.outfielder.default.shots_on_target },
    goals: { G: leagueRules.scoringRules.goalkeeper.goals, D: leagueRules.scoringRules.outfielder.defender.goals, M: leagueRules.scoringRules.outfielder.default.goals, F: leagueRules.scoringRules.outfielder.default.goals },
    tacklesWon: { G: leagueRules.scoringRules.goalkeeper.tackles_won, D: leagueRules.scoringRules.outfielder.default.tackles_won, M: leagueRules.scoringRules.outfielder.default.tackles_won, F: leagueRules.scoringRules.outfielder.default.tackles_won },
    interceptions: { G: leagueRules.scoringRules.goalkeeper.interceptions, D: leagueRules.scoringRules.outfielder.default.interceptions, M: leagueRules.scoringRules.outfielder.default.interceptions, F: leagueRules.scoringRules.outfielder.default.interceptions },
    successfulDribbles: { G: leagueRules.scoringRules.goalkeeper.successful_dribbles, D: leagueRules.scoringRules.outfielder.default.successful_dribbles, M: leagueRules.scoringRules.outfielder.default.successful_dribbles, F: leagueRules.scoringRules.outfielder.default.successful_dribbles },
    accurateCrossesNoCorners: { G: leagueRules.scoringRules.goalkeeper.accurate_crosses_no_corners, D: leagueRules.scoringRules.outfielder.default.accurate_crosses_no_corners, M: leagueRules.scoringRules.outfielder.default.accurate_crosses_no_corners, F: leagueRules.scoringRules.outfielder.default.accurate_crosses_no_corners },
    penaltyKicksDrawn: { G: leagueRules.scoringRules.goalkeeper.penalty_kicks_drawn, D: leagueRules.scoringRules.outfielder.default.penalty_kicks_drawn, M: leagueRules.scoringRules.outfielder.default.penalty_kicks_drawn, F: leagueRules.scoringRules.outfielder.default.penalty_kicks_drawn },
    foulsSuffered: { G: leagueRules.scoringRules.goalkeeper.fouls_suffered, D: leagueRules.scoringRules.outfielder.default.fouls_suffered, M: leagueRules.scoringRules.outfielder.default.fouls_suffered, F: leagueRules.scoringRules.outfielder.default.fouls_suffered },

    // Position-Specific & Goalkeeper Stats
    saves: { G: leagueRules.scoringRules.goalkeeper.saves, D: 0, M: 0, F: 0 },
    penaltyKickSaves: { G: leagueRules.scoringRules.goalkeeper.penalty_kick_saves, D: 0, M: 0, F: 0 },
    highClaimsSucceeded: { G: leagueRules.scoringRules.goalkeeper.high_claims_succeeded, D: 0, M: 0, F: 0 },
    cleanSheets: { G: leagueRules.scoringRules.goalkeeper.clean_sheets, D: leagueRules.scoringRules.outfielder.default.clean_sheets_on_field, M: leagueRules.scoringRules.outfielder.midfielder.clean_sheets_on_field, F: leagueRules.scoringRules.outfielder.forward.clean_sheets_on_field },
    aerialsWon: { G: leagueRules.scoringRules.goalkeeper.aerials_won, D: leagueRules.scoringRules.outfielder.defender.aerials_won, M: leagueRules.scoringRules.outfielder.default.aerials_won, F: leagueRules.scoringRules.outfielder.default.aerials_won },
    blockedShots: { G: leagueRules.scoringRules.outfielder.default.blocked_shots, D: leagueRules.scoringRules.outfielder.defender.blocked_shots, M: leagueRules.scoringRules.outfielder.midfielder.blocked_shots, F: leagueRules.scoringRules.outfielder.default.blocked_shots },
    effectiveClearances: { G: leagueRules.scoringRules.goalkeeper.effective_clearances, D: leagueRules.scoringRules.outfielder.defender.effective_clearances, M: leagueRules.scoringRules.outfielder.midfielder.effective_clearances, F: leagueRules.scoringRules.outfielder.default.effective_clearances },
    ballRecoveries: { G: 0, D: leagueRules.scoringRules.outfielder.default.ball_recoveries, M: leagueRules.scoringRules.outfielder.default.ball_recoveries, F: leagueRules.scoringRules.outfielder.default.ball_recoveries },

    // Negative Points
    dispossessed: { G: leagueRules.scoringRules.goalkeeper.dispossessed, D: leagueRules.scoringRules.outfielder.default.dispossessed, M: leagueRules.scoringRules.outfielder.default.dispossessed, F: leagueRules.scoringRules.outfielder.default.dispossessed },
    foulsCommitted: { G: leagueRules.scoringRules.goalkeeper.fouls_committed, D: leagueRules.scoringRules.outfielder.default.fouls_committed, M: leagueRules.scoringRules.outfielder.default.fouls_committed, F: leagueRules.scoringRules.outfielder.default.fouls_committed },
    ownGoals: { G: leagueRules.scoringRules.goalkeeper.own_goals, D: leagueRules.scoringRules.outfielder.default.own_goals, M: leagueRules.scoringRules.outfielder.default.own_goals, F: leagueRules.scoringRules.outfielder.default.own_goals },
    // IMPORTANT FIX: Goals against only applies to goalkeepers and defenders, not all outfielders
    goalsAgainst: { G: leagueRules.scoringRules.goalkeeper.goals_against, D: leagueRules.scoringRules.outfielder.defender.goals_against_outfielders, M: leagueRules.scoringRules.outfielder.default.goals_against_outfielders, F: leagueRules.scoringRules.outfielder.default.goals_against_outfielders },
    yellowCards: { G: leagueRules.scoringRules.goalkeeper.yellow_cards, D: leagueRules.scoringRules.outfielder.default.yellow_cards, M: leagueRules.scoringRules.outfielder.default.yellow_cards, F: leagueRules.scoringRules.outfielder.default.yellow_cards },
    redCards: { G: leagueRules.scoringRules.goalkeeper.red_cards, D: leagueRules.scoringRules.outfielder.default.red_cards, M: leagueRules.scoringRules.outfielder.default.red_cards, F: leagueRules.scoringRules.outfielder.default.red_cards },
    penaltyKicksMissed: { G: leagueRules.scoringRules.goalkeeper.penalty_kicks_missed, D: leagueRules.scoringRules.outfielder.default.penalty_kicks_missed, M: leagueRules.scoringRules.outfielder.default.penalty_kicks_missed, F: leagueRules.scoringRules.outfielder.default.penalty_kicks_missed },
    handBalls: { G: 0, D: leagueRules.scoringRules.outfielder.default.hand_balls, M: leagueRules.scoringRules.outfielder.default.hand_balls, F: leagueRules.scoringRules.outfielder.default.hand_balls },
    offsides: { G: 0, D: leagueRules.scoringRules.outfielder.default.offsides, M: leagueRules.scoringRules.outfielder.default.offsides, F: leagueRules.scoringRules.outfielder.default.offsides },
    
    // Additional stats from league rules
    penalties: { G: leagueRules.scoringRules.goalkeeper.penalties, D: leagueRules.scoringRules.outfielder.default.penalties, M: leagueRules.scoringRules.outfielder.default.penalties, F: leagueRules.scoringRules.outfielder.default.penalties },
  },
  
  // Draft info
  draft: leagueRules.additionalRules.draft
};

// Helper function to create a team with proper league configuration
export const createTeamTemplate = (id, name) => ({
  id,
  name,
  picks: [],
  // League roster requirements
  positionLimits: { ...LEAGUE_CONFIG.positionLimits },
  // Roster structure
  activePlayers: [],
  reservePlayers: [],
  injuredReservePlayers: [],
  // Limits
  ...LEAGUE_CONFIG.rosterLimits
}); 