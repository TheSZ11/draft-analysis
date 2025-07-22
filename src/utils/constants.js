// Shared constants for the fantasy draft tracker

export const ROSTER_CATEGORIES = {
  ACTIVE: 'active',
  RESERVE: 'reserve', 
  INJURED_RESERVE: 'injured_reserve'
};

// Team mapping constants (extracted from App.jsx)
export const teamMapping = {
  'Arsenal': 'ARS',
  'Aston Villa': 'AVL',
  'Bournemouth': 'BOU',
  'Brentford': 'BRE',
  'Brighton': 'BHA',
  'Chelsea': 'CHE',
  'Crystal Palace': 'CRY',
  'Everton': 'EVE',
  'Fulham': 'FUL',
  'Ipswich': 'IPS',
  'Leicester': 'LEI',
  'Liverpool': 'LIV',
  'Manchester City': 'MCI',
  'Manchester United': 'MUN',
  'Newcastle': 'NEW',
  'Nottingham Forest': 'NFO',
  'Southampton': 'SOU',
  'Tottenham': 'TOT',
  'West Ham': 'WHU',
  'Wolves': 'WOL'
};

export const fplDataTeamMapping = {
  'Arsenal': 'ARS',
  'Aston Villa': 'AVL', 
  'Bournemouth': 'BOU',
  'AFC Bournemouth': 'BOU',
  'Brentford': 'BRE',
  'Brighton': 'BHA',
  'Brighton & Hove Albion': 'BHA',
  'Chelsea': 'CHE',
  'Crystal Palace': 'CRY',
  'Everton': 'EVE',
  'Fulham': 'FUL',
  'Ipswich': 'IPS',
  'Ipswich Town': 'IPS',
  'Leicester': 'LEI',
  'Leicester City': 'LEI',
  'Liverpool': 'LIV',
  'Manchester City': 'MCI',
  'Manchester United': 'MUN',
  'Manchester Utd': 'MUN',
  'Newcastle': 'NEW',
  'Newcastle United': 'NEW',
  'Newcastle Utd': 'NEW',
  'Nottingham Forest': 'NFO',
  'Nott\'ham Forest': 'NFO',
  'Southampton': 'SOU',
  'Tottenham': 'TOT',
  'Tottenham Hotspur': 'TOT',
  'West Ham': 'WHU',
  'West Ham United': 'WHU',
  'Wolves': 'WOL',
  'Wolverhampton Wanderers': 'WOL'
};

// Scoring rules (extracted from App.jsx)
export const scoringRules = {
  // Attacking
  goals: 4,
  assists: 3,
  assistsSecond: 1,
  shots: 0.2,
  shotsOnTarget: 0.4,
  keyPasses: 0.3,
  
  // Defensive  
  tacklesWon: 0.4,
  interceptions: 0.3,
  dribbles: 0.2,
  accCrosses: 0.3,
  blockedShots: 0.5,
  clearances: 0.1,
  recoveries: 0.1,
  aerialsWon: 0.2,
  
  // Disciplinary (negative)
  foulsCommitted: -0.2,
  yellowCards: -1,
  redCards: -3,
  offsides: -0.3,
  
  // Goalkeeper specific
  cleanSheets: 4,
  saves: 0.3,
  pkSaves: 5,
  highClaims: 0.2,
  goalsConceded: -0.5,
  
  // Penalties
  pkMissed: -3,
  ownGoals: -4,
  handBalls: -2,
  
  // Positive actions
  pkDrawn: 2,
  foulsSuffered: 0.2,
  dispossessed: -0.1
};

// Difficulty colors for fixtures
export const difficultyColors = {
  1: 'bg-green-600',
  2: 'bg-green-500', 
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-600'
}; 