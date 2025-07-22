import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFixtures } from '../../hooks/useFixtures.js'

// Mock external dependencies
vi.mock('../../utils/dataProcessing.js', () => ({
  fetchFixtures: vi.fn(),
  getTeamFixtureIndicators: vi.fn(),
  getUpcomingFixturesText: vi.fn(),
  getFixtureDifficultyScore: vi.fn()
}))

vi.mock('../../fixtureData.json', () => ({
  default: {
    LIV: [
      { opponent: 'MCI', matchweek: 1, home: true, difficulty: 4 },
      { opponent: 'ARS', matchweek: 2, home: false, difficulty: 3 }
    ],
    MCI: [
      { opponent: 'LIV', matchweek: 1, home: false, difficulty: 3 },
      { opponent: 'CHE', matchweek: 2, home: true, difficulty: 2 }
    ]
  }
}))

import { 
  fetchFixtures, 
  getTeamFixtureIndicators, 
  getUpcomingFixturesText, 
  getFixtureDifficultyScore 
} from '../../utils/dataProcessing.js'

describe('useFixtures Hook', () => {
  let mockFixtureData

  beforeEach(() => {
    vi.clearAllMocks()

    mockFixtureData = {
      LIV: [
        { opponent: 'MCI', matchweek: 1, home: true, difficulty: 4 },
        { opponent: 'ARS', matchweek: 2, home: false, difficulty: 3 },
        { opponent: 'TOT', matchweek: 3, home: true, difficulty: 2 }
      ],
      MCI: [
        { opponent: 'LIV', matchweek: 1, home: false, difficulty: 3 },
        { opponent: 'CHE', matchweek: 2, home: true, difficulty: 2 },
        { opponent: 'AVL', matchweek: 3, home: false, difficulty: 1 }
      ],
      ARS: [
        { opponent: 'NEW', matchweek: 1, home: true, difficulty: 1 },
        { opponent: 'LIV', matchweek: 2, home: true, difficulty: 4 },
        { opponent: 'BRI', matchweek: 3, home: false, difficulty: 2 }
      ]
    }

    fetchFixtures.mockReturnValue(mockFixtureData)
    getTeamFixtureIndicators.mockReturnValue([
      { opponent: 'MCI', difficulty: 4 },
      { opponent: 'ARS', difficulty: 3 },
      { opponent: 'TOT', difficulty: 2 }
    ])
    getUpcomingFixturesText.mockReturnValue('MCI(H), ARS(A), TOT(H)')
    getFixtureDifficultyScore.mockReturnValue(3.0)
  })

  describe('initialization', () => {
    it('should initialize with correct default values', async () => {
      const { result } = renderHook(() => useFixtures())

      // Check only error state initially since fixtures are loaded immediately
      expect(result.current.error).toBe(null)

      // Wait for the async initialization to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // After initialization, loading should be false and fixtures should be loaded
      expect(result.current.loading).toBe(false)
      expect(typeof result.current.fixtures).toBe('object')
      expect(result.current.fixtures).not.toBe(null)
    })

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useFixtures())

      expect(typeof result.current.initializeFixtures).toBe('function')
      expect(typeof result.current.getTeamFixtures).toBe('function')
      expect(typeof result.current.getUpcomingIndicators).toBe('function')
      expect(typeof result.current.getUpcomingText).toBe('function')
      expect(typeof result.current.getDifficultyScore).toBe('function')
      expect(typeof result.current.getNextFixture).toBe('function')
      expect(typeof result.current.getGameweekFixtures).toBe('function')
      expect(typeof result.current.getEasiestFixtures).toBe('function')
      expect(typeof result.current.getHardestFixtures).toBe('function')
      expect(typeof result.current.hasFixtureData).toBe('function')
      expect(typeof result.current.getFixtureStats).toBe('function')
      expect(typeof result.current.resetFixtures).toBe('function')
    })

    it('should auto-initialize fixtures on mount', async () => {
      const { result } = renderHook(() => useFixtures())

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(fetchFixtures).toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
      expect(result.current.fixtures).toEqual(mockFixtureData)
    })

    it('should handle initialization errors', async () => {
      const errorMessage = 'Failed to fetch fixtures'
      fetchFixtures.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.fixtures).toEqual({})
    })
  })

  describe('team fixture management', () => {
    beforeEach(async () => {
      // Wait for initialization to complete in each test
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
    })

    it('should get team fixtures correctly', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const livFixtures = result.current.getTeamFixtures('LIV')
      expect(livFixtures).toEqual(mockFixtureData.LIV)

      const nonExistentFixtures = result.current.getTeamFixtures('INVALID')
      expect(nonExistentFixtures).toEqual([])
    })

    it('should get upcoming fixture indicators', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const indicators = result.current.getUpcomingIndicators('LIV', 3)

      expect(getTeamFixtureIndicators).toHaveBeenCalledWith('LIV', mockFixtureData, 3)
      expect(indicators).toEqual([
        { opponent: 'MCI', difficulty: 4 },
        { opponent: 'ARS', difficulty: 3 },
        { opponent: 'TOT', difficulty: 2 }
      ])
    })

    it('should get upcoming fixtures as text', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const text = result.current.getUpcomingText('LIV', 3)

      expect(getUpcomingFixturesText).toHaveBeenCalledWith('LIV', mockFixtureData, 3)
      expect(text).toBe('MCI(H), ARS(A), TOT(H)')
    })

    it('should get difficulty score', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const score = result.current.getDifficultyScore('LIV', 6)

      expect(getFixtureDifficultyScore).toHaveBeenCalledWith('LIV', mockFixtureData, 6)
      expect(score).toBe(3.0)
    })

    it('should get next fixture', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const nextFixture = result.current.getNextFixture('LIV')
      expect(nextFixture).toEqual(mockFixtureData.LIV[0])

      const noFixture = result.current.getNextFixture('INVALID')
      expect(noFixture).toBe(null)
    })

    it('should check if fixture data exists', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const hasLivData = result.current.hasFixtureData('LIV')
      const hasInvalidData = result.current.hasFixtureData('INVALID')
      
      expect(hasLivData).toBe(true)
      expect(hasInvalidData).toBe(false)
    })
  })

  describe('gameweek fixture management', () => {
    it('should get fixtures for specific gameweek', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const gameweek1Fixtures = result.current.getGameweekFixtures(1)

      // Should only include home fixtures to avoid duplicates
      expect(gameweek1Fixtures).toHaveLength(2) // LIV vs MCI, ARS vs NEW
      expect(gameweek1Fixtures).toEqual([
        {
          matchweek: 1,
          homeTeam: 'LIV',
          awayTeam: 'MCI',
          difficulty: 4,
          opponent: 'MCI',
          home: true
        },
        {
          matchweek: 1,
          homeTeam: 'ARS',
          awayTeam: 'NEW',
          difficulty: 1,
          opponent: 'NEW',
          home: true
        }
      ])
    })

    it('should return empty array for non-existent gameweek', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const nonExistentGameweek = result.current.getGameweekFixtures(999)
      expect(nonExistentGameweek).toEqual([])
    })
  })

  describe('fixture difficulty analysis', () => {
    it('should get teams with easiest fixtures', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Mock different difficulty scores for each team
      getFixtureDifficultyScore
        .mockReturnValueOnce(3.0) // LIV
        .mockReturnValueOnce(2.0) // MCI  
        .mockReturnValueOnce(2.5) // ARS

      const easiestFixtures = result.current.getEasiestFixtures(6, 3)

      expect(easiestFixtures).toHaveLength(3)
      expect(easiestFixtures[0].team).toBe('MCI') // Lowest difficulty first
      expect(easiestFixtures[0].difficulty).toBe(2.0)
      expect(easiestFixtures[1].team).toBe('ARS')
      expect(easiestFixtures[2].team).toBe('LIV')
    })

    it('should get teams with hardest fixtures', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Mock different difficulty scores
      getFixtureDifficultyScore
        .mockReturnValueOnce(3.0) // LIV
        .mockReturnValueOnce(2.0) // MCI
        .mockReturnValueOnce(2.5) // ARS

      const hardestFixtures = result.current.getHardestFixtures(6, 3)

      expect(hardestFixtures).toHaveLength(3)
      expect(hardestFixtures[0].team).toBe('LIV') // Highest difficulty first
      expect(hardestFixtures[0].difficulty).toBe(3.0)
      expect(hardestFixtures[1].team).toBe('ARS')
      expect(hardestFixtures[2].team).toBe('MCI')
    })

    it('should limit results for easiest fixtures', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const limitedResults = result.current.getEasiestFixtures(6, 1)
      expect(limitedResults).toHaveLength(1)
    })
  })

  describe('fixture statistics', () => {
    it('should calculate fixture statistics correctly', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const stats = result.current.getFixtureStats()

      expect(stats.totalTeams).toBe(3) // LIV, MCI, ARS
      expect(stats.totalFixtures).toBe(9) // 3 fixtures per team
      expect(stats.averageFixturesPerTeam).toBe(3)
      expect(stats.averageDifficulty).toBeGreaterThan(0)
      expect(stats.hasData).toBe(true)
    })

    it('should handle empty fixture data for statistics', async () => {
      fetchFixtures.mockReturnValue({})
      
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const stats = result.current.getFixtureStats()

      expect(stats).toEqual({
        totalTeams: 0,
        totalFixtures: 0,
        averageFixturesPerTeam: 0,
        averageDifficulty: 0,
        hasData: false
      })
    })
  })

  describe('fixture reset and cleanup', () => {
    it('should reset fixture data', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Verify data is loaded
      expect(Object.keys(result.current.fixtures)).toHaveLength(3)

      // Reset fixtures
      act(() => {
        result.current.resetFixtures()
      })

      expect(result.current.fixtures).toEqual({})
      expect(result.current.error).toBe(null)
    })

    it('should allow manual data updates via setters', async () => {
      const { result } = renderHook(() => useFixtures())

      const newFixtures = { CHE: [{ opponent: 'MUN', matchweek: 1, difficulty: 3 }] }

      act(() => {
        result.current.setFixtures(newFixtures)
        result.current.setLoading(false)
        result.current.setError('Test error')
      })

      expect(result.current.fixtures).toEqual(newFixtures)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Test error')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(() => {
        result.current.getTeamFixtures(null)
      }).not.toThrow()

      expect(() => {
        result.current.getUpcomingIndicators(null, null)
      }).not.toThrow()

      expect(() => {
        result.current.getDifficultyScore(null, null)
      }).not.toThrow()

      expect(() => {
        result.current.getGameweekFixtures(null)
      }).not.toThrow()
    })

    it('should handle malformed fixture data', async () => {
      const malformedData = {
        LIV: [
          { opponent: 'MCI' }, // Missing matchweek, difficulty
          null, // Null fixture
          { matchweek: 2, difficulty: 3 } // Missing opponent
        ],
        INVALID_TEAM: null
      }

      fetchFixtures.mockReturnValue(malformedData)

      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.fixtures).toEqual(malformedData)

      expect(() => {
        result.current.getFixtureStats()
      }).not.toThrow()

      expect(() => {
        result.current.getGameweekFixtures(1)
      }).not.toThrow()
    })

    it('should handle missing utility functions', async () => {
      getTeamFixtureIndicators.mockImplementation(() => {
        throw new Error('Function not available')
      })

      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(() => {
        result.current.getUpcomingIndicators('LIV')
      }).toThrow('Function not available')
    })

    it('should handle concurrent state updates', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate rapid concurrent updates
      act(() => {
        result.current.setFixtures({ team1: [] })
        result.current.setFixtures({ team2: [] })
        result.current.setFixtures({ team3: [] })
        result.current.setLoading(true)
        result.current.setLoading(false)
      })

      expect(result.current.fixtures).toEqual({ team3: [] })
      expect(result.current.loading).toBe(false)
    })

    it('should maintain referential equality when appropriate', () => {
      const { result, rerender } = renderHook(() => useFixtures())

      const firstFunctions = {
        getTeamFixtures: result.current.getTeamFixtures,
        resetFixtures: result.current.resetFixtures,
        getFixtureStats: result.current.getFixtureStats
      }

      rerender()

      expect(result.current.getTeamFixtures).toBe(firstFunctions.getTeamFixtures)
      expect(result.current.resetFixtures).toBe(firstFunctions.resetFixtures)
      expect(result.current.getFixtureStats).toBe(firstFunctions.getFixtureStats)
    })

    it('should handle default parameter values correctly', async () => {
      const { result } = renderHook(() => useFixtures())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Test default parameter handling
      result.current.getUpcomingIndicators('LIV') // Should use default count = 3
      expect(getTeamFixtureIndicators).toHaveBeenCalledWith('LIV', mockFixtureData, 3)

      result.current.getUpcomingText('LIV') // Should use default count = 3
      expect(getUpcomingFixturesText).toHaveBeenCalledWith('LIV', mockFixtureData, 3)

      result.current.getDifficultyScore('LIV') // Should use default gameweeks = 6
      expect(getFixtureDifficultyScore).toHaveBeenCalledWith('LIV', mockFixtureData, 6)

      result.current.getEasiestFixtures() // Should use defaults: gameweeks = 6, limit = 5
      result.current.getHardestFixtures() // Should use defaults: gameweeks = 6, limit = 5
    })
  })
}) 