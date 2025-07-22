import { describe, it, expect, beforeEach, vi } from 'vitest'
import { aiDraftPlayer, calculateDraftPosition } from '../../utils/draftLogic.js'

// Mock the draft strategy module
vi.mock('../../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn()
}))

import { getStrategicRecommendations } from '../../draftStrategy.js'

describe('Draft Logic Utils', () => {
  let mockTeam
  let mockAvailablePlayers
  let mockReplacementLevels
  let mockStrategicRecommendations

  beforeEach(() => {
    vi.clearAllMocks()

    mockTeam = {
      id: 1,
      name: 'Test Team',
      picks: [],
      positionLimits: {
        D: { minActive: 2, maxActive: 4, totalMax: 6 },
        M: { minActive: 3, maxActive: 5, totalMax: 6 },
        F: { minActive: 1, maxActive: 3, totalMax: 4 },
        G: { minActive: 1, maxActive: 1, totalMax: 2 }
      },
      maxTotalPlayers: 15,
      maxActivePlayers: 11
    }

    mockAvailablePlayers = [
      {
        id: 1,
        name: 'Elite Forward',
        position: 'F',
        team: 'ARS',
        historicalPoints: 200,
        vorp: 50
      },
      {
        id: 2,
        name: 'Good Midfielder',
        position: 'M',
        team: 'LIV',
        historicalPoints: 180,
        vorp: 40
      },
      {
        id: 3,
        name: 'Average Defender',
        position: 'D',
        team: 'MCI',
        historicalPoints: 120,
        vorp: 20
      },
      {
        id: 4,
        name: 'Poor Goalkeeper',
        position: 'G',
        team: 'CHE',
        historicalPoints: 80,
        vorp: 10
      },
      {
        id: 5,
        name: 'Another Forward',
        position: 'F',
        team: 'TOT',
        historicalPoints: 160,
        vorp: 30
      }
    ]

    mockReplacementLevels = {
      F: 100,
      M: 90,
      D: 80,
      G: 70
    }

    mockStrategicRecommendations = {
      recommendations: [
        {
          player: mockAvailablePlayers[0],
          score: 95,
          reasoning: 'Elite forward with high VORP'
        },
        {
          player: mockAvailablePlayers[1],
          score: 85,
          reasoning: 'Solid midfielder option'
        },
        {
          player: mockAvailablePlayers[2],
          score: 75,
          reasoning: 'Fills defensive need'
        }
      ],
      positionNeeds: ['F', 'M'],
      strategicPhase: 'early'
    }

    getStrategicRecommendations.mockReturnValue(mockStrategicRecommendations)
  })

  describe('aiDraftPlayer', () => {
    it('should draft the top strategic recommendation', () => {
      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        1,
        3,
        [],
        false,
        10
      )

      expect(selected).toEqual(mockAvailablePlayers[0])
      expect(getStrategicRecommendations).toHaveBeenCalledWith(
        mockTeam.picks,
        1,
        3,
        mockAvailablePlayers,
        mockReplacementLevels,
        10
      )
    })

    it('should return null when team is full', () => {
      const fullTeam = {
        ...mockTeam,
        picks: Array(15).fill({ position: 'M' })
      }

      const selected = aiDraftPlayer(
        fullTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        1,
        3
      )

      expect(selected).toBeNull()
    })

    it('should return null when no players available', () => {
      const selected = aiDraftPlayer(
        mockTeam,
        [],
        mockReplacementLevels,
        1,
        3
      )

      expect(selected).toBeNull()
    })

    it('should return null when no strategic recommendations', () => {
      getStrategicRecommendations.mockReturnValue({
        recommendations: [],
        positionNeeds: [],
        strategicPhase: 'late'
      })

      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        1,
        3
      )

      expect(selected).toBeNull()
    })

    it('should handle simulation mode correctly', () => {
      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        5,
        2,
        ['Drafted Player'],
        true,
        10
      )

      expect(getStrategicRecommendations).toHaveBeenCalledWith(
        mockTeam.picks,
        5,
        2,
        mockAvailablePlayers,
        mockReplacementLevels,
        10
      )
      expect(selected).toEqual(mockAvailablePlayers[0])
    })

    it('should prefer players that fill position needs', () => {
      // Mock recommendations where the second player fills a greater need
      const needBasedRecs = {
        recommendations: [
          {
            player: mockAvailablePlayers[1], // Midfielder
            score: 90,
            reasoning: 'Fills critical midfield need'
          },
          {
            player: mockAvailablePlayers[0], // Forward
            score: 85,
            reasoning: 'High VORP but position less needed'
          }
        ],
        positionNeeds: ['M', 'D'],
        strategicPhase: 'middle'
      }

      getStrategicRecommendations.mockReturnValue(needBasedRecs)

      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        3,
        5
      )

      expect(selected).toEqual(mockAvailablePlayers[1])
    })

    it('should handle edge case with single recommendation', () => {
      const singleRec = {
        recommendations: [
          {
            player: mockAvailablePlayers[2],
            score: 70,
            reasoning: 'Only viable option'
          }
        ],
        positionNeeds: ['D'],
        strategicPhase: 'late'
      }

      getStrategicRecommendations.mockReturnValue(singleRec)

      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        10,
        8
      )

      expect(selected).toEqual(mockAvailablePlayers[2])
    })

    it('should pass correct parameters to strategic recommendations', () => {
      const existingPicks = [
        { position: 'F', name: 'Existing Forward' },
        { position: 'M', name: 'Existing Midfielder' }
      ]
      
      const teamWithPicks = {
        ...mockTeam,
        picks: existingPicks
      }

      aiDraftPlayer(
        teamWithPicks,
        mockAvailablePlayers,
        mockReplacementLevels,
        6,
        4,
        ['Player1', 'Player2'],
        true,
        12
      )

      expect(getStrategicRecommendations).toHaveBeenCalledWith(
        existingPicks,
        6,
        4,
        mockAvailablePlayers,
        mockReplacementLevels,
        12
      )
    })

    it('should handle malformed strategic recommendations gracefully', () => {
      getStrategicRecommendations.mockReturnValue({
        recommendations: [
          { player: null, score: 90 }, // Invalid recommendation
          { player: mockAvailablePlayers[1], score: 80 }
        ]
      })

      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        1,
        1
      )

      // Should skip the invalid recommendation and select the valid one
      expect(selected).toEqual(mockAvailablePlayers[1])
    })

    it('should handle recommendations with missing players', () => {
      getStrategicRecommendations.mockReturnValue({
        recommendations: [
          {
            player: { id: 999, name: 'Unavailable Player' }, // Player not in available list
            score: 95
          },
          {
            player: mockAvailablePlayers[0],
            score: 85
          }
        ]
      })

      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        1,
        1
      )

      // Should select the player that's actually available
      expect(selected).toEqual(mockAvailablePlayers[0])
    })
  })

  describe('calculateDraftPosition', () => {
    it('should calculate correct position for snake draft odd rounds', () => {
      // Round 1: picks 1-10 go to positions 1-10
      expect(calculateDraftPosition(1, 10)).toBe(1)
      expect(calculateDraftPosition(5, 10)).toBe(5)
      expect(calculateDraftPosition(10, 10)).toBe(10)
    })

    it('should calculate correct position for snake draft even rounds', () => {
      // Round 2: picks 11-20 go to positions 10-1 (reversed)
      expect(calculateDraftPosition(11, 10)).toBe(10)
      expect(calculateDraftPosition(15, 10)).toBe(6)
      expect(calculateDraftPosition(20, 10)).toBe(1)
    })

    it('should handle different team counts', () => {
      // 8-team league
      expect(calculateDraftPosition(1, 8)).toBe(1)
      expect(calculateDraftPosition(8, 8)).toBe(8)
      expect(calculateDraftPosition(9, 8)).toBe(8) // Round 2, pick 1 -> position 8
      expect(calculateDraftPosition(16, 8)).toBe(1) // Round 2, pick 8 -> position 1

      // 12-team league  
      expect(calculateDraftPosition(1, 12)).toBe(1)
      expect(calculateDraftPosition(12, 12)).toBe(12)
      expect(calculateDraftPosition(13, 12)).toBe(12) // Round 2, pick 1 -> position 12
      expect(calculateDraftPosition(24, 12)).toBe(1) // Round 2, pick 12 -> position 1
    })

    it('should handle later rounds correctly', () => {
      // Round 3: picks 21-30 go to positions 1-10 (odd round)
      expect(calculateDraftPosition(21, 10)).toBe(1)
      expect(calculateDraftPosition(30, 10)).toBe(10)

      // Round 4: picks 31-40 go to positions 10-1 (even round)
      expect(calculateDraftPosition(31, 10)).toBe(10)
      expect(calculateDraftPosition(40, 10)).toBe(1)
    })

    it('should handle edge case of pick 0', () => {
      expect(calculateDraftPosition(0, 10)).toBe(10) // Wraps to last position
    })

    it('should handle single team league', () => {
      expect(calculateDraftPosition(1, 1)).toBe(1)
      expect(calculateDraftPosition(2, 1)).toBe(1)
      expect(calculateDraftPosition(10, 1)).toBe(1)
    })

    it('should handle very large pick numbers', () => {
      const largePick = 1000
      const teams = 10
      const position = calculateDraftPosition(largePick, teams)
      
      expect(position).toBeGreaterThanOrEqual(1)
      expect(position).toBeLessThanOrEqual(teams)
    })
  })

  describe('integration and edge cases', () => {
    it('should handle team with many existing picks', () => {
      const experiencedTeam = {
        ...mockTeam,
        picks: [
          { position: 'F', name: 'Forward 1' },
          { position: 'F', name: 'Forward 2' },
          { position: 'M', name: 'Midfielder 1' },
          { position: 'M', name: 'Midfielder 2' },
          { position: 'M', name: 'Midfielder 3' },
          { position: 'D', name: 'Defender 1' },
          { position: 'D', name: 'Defender 2' },
          { position: 'G', name: 'Goalkeeper 1' }
        ]
      }

      const selected = aiDraftPlayer(
        experiencedTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        12,
        7
      )

      expect(getStrategicRecommendations).toHaveBeenCalledWith(
        experiencedTeam.picks,
        12,
        7,
        mockAvailablePlayers,
        mockReplacementLevels,
        10
      )
    })

    it('should handle empty available players after team filtering', () => {
      getStrategicRecommendations.mockReturnValue({
        recommendations: [],
        positionNeeds: [],
        strategicPhase: 'desperate'
      })

      const selected = aiDraftPlayer(
        mockTeam,
        [],
        mockReplacementLevels,
        15,
        1
      )

      expect(selected).toBeNull()
    })

    it('should handle null replacement levels', () => {
      const selected = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        null,
        1,
        1
      )

      expect(getStrategicRecommendations).toHaveBeenCalledWith(
        mockTeam.picks,
        1,
        1,
        mockAvailablePlayers,
        null,
        10
      )
    })

    it('should maintain draft strategy consistency across multiple calls', () => {
      // First call
      const first = aiDraftPlayer(
        mockTeam,
        mockAvailablePlayers,
        mockReplacementLevels,
        1,
        1
      )

      // Update team with first pick
      const updatedTeam = {
        ...mockTeam,
        picks: [first]
      }

      // Remove selected player from available
      const remainingPlayers = mockAvailablePlayers.filter(p => p.id !== first.id)

      // Second call should get updated recommendations
      getStrategicRecommendations.mockReturnValue({
        recommendations: [
          {
            player: remainingPlayers[0],
            score: 80,
            reasoning: 'Best remaining option'
          }
        ]
      })

      const second = aiDraftPlayer(
        updatedTeam,
        remainingPlayers,
        mockReplacementLevels,
        21,
        1
      )

      expect(getStrategicRecommendations).toHaveBeenCalledTimes(2)
      expect(second).toBeDefined()
      expect(second.id).not.toBe(first.id)
    })

    describe('error handling', () => {
      it('should handle strategic recommendations throwing error', () => {
        getStrategicRecommendations.mockImplementation(() => {
          throw new Error('Strategic calculation failed')
        })

        expect(() => aiDraftPlayer(
          mockTeam,
          mockAvailablePlayers,
          mockReplacementLevels,
          1,
          1
        )).toThrow('Strategic calculation failed')
      })

      it('should handle malformed team object', () => {
        const badTeam = {
          id: 1,
          // Missing required properties
        }

        const selected = aiDraftPlayer(
          badTeam,
          mockAvailablePlayers,
          mockReplacementLevels,
          1,
          1
        )

        // Should still call strategic recommendations but may handle gracefully
        expect(getStrategicRecommendations).toHaveBeenCalled()
      })

      it('should handle negative draft positions and rounds', () => {
        const selected = aiDraftPlayer(
          mockTeam,
          mockAvailablePlayers,
          mockReplacementLevels,
          -1,
          -1
        )

        expect(getStrategicRecommendations).toHaveBeenCalledWith(
          mockTeam.picks,
          -1,
          -1,
          mockAvailablePlayers,
          mockReplacementLevels,
          10
        )
      })
    })
  })
}) 