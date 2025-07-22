// Debug script to test React component logic
const fs = require('fs');

// Mock React hooks
let state = {};
let effectCount = 0;
let renderCount = 0;

const useState = (initialValue) => {
  const key = `state_${Object.keys(state).length}`;
  if (!(key in state)) {
    state[key] = initialValue;
  }
  return [
    state[key],
    (newValue) => {
      state[key] = newValue;
      console.log(`State updated: ${key} =`, newValue);
    }
  ];
};

const useEffect = (callback, dependencies) => {
  effectCount++;
  console.log(`useEffect #${effectCount} called with dependencies:`, dependencies);
  
  // Simulate the effect
  try {
    callback();
  } catch (error) {
    console.error(`Error in useEffect #${effectCount}:`, error);
  }
};

// Mock the component logic
console.log('=== Testing React Component Logic ===');

// Initialize state
const [loading, setLoading] = useState(true);
const [availablePlayers, setAvailablePlayers] = useState([]);
const [teams, setTeams] = useState([]);
const [currentPick, setCurrentPick] = useState(1);
const [draftedPlayers, setDraftedPlayers] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedPosition, setSelectedPosition] = useState('ALL');
const [hoveredPlayer, setHoveredPlayer] = useState(null);
const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
const [fixtures, setFixtures] = useState({});
const [replacementLevels, setReplacementLevels] = useState({});
const [playerTiers, setPlayerTiers] = useState([]);
const [vorpUpdateCount, setVorpUpdateCount] = useState(0);
const [isVorpUpdating, setIsVorpUpdating] = useState(false);

console.log('Initial state:', {
  loading: loading[0],
  availablePlayersLength: availablePlayers[0] ? availablePlayers[0].length : 0,
  teamsLength: teams[0] ? teams[0].length : 0,
  currentPick: currentPick[0],
  draftedPlayersLength: draftedPlayers[0] ? draftedPlayers[0].length : 0
});

// Test the initialization useEffect
console.log('\n=== Testing Initialization useEffect ===');
useEffect(() => {
  console.log('Initialization useEffect triggered');
  
  // Initialize teams
  const teamCount = 10;
  const newTeams = [];
  for (let i = 1; i <= teamCount; i++) {
    newTeams.push({
      id: i,
      name: i === 1 ? 'Your Team' : `Team ${i}`,
      picks: [],
      positionLimits: {
        D: { minActive: 3, maxActive: 5, totalMax: 8 },
        M: { minActive: 3, maxActive: 5, totalMax: 8 },
        F: { minActive: 1, maxActive: 3, totalMax: 6 },
        G: { minActive: 1, maxActive: 1, totalMax: 3 }
      },
      activePlayers: [],
      reservePlayers: [],
      injuredReservePlayers: [],
      maxTotalPlayers: 14,
      maxActivePlayers: 11,
      maxReservePlayers: 3,
      maxInjuredReservePlayers: 1
    });
  }
  setTeams[1](newTeams);
  console.log('Teams initialized:', newTeams.length);
  
  // Simulate fetchPlayerData
  console.log('Simulating fetchPlayerData...');
  setLoading[1](false);
  setAvailablePlayers[1]([]); // Empty for now
  
  // Simulate fetchFixtures
  console.log('Simulating fetchFixtures...');
  setFixtures[1]({});
  
}, []);

// Test the VORP update useEffect
console.log('\n=== Testing VORP Update useEffect ===');
useEffect(() => {
  console.log('VORP update useEffect triggered');
  console.log('Dependencies:', {
    vorpUpdateCount: vorpUpdateCount[0],
    availablePlayersLength: availablePlayers[0] ? availablePlayers[0].length : 0,
    draftedPlayersLength: draftedPlayers[0] ? draftedPlayers[0].length : 0
  });
  
  if (availablePlayers[0] && availablePlayers[0].length > 0) {
    setIsVorpUpdating[1](true);
    console.log('Setting isVorpUpdating to true');
    
    // Simulate the timeout
    setTimeout(() => {
      console.log('VORP update timeout executed');
      setIsVorpUpdating[1](false);
      console.log('Setting isVorpUpdating to false');
    }, 100);
  }
}, [vorpUpdateCount[0], availablePlayers[0] ? availablePlayers[0].length : 0, draftedPlayers[0] ? draftedPlayers[0].length : 0]);

// Test the getCurrentTeam function
console.log('\n=== Testing getCurrentTeam function ===');
const getCurrentTeam = () => {
  const teamCount = teams[0] ? teams[0].length : 0;
  if (teamCount === 0) return null;
  
  const round = Math.floor((currentPick[0] - 1) / teamCount) + 1;
  const pickInRound = ((currentPick[0] - 1) % teamCount) + 1;
  
  if (round % 2 === 1) {
    return teams[0][pickInRound - 1];
  } else {
    return teams[0][teamCount - pickInRound];
  }
};

const currentTeam = getCurrentTeam();
console.log('Current team:', currentTeam);

// Test the getAvailablePlayers function
console.log('\n=== Testing getAvailablePlayers function ===');
const getAvailablePlayers = () => {
  const currentTeam = getCurrentTeam();
  
  return (availablePlayers[0] || [])
    .filter(player => !(draftedPlayers[0] || []).includes(player.name))
    .filter(player => selectedPosition[0] === 'ALL' || player.position === selectedPosition[0])
    .filter(player => 
      player.name.toLowerCase().includes(searchTerm[0].toLowerCase()) || 
      player.team.toLowerCase().includes(searchTerm[0].toLowerCase())
    )
    .map(player => {
      const currentPositionCount = currentTeam?.picks.filter(pick => pick.position === player.position).length || 0;
      const positionLimit = currentTeam?.positionLimits[player.position]?.totalMax || 0;
      const isPositionFull = currentPositionCount >= positionLimit;
      
      return {
        ...player,
        vorp: 0, // Mock VORP calculation
        isPositionFull,
        positionCount: currentPositionCount,
        positionLimit
      };
    })
    .sort((a, b) => b.vorp - a.vorp);
};

const available = getAvailablePlayers();
console.log('Available players:', available.length);

// Test the getRecommendations function
console.log('\n=== Testing getRecommendations function ===');
const getRecommendations = () => {
  const currentTeam = getCurrentTeam();
  if (!currentTeam) return [];

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

const recommendations = getRecommendations();
console.log('Recommendations:', recommendations.length);

// Test the getBestAvailable function
console.log('\n=== Testing getBestAvailable function ===');
const getBestAvailable = () => {
  return getAvailablePlayers()
    .filter(player => !player.isPositionFull)
    .slice(0, 3)
    .map(player => ({
      ...player,
      tier: 1 // Mock tier
    }));
};

const bestAvailable = getBestAvailable();
console.log('Best available:', bestAvailable.length);

// Test render cycle
console.log('\n=== Testing Render Cycle ===');
renderCount++;
console.log(`Render #${renderCount}`);

// Check for potential infinite loops
console.log('\n=== Checking for Infinite Loop Indicators ===');
console.log('Effect count:', effectCount);
console.log('Render count:', renderCount);

if (effectCount > 10) {
  console.error('⚠️  WARNING: Too many effects triggered - possible infinite loop!');
}

if (renderCount > 10) {
  console.error('⚠️  WARNING: Too many renders - possible infinite loop!');
}

console.log('\n=== Test completed ==='); 