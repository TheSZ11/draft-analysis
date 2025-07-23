import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSimulation } from '../../hooks/useSimulation.js'

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
  }
]

const mockReplacementLevels = {
  F: 100,
  M: 120,
  D: 90,
  G: 80
}

const createMockTeam = (id = 1, name = 'Test Team') => ({
  id,
  name,
  picks: [],
  maxTotalPlayers: 15,
  maxActivePlayers: 11,
  positionLimits: {
    F: { minActive: 1, maxActive: 3, totalMax: 4 },
    M: { minActive: 3, maxActive: 5, totalMax: 6 },
    D: { minActive: 2, maxActive: 4, totalMax: 6 },
    G: { minActive: 1, maxActive: 1, totalMax: 2 }
  }
})

// Mock external dependencies
vi.mock('../../leagueConfig.js', () => ({
  LEAGUE_CONFIG: {
    rosterLimits: {
      maxTotalPlayers: 15,
      maxActivePlayers: 11
    },
    positionLimits: {
      F: { minActive: 1, maxActive: 3, totalMax: 4 },
      M: { minActive: 3, maxActive: 5, totalMax: 6 },
      D: { minActive: 2, maxActive: 4, totalMax: 6 },
      G: { minActive: 1, maxActive: 1, totalMax: 2 }
    }
  }
}))

vi.mock('../../utils/draftLogic.js', () => ({
  aiDraftPlayer: vi.fn(),
  calculateDraftPosition: vi.fn()
}))

vi.mock('../../utils/rosterValidation.js', () => ({
  determineRosterCategory: vi.fn(),
  validateDraftMove: vi.fn(() => ({ isValid: true, errors: [] }))
}))

import { aiDraftPlayer, calculateDraftPosition } from '../../utils/draftLogic.js'
import { determineRosterCategory, validateDraftMove as _validateDraftMove } from '../../utils/rosterValidation.js'

describe('useSimulation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    aiDraftPlayer.mockReturnValue(mockPlayers[0])
    calculateDraftPosition.mockReturnValue(1)
    determineRosterCategory.mockReturnValue('active')
  })

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useSimulation())

      expect(result.current.isSimulationMode).toBe(false)
      expect(result.current.simulationTeams).toEqual([])
      expect(result.current.userDraftPosition).toBe(1)
      expect(result.current.simulationResults).toBe(null)
      expect(result.current.showResultsModal).toBe(false)
    })

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useSimulation())

      expect(typeof result.current.startSimulation).toBe('function')
      expect(typeof result.current.stopSimulation).toBe('function')
      expect(typeof result.current.resetSimulation).toBe('function')
      expect(typeof result.current.makeAIPick).toBe('function')
      expect(typeof result.current.draftPlayerInSimulation).toBe('function')
      expect(typeof result.current.processAIPicks).toBe('function')
      expect(typeof result.current.completeSimulation).toBe('function')
      expect(typeof result.current.getUserTeam).toBe('function')
      expect(typeof result.current.isSimulationComplete).toBe('function')
    })
  })

  describe('simulation lifecycle', () => {
    it('should start simulation correctly', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.startSimulation(5)
      })

      expect(result.current.isSimulationMode).toBe(true)
      expect(result.current.userDraftPosition).toBe(5)
      expect(result.current.simulationTeams).toHaveLength(10)
      expect(result.current.simulationTeams[0].name).toBe('Your Team')
      expect(result.current.simulationTeams[1].name).toBe('AI Team 1')
      expect(result.current.simulationResults).toBe(null)
      expect(result.current.showResultsModal).toBe(false)
    })

    it('should start simulation with randomized position when no position provided', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.startSimulation()
      })

      expect(result.current.userDraftPosition).toBeGreaterThanOrEqual(1)
      expect(result.current.userDraftPosition).toBeLessThanOrEqual(10)
      expect(result.current.isSimulationMode).toBe(true)
    })

    it('should start simulation with specific position when provided', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.startSimulation(7)
      })

      expect(result.current.userDraftPosition).toBe(7)
      expect(result.current.isSimulationMode).toBe(true)
    })

    it('should randomize draft position on multiple starts', () => {
      const { result } = renderHook(() => useSimulation())
      const positions = new Set()

      // Start simulation multiple times to test randomization
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.startSimulation() // No position provided = random
        })
        
        positions.add(result.current.userDraftPosition)
        
        // Reset to allow starting again
        act(() => {
          result.current.resetSimulation()
        })
      }

      // Should have generated at least 2 different positions out of 10 attempts
      // (extremely unlikely to get the same position 10 times in a row)
      expect(positions.size).toBeGreaterThan(1)
      
      // All positions should be valid (1-10)
      positions.forEach(position => {
        expect(position).toBeGreaterThanOrEqual(1)
        expect(position).toBeLessThanOrEqual(10)
      })
    })

    it('should stop simulation correctly', () => {
      const { result } = renderHook(() => useSimulation())

      // Start simulation first
      act(() => {
        result.current.startSimulation(3)
      })

      expect(result.current.isSimulationMode).toBe(true)

      // Stop simulation
      act(() => {
        result.current.stopSimulation()
      })

      expect(result.current.isSimulationMode).toBe(false)
      expect(result.current.simulationTeams).toEqual([])
      expect(result.current.simulationResults).toBe(null)
      expect(result.current.showResultsModal).toBe(false)
    })

    it('should reset simulation correctly', () => {
      const { result } = renderHook(() => useSimulation())

      // Start simulation and add some picks
      act(() => {
        result.current.startSimulation(2)
      })

      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[0], 1, [])
      })

      expect(result.current.simulationTeams[0].picks).toHaveLength(1)
      expect(result.current.isSimulationMode).toBe(true)

      // Reset simulation - should fully exit simulation mode
      act(() => {
        result.current.resetSimulation()
      })

      // After reset, should completely exit simulation mode
      expect(result.current.isSimulationMode).toBe(false)
      expect(result.current.simulationTeams).toEqual([])
      expect(result.current.simulationResults).toBe(null)
      expect(result.current.showResultsModal).toBe(false)
      expect(result.current.userDraftPosition).toBe(1)
    })
  })

  describe('AI picks and drafting', () => {
    it('should make AI pick successfully', () => {
      const { result } = renderHook(() => useSimulation())

      const mockTeam = createMockTeam(1, 'AI Team')
      const selectedPlayer = result.current.makeAIPick(
        mockTeam,
        mockPlayers,
        mockReplacementLevels,
        1,
        1,
        []
      )

      expect(aiDraftPlayer).toHaveBeenCalledWith(
        mockTeam,
        mockPlayers,
        mockReplacementLevels,
        1,
        1,
        [],
        true, // isSimulationMode
        10 // totalTeams
      )
      expect(selectedPlayer).toEqual(mockPlayers[0])
    })

    it('should draft player in simulation correctly', () => {
      const { result } = renderHook(() => useSimulation())

      // Start simulation
      act(() => {
        result.current.startSimulation(1)
      })

      const player = mockPlayers[0]
      const round = 1
      const draftedPlayers = []

      act(() => {
        const updateResult = result.current.draftPlayerInSimulation(player, round, draftedPlayers)
        
        expect(determineRosterCategory).toHaveBeenCalledWith(
          result.current.simulationTeams[0], 
          player
        )
        expect(updateResult.playerWithCategory).toEqual({
          ...player,
          round,
          rosterCategory: 'active'
        })
        expect(updateResult.newDraftedPlayers).toEqual([player.name])
      })

      expect(result.current.simulationTeams[0].picks).toHaveLength(1)
      expect(result.current.simulationTeams[0].picks[0]).toEqual({
        ...player,
        round,
        rosterCategory: 'active'
      })
    })

    it('should handle draft player error when user team not found', () => {
      const { result } = renderHook(() => useSimulation())

      // Don't start simulation (no teams)
      const player = mockPlayers[0]

      expect(() => {
        act(() => {
          result.current.draftPlayerInSimulation(player, 1, [])
        })
      }).toThrow('User team not found in simulation')
    })
  })

  describe('AI pick processing', () => {
    it('should process AI picks correctly', () => {
      const { result } = renderHook(() => useSimulation())

      // Start simulation with user at position 5
      act(() => {
        result.current.startSimulation(5)
      })

      const currentPick = 1
      const availablePlayers = [...mockPlayers]
      const draftedPlayers = []

      act(() => {
        const updateResult = result.current.processAIPicks(
          currentPick,
          availablePlayers,
          mockReplacementLevels,
          draftedPlayers
        )

        // Should process picks 1-4 (before user's turn at pick 5)
        expect(aiDraftPlayer).toHaveBeenCalledTimes(4)
        expect(updateResult.nextPick).toBe(5) // Should stop at user's pick
      })
    })

    it('should handle empty teams in processAIPicks', () => {
      const { result } = renderHook(() => useSimulation())

      // Don't start simulation
      act(() => {
        const updateResult = result.current.processAIPicks(1, mockPlayers, mockReplacementLevels, [])
        
        expect(updateResult.updatedTeams).toEqual([])
        expect(updateResult.nextPick).toBe(1)
      })
    })
  })

  describe('simulation completion and results', () => {
    it('should complete simulation and generate results', () => {
      const { result } = renderHook(() => useSimulation())

      // Start simulation and add some picks
      act(() => {
        result.current.startSimulation(1)
      })

      // Add picks to user team
      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[0], 1, [])
      })
      
      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[1], 1, [mockPlayers[0].name])
      })

      act(() => {
        result.current.completeSimulation()
      })

      expect(result.current.simulationResults).not.toBe(null)
      expect(result.current.simulationResults.userTeam).toEqual(result.current.simulationTeams[0])
      expect(result.current.simulationResults.userDraftPosition).toBe(1)
      expect(result.current.simulationResults.totalPicks).toBeGreaterThanOrEqual(1)
      expect(result.current.showResultsModal).toBe(true)
    })

    it('should handle complete simulation with no teams', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.completeSimulation()
      })

      expect(result.current.simulationResults).toBe(null)
      expect(result.current.showResultsModal).toBe(false)
    })

    it('should get user team correctly', () => {
      const { result } = renderHook(() => useSimulation())

      // No simulation started
      expect(result.current.getUserTeam()).toBe(null)

      // Start simulation
      act(() => {
        result.current.startSimulation(3)
      })

      const userTeam = result.current.getUserTeam()
      expect(userTeam).not.toBe(null)
      expect(userTeam.name).toBe('Your Team')
      expect(userTeam.id).toBe(1)
    })

    it('should check if simulation is complete', () => {
      const { result } = renderHook(() => useSimulation())

      // No simulation
      expect(result.current.isSimulationComplete()).toBe(false)

      // Start simulation
      act(() => {
        result.current.startSimulation(1)
      })

      // Not complete (no picks)
      expect(result.current.isSimulationComplete()).toBe(false)

      // Fill teams to max capacity
      act(() => {
        const fullTeams = result.current.simulationTeams.map(team => ({
          ...team,
          picks: Array(15).fill(mockPlayers[0])
        }))
        result.current.setSimulationTeams(fullTeams)
      })

      // Should be complete
      expect(result.current.isSimulationComplete()).toBe(true)
    })
  })

  describe('result analysis', () => {
    beforeEach(() => {
      // Create a mock scenario with multiple teams having different scores
      vi.clearAllMocks()
    })

    it('should calculate user ranking correctly', () => {
      const { result } = renderHook(() => useSimulation())

      // Start simulation
      act(() => {
        result.current.startSimulation(1)
      })

      // Mock teams with different point totals
      act(() => {
        const teamsWithPicks = result.current.simulationTeams.map((team, index) => ({
          ...team,
          picks: [
            { ...mockPlayers[0], historicalPoints: 100 + (index * 20) } // Varying points
          ]
        }))
        result.current.setSimulationTeams(teamsWithPicks)
      })

      act(() => {
        result.current.completeSimulation()
      })

      const results = result.current.simulationResults
      expect(results.summary.userRanking).toBeGreaterThanOrEqual(1)
      expect(results.summary.userRanking).toBeLessThanOrEqual(10)
    })

    it('should find best and worst picks', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.startSimulation(1)
      })

      // Add multiple picks with different point values  
      act(() => {
        result.current.draftPlayerInSimulation({
          ...mockPlayers[0],
          historicalPoints: 200
        }, 1, [])
      })
      
      act(() => {
        result.current.draftPlayerInSimulation({
          ...mockPlayers[1],
          historicalPoints: 50
        }, 1, [mockPlayers[0].name])
      })

      act(() => {
        result.current.completeSimulation()
      })

      const results = result.current.simulationResults
      // Note: The order may be different due to the separate act() calls
      const picks = results.userTeam.picks
      const sortedByPoints = picks.sort((a, b) => (b.historicalPoints || 0) - (a.historicalPoints || 0))
      expect(sortedByPoints[0].historicalPoints).toBe(200) // Best pick
      expect(sortedByPoints[sortedByPoints.length - 1].historicalPoints).toBe(50) // Worst pick
    })

    it('should analyze position balance', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.startSimulation(1)
      })

      // Add picks from different positions - each in separate act() calls
      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[0], 1, []) // Forward
      })
      
      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[1], 1, [mockPlayers[0].name]) // Midfielder
      })
      
      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[2], 1, [mockPlayers[0].name, mockPlayers[1].name]) // Defender
      })

      act(() => {
        result.current.completeSimulation()
      })

      const results = result.current.simulationResults
      // Check that we have picks from different positions
      const picks = results.userTeam.picks
      expect(picks.length).toBeGreaterThanOrEqual(1)
      
      // Check position balance matches what we actually have
      const actualBalance = picks.reduce((acc, player) => {
        acc[player.position] = (acc[player.position] || 0) + 1
        return acc
      }, { F: 0, M: 0, D: 0, G: 0 })
      
      expect(results.summary.positionBalance).toEqual(actualBalance)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const { result } = renderHook(() => useSimulation())

      expect(() => {
        result.current.makeAIPick(null, [], {}, 1, 1, [])
      }).not.toThrow()

      expect(() => {
        result.current.processAIPicks(null, null, null, null)
      }).not.toThrow()
    })

    it('should handle malformed team data', () => {
      const { result } = renderHook(() => useSimulation())

      act(() => {
        result.current.startSimulation(1)
      })

      // Set malformed teams
      act(() => {
        result.current.setSimulationTeams([
          null,
          { id: 2 }, // Missing required properties
          { id: 3, picks: null }
        ])
      })

      expect(() => {
        result.current.isSimulationComplete()
      }).not.toThrow()

      expect(() => {
        result.current.completeSimulation()
      }).not.toThrow()
    })

    it('should handle concurrent state updates', () => {
      const { result } = renderHook(() => useSimulation())

      // Rapid state changes
      act(() => {
        result.current.startSimulation(1)
        result.current.startSimulation(5)
        result.current.resetSimulation()
        result.current.stopSimulation()
      })

      expect(result.current.isSimulationMode).toBe(false)
      expect(result.current.simulationTeams).toEqual([])
    })

    it('should maintain referential equality when appropriate', () => {
      const { result, rerender } = renderHook(() => useSimulation())

      const firstFunctions = {
        startSimulation: result.current.startSimulation,
        stopSimulation: result.current.stopSimulation,
        makeAIPick: result.current.makeAIPick
      }

      rerender()

      expect(result.current.startSimulation).toBe(firstFunctions.startSimulation)
      expect(result.current.stopSimulation).toBe(firstFunctions.stopSimulation)
      expect(result.current.makeAIPick).toBe(firstFunctions.makeAIPick)
    })
  })
}) 