import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDraftState } from '../../hooks/useDraftState.js'

// Mock the league config
vi.mock('../../leagueConfig.js', () => ({
  LEAGUE_CONFIG: {
    rosterLimits: {
      maxTotalPlayers: 15,
      maxActivePlayers: 11
    }
  },
  createTeamTemplate: vi.fn((id, name) => ({
    id,
    name,
    picks: [],
    positionLimits: {
      D: { minActive: 2, maxActive: 4, totalMax: 6 },
      M: { minActive: 3, maxActive: 5, totalMax: 6 },
      F: { minActive: 1, maxActive: 3, totalMax: 4 },
      G: { minActive: 1, maxActive: 1, totalMax: 2 }
    },
    maxTotalPlayers: 15,
    maxActivePlayers: 11
  }))
}))

describe('useDraftState Hook', () => {
  let draftHook

  beforeEach(() => {
    vi.clearAllMocks()
    const { result } = renderHook(() => useDraftState())
    draftHook = result
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { current } = draftHook
      
      expect(current.teams).toEqual([])
      expect(current.currentPick).toBe(1)
      expect(current.draftedPlayers).toEqual([])
      expect(current.userDraftPosition).toBe(1)
    })

    it('should provide all required functions', () => {
      const { current } = draftHook
      
      expect(typeof current.setTeams).toBe('function')
      expect(typeof current.setCurrentPick).toBe('function')
      expect(typeof current.setDraftedPlayers).toBe('function')
      expect(typeof current.updateTeamPicks).toBe('function')
      expect(typeof current.resetDraft).toBe('function')
      expect(typeof current.getCurrentDraftTeam).toBe('function')
      expect(typeof current.getDraftProgress).toBe('function')
    })
  })

  describe('team management', () => {
    it('should set teams correctly', () => {
      const mockTeams = [
        { id: 1, name: 'Team 1', picks: [] },
        { id: 2, name: 'Team 2', picks: [] }
      ]

      act(() => {
        draftHook.current.setTeams(mockTeams)
      })

      expect(draftHook.current.teams).toEqual(mockTeams)
    })

    it('should update team picks correctly', () => {
      const initialTeams = [
        { id: 1, name: 'Team 1', picks: [] },
        { id: 2, name: 'Team 2', picks: [] }
      ]

      const newPicks = [
        { id: 1, name: 'Player 1', position: 'F' },
        { id: 2, name: 'Player 2', position: 'M' }
      ]

      act(() => {
        draftHook.current.setTeams(initialTeams)
      })

      act(() => {
        draftHook.current.updateTeamPicks(1, newPicks)
      })

      expect(draftHook.current.teams[0].picks).toEqual(newPicks)
      expect(draftHook.current.teams[1].picks).toEqual([])
    })

    it('should not update picks for non-existent team', () => {
      const initialTeams = [
        { id: 1, name: 'Team 1', picks: [] }
      ]

      act(() => {
        draftHook.current.setTeams(initialTeams)
      })

      act(() => {
        draftHook.current.updateTeamPicks(999, [{ id: 1, name: 'Player 1' }])
      })

      // Teams should remain unchanged
      expect(draftHook.current.teams[0].picks).toEqual([])
    })
  })

  describe('draft progress', () => {
    it('should increment current pick', () => {
      expect(draftHook.current.currentPick).toBe(1)

      act(() => {
        draftHook.current.setCurrentPick(5)
      })

      expect(draftHook.current.currentPick).toBe(5)
    })

    it('should increment pick with function', () => {
      act(() => {
        draftHook.current.setCurrentPick(prev => prev + 1)
      })

      expect(draftHook.current.currentPick).toBe(2)
    })

    it('should update drafted players list', () => {
      const draftedPlayers = ['Player 1', 'Player 2', 'Player 3']

      act(() => {
        draftHook.current.setDraftedPlayers(draftedPlayers)
      })

      expect(draftHook.current.draftedPlayers).toEqual(draftedPlayers)
    })

    it('should add to drafted players using function', () => {
      act(() => {
        draftHook.current.setDraftedPlayers(['Player 1'])
      })

      act(() => {
        draftHook.current.setDraftedPlayers(prev => [...prev, 'Player 2'])
      })

      expect(draftHook.current.draftedPlayers).toEqual(['Player 1', 'Player 2'])
    })
  })

  describe('getCurrentDraftTeam', () => {
    const mockTeams = [
      { id: 1, name: 'User Team', picks: [] },
      { id: 2, name: 'AI Team 1', picks: [] },
      { id: 3, name: 'AI Team 2', picks: [] }
    ]

    beforeEach(() => {
      act(() => {
        draftHook.current.setTeams(mockTeams)
      })
    })

    it('should return correct team in normal mode', () => {
      const currentTeam = draftHook.current.getCurrentDraftTeam(false, 1, [])
      expect(currentTeam).toEqual(mockTeams[0])
    })

    it('should return user team in simulation mode', () => {
      const simulationTeams = [
        { id: 1, name: 'Your Team', picks: [] },
        { id: 2, name: 'AI Team', picks: [] }
      ]

      const currentTeam = draftHook.current.getCurrentDraftTeam(true, 1, simulationTeams)
      expect(currentTeam).toEqual(simulationTeams[0])
    })

    it('should handle different user draft positions in simulation', () => {
      const simulationTeams = [
        { id: 1, name: 'Your Team', picks: [] },
        { id: 2, name: 'AI Team', picks: [] }
      ]

      // User position should not affect which team is returned (always first team)
      const currentTeam = draftHook.current.getCurrentDraftTeam(true, 5, simulationTeams)
      expect(currentTeam).toEqual(simulationTeams[0])
    })

    it('should return null when no teams available', () => {
      act(() => {
        draftHook.current.setTeams([])
      })

      const currentTeam = draftHook.current.getCurrentDraftTeam(false, 1, [])
      expect(currentTeam).toBeNull()
    })
  })

  describe('getDraftProgress', () => {
    it('should calculate correct progress for empty teams', () => {
      const mockTeams = [
        { id: 1, picks: [], maxTotalPlayers: 15 },
        { id: 2, picks: [], maxTotalPlayers: 15 }
      ]

      act(() => {
        draftHook.current.setTeams(mockTeams)
      })

      const progress = draftHook.current.getDraftProgress()
      
      expect(progress.totalPicks).toBe(0)
      expect(progress.totalPossible).toBe(30) // 2 teams * 15 players
      expect(progress.percentage).toBe(0)
      expect(progress.round).toBe(1)
    })

    it('should calculate correct progress with some picks', () => {
      const mockTeams = [
        { 
          id: 1, 
          picks: [
            { name: 'Player 1' },
            { name: 'Player 2' }
          ],
          maxTotalPlayers: 15 
        },
        { 
          id: 2, 
          picks: [
            { name: 'Player 3' }
          ],
          maxTotalPlayers: 15 
        }
      ]

      act(() => {
        draftHook.current.setTeams(mockTeams)
        draftHook.current.setCurrentPick(4)
      })

      const progress = draftHook.current.getDraftProgress()
      
      expect(progress.totalPicks).toBe(3)
      expect(progress.totalPossible).toBe(30)
      expect(progress.percentage).toBe(10) // 3/30 * 100
      expect(progress.round).toBe(2) // pick 4 = round 2 (picks 1-2 = round 1, pick 3-4 = round 2)
    })

    it('should handle teams with different max players', () => {
      const mockTeams = [
        { id: 1, picks: [], maxTotalPlayers: 10 },
        { id: 2, picks: [], maxTotalPlayers: 15 }
      ]

      act(() => {
        draftHook.current.setTeams(mockTeams)
      })

      const progress = draftHook.current.getDraftProgress()
      expect(progress.totalPossible).toBe(25) // 10 + 15
    })

    it('should handle empty teams array', () => {
      const progress = draftHook.current.getDraftProgress()
      
      expect(progress.totalPicks).toBe(0)
      expect(progress.totalPossible).toBe(0)
      expect(progress.percentage).toBe(0)
      expect(progress.round).toBe(1)
    })
  })

  describe('resetDraft', () => {
    it('should reset all state to initial values', () => {
      // Set some state first
      act(() => {
        draftHook.current.setTeams([
          { id: 1, picks: [{ name: 'Player 1' }] }
        ])
        draftHook.current.setCurrentPick(10)
        draftHook.current.setDraftedPlayers(['Player 1', 'Player 2'])
      })

      // Verify state is set
      expect(draftHook.current.teams).not.toEqual([])
      expect(draftHook.current.currentPick).toBe(10)
      expect(draftHook.current.draftedPlayers).not.toEqual([])

      // Reset
      act(() => {
        draftHook.current.resetDraft()
      })

      // Verify reset
      expect(draftHook.current.teams).toEqual([])
      expect(draftHook.current.currentPick).toBe(1)
      expect(draftHook.current.draftedPlayers).toEqual([])
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null teams gracefully', () => {
      act(() => {
        draftHook.current.setTeams(null)
      })

      expect(draftHook.current.teams).toBeNull()
      
      const progress = draftHook.current.getDraftProgress()
      expect(progress.totalPossible).toBe(0)
    })

    it('should handle undefined team picks', () => {
      const teamsWithUndefinedPicks = [
        { id: 1, maxTotalPlayers: 15 }, // No picks property
        { id: 2, picks: null, maxTotalPlayers: 15 }
      ]

      act(() => {
        draftHook.current.setTeams(teamsWithUndefinedPicks)
      })

      const progress = draftHook.current.getDraftProgress()
      expect(progress.totalPicks).toBe(0)
    })

    it('should handle invalid current pick values', () => {
      act(() => {
        draftHook.current.setCurrentPick(-1)
      })

      expect(draftHook.current.currentPick).toBe(-1)
      
      const progress = draftHook.current.getDraftProgress()
      expect(progress.round).toBeGreaterThanOrEqual(1) // Should handle negative picks gracefully
    })

    it('should handle very large teams arrays', () => {
      const largeTeams = Array(1000).fill().map((_, i) => ({
        id: i + 1,
        picks: [],
        maxTotalPlayers: 15
      }))

      act(() => {
        draftHook.current.setTeams(largeTeams)
      })

      expect(draftHook.current.teams).toHaveLength(1000)
      
      const progress = draftHook.current.getDraftProgress()
      expect(progress.totalPossible).toBe(15000)
    })

    it('should maintain referential equality when appropriate', () => {
      const mockTeams = [{ id: 1, picks: [] }]
      
      act(() => {
        draftHook.current.setTeams(mockTeams)
      })

      const teams1 = draftHook.current.teams
      
      // Re-render hook (simulate component re-render)
      const { result: newResult } = renderHook(() => useDraftState())
      
      // State should be independent between hook instances
      expect(newResult.current.teams).not.toBe(teams1)
    })
  })

  describe('concurrent updates', () => {
    it('should handle rapid state updates correctly', () => {
      // Simulate rapid updates that might happen during AI drafting
      act(() => {
        draftHook.current.setCurrentPick(1)
        draftHook.current.setCurrentPick(2)
        draftHook.current.setCurrentPick(3)
        draftHook.current.setDraftedPlayers(['Player 1'])
        draftHook.current.setDraftedPlayers(prev => [...prev, 'Player 2'])
        draftHook.current.setDraftedPlayers(prev => [...prev, 'Player 3'])
      })

      expect(draftHook.current.currentPick).toBe(3)
      expect(draftHook.current.draftedPlayers).toEqual(['Player 1', 'Player 2', 'Player 3'])
    })

    it('should handle functional updates correctly', () => {
      act(() => {
        draftHook.current.setTeams([
          { id: 1, picks: [{ name: 'Initial Player' }] }
        ])
      })

      act(() => {
        draftHook.current.updateTeamPicks(1, prev => [
          ...prev,
          { name: 'New Player' }
        ])
      })

      expect(draftHook.current.teams[0].picks).toHaveLength(2)
      expect(draftHook.current.teams[0].picks[1].name).toBe('New Player')
    })
  })
}) 