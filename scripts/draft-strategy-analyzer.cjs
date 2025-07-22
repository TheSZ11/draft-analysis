const fs = require('fs');
const path = require('path');

// Load the player data
const playerData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/fpl-data.json'), 'utf8'));

// Scoring rules (same as in your app)
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

// Calculate historical points
const calculateHistoricalPoints = (player) => {
  const pos = player.position;
  if (!pos) return 0;

  let totalPoints = 0;
  const addPoints = (statName, statValue) => {
    if (scoringRules[statName] && scoringRules[statName][pos] !== 0 && statValue) {
      totalPoints += statValue * scoringRules[statName][pos];
    }
  };

  // Positive stats
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

  // Negative stats
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

// Calculate points per 90 minutes
const calculatePointsPer90 = (player) => {
  const points = calculateHistoricalPoints(player);
  return player.minutes > 0 ? (points / player.minutes) * 90 : 0;
};

// Player archetypes
const analyzePlayerArchetypes = () => {
  const playersWithStats = playerData
    .filter(p => p.minutes >= 1000) // Only players with significant minutes
    .map(player => ({
      ...player,
      historicalPoints: calculateHistoricalPoints(player),
      pointsPer90: calculatePointsPer90(player),
      // Volume stats per 90
      tacklesPer90: (player.tacklesWon / player.minutes) * 90,
      interceptionsPer90: (player.interceptions / player.minutes) * 90,
      keyPassesPer90: (player.keyPasses / player.minutes) * 90,
      dribblesPer90: (player.dribbles / player.minutes) * 90,
      shotsPer90: (player.shots / player.minutes) * 90,
      goalsPer90: (player.goals / player.minutes) * 90,
      assistsPer90: (player.assists / player.minutes) * 90,
    }))
    .sort((a, b) => b.historicalPoints - a.historicalPoints);

  // Define archetypes
  const archetypes = {
    // Volume stat specialists
    tackleMachine: playersWithStats
      .filter(p => p.tacklesPer90 >= 3 && p.interceptionsPer90 >= 1)
      .slice(0, 10),
    
    keyPassMaster: playersWithStats
      .filter(p => p.keyPassesPer90 >= 2.5)
      .slice(0, 10),
    
    dribbleWizard: playersWithStats
      .filter(p => p.dribblesPer90 >= 2)
      .slice(0, 10),
    
    // Goal scorers
    goalScorer: playersWithStats
      .filter(p => p.goalsPer90 >= 0.4)
      .slice(0, 10),
    
    // All-around contributors
    boxToBox: playersWithStats
      .filter(p => p.position === 'M' && p.tacklesPer90 >= 2 && p.keyPassesPer90 >= 1.5)
      .slice(0, 10),
    
    // Defensive specialists
    defensiveSpecialist: playersWithStats
      .filter(p => p.tacklesPer90 >= 2.5 && p.interceptionsPer90 >= 1.5 && p.blockedShots >= 20)
      .slice(0, 10),
    
    // High-floor players (consistent 5+ points per 90)
    highFloor: playersWithStats
      .filter(p => p.pointsPer90 >= 5)
      .slice(0, 15),
  };

  return { playersWithStats, archetypes };
};

// Generate draft strategy recommendations
const generateDraftStrategy = () => {
  const { playersWithStats, archetypes } = analyzePlayerArchetypes();
  
  console.log('🎯 DRAFT STRATEGY FOR VOLUME-STATS LEAGUE\n');
  
  console.log('📊 TOP 20 OVERALL PLAYERS:');
  playersWithStats.slice(0, 20).forEach((player, index) => {
    console.log(`${index + 1}. ${player.name} (${player.position}) - ${player.team}`);
    console.log(`   Points: ${player.historicalPoints.toFixed(1)} | PP90: ${player.pointsPer90.toFixed(1)}`);
    console.log(`   Goals: ${player.goals} | Assists: ${player.assists} | Key Passes: ${player.keyPasses}`);
    console.log(`   Tackles: ${player.tacklesWon} | Interceptions: ${player.interceptions}`);
    console.log('');
  });

  console.log('\n🔧 PLAYER ARCHETYPES:\n');
  
  Object.entries(archetypes).forEach(([archetype, players]) => {
    console.log(`${archetype.toUpperCase()}:`);
    players.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name} (${player.position}) - ${player.team}`);
      console.log(`     Points: ${player.historicalPoints.toFixed(1)} | PP90: ${player.pointsPer90.toFixed(1)}`);
    });
    console.log('');
  });

  // Position-specific recommendations
  console.log('📋 POSITION-SPECIFIC STRATEGY:\n');
  
  const positions = ['M', 'D', 'F', 'G'];
  positions.forEach(pos => {
    const positionPlayers = playersWithStats.filter(p => p.position === pos).slice(0, 10);
    console.log(`${pos} PLAYERS (Top 10):`);
    positionPlayers.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name} - ${player.team}`);
      console.log(`     Points: ${player.historicalPoints.toFixed(1)} | PP90: ${player.pointsPer90.toFixed(1)}`);
    });
    console.log('');
  });

  // Snake draft recommendations
  console.log('🐍 SNAKE DRAFT RECOMMENDATIONS:\n');
  
  console.log('EARLY PICKS (1-4): Target elite volume players');
  console.log('- Box-to-box midfielders');
  console.log('- High-volume defenders');
  console.log('- Goal-scoring forwards with peripheral stats');
  console.log('');
  
  console.log('MIDDLE PICKS (5-8): Build depth');
  console.log('- Volume stat specialists');
  console.log('- Consistent floor players');
  console.log('- Position scarcity considerations');
  console.log('');
  
  console.log('LATE PICKS (9-15): Fill needs');
  console.log('- Goalkeeper (high save volume)');
  console.log('- Bench depth (high-floor players)');
  console.log('- Utility players');
  console.log('');

  // Value picks (players who might fall)
  console.log('💎 POTENTIAL VALUE PICKS (might fall in draft):');
  const valuePicks = playersWithStats
    .filter(p => p.pointsPer90 >= 4.5 && p.minutes >= 1500)
    .slice(0, 10);
  
  valuePicks.forEach((player, index) => {
    console.log(`${index + 1}. ${player.name} (${player.position}) - ${player.team}`);
    console.log(`   PP90: ${player.pointsPer90.toFixed(1)} | Minutes: ${player.minutes}`);
  });
};

// Run the analysis
generateDraftStrategy(); 