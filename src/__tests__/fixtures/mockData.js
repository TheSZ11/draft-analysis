/**
 * Mock data fixtures for comprehensive testing
 * Provides consistent, realistic test data across all test suites
 */

import { ROSTER_CATEGORIES } from '../../utils/constants.js'

// Mock players with comprehensive stats
export const mockPlayers = {
  elite: {
    id: 1,
    name: 'Mohamed Salah',
    position: 'F',
    team: 'LIV',
    age: 31,
    minutes: 3200,
    goals: 24,
    assists: 12,
    assistsSecond: 8,
    shots: 120,
    shotsOnTarget: 65,
    keyPasses: 45,
    tacklesWon: 15,
    interceptions: 8,
    dribbles: 85,
    accCrosses: 12,
    foulsCommitted: 18,
    foulsSuffered: 32,
    offsides: 15,
    pkMissed: 1,
    pkDrawn: 3,
    ownGoals: 0,
    dispossessed: 25,
    recoveries: 45,
    aerialsWon: 18,
    blockedShots: 2,
    clearances: 5,
    yellowCards: 2,
    redCards: 0,
    cleanSheets: 0,
    saves: 0,
    pkSaves: 0,
    highClaims: 0,
    goalsConceded: 0,
    handBalls: 0,
    historicalPoints: 285.5,
    fp90: 8.2,
    vorp: 125.5,
    strategicScore: 92,
    tier: 'ELITE',
    isPositionFull: false,
    price: 13.0,
    form: 8.5,
    news: 'Available'
  },

  good: {
    id: 2,
    name: 'Bruno Fernandes',
    position: 'M',
    team: 'MUN',
    age: 29,
    minutes: 2850,
    goals: 15,
    assists: 18,
    assistsSecond: 12,
    shots: 85,
    shotsOnTarget: 42,
    keyPasses: 65,
    tacklesWon: 35,
    interceptions: 28,
    dribbles: 45,
    accCrosses: 25,
    foulsCommitted: 22,
    foulsSuffered: 28,
    offsides: 8,
    pkMissed: 0,
    pkDrawn: 5,
    ownGoals: 0,
    dispossessed: 32,
    recoveries: 85,
    aerialsWon: 12,
    blockedShots: 8,
    clearances: 18,
    yellowCards: 4,
    redCards: 0,
    cleanSheets: 2,
    saves: 0,
    pkSaves: 0,
    highClaims: 0,
    goalsConceded: 0,
    handBalls: 0,
    historicalPoints: 225.8,
    fp90: 7.1,
    vorp: 85.8,
    strategicScore: 78,
    tier: 'HIGH',
    isPositionFull: false,
    price: 11.5,
    form: 7.2,
    news: 'Available'
  },

  average: {
    id: 3,
    name: 'Conor Gallagher',
    position: 'M',
    team: 'CHE',
    age: 24,
    minutes: 2200,
    goals: 8,
    assists: 6,
    assistsSecond: 4,
    shots: 45,
    shotsOnTarget: 18,
    keyPasses: 28,
    tacklesWon: 52,
    interceptions: 45,
    dribbles: 22,
    accCrosses: 8,
    foulsCommitted: 35,
    foulsSuffered: 18,
    offsides: 3,
    pkMissed: 0,
    pkDrawn: 2,
    ownGoals: 0,
    dispossessed: 28,
    recoveries: 125,
    aerialsWon: 25,
    blockedShots: 12,
    clearances: 35,
    yellowCards: 8,
    redCards: 1,
    cleanSheets: 3,
    saves: 0,
    pkSaves: 0,
    highClaims: 0,
    goalsConceded: 0,
    handBalls: 1,
    historicalPoints: 145.2,
    fp90: 5.9,
    vorp: 25.2,
    strategicScore: 58,
    tier: 'MEDIUM',
    isPositionFull: false,
    price: 6.5,
    form: 5.8,
    news: 'Available'
  },

  defender: {
    id: 4,
    name: 'Virgil van Dijk',
    position: 'D',
    team: 'LIV',
    age: 32,
    minutes: 2950,
    goals: 4,
    assists: 2,
    assistsSecond: 1,
    shots: 25,
    shotsOnTarget: 12,
    keyPasses: 15,
    tacklesWon: 45,
    interceptions: 65,
    dribbles: 8,
    accCrosses: 2,
    foulsCommitted: 18,
    foulsSuffered: 12,
    offsides: 2,
    pkMissed: 0,
    pkDrawn: 1,
    ownGoals: 0,
    dispossessed: 8,
    recoveries: 185,
    aerialsWon: 125,
    blockedShots: 25,
    clearances: 165,
    yellowCards: 3,
    redCards: 0,
    cleanSheets: 18,
    saves: 0,
    pkSaves: 0,
    highClaims: 0,
    goalsConceded: 0,
    handBalls: 0,
    historicalPoints: 185.5,
    fp90: 5.7,
    vorp: 65.5,
    strategicScore: 72,
    tier: 'HIGH',
    isPositionFull: false,
    price: 6.0,
    form: 6.1,
    news: 'Available'
  },

  goalkeeper: {
    id: 5,
    name: 'Alisson Becker',
    position: 'G',
    team: 'LIV',
    age: 30,
    minutes: 3150,
    goals: 0,
    assists: 1,
    assistsSecond: 0,
    shots: 0,
    shotsOnTarget: 0,
    keyPasses: 2,
    tacklesWon: 2,
    interceptions: 5,
    dribbles: 1,
    accCrosses: 0,
    foulsCommitted: 2,
    foulsSuffered: 8,
    offsides: 0,
    pkMissed: 0,
    pkDrawn: 0,
    ownGoals: 0,
    dispossessed: 3,
    recoveries: 25,
    aerialsWon: 8,
    blockedShots: 0,
    clearances: 45,
    yellowCards: 1,
    redCards: 0,
    cleanSheets: 16,
    saves: 125,
    pkSaves: 2,
    highClaims: 35,
    goalsConceded: 28,
    handBalls: 0,
    historicalPoints: 165.8,
    fp90: 4.7,
    vorp: 45.8,
    strategicScore: 68,
    tier: 'HIGH',
    isPositionFull: false,
    price: 5.5,
    form: 5.2,
    news: 'Available'
  },

  poor: {
    id: 6,
    name: 'Poor Player',
    position: 'F',
    team: 'BUR',
    age: 22,
    minutes: 1200,
    goals: 2,
    assists: 1,
    assistsSecond: 0,
    shots: 18,
    shotsOnTarget: 6,
    keyPasses: 8,
    tacklesWon: 5,
    interceptions: 3,
    dribbles: 12,
    accCrosses: 1,
    foulsCommitted: 15,
    foulsSuffered: 8,
    offsides: 8,
    pkMissed: 1,
    pkDrawn: 0,
    ownGoals: 1,
    dispossessed: 18,
    recoveries: 15,
    aerialsWon: 4,
    blockedShots: 1,
    clearances: 2,
    yellowCards: 5,
    redCards: 1,
    cleanSheets: 0,
    saves: 0,
    pkSaves: 0,
    highClaims: 0,
    goalsConceded: 0,
    handBalls: 0,
    historicalPoints: 45.2,
    fp90: 3.4,
    vorp: -35.8,
    strategicScore: 25,
    tier: 'LOW',
    isPositionFull: false,
    price: 4.5,
    form: 2.8,
    news: 'Available'
  }
}

// Mock teams with various states
export const mockTeams = {
  empty: {
    id: 1,
    name: 'Empty Team',
    picks: [],
    positionLimits: {
      D: { minActive: 2, maxActive: 4, totalMax: 6 },
      M: { minActive: 3, maxActive: 5, totalMax: 6 },
      F: { minActive: 1, maxActive: 3, totalMax: 4 },
      G: { minActive: 1, maxActive: 1, totalMax: 2 }
    },
    maxTotalPlayers: 15,
    maxActivePlayers: 11,
    maxReservePlayers: 4,
    maxInjuredReservePlayers: 2
  },

  partial: {
    id: 2,
    name: 'Partial Team',
    picks: [
      { ...mockPlayers.elite, rosterCategory: ROSTER_CATEGORIES.ACTIVE, round: 1 },
      { ...mockPlayers.good, rosterCategory: ROSTER_CATEGORIES.ACTIVE, round: 2 },
      { ...mockPlayers.defender, rosterCategory: ROSTER_CATEGORIES.ACTIVE, round: 3 }
    ],
    positionLimits: {
      D: { minActive: 2, maxActive: 4, totalMax: 6 },
      M: { minActive: 3, maxActive: 5, totalMax: 6 },
      F: { minActive: 1, maxActive: 3, totalMax: 4 },
      G: { minActive: 1, maxActive: 1, totalMax: 2 }
    },
    maxTotalPlayers: 15,
    maxActivePlayers: 11,
    maxReservePlayers: 4,
    maxInjuredReservePlayers: 2
  },

  full: {
    id: 3,
    name: 'Full Team',
    picks: Array(15).fill().map((_, i) => ({
      id: i + 100,
      name: `Player ${i + 1}`,
      position: ['F', 'M', 'D', 'G'][i % 4],
      rosterCategory: i < 11 ? ROSTER_CATEGORIES.ACTIVE : ROSTER_CATEGORIES.RESERVE,
      round: Math.floor(i / 2) + 1,
      historicalPoints: 100 - i * 2
    })),
    positionLimits: {
      D: { minActive: 2, maxActive: 4, totalMax: 6 },
      M: { minActive: 3, maxActive: 5, totalMax: 6 },
      F: { minActive: 1, maxActive: 3, totalMax: 4 },
      G: { minActive: 1, maxActive: 1, totalMax: 2 }
    },
    maxTotalPlayers: 15,
    maxActivePlayers: 11,
    maxReservePlayers: 4,
    maxInjuredReservePlayers: 2
  }
}

// Mock fixture data
export const mockFixtures = {
  LIV: [
    { opponent: 'MCI', home: true, difficulty: 4, gameweek: 1 },
    { opponent: 'ARS', home: false, difficulty: 4, gameweek: 2 },
    { opponent: 'BUR', home: true, difficulty: 2, gameweek: 3 }
  ],
  MCI: [
    { opponent: 'LIV', home: false, difficulty: 4, gameweek: 1 },
    { opponent: 'CHE', home: true, difficulty: 3, gameweek: 2 },
    { opponent: 'AVL', home: false, difficulty: 3, gameweek: 3 }
  ],
  MUN: [
    { opponent: 'NEW', home: true, difficulty: 3, gameweek: 1 },
    { opponent: 'TOT', home: false, difficulty: 4, gameweek: 2 },
    { opponent: 'SOU', home: true, difficulty: 2, gameweek: 3 }
  ]
}

// Mock replacement levels
export const mockReplacementLevels = {
  F: 80,
  M: 70,
  D: 60,
  G: 50
}

// Mock player tiers
export const mockPlayerTiers = {
  F: [
    { ...mockPlayers.elite, tier: 'ELITE' },
    { ...mockPlayers.poor, tier: 'LOW' }
  ],
  M: [
    { ...mockPlayers.good, tier: 'HIGH' },
    { ...mockPlayers.average, tier: 'MEDIUM' }
  ],
  D: [
    { ...mockPlayers.defender, tier: 'HIGH' }
  ],
  G: [
    { ...mockPlayers.goalkeeper, tier: 'HIGH' }
  ]
}

// Mock scoring rules
export const mockScoringRules = {
  goals: { F: 6, M: 6, D: 8, G: 10 },
  assists: { F: 4, M: 4, D: 6, G: 6 },
  assistsSecond: { F: 2, M: 2, D: 2, G: 2 },
  shotsOnTarget: { F: 0.3, M: 0.3, D: 0.3, G: 0.3 },
  keyPasses: { F: 0.5, M: 0.5, D: 0.5, G: 0.5 },
  tacklesWon: { F: 0.5, M: 0.5, D: 0.5, G: 0.5 },
  interceptions: { F: 0.5, M: 0.5, D: 0.5, G: 0.5 },
  dribbles: { F: 0.3, M: 0.3, D: 0.3, G: 0.3 },
  accCrosses: { F: 0.3, M: 0.3, D: 0.3, G: 0.3 },
  foulsDrawn: { F: 0.2, M: 0.2, D: 0.2, G: 0.2 },
  saves: { F: 0, M: 0, D: 0, G: 3 },
  cleanSheets: { F: 0, M: 1, D: 2, G: 6 },
  aerialsWon: { F: 0.3, M: 0.3, D: 0.3, G: 0.3 },
  blockedShots: { F: 0.5, M: 0.5, D: 0.5, G: 0.5 },
  clearances: { F: 0.2, M: 0.2, D: 0.2, G: 0.2 },
  recoveries: { F: 0.1, M: 0.1, D: 0.1, G: 0.1 },
  // Negative scoring
  yellowCards: { F: -1, M: -1, D: -1, G: -1 },
  redCards: { F: -3, M: -3, D: -3, G: -3 },
  ownGoals: { F: -4, M: -4, D: -4, G: -4 },
  foulsCommitted: { F: -0.2, M: -0.2, D: -0.2, G: -0.2 },
  dispossessed: { F: -0.1, M: -0.1, D: -0.1, G: -0.1 },
  offsides: { F: -0.2, M: -0.2, D: -0.2, G: 0 },
  pkMissed: { F: -3, M: -3, D: -3, G: -3 },
  handBalls: { F: -2, M: -2, D: -2, G: 0 },
  goalsConceded: { F: 0, M: 0, D: -1, G: -1 },
  pkSaves: { F: 0, M: 0, D: 0, G: 6 },
  highClaims: { F: 0, M: 0, D: 0, G: 0.5 }
}

// Mock strategic recommendations
export const mockStrategicRecommendations = {
  basic: {
    recommendations: [
      {
        player: mockPlayers.elite,
        score: 95,
        reasoning: 'Elite forward with exceptional VORP and historical performance'
      },
      {
        player: mockPlayers.good,
        score: 85,
        reasoning: 'Solid midfielder with good assist potential'
      },
      {
        player: mockPlayers.defender,
        score: 75,
        reasoning: 'Reliable defender with clean sheet potential'
      }
    ],
    positionNeeds: ['F', 'M', 'D'],
    strategicPhase: 'early',
    teamAnalysis: {
      strengths: [],
      weaknesses: ['needs forwards', 'needs midfielders', 'needs defenders'],
      nextPriority: 'F'
    }
  },

  midDraft: {
    recommendations: [
      {
        player: mockPlayers.goalkeeper,
        score: 70,
        reasoning: 'Quality goalkeeper to complete starting lineup'
      },
      {
        player: mockPlayers.average,
        score: 65,
        reasoning: 'Depth midfielder for squad rotation'
      }
    ],
    positionNeeds: ['G', 'M'],
    strategicPhase: 'middle',
    teamAnalysis: {
      strengths: ['solid forward line', 'good midfield depth'],
      weaknesses: ['needs goalkeeper', 'lacks defensive depth'],
      nextPriority: 'G'
    }
  }
}

// Mock UI state
export const mockUIState = {
  searchTerm: '',
  selectedPosition: 'ALL',
  hoveredPlayer: null,
  tooltipPosition: { x: 0, y: 0 },
  showComplianceReport: false,
  complianceReportData: null,
  forceUpdate: 0
}

// Mock league configuration
export const mockLeagueConfig = {
  positionLimits: {
    D: { minActive: 2, maxActive: 4, totalMax: 6 },
    M: { minActive: 3, maxActive: 5, totalMax: 6 },
    F: { minActive: 1, maxActive: 3, totalMax: 4 },
    G: { minActive: 1, maxActive: 1, totalMax: 2 }
  },
  rosterLimits: {
    maxTotalPlayers: 15,
    maxActivePlayers: 11,
    maxReservePlayers: 4,
    maxInjuredReservePlayers: 2
  },
  scoringRules: mockScoringRules
}

// Helper functions for creating test data
export const createMockPlayer = (overrides = {}) => ({
  ...mockPlayers.average,
  ...overrides
})

export const createMockTeam = (overrides = {}) => ({
  ...mockTeams.empty,
  ...overrides
})

export const createMockTeams = (count = 10) => 
  Array(count).fill().map((_, i) => createMockTeam({ 
    id: i + 1, 
    name: i === 0 ? 'Your Team' : `AI Team ${i}` 
  }))

export const createMockPlayersArray = (count = 100) =>
  Array(count).fill().map((_, i) => createMockPlayer({
    id: i + 1,
    name: `Player ${i + 1}`,
    position: ['F', 'M', 'D', 'G'][i % 4],
    historicalPoints: Math.max(20, 150 - i),
    vorp: Math.max(-20, 50 - i * 0.5)
  }))

// Mock event objects for testing
export const createMockMouseEvent = (overrides = {}) => ({
  clientX: 100,
  clientY: 100,
  target: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }) },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...overrides
})

export const createMockKeyboardEvent = (key = 'Enter', overrides = {}) => ({
  key,
  code: `Key${key.toUpperCase()}`,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...overrides
})

// Export all mock data as default
export default {
  players: mockPlayers,
  teams: mockTeams,
  fixtures: mockFixtures,
  replacementLevels: mockReplacementLevels,
  playerTiers: mockPlayerTiers,
  scoringRules: mockScoringRules,
  strategicRecommendations: mockStrategicRecommendations,
  uiState: mockUIState,
  leagueConfig: mockLeagueConfig,
  
  // Helper functions
  createMockPlayer,
  createMockTeam,
  createMockTeams,
  createMockPlayersArray,
  createMockMouseEvent,
  createMockKeyboardEvent
} 