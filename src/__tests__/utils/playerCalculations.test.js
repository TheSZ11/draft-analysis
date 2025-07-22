import { describe, it, expect, beforeEach } from 'vitest'
import { 
  calculateHistoricalPoints,
  calculateReplacementLevels,
  createPlayerTiers,
  calculateVORP,
  getPlayerTierByName,
  getTierColor
} from '../../utils/playerCalculations.js'

describe('Player Calculations Utils', () => {
  let mockPlayer
  let mockScoringRules
  let mockPlayers
  let mockReplacementLevels

  beforeEach(() => {
    mockScoringRules = {
      goals: { F: 6, M: 6, D: 8, G: 10 },
      assists: { F: 4, M: 4, D: 6, G: 6 },
      assistsSecond: { F: 2, M: 2, D: 2, G: 2 },
      tacklesWon: { F: 0.5, M: 0.5, D: 0.5, G: 0.5 },
      interceptions: { F: 0.5, M: 0.5, D: 0.5, G: 0.5 },
      saves: { F: 0, M: 0, D: 0, G: 3 },
      cleanSheets: { F: 0, M: 1, D: 2, G: 6 },
      yellowCards: { F: -1, M: -1, D: -1, G: -1 },
      redCards: { F: -3, M: -3, D: -3, G: -3 },
      ownGoals: { F: -4, M: -4, D: -4, G: -4 }
    }

    mockPlayer = {
      id: 1,
      name: 'Test Player',
      position: 'M',
      team: 'ARS',
      minutes: 2500,
      goals: 15,
      assists: 8,
      assistsSecond: 5,
      tacklesWon: 45,
      interceptions: 32,
      saves: 0,
      cleanSheets: 8,
      yellowCards: 3,
      redCards: 0,
      ownGoals: 0
    }

    mockPlayers = [
      { position: 'F', historicalPoints: 180, name: 'Top Forward' },
      { position: 'F', historicalPoints: 160, name: 'Good Forward' },
      { position: 'F', historicalPoints: 120, name: 'Average Forward' },
      { position: 'F', historicalPoints: 80, name: 'Poor Forward' },
      { position: 'M', historicalPoints: 170, name: 'Top Midfielder' },
      { position: 'M', historicalPoints: 140, name: 'Good Midfielder' },
      { position: 'M', historicalPoints: 100, name: 'Average Midfielder' },
      { position: 'M', historicalPoints: 60, name: 'Poor Midfielder' },
      { position: 'D', historicalPoints: 140, name: 'Top Defender' },
      { position: 'D', historicalPoints: 120, name: 'Good Defender' },
      { position: 'D', historicalPoints: 90, name: 'Average Defender' },
      { position: 'D', historicalPoints: 50, name: 'Poor Defender' },
      { position: 'G', historicalPoints: 130, name: 'Top Goalkeeper' },
      { position: 'G', historicalPoints: 110, name: 'Good Goalkeeper' },
      { position: 'G', historicalPoints: 80, name: 'Average Goalkeeper' },
      { position: 'G', historicalPoints: 40, name: 'Poor Goalkeeper' }
    ]

    mockReplacementLevels = {
      F: 100,
      M: 80,
      D: 70,
      G: 60
    }
  })

  describe('calculateHistoricalPoints', () => {
    it('should correctly calculate points for outfield player', () => {
      const points = calculateHistoricalPoints(mockPlayer, mockScoringRules)
      
      // Expected: (15*6) + (8*4) + (5*2) + (45*0.5) + (32*0.5) + (8*1) + (3*-1)
      // = 90 + 32 + 10 + 22.5 + 16 + 8 - 3 = 175.5
      expect(points).toBe(175.5)
    })

    it('should correctly calculate points for goalkeeper', () => {
      const goalkeeper = {
        ...mockPlayer,
        position: 'G',
        saves: 120,
        cleanSheets: 15,
        goals: 2
      }
      
      const points = calculateHistoricalPoints(goalkeeper, mockScoringRules)
      
      // Expected: (2*10) + (8*6) + (5*2) + (45*0.5) + (32*0.5) + (120*3) + (15*6) + (3*-1)
      // = 20 + 48 + 10 + 22.5 + 16 + 360 + 90 - 3 = 563.5
      expect(points).toBe(563.5)
    })

    it('should handle missing stats gracefully', () => {
      const incompletePlayer = {
        position: 'F',
        goals: 10
        // Missing other stats
      }
      
      const points = calculateHistoricalPoints(incompletePlayer, mockScoringRules)
      
      expect(points).toBe(60) // Only goals counted
      expect(points).toBeGreaterThan(0)
    })

    it('should handle negative stats correctly', () => {
      const penalizedPlayer = {
        ...mockPlayer,
        redCards: 2,
        ownGoals: 1,
        yellowCards: 8
      }
      
      const points = calculateHistoricalPoints(penalizedPlayer, mockScoringRules)
      
      // Should include negative points for cards and own goals
      expect(points).toBeLessThan(calculateHistoricalPoints(mockPlayer, mockScoringRules))
    })

    it('should return 0 for player with no stats', () => {
      const emptyPlayer = { position: 'M' }
      const points = calculateHistoricalPoints(emptyPlayer, mockScoringRules)
      
      expect(points).toBe(0)
    })
  })

  describe('calculateReplacementLevels', () => {
    it('should calculate correct replacement levels for all positions', () => {
      const levels = calculateReplacementLevels(mockPlayers)
      
      expect(levels).toHaveProperty('F')
      expect(levels).toHaveProperty('M')
      expect(levels).toHaveProperty('D')
      expect(levels).toHaveProperty('G')
      
      // Replacement level should be around the bottom third of players
      expect(levels.F).toBeGreaterThan(0)
      expect(levels.F).toBeLessThan(160) // Less than good forwards
    })

    it('should handle empty player list', () => {
      const levels = calculateReplacementLevels([])
      
      expect(levels.F).toBe(0)
      expect(levels.M).toBe(0)
      expect(levels.D).toBe(0)
      expect(levels.G).toBe(0)
    })

    it('should handle single player per position', () => {
      const singlePlayers = [
        { position: 'F', historicalPoints: 100 },
        { position: 'M', historicalPoints: 80 },
        { position: 'D', historicalPoints: 60 },
        { position: 'G', historicalPoints: 40 }
      ]
      
      const levels = calculateReplacementLevels(singlePlayers)
      
      // With only one player per position, replacement level should be 0
      expect(levels.F).toBe(0)
      expect(levels.M).toBe(0)
      expect(levels.D).toBe(0)
      expect(levels.G).toBe(0)
    })

    it('should calculate different levels for different positions', () => {
      const levels = calculateReplacementLevels(mockPlayers)
      
      // Different positions should have different replacement levels
      const uniqueLevels = new Set([levels.F, levels.M, levels.D, levels.G])
      expect(uniqueLevels.size).toBeGreaterThan(1)
    })
  })

  describe('calculateVORP', () => {
    it('should calculate positive VORP for above-replacement player', () => {
      const goodPlayer = { position: 'M', historicalPoints: 150 }
      const vorp = calculateVORP(goodPlayer, mockReplacementLevels)
      
      expect(vorp).toBeGreaterThan(0)
      expect(vorp).toBe(150 - mockReplacementLevels.M)
    })

    it('should calculate negative VORP for below-replacement player', () => {
      const poorPlayer = { position: 'M', historicalPoints: 50 }
      const vorp = calculateVORP(poorPlayer, mockReplacementLevels)
      
      expect(vorp).toBeLessThan(0)
      expect(vorp).toBe(50 - mockReplacementLevels.M)
    })

    it('should calculate zero VORP for replacement-level player', () => {
      const replacementPlayer = { position: 'M', historicalPoints: mockReplacementLevels.M }
      const vorp = calculateVORP(replacementPlayer, mockReplacementLevels)
      
      expect(vorp).toBe(0)
    })

    it('should handle invalid position', () => {
      const invalidPlayer = { position: 'INVALID', historicalPoints: 100 }
      const vorp = calculateVORP(invalidPlayer, mockReplacementLevels)
      
      expect(vorp).toBe(0)
    })

    it('should handle missing historicalPoints', () => {
      const incompletePlayer = { position: 'M' }
      const vorp = calculateVORP(incompletePlayer, mockReplacementLevels)
      
      expect(vorp).toBeLessThan(0) // 0 - replacement level = negative
    })
  })

  describe('createPlayerTiers', () => {
    it('should create tiers for all positions', () => {
      const tiers = createPlayerTiers(mockPlayers, mockReplacementLevels)
      
      expect(tiers).toHaveProperty('F')
      expect(tiers).toHaveProperty('M')
      expect(tiers).toHaveProperty('D')
      expect(tiers).toHaveProperty('G')
    })

    it('should assign players to appropriate tiers', () => {
      const tiers = createPlayerTiers(mockPlayers, mockReplacementLevels)
      
      // Top players should be in ELITE or HIGH tiers
      const topForward = tiers.F.find(p => p.name === 'Top Forward')
      expect(['ELITE', 'HIGH']).toContain(topForward.tier)
      
      // Poor players should be in LOW tier
      const poorForward = tiers.F.find(p => p.name === 'Poor Forward')
      expect(poorForward.tier).toBe('LOW')
    })

    it('should handle empty player list', () => {
      const tiers = createPlayerTiers([], mockReplacementLevels)
      
      expect(tiers.F).toEqual([])
      expect(tiers.M).toEqual([])
      expect(tiers.D).toEqual([])
      expect(tiers.G).toEqual([])
    })

    it('should sort players within each tier by VORP', () => {
      const tiers = createPlayerTiers(mockPlayers, mockReplacementLevels)
      
      // Check that players in each tier are sorted by VORP (highest first)
      Object.values(tiers).forEach(positionTiers => {
        if (positionTiers.length > 1) {
          for (let i = 0; i < positionTiers.length - 1; i++) {
            expect(positionTiers[i].vorp).toBeGreaterThanOrEqual(positionTiers[i + 1].vorp)
          }
        }
      })
    })
  })

  describe('getPlayerTierByName', () => {
    let mockTiers

    beforeEach(() => {
      mockTiers = {
        F: [
          { name: 'Elite Forward', tier: 'ELITE' },
          { name: 'High Forward', tier: 'HIGH' }
        ],
        M: [
          { name: 'Medium Midfielder', tier: 'MEDIUM' },
          { name: 'Low Midfielder', tier: 'LOW' }
        ]
      }
    })

    it('should return correct tier for existing player', () => {
      const tier = getPlayerTierByName('Elite Forward', mockTiers)
      expect(tier).toBe('ELITE')
    })

    it('should return null for non-existent player', () => {
      const tier = getPlayerTierByName('Unknown Player', mockTiers)
      expect(tier).toBeNull()
    })

    it('should handle empty tiers', () => {
      const tier = getPlayerTierByName('Any Player', {})
      expect(tier).toBeNull()
    })

    it('should be case sensitive', () => {
      const tier = getPlayerTierByName('elite forward', mockTiers)
      expect(tier).toBeNull()
    })
  })

  describe('getTierColor', () => {
    it('should return correct colors for all tiers', () => {
      expect(getTierColor('ELITE')).toBe('bg-purple-500')
      expect(getTierColor('HIGH')).toBe('bg-blue-500')
      expect(getTierColor('MEDIUM')).toBe('bg-green-500')
      expect(getTierColor('LOW')).toBe('bg-yellow-500')
      expect(getTierColor('REPLACEMENT')).toBe('bg-gray-500')
    })

    it('should return default color for unknown tier', () => {
      expect(getTierColor('UNKNOWN')).toBe('bg-gray-300')
      expect(getTierColor('')).toBe('bg-gray-300')
      expect(getTierColor(null)).toBe('bg-gray-300')
      expect(getTierColor(undefined)).toBe('bg-gray-300')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle players with zero minutes', () => {
      const noPlaytimePlayer = { ...mockPlayer, minutes: 0 }
      const points = calculateHistoricalPoints(noPlaytimePlayer, mockScoringRules)
      
      expect(typeof points).toBe('number')
      expect(isNaN(points)).toBe(false)
    })

    it('should handle extremely high stat values', () => {
      const superPlayer = {
        ...mockPlayer,
        goals: 1000,
        assists: 500,
        saves: 2000
      }
      
      const points = calculateHistoricalPoints(superPlayer, mockScoringRules)
      expect(points).toBeGreaterThan(0)
      expect(isFinite(points)).toBe(true)
    })

    it('should handle NaN values in player stats', () => {
      const nanPlayer = {
        ...mockPlayer,
        goals: NaN,
        assists: undefined,
        tackles: null
      }
      
      const points = calculateHistoricalPoints(nanPlayer, mockScoringRules)
      expect(isNaN(points)).toBe(false)
    })

    it('should handle malformed scoring rules', () => {
      const badRules = {
        goals: { F: NaN, M: undefined }
      }
      
      expect(() => calculateHistoricalPoints(mockPlayer, badRules)).not.toThrow()
    })

    it('should handle large datasets efficiently', () => {
      const largePlayers = Array(10000).fill().map((_, i) => ({
        position: ['F', 'M', 'D', 'G'][i % 4],
        historicalPoints: Math.random() * 200,
        name: `Player ${i}`
      }))
      
      const start = Date.now()
      const levels = calculateReplacementLevels(largePlayers)
      const tiers = createPlayerTiers(largePlayers, levels)
      const end = Date.now()
      
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
      expect(Object.keys(tiers)).toHaveLength(4)
    })
  })
}) 