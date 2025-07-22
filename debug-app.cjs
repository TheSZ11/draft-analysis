// Debug script to test app logic
const fs = require('fs');

// Mock the fixture data
const fixtureData = {
  fixtures: [
    {
      matchweek: 1,
      homeTeam: "Arsenal",
      awayTeam: "Brentford",
      date: "2024-08-17",
      time: "15:00",
      datetime: "2024-08-17T15:00:00Z"
    }
  ]
};

// Mock the player data
const mockPlayerData = [
  {
    id: 1,
    name: "Erling Haaland",
    team: "Manchester City",
    position: "F",
    age: 23,
    minutes: 2000,
    goals: 20,
    assists: 5,
    assistsSecond: 2,
    shots: 80,
    shotsOnTarget: 45,
    keyPasses: 30,
    tacklesWon: 5,
    interceptions: 3,
    dribbles: 15,
    accCrosses: 8,
    foulsCommitted: 10,
    foulsSuffered: 25,
    offsides: 8,
    pkMissed: 0,
    pkDrawn: 2,
    ownGoals: 0,
    dispossessed: 20,
    recoveries: 15,
    aerialsWon: 12,
    blockedShots: 2,
    clearances: 5,
    yellowCards: 3,
    redCards: 0,
    cleanSheets: 0,
    saves: 0,
    pkSaves: 0,
    highClaims: 0,
    goalsConceded: 0,
    handBalls: 0
  }
];

// Scoring rules
const scoringRules = {
  assists: { G: 7, D: 7, M: 6, F: 6 },
  assistsSecond: { G: 2, D: 2, M: 2, F: 2 },
  keyPasses: { G: 2, D: 2, M: 2, F: 2 },
  shotsOnTarget: { G: 2, D: 2, M: 2, F: 2 },
  goals: { G: 10, D: 10, M: 9, F: 9 },
  tacklesWon: { G: 1, D: 1, M: 1, F: 1 },
  interceptions: { G: 1, D: 1, M: 1, F: 1 },
  successfulDribbles: { G: 1, D: 1, M: 1, F: 1 },
  accurateCrossesNoCorners: { G: 1, D: 1, M: 1, F: 1 },
  penaltyKicksDrawn: { G: 2, D: 2, M: 2, F: 2 },
  foulsSuffered: { G: 0.25, D: 0.25, M: 0.25, F: 0.25 },
  saves: { G: 2, D: 0, M: 0, F: 0 },
  penaltyKickSaves: { G: 8, D: 0, M: 0, F: 0 },
  highClaimsSucceeded: { G: 1, D: 0, M: 0, F: 0 },
  cleanSheets: { G: 8, D: 6, M: 1, F: 0 },
  aerialsWon: { G: 1, D: 1, M: 0.5, F: 0.5 },
  blockedShots: { G: 0, D: 1, M: 0.5, F: 0 },
  effectiveClearances: { G: 0.5, D: 0.5, M: 0.25, F: 0 },
  ballRecoveries: { G: 0, D: 0.25, M: 0.25, F: 0.25 },
  dispossessed: { G: -0.5, D: -0.5, M: -0.5, F: -0.5 },
  foulsCommitted: { G: -0.25, D: -0.25, M: -0.25, F: -0.25 },
  ownGoals: { G: -5, D: -5, M: -5, F: -5 },
  goalsAgainst: { G: -2, D: -2, M: 0, F: 0 },
  yellowCards: { G: -2, D: -2, M: -2, F: -2 },
  redCards: { G: -7, D: -5, M: -5, F: -5 },
  penaltyKicksMissed: { G: -4, D: -4, M: -4, F: -4 },
  handBalls: { G: 0, D: -0.25, M: -0.25, F: -0.25 },
  offsides: { G: 0, D: -0.25, M: -0.25, F: -0.25 },
};

// Team mapping
const fplDataTeamMapping = {
  "Bournemouth": "BOU",
  "Brighton": "BHA", 
  "Tottenham": "TOT",
  "Manchester Utd": "MUN",
  "Newcastle Utd": "NEW",
  "West Ham": "WHU",
  "Nott'ham Forest": "NOT",
  "Wolves": "WOL",
  "Leicester City": "LEI",
  "Southampton": "SOU",
  "Ipswich Town": "IPS",
  "Liverpool": "LIV",
  "Manchester City": "MCI",
  "Arsenal": "ARS",
  "Chelsea": "CHE",
  "Everton": "EVE",
  "Crystal Palace": "CRY",
  "Brentford": "BRF",
  "Aston Villa": "AVL",
  "Fulham": "FUL"
};

// Calculate historical points
const calculateHistoricalPoints = (player, rules) => {
  const pos = player.position;
  if (!pos) return 0;

  let totalPoints = 0;

  const addPoints = (statName, statValue) => {
    if (rules[statName] && rules[statName][pos] !== 0 && statValue) {
      totalPoints += statValue * rules[statName][pos];
    }
  };

  addPoints('assists', player.assists);
  addPoints('assistsSecond', player.assistsSecond);
  addPoints('keyPasses', player.keyPasses);
  addPoints('shotsOnTarget', player.shotsOnTarget);
  addPoints('goals', player.goals);
  addPoints('tacklesWon', player.tacklesWon);
  addPoints('interceptions', player.interceptions);
  addPoints('successfulDribbles', player.dribbles);
  addPoints('accurateCrossesNoCorners', player.accCrosses);
  addPoints('penaltyKicksDrawn', player.pkDrawn);
  addPoints('foulsSuffered', player.foulsSuffered);
  addPoints('saves', player.saves);
  addPoints('penaltyKickSaves', player.pkSaves);
  addPoints('highClaimsSucceeded', player.highClaims);
  addPoints('cleanSheets', player.cleanSheets);
  addPoints('aerialsWon', player.aerialsWon);
  addPoints('blockedShots', player.blockedShots);
  addPoints('effectiveClearances', player.clearances);
  addPoints('ballRecoveries', player.recoveries);
  addPoints('dispossessed', player.dispossessed);
  addPoints('foulsCommitted', player.foulsCommitted);
  addPoints('ownGoals', player.ownGoals);
  addPoints('goalsAgainst', player.goalsConceded);
  addPoints('yellowCards', player.yellowCards);
  addPoints('redCards', player.redCards);
  addPoints('penaltyKicksMissed', player.pkMissed);
  addPoints('handBalls', player.handBalls);
  addPoints('offsides', player.offsides);

  return totalPoints;
};

// Calculate replacement levels
const calculateReplacementLevels = (players) => {
  const positions = ['F', 'M', 'D', 'G'];
  const levels = {};
  
  positions.forEach(pos => {
    const positionPlayers = players
      .filter(p => p.position === pos)
      .sort((a, b) => b.historicalPoints - a.historicalPoints);
    
    const replacementIndex = Math.min(12, positionPlayers.length - 1);
    levels[pos] = positionPlayers[replacementIndex]?.historicalPoints || 0;
  });
  
  return levels;
};

// Calculate VORP
const calculateVORP = (player, levels) => {
  const replacementLevel = levels[player.position] || 0;
  return player.historicalPoints - replacementLevel;
};

// Test the functions
console.log('=== Testing App Logic ===');

// Process player data
const players = mockPlayerData.map(player => {
  const historicalPoints = calculateHistoricalPoints(player, scoringRules);
  const fp90 = (player.minutes > 0) ? (historicalPoints / player.minutes) * 90 : 0;
  const teamCode = fplDataTeamMapping[player.team] || player.team;
  
  return {
    ...player,
    team: teamCode,
    historicalPoints: Math.round(historicalPoints * 10) / 10,
    fp90: Math.round(fp90 * 100) / 100
  };
}).filter(player => player.minutes > 500);

console.log('Processed players:', players.length);
console.log('Sample player:', players[0]);

// Calculate replacement levels
const levels = calculateReplacementLevels(players);
console.log('Replacement levels:', levels);

// Calculate VORP for each player
const playersWithVORP = players.map(player => ({
  ...player,
  vorp: calculateVORP(player, levels)
}));

console.log('Players with VORP:', playersWithVORP.map(p => ({ name: p.name, vorp: p.vorp })));

// Test getAvailablePlayers logic
const availablePlayers = playersWithVORP;
const draftedPlayers = [];
const selectedPosition = 'ALL';
const searchTerm = '';

const getAvailablePlayers = () => {
  return availablePlayers
    .filter(player => !draftedPlayers.includes(player.name))
    .filter(player => selectedPosition === 'ALL' || player.position === selectedPosition)
    .filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      player.team.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(player => ({
      ...player,
      vorp: calculateVORP(player, levels)
    }))
    .sort((a, b) => b.vorp - a.vorp);
};

console.log('Available players:', getAvailablePlayers().length);

// Test getRecommendations logic
const getRecommendations = () => {
  const available = getAvailablePlayers();
  
  return available.slice(0, 15).map(player => {
    const avgDifficulty = 3; // Mock fixture difficulty
    const fixtureRating = 6 - avgDifficulty;
    
    let score = player.vorp;
    score += (fixtureRating - 3) * 10;
    
    if (player.fp90) {
      score += player.fp90 * 3;
    }
    
    return {
      ...player,
      score,
      reason: 'Test reason',
      fixtureRating,
      avgDifficulty: Math.round(avgDifficulty * 10) / 10
    };
  }).sort((a, b) => b.score - a.score);
};

console.log('Recommendations:', getRecommendations().length);

console.log('=== Test completed successfully ==='); 