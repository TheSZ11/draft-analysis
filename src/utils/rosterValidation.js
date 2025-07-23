import { ROSTER_CATEGORIES } from './constants.js';

/**
 * Calculate roster counts by category and position
 * @param {Object} team - Team object with picks array
 * @returns {Object} Counts object with breakdown by category and position
 */
export const getRosterCounts = (team) => {
  const counts = {
    active: { total: 0, byPosition: { D: 0, M: 0, F: 0, G: 0 } },
    reserve: { total: 0, byPosition: { D: 0, M: 0, F: 0, G: 0 } },
    injured_reserve: { total: 0, byPosition: { D: 0, M: 0, F: 0, G: 0 } },
    total: 0
  };

  team.picks.forEach(player => {
    const category = player.rosterCategory || ROSTER_CATEGORIES.ACTIVE;
    counts[category].total++;
    counts[category].byPosition[player.position]++;
    counts.total++;
  });

  return counts;
};

/**
 * Check if a player can be added to a specific roster category
 * @param {Object} team - Team object
 * @param {string} category - Roster category ('active', 'reserve', 'injured_reserve')
 * @param {string} position - Player position ('D', 'M', 'F', 'G')
 * @returns {boolean} Whether player can be added to category
 */
export const canAddToCategory = (team, category, position) => {
  const counts = getRosterCounts(team);
  const positionLimits = team.positionLimits[position];
  
  switch (category) {
    case ROSTER_CATEGORIES.ACTIVE: {
      return (
        counts.active.total < team.maxActivePlayers &&
        counts.active.byPosition[position] < positionLimits.maxActive
      );
    }
    case ROSTER_CATEGORIES.RESERVE: {
      return counts.reserve.total < team.maxReservePlayers;
    }
    case ROSTER_CATEGORIES.INJURED_RESERVE: {
      return counts.injured_reserve.total < team.maxInjuredReservePlayers;
    }
    default:
      return false;
  }
};

/**
 * Determine which roster category a player should be added to
 * @param {Object} team - Team object
 * @param {Object} player - Player object
 * @returns {string} Roster category
 */
export const determineRosterCategory = (team, player) => {
  // First try to add to active lineup
  if (canAddToCategory(team, ROSTER_CATEGORIES.ACTIVE, player.position)) {
    return ROSTER_CATEGORIES.ACTIVE;
  }
  // Then try reserves
  if (canAddToCategory(team, ROSTER_CATEGORIES.RESERVE, player.position)) {
    return ROSTER_CATEGORIES.RESERVE;
  }
  // Finally try injured reserve
  if (canAddToCategory(team, ROSTER_CATEGORIES.INJURED_RESERVE, player.position)) {
    return ROSTER_CATEGORIES.INJURED_RESERVE;
  }
  // Default to reserve (this might exceed limits, but we'll validate separately)
  return ROSTER_CATEGORIES.RESERVE;
};

/**
 * Validate team roster against league rules
 * @param {Object} team - Team object
 * @returns {Object} Validation result with errors array
 */
export const validateRoster = (team) => {
  const counts = getRosterCounts(team);
  const errors = [];

  // Check total roster size
  if (counts.total > team.maxTotalPlayers) {
    errors.push(`Total roster size (${counts.total}) exceeds maximum (${team.maxTotalPlayers})`);
  }

  // Check active lineup
  if (counts.active.total > team.maxActivePlayers) {
    errors.push(`Active players (${counts.active.total}) exceeds maximum (${team.maxActivePlayers})`);
  }

  // Check reserves
  if (counts.reserve.total > team.maxReservePlayers) {
    errors.push(`Reserve players (${counts.reserve.total}) exceeds maximum (${team.maxReservePlayers})`);
  }

  // Check injury reserve
  if (counts.injured_reserve.total > team.maxInjuredReservePlayers) {
    errors.push(`Injured reserve players (${counts.injured_reserve.total}) exceeds maximum (${team.maxInjuredReservePlayers})`);
  }

  // Check position limits for active players
  Object.entries(team.positionLimits).forEach(([position, limits]) => {
    const activeCount = counts.active.byPosition[position];
    if (activeCount > limits.maxActive) {
      errors.push(`Active ${position} players (${activeCount}) exceeds maximum (${limits.maxActive})`);
    }
    if (activeCount < limits.minActive && counts.total >= team.maxActivePlayers) {
      errors.push(`Active ${position} players (${activeCount}) below minimum (${limits.minActive})`);
    }

    // Check total position limits
    const totalPositionCount = counts.active.byPosition[position] + 
                              counts.reserve.byPosition[position] + 
                              counts.injured_reserve.byPosition[position];
    if (totalPositionCount > limits.totalMax) {
      errors.push(`Total ${position} players (${totalPositionCount}) exceeds maximum (${limits.totalMax})`);
    }
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate whether a draft move is legal
 * @param {Object} team - Team object
 * @param {Object} player - Player to draft
 * @returns {Object} Validation result
 */
export const validateDraftMove = (team, player) => {
  const errors = [];
  
  // Check if team is already full
  if (team.picks.length >= team.maxTotalPlayers) {
    errors.push(`Team roster is full (${team.picks.length}/${team.maxTotalPlayers} players)`);
    return { isValid: false, errors };
  }
  
  // Check if player is already on team
  if (team.picks.some(pick => pick.id === player.id || pick.name === player.name)) {
    errors.push(`${player.name} is already on team`);
  }
  
  // Check for invalid position
  if (!['F', 'M', 'D', 'G'].includes(player.position)) {
    errors.push(`Invalid position: ${player.position}`);
  }

  // Check position limits
  const currentPositionCount = team.picks.filter(pick => pick.position === player.position).length;
  const positionLimit = team.positionLimits[player.position]?.totalMax || 0;
  
  if (currentPositionCount >= positionLimit) {
    errors.push(`Cannot draft another ${player.position} - ${player.position} position is full (${currentPositionCount}/${positionLimit})`);
  }

  // Additional roster validation
  const counts = getRosterCounts(team);
  if (counts.total >= team.maxTotalPlayers) {
    errors.push(`Team already has maximum players (${team.maxTotalPlayers})`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate lineup legality for setting active roster
 * @param {Object} team - Team object
 * @returns {Object} Validation result
 */
export const validateLineupLegality = (team) => {
  const counts = getRosterCounts(team);
  const errors = [];
  const warnings = [];

  // Check minimum active players by position
  Object.entries(team.positionLimits).forEach(([position, limits]) => {
    const activeCount = counts.active.byPosition[position];
    if (activeCount < limits.minActive) {
      errors.push(`Need at least ${limits.minActive} active ${position} players (currently ${activeCount})`);
    }
    if (activeCount > limits.maxActive) {
      errors.push(`Too many active ${position} players (${activeCount}/${limits.maxActive})`);
    }
  });

  // Check for goalkeepers specifically
  if (counts.active.byPosition.G === 0) {
    errors.push(`Need at least 1 active goalkeeper`);
  }

  // Check for reserve players in active lineup
  const reservePlayersInActiveLineup = team.picks.filter(pick => 
    pick.rosterCategory === ROSTER_CATEGORIES.RESERVE
  );
  
  // If there are any reserve players, and we're counting them in active positions, that's an error
  if (reservePlayersInActiveLineup.length > 0) {
    // Check if any reserve players are somehow being counted as active
    const reserveNames = reservePlayersInActiveLineup.map(p => p.name);
    errors.push(`Cannot have reserve players in active lineup: ${reserveNames.join(', ')}`);
  }

  // Check total active players
  const totalActive = counts.active.total;
  if (totalActive < team.maxActivePlayers) {
    warnings.push(`Active lineup not full (${totalActive}/${team.maxActivePlayers})`);
  }
  if (totalActive > team.maxActivePlayers) {
    errors.push(`Too many active players (${totalActive}/${team.maxActivePlayers})`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate moving a player between roster categories
 * @param {Object} team - Team object
 * @param {Object} player - Player to move
 * @param {string} newCategory - Target category
 * @returns {Object} Validation result
 */
export const validateRosterMove = (team, player, newCategory) => {
  const errors = [];
  
  // Check if player is on the team
  const playerOnTeam = team.picks.find(pick => pick.id === player.id);
  if (!playerOnTeam) {
    errors.push(`${player.name} is not on the team`);
    return { isValid: false, errors };
  }

  // Check if trying to move to same category
  const currentCategory = playerOnTeam.rosterCategory || ROSTER_CATEGORIES.ACTIVE;
  if (currentCategory === newCategory) {
    errors.push(`${player.name} is already in ${newCategory} category`);
    return { isValid: false, errors };
  }

  // Check if target category has space
  const tempTeam = {
    ...team,
    picks: team.picks.filter(pick => pick.id !== player.id) // Remove player for availability check
  };
  
  if (!canAddToCategory(tempTeam, newCategory, player.position)) {
    errors.push(`Cannot move to ${newCategory} - category is full or position limit reached`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Generate comprehensive compliance report for a team
 * @param {Object} team - Team object
 * @returns {Object} Detailed compliance report
 */
export const generateComplianceReport = (team) => {
  const compliance = validateLeagueCompliance(team);
  const counts = getRosterCounts(team);
  
  return {
    rosterCounts: counts,
    complianceStatus: compliance.isCompliant ? 'compliant' : 'non-compliant',
    violations: compliance.errors || [],
    recommendations: compliance.warnings || [],
    ...compliance,
    timestamp: new Date().toISOString()
  };
};

/**
 * Comprehensive league compliance validation
 * @param {Object} team - Team object
 * @returns {Object} Compliance results with score
 */
export const validateLeagueCompliance = (team) => {
  const errors = [];
  const warnings = [];
  
  // Basic roster validation
  const rosterValidation = validateRoster(team);
  errors.push(...rosterValidation.errors);
  
  // Lineup validation
  const lineupValidation = validateLineupLegality(team);
  errors.push(...lineupValidation.errors);
  warnings.push(...lineupValidation.warnings);
  
  // Additional checks
  const counts = getRosterCounts(team);
  
  // Check for completely empty positions
  Object.entries(team.positionLimits).forEach(([position, _limits]) => {
    const totalCount = counts.active.byPosition[position] + 
                      counts.reserve.byPosition[position] + 
                      counts.injured_reserve.byPosition[position];
    if (totalCount === 0) {
      errors.push(`No ${position} players on roster`);
    }
  });

  // Calculate compliance score (0-100)
  const complianceScore = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));
  
  return {
    isCompliant: errors.length === 0,
    complianceScore,
    errors,
    warnings,
    summary: {
      totalIssues: errors.length + warnings.length,
      criticalIssues: errors.length,
      minorIssues: warnings.length
    }
  };
}; 