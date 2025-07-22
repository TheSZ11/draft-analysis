import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayerData } from '../../hooks/usePlayerData.js'

// Mock data
const mockPlayers = [
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
    name: 'Goalkeeper',
    position: 'G',
    team: 'TOT',
    historicalPoints: 100,
    vorp: 15
  },
  {
    id: 5,
    name: 'Poor Forward',
    position: 'F',
    team: 'CHE',
    historicalPoints: 80,
    vorp: 5
  }
]

const mockReplacementLevels = {
  F: 100,
  M: 120,
  D: 90,
  G: 80
}

const mockPlayerTiers = {
  F: [
    { name: 'Elite Forward', tier: 'ELITE' }
  ],
  M: [
    { name: 'Good Midfielder', tier: 'HIGH' }
  ],
  D: [
    { name: 'Average Defender', tier: 'MEDIUM' }
  ],
  G: [
    { name: 'Goalkeeper', tier: 'LOW' }
  ]
}

// Mock external dependencies
vi.mock('../../utils/dataProcessing.js', () => ({
  fetchPlayerData: vi.fn(),
  updatePlayerCalculations: vi.fn()
}))

vi.mock('../../utils/draftLogic.js', () => ({
  getRecommendations: vi.fn(),
  getAvailablePlayers: vi.fn()
}))

vi.mock('../../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn()
}))

import { 
  fetchPlayerData, 
  updatePlayerCalculations 
} from '../../utils/dataProcessing.js'
import { 
  getRecommendations,
  getAvailablePlayers
} from '../../utils/draftLogic.js'
import { getStrategicRecommendations } from '../../draftStrategy.js'

describe('usePlayerData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Standard mock setup that most tests expect
    fetchPlayerData.mockResolvedValue({
      players: mockPlayers,
      replacementLevels: mockReplacementLevels,
      playerTiers: mockPlayerTiers
    })
    
    updatePlayerCalculations.mockReturnValue({
      replacementLevels: mockReplacementLevels,
      playerTiers: mockPlayerTiers
    })
    
    getRecommendations.mockReturnValue([])
    getAvailablePlayers.mockReturnValue(mockPlayers)
    getStrategicRecommendations.mockReturnValue({
      recommendations: [],
      insights: [],
      rosterAnalysis: null
    })
  })

  describe('initialization', () => {
    it('should initialize with correct default values', async () => {
      const { result } = renderHook(() => usePlayerData())

      // Initial state
      expect(result.current.loading).toBe(true)
      expect(result.current.availablePlayers).toEqual([])
      expect(result.current.replacementLevels).toEqual({})
      expect(result.current.playerTiers).toEqual([])
      expect(result.current.error).toBe(null)

      // Wait for initialization to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.availablePlayers).toEqual(mockPlayers)
      expect(result.current.replacementLevels).toEqual(mockReplacementLevels)
      expect(result.current.playerTiers).toEqual(mockPlayerTiers)
    })

    it('should provide all required functions', () => {
      const { result } = renderHook(() => usePlayerData())

      expect(typeof result.current.initializePlayerData).toBe('function')
      expect(typeof result.current.updateCalculations).toBe('function')
      expect(typeof result.current.getStrategicRecommendations).toBe('function')
      expect(typeof result.current.getAvailablePlayers).toBe('function')
      expect(typeof result.current.findPlayerByName).toBe('function')
      expect(typeof result.current.getPlayerStats).toBe('function')
      expect(typeof result.current.getPlayerTier).toBe('function')
      expect(typeof result.current.resetPlayerData).toBe('function')
    })

    it('should handle initialization errors', async () => {
      const errorMessage = 'Failed to fetch player data'
      fetchPlayerData.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.availablePlayers).toEqual([])
    })
  })

  describe('player data management', () => {
    it('should update calculations when drafted players change', async () => {
      const { result } = renderHook(() => usePlayerData())

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const draftedPlayers = ['Elite Forward', 'Good Midfielder']
      
      act(() => {
        result.current.updateCalculations(draftedPlayers)
      })

      expect(updatePlayerCalculations).toHaveBeenCalledWith(mockPlayers, draftedPlayers)
    })

    it('should not update calculations with empty player list', async () => {
      const { result } = renderHook(() => usePlayerData())

      // Reset to empty players
      act(() => {
        result.current.setAvailablePlayers([])
      })

      act(() => {
        result.current.updateCalculations(['Player Name'])
      })

      expect(updatePlayerCalculations).not.toHaveBeenCalled()
    })

    it('should find player by name correctly', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const foundPlayer = result.current.findPlayerByName('Elite Forward')
      expect(foundPlayer).toEqual(mockPlayers[0])

      const notFound = result.current.findPlayerByName('Nonexistent Player')
      expect(notFound).toBeUndefined()
    })
  })

  describe('strategic recommendations', () => {
    it('should get strategic recommendations successfully', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const mockRoster = []
      const mockRound = 1
      const mockPosition = 3
      const mockAvailable = mockPlayers
      const mockLevels = mockReplacementLevels

      const recommendations = result.current.getStrategicRecommendations(
        mockRoster, mockRound, mockPosition, mockAvailable, mockLevels, 10
      )

      expect(getStrategicRecommendations).toHaveBeenCalledWith(
        mockRoster, mockRound, mockPosition, mockAvailable, mockLevels, 10
      )
      expect(recommendations).toEqual({
        recommendations: [],
        insights: [],
        rosterAnalysis: null
      })
    })

    it('should handle strategic recommendation errors gracefully', async () => {
      getStrategicRecommendations.mockImplementation(() => {
        throw new Error('Strategic calculation failed')
      })

      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const recommendations = result.current.getStrategicRecommendations(
        [], 1, 1, mockPlayers, mockReplacementLevels
      )

      expect(recommendations).toEqual({
        recommendations: [],
        insights: [],
        rosterAnalysis: null
      })
    })
  })

  describe('player filtering and search', () => {
    it('should get available players with filtering', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const draftedPlayers = ['Elite Forward']
      const currentTeam = { id: 1, picks: [] }
      const position = 'F'
      const searchTerm = 'midfielder'

      const available = result.current.getAvailablePlayers(
        draftedPlayers, currentTeam, position, searchTerm
      )

      expect(getAvailablePlayers).toHaveBeenCalledWith(
        mockPlayers, draftedPlayers, currentTeam, position, searchTerm, mockReplacementLevels
      )
      expect(available).toEqual(mockPlayers)
    })

    it('should handle default parameters in getAvailablePlayers', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      result.current.getAvailablePlayers()

      expect(getAvailablePlayers).toHaveBeenCalledWith(
        mockPlayers, [], null, 'ALL', '', mockReplacementLevels
      )
    })
  })

  describe('player statistics', () => {
    it('should calculate player statistics correctly', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const stats = result.current.getPlayerStats()

      expect(stats.totalPlayers).toBe(mockPlayers.length)
      expect(stats.byPosition).toEqual({
        F: 2, // Elite Forward, Poor Forward
        M: 1, // Good Midfielder
        D: 1, // Average Defender
        G: 1  // Goalkeeper
      })
      expect(stats.averagePoints).toBeGreaterThan(0)
      expect(stats.topPlayer).toEqual(mockPlayers[0]) // Elite Forward has highest points
    })

    it('should handle empty player list for statistics', async () => {
      const { result } = renderHook(() => usePlayerData())

      act(() => {
        result.current.setAvailablePlayers([])
      })

      const stats = result.current.getPlayerStats()

      expect(stats).toEqual({
        totalPlayers: 0,
        byPosition: { F: 0, M: 0, D: 0, G: 0 },
        averagePoints: 0,
        topPlayer: null
      })
    })
  })

  describe('player tiers', () => {
    it('should get player tier information correctly', async () => {
      // For this test, use a special mock setup to prevent auto-initialization interference
      fetchPlayerData.mockResolvedValue({
        players: [],
        replacementLevels: {},
        playerTiers: {}
      })

      // Mock playerTiers in the format that createPlayerTiers actually returns
      const mockTiersObject = {
        F: [
          { ...mockPlayers[0], tier: 'ELITE' },     // Elite Forward - Tier 1
          { ...mockPlayers[4], tier: 'LOW' }        // Poor Forward - Tier 4  
        ],
        M: [
          { ...mockPlayers[1], tier: 'HIGH' }       // Good Midfielder - Tier 2
        ],
        D: [
          { ...mockPlayers[2], tier: 'MEDIUM' }     // Average Defender - Tier 3
        ],
        G: [
          { ...mockPlayers[3], tier: 'LOW' }        // Goalkeeper - Tier 4
        ]
      }

      const { result } = renderHook(() => usePlayerData())

      // Wait for auto-initialization to complete with empty data
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Then set our custom tier data
      await act(async () => {
        result.current.setPlayerTiers(mockTiersObject)
      })

      const tier1 = result.current.getPlayerTier('Elite Forward')
      expect(tier1).toEqual({
        tier: 1,
        tierSize: 1, // Only 1 ELITE player
        totalTiers: 4
      })

      const tier4 = result.current.getPlayerTier('Poor Forward')
      expect(tier4).toEqual({
        tier: 4,
        tierSize: 2, // 2 LOW tier players (Poor Forward + Goalkeeper)
        totalTiers: 4
      })

      const noTier = result.current.getPlayerTier('Nonexistent Player')
      expect(noTier).toBeNull()
    })

    it('should handle empty player tiers', async () => {
      const { result } = renderHook(() => usePlayerData())

      act(() => {
        result.current.setPlayerTiers([])
      })

      const tier = result.current.getPlayerTier('Elite Forward')
      expect(tier).toBeNull()
    })
  })

  describe('data reset and cleanup', () => {
    it('should reset all player data', async () => {
      const { result } = renderHook(() => usePlayerData())

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Verify data is loaded
      expect(result.current.availablePlayers.length).toBeGreaterThan(0)

      // Reset data
      act(() => {
        result.current.resetPlayerData()
      })

      // Verify reset
      expect(result.current.availablePlayers).toEqual([])
      expect(result.current.replacementLevels).toEqual({})
      expect(result.current.playerTiers).toEqual([])
      expect(result.current.strategicData).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('should allow manual data updates via setters', async () => {
      const { result } = renderHook(() => usePlayerData())

      const newPlayers = [mockPlayers[0]]
      const newLevels = { F: 100 }

      act(() => {
        result.current.setAvailablePlayers(newPlayers)
        result.current.setReplacementLevels(newLevels)
        result.current.setLoading(false)
      })

      expect(result.current.availablePlayers).toEqual(newPlayers)
      expect(result.current.replacementLevels).toEqual(newLevels)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Test with null inputs
      expect(() => {
        result.current.updateCalculations(null)
      }).not.toThrow()

      expect(() => {
        result.current.getAvailablePlayers(null, null, null, null)
      }).not.toThrow()

      expect(() => {
        result.current.findPlayerByName(null)
      }).not.toThrow()

      expect(() => {
        result.current.getPlayerTier(null)
      }).not.toThrow()
    })

    it('should handle malformed player data', async () => {
      const malformedData = {
        players: [
          { name: 'Player 1' }, // Missing required fields
          { position: 'F' }, // Missing name
          null, // Null player
          { name: 'Valid Player', position: 'M', historicalPoints: 100 }
        ],
        replacementLevels: null,
        playerTiers: undefined
      }

      fetchPlayerData.mockResolvedValue(malformedData)

      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.availablePlayers).toEqual(malformedData.players)
    })

    it('should handle concurrent state updates', async () => {
      const { result } = renderHook(() => usePlayerData())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate rapid concurrent updates
      act(() => {
        result.current.setAvailablePlayers([mockPlayers[0]])
        result.current.setAvailablePlayers([mockPlayers[1]])
        result.current.setAvailablePlayers([mockPlayers[2]])
      })

      expect(result.current.availablePlayers).toEqual([mockPlayers[2]])
    })
  })
}) 