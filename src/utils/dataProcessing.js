import { teamMapping, fplDataTeamMapping, difficultyColors } from './constants.js';
import { processPlayerData, calculateReplacementLevels, createPlayerTiers } from './playerCalculations.js';

/**
 * Calculate fixture difficulty based on opponent strength
 * @param {string} opponent - Opponent team name
 * @param {boolean} isHome - Whether the match is at home
 * @returns {number} Difficulty score (1-5)
 */
const calculateFixtureDifficulty = (opponent, isHome) => {
  // Team strength rankings (rough Premier League strength tiers)
  const teamStrength = {
    'MCI': 5, 'ARS': 5, 'LIV': 5, 'CHE': 4, 'TOT': 4, 'MUN': 4,
    'NEW': 3, 'AVL': 3, 'WHU': 3, 'BHA': 3, 'FUL': 3, 'WOL': 3,
    'EVE': 2, 'CRY': 2, 'BOU': 2, 'BRE': 2, 'NFO': 2, 'SOU': 2,
    'LEI': 1, 'IPS': 1, 'SUN': 1, 'LEE': 2, 'BUR': 1
  };

  let difficulty = teamStrength[opponent] || 3;
  
  // Adjust for home/away advantage
  if (isHome) {
    difficulty = Math.max(1, difficulty - 0.5);
  } else {
    difficulty = Math.min(5, difficulty + 0.5);
  }
  
  return Math.round(difficulty);
};

/**
 * Fetch and process fixture data
 * @param {Object} fixtureData - Raw fixture data
 * @returns {Object} Processed fixture data by team
 */
export const fetchFixtures = (fixtureData) => {
  const teamFixtures = {};
  
  // Combined team mapping including various name formats
  const allTeamMappings = {
    ...teamMapping,
    ...fplDataTeamMapping,
    // Additional mappings for fixture data variations
    'AFC Bournemouth': 'BOU',
    'Brighton & Hove Albion': 'BHA',
    'Manchester United': 'MUN',
    'Manchester City': 'MCI',
    'Newcastle United': 'NEW',
    'Nottingham Forest': 'NFO',
    'Nottingham Forest (Sky Sports)*': 'NFO',
    'Tottenham Hotspur': 'TOT',
    'West Ham United': 'WHU',
    'Wolverhampton Wanderers': 'WOL',
    'Crystal Palace': 'CRY',
    'Aston Villa': 'AVL',
    'Leicester City': 'LEI',
    'Ipswich Town': 'IPS',
    // Additional teams that may appear in fixture data
    'Sunderland': 'SUN',
    'Leeds United': 'LEE',
    'Burnley': 'BUR',
    'West Ham United (Sky Sports)*': 'WHU'
  };
  
  // Initialize all teams with empty arrays
  Object.values(allTeamMappings).forEach(teamCode => {
    if (!teamFixtures[teamCode]) {
      teamFixtures[teamCode] = [];
    }
  });
  
  // Process fixture data
  if (fixtureData && fixtureData.fixtures) {
    fixtureData.fixtures.forEach(fixture => {
      const homeTeamCode = allTeamMappings[fixture.homeTeam];
      const awayTeamCode = allTeamMappings[fixture.awayTeam];
      
      if (!homeTeamCode || !awayTeamCode) {
        console.warn(`Team mapping not found for fixture: ${fixture.homeTeam} vs ${fixture.awayTeam}`);
        return;
      }
      
      // Ensure both teams are initialized
      if (!teamFixtures[homeTeamCode]) teamFixtures[homeTeamCode] = [];
      if (!teamFixtures[awayTeamCode]) teamFixtures[awayTeamCode] = [];
      
      // Add fixture for home team
      teamFixtures[homeTeamCode].push({
        matchweek: fixture.matchweek,
        opponent: awayTeamCode,
        home: true,
        difficulty: calculateFixtureDifficulty(awayTeamCode, true)
      });
      
      // Add fixture for away team
      teamFixtures[awayTeamCode].push({
        matchweek: fixture.matchweek,
        opponent: homeTeamCode,
        home: false,
        difficulty: calculateFixtureDifficulty(homeTeamCode, false)
      });
    });
    
    // Sort fixtures by matchweek for each team
    Object.keys(teamFixtures).forEach(teamCode => {
      teamFixtures[teamCode].sort((a, b) => a.matchweek - b.matchweek);
    });
  }
  
  console.log('Processed fixtures:', Object.keys(teamFixtures).length, 'teams');
  console.log('Sample team fixtures:', Object.entries(teamFixtures).slice(0, 3).map(([team, fixtures]) => 
    `${team}: ${fixtures.length} fixtures`
  ));
  
  return teamFixtures;
};

/**
 * Fetch and process player data from API
 * @returns {Promise<Object>} Promise resolving to processed player data
 */
export const fetchPlayerData = async () => {
  try {
    const response = await fetch('/fpl-data.json');
    if (!response.ok) {
      throw new Error('Could not load player data file');
    }
    
    const data = await response.json();
    
    // New format: data is directly an array of players
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format - expected array of players');
    }

    // Process the raw data into formatted player objects
    const players = processPlayerData(data);
    
    // Calculate VORP and tiers
    const levels = calculateReplacementLevels(players);
    const tiers = createPlayerTiers(players, levels);
    
    return {
      players,
      replacementLevels: levels,
      playerTiers: tiers
    };
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
};

/**
 * Get fixture indicators for a player's team
 * @param {string} playerTeam - Player's team code
 * @param {Object} fixtures - Fixtures data by team
 * @param {number} count - Number of fixtures to return
 * @returns {Array} Array of upcoming fixtures
 */
export const getTeamFixtureIndicators = (playerTeam, fixtures, count = 3) => {
  const teamFixtures = fixtures[playerTeam] || [];
  return teamFixtures.slice(0, count);
};

/**
 * Get upcoming fixtures text for display
 * @param {string} playerTeam - Player's team code
 * @param {Object} fixtures - Fixtures data by team
 * @param {number} count - Number of fixtures to include
 * @returns {string} Formatted fixture text
 */
export const getUpcomingFixturesText = (playerTeam, fixtures, count = 3) => {
  const teamFixtures = fixtures[playerTeam] || [];
  
  return teamFixtures.slice(0, count).map(fixture => 
    `${fixture.home ? 'vs' : '@'} ${fixture.opponent} (${fixture.difficulty})`
  ).join(', ');
};

/**
 * Calculate average fixture difficulty for a team
 * @param {string} playerTeam - Player's team code
 * @param {Object} fixtures - Fixtures data by team
 * @param {number} gameweeks - Number of gameweeks to analyze
 * @returns {number} Average difficulty score
 */
export const getFixtureDifficultyScore = (playerTeam, fixtures, gameweeks = 6) => {
  const teamFixtures = fixtures[playerTeam] || [];
  
  if (teamFixtures.length === 0) {
    return 3; // Default neutral difficulty
  }
  
  // Look at next N fixtures for short-term planning
  const upcomingFixtures = teamFixtures.slice(0, gameweeks);
  const avgDifficulty = upcomingFixtures.reduce((sum, fixture) => sum + fixture.difficulty, 0) / upcomingFixtures.length;
  
  return avgDifficulty;
};

/**
 * Export fixture data for external use
 * @param {Object} fixtures - Fixtures data
 * @returns {string} CSV formatted fixture data
 */
export const exportFixtureData = (fixtures) => {
  const headers = ['Team', 'Matchweek', 'Opponent', 'Home/Away', 'Difficulty'];
  const rows = [headers.join(',')];
  
  Object.entries(fixtures).forEach(([team, teamFixtures]) => {
    teamFixtures.forEach(fixture => {
      const row = [
        team,
        fixture.matchweek,
        fixture.opponent,
        fixture.home ? 'Home' : 'Away',
        fixture.difficulty
      ];
      rows.push(row.join(','));
    });
  });
  
  return rows.join('\n');
};

/**
 * Initialize app data - fetch both player and fixture data
 * @param {Object} fixtureData - Raw fixture data
 * @returns {Promise<Object>} Promise resolving to all app data
 */
export const initializeAppData = async (fixtureData) => {
  try {
    // Fetch player data
    const playerDataResult = await fetchPlayerData();
    
    // Process fixture data
    const fixtures = fetchFixtures(fixtureData);
    
    return {
      ...playerDataResult,
      fixtures,
      loading: false
    };
  } catch (error) {
    console.error('Error initializing app data:', error);
    return {
      players: [],
      replacementLevels: {},
      playerTiers: [],
      fixtures: {},
      loading: false,
      error: error.message
    };
  }
};

/**
 * Update player data calculations when players change
 * @param {Array} availablePlayers - Current available players
 * @param {Array} draftedPlayers - List of drafted player names
 * @returns {Object} Updated calculations
 */
export const updatePlayerCalculations = (availablePlayers, draftedPlayers) => {
  // Filter to only available players
  const available = availablePlayers.filter(player => !draftedPlayers.includes(player.name));
  
  // Recalculate replacement levels and tiers based on remaining players
  const newLevels = calculateReplacementLevels(available);
  const newTiers = createPlayerTiers(available, newLevels);
  
  return {
    replacementLevels: newLevels,
    playerTiers: newTiers
  };
}; 