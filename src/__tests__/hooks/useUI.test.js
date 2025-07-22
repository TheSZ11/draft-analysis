import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUI } from '../../hooks/useUI.js'

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

// Mock window.innerWidth for tooltip positioning tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

describe('useUI Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useUI())

      expect(result.current.searchTerm).toBe('')
      expect(result.current.selectedPosition).toBe('ALL')
      expect(result.current.hoveredPlayer).toBe(null)
      expect(result.current.tooltipPosition).toEqual({ x: 0, y: 0 })
      expect(result.current.showComplianceReport).toBe(false)
      expect(result.current.complianceReportData).toBe(null)
      expect(result.current.forceUpdate).toBe(0)
    })

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useUI())

      expect(typeof result.current.handlePlayerHover).toBe('function')
      expect(typeof result.current.clearPlayerHover).toBe('function')
      expect(typeof result.current.showComplianceReportModal).toBe('function')
      expect(typeof result.current.hideComplianceReportModal).toBe('function')
      expect(typeof result.current.filterPlayers).toBe('function')
      expect(typeof result.current.clearFilters).toBe('function')
      expect(typeof result.current.triggerForceUpdate).toBe('function')
      expect(typeof result.current.updateSearchTerm).toBe('function')
      expect(typeof result.current.updateSelectedPosition).toBe('function')
      expect(typeof result.current.getTooltipStyle).toBe('function')
      expect(typeof result.current.resetUIState).toBe('function')
      expect(typeof result.current.getUIStateSummary).toBe('function')
    })
  })

  describe('search functionality', () => {
    it('should update search term correctly', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('test search')
      })

      expect(result.current.searchTerm).toBe('test search')
    })

    it('should allow direct setter access', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.setSearchTerm('direct set')
      })

      expect(result.current.searchTerm).toBe('direct set')
    })

    it('should handle empty search term', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('')
      })

      expect(result.current.searchTerm).toBe('')
    })
  })

  describe('position filtering', () => {
    it('should update selected position correctly', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSelectedPosition('F')
      })

      expect(result.current.selectedPosition).toBe('F')
    })

    it('should handle all valid positions', () => {
      const { result } = renderHook(() => useUI())

      const positions = ['ALL', 'F', 'M', 'D', 'G']

      positions.forEach(position => {
        act(() => {
          result.current.updateSelectedPosition(position)
        })
        expect(result.current.selectedPosition).toBe(position)
      })
    })

    it('should allow direct setter access', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.setSelectedPosition('M')
      })

      expect(result.current.selectedPosition).toBe('M')
    })
  })

  describe('team filtering', () => {
    it('should update selected team correctly', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSelectedTeam('ARS')
      })

      expect(result.current.selectedTeam).toBe('ARS')
    })

    it('should handle all teams', () => {
      const { result } = renderHook(() => useUI())

      const teams = ['ALL', 'ARS', 'LIV', 'MCI']

      teams.forEach(team => {
        act(() => {
          result.current.updateSelectedTeam(team)
        })
        expect(result.current.selectedTeam).toBe(team)
      })
    })

    it('should allow direct setter access', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.setSelectedTeam('LIV')
      })

      expect(result.current.selectedTeam).toBe('LIV')
    })
  })

  describe('player filtering', () => {
    it('should filter players by position', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSelectedPosition('F')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      const forwardPlayers = filteredPlayers.filter(p => p.position === 'F')

      expect(filteredPlayers.length).toBe(forwardPlayers.length)
      expect(filteredPlayers.every(p => p.position === 'F')).toBe(true)
    })

    it('should filter players by search term (name)', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('elite')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers.length).toBeGreaterThan(0)
      expect(filteredPlayers.every(p => 
        p.name.toLowerCase().includes('elite')
      )).toBe(true)
    })

    it('should filter players by search term (team)', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('ARS')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers.length).toBeGreaterThan(0)
      expect(filteredPlayers.every(p => 
        p.team.toLowerCase().includes('ars')
      )).toBe(true)
    })

    it('should filter players by team', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSelectedTeam('ARS')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers.length).toBeGreaterThan(0)
      expect(filteredPlayers.every(p => p.team === 'ARS')).toBe(true)
    })

    it('should combine position and search filters', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSelectedPosition('F')
        result.current.updateSearchTerm('elite')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers.every(p => 
        p.position === 'F' && p.name.toLowerCase().includes('elite')
      )).toBe(true)
    })

    it('should combine position, team, and search filters', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSelectedPosition('F')
        result.current.updateSelectedTeam('ARS')
        result.current.updateSearchTerm('elite')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers.every(p => 
        p.position === 'F' && 
        p.team === 'ARS' && 
        p.name.toLowerCase().includes('elite')
      )).toBe(true)
    })

    it('should return all players with ALL position and empty search', () => {
      const { result } = renderHook(() => useUI())

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers).toEqual(mockPlayers)
    })

    it('should handle empty player list', () => {
      const { result } = renderHook(() => useUI())

      const filteredPlayers = result.current.filterPlayers([])
      
      expect(filteredPlayers).toEqual([])
    })

    it('should handle case insensitive search', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('ELITE')
      })

      const filteredPlayers = result.current.filterPlayers(mockPlayers)
      
      expect(filteredPlayers.length).toBeGreaterThan(0)
    })
  })

  describe('tooltip functionality', () => {
    it('should handle player hover with event', () => {
      const { result } = renderHook(() => useUI())

      const mockEvent = {
        currentTarget: {
          getBoundingClientRect: vi.fn().mockReturnValue({
            right: 100,
            top: 50
          })
        }
      }

      const player = mockPlayers[0]

      act(() => {
        result.current.handlePlayerHover(player, mockEvent)
      })

      expect(result.current.hoveredPlayer).toEqual(player)
      expect(result.current.tooltipPosition).toEqual({
        x: 110, // right + 10
        y: 50   // top
      })
    })

    it('should handle player hover without event', () => {
      const { result } = renderHook(() => useUI())

      const player = mockPlayers[0]

      act(() => {
        result.current.handlePlayerHover(player, null)
      })

      expect(result.current.hoveredPlayer).toEqual(player)
      expect(result.current.tooltipPosition).toEqual({ x: 0, y: 0 })
    })

    it('should clear player hover', () => {
      const { result } = renderHook(() => useUI())

      // Set a hovered player first
      act(() => {
        result.current.handlePlayerHover(mockPlayers[0], null)
      })

      expect(result.current.hoveredPlayer).not.toBe(null)

      // Clear hover
      act(() => {
        result.current.clearPlayerHover()
      })

      expect(result.current.hoveredPlayer).toBe(null)
    })

    it('should calculate tooltip style correctly', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.setTooltipPosition({ x: 500, y: 100 })
      })

      const style = result.current.getTooltipStyle(1024)

      expect(style).toEqual({
        left: 500,
        top: 100,
        transform: 'translateY(-50%)'
      })
    })

    it('should adjust tooltip position for screen edge', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.setTooltipPosition({ x: 900, y: 100 })
      })

      const style = result.current.getTooltipStyle(1024)

      expect(style.left).toBe(704) // 1024 - 320 (tooltip width)
      expect(style.top).toBe(100)
    })

    it('should use window width by default', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.setTooltipPosition({ x: 100, y: 50 })
      })

      const style = result.current.getTooltipStyle()

      expect(style.left).toBe(100)
    })
  })

  describe('compliance report modal', () => {
    it('should show compliance report modal', () => {
      const { result } = renderHook(() => useUI())

      const reportData = { violations: [], recommendations: [] }

      act(() => {
        result.current.showComplianceReportModal(reportData)
      })

      expect(result.current.showComplianceReport).toBe(true)
      expect(result.current.complianceReportData).toEqual(reportData)
    })

    it('should hide compliance report modal', () => {
      const { result } = renderHook(() => useUI())

      // Show modal first
      act(() => {
        result.current.showComplianceReportModal({ violations: [] })
      })

      expect(result.current.showComplianceReport).toBe(true)

      // Hide modal
      act(() => {
        result.current.hideComplianceReportModal()
      })

      expect(result.current.showComplianceReport).toBe(false)
      expect(result.current.complianceReportData).toBe(null)
    })
  })

  describe('filter management', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useUI())

      // Set some filters
      act(() => {
        result.current.updateSearchTerm('test')
        result.current.updateSelectedPosition('F')
        result.current.updateSelectedTeam('ARS')
      })

      expect(result.current.searchTerm).toBe('test')
      expect(result.current.selectedPosition).toBe('F')
      expect(result.current.selectedTeam).toBe('ARS')

      // Clear filters
      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.searchTerm).toBe('')
      expect(result.current.selectedPosition).toBe('ALL')
      expect(result.current.selectedTeam).toBe('ALL')
    })
  })

  describe('force update functionality', () => {
    it('should increment force update counter', () => {
      const { result } = renderHook(() => useUI())

      expect(result.current.forceUpdate).toBe(0)

      act(() => {
        result.current.triggerForceUpdate()
      })

      expect(result.current.forceUpdate).toBe(1)

      act(() => {
        result.current.triggerForceUpdate()
      })

      expect(result.current.forceUpdate).toBe(2)
    })
  })

  describe('state reset', () => {
    it('should reset all UI state', () => {
      const { result } = renderHook(() => useUI())

      // Set various state values
      act(() => {
        result.current.updateSearchTerm('test')
        result.current.updateSelectedPosition('F')
        result.current.updateSelectedTeam('ARS')
        result.current.handlePlayerHover(mockPlayers[0], null)
        result.current.setTooltipPosition({ x: 100, y: 50 })
        result.current.showComplianceReportModal({ violations: [] })
        result.current.triggerForceUpdate()
      })

      // Verify state is set
      expect(result.current.searchTerm).toBe('test')
      expect(result.current.selectedPosition).toBe('F')
      expect(result.current.selectedTeam).toBe('ARS')
      expect(result.current.hoveredPlayer).not.toBe(null)
      expect(result.current.showComplianceReport).toBe(true)
      expect(result.current.forceUpdate).toBe(1)

      // Reset state
      act(() => {
        result.current.resetUIState()
      })

      // Verify reset
      expect(result.current.searchTerm).toBe('')
      expect(result.current.selectedPosition).toBe('ALL')
      expect(result.current.selectedTeam).toBe('ALL')
      expect(result.current.hoveredPlayer).toBe(null)
      expect(result.current.tooltipPosition).toEqual({ x: 0, y: 0 })
      expect(result.current.showComplianceReport).toBe(false)
      expect(result.current.complianceReportData).toBe(null)
      expect(result.current.forceUpdate).toBe(0)
    })
  })

  describe('UI state summary', () => {
    it('should provide accurate UI state summary', () => {
      const { result } = renderHook(() => useUI())

      const summary = result.current.getUIStateSummary()

      expect(summary).toEqual({
        hasSearch: false,
        hasPositionFilter: false,
        hasTeamFilter: false,
        hasHoveredPlayer: false,
        showingComplianceReport: false,
        tooltipPosition: { x: 0, y: 0 },
        forceUpdateCount: 0
      })
    })

    it('should reflect state changes in summary', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('test')
        result.current.updateSelectedPosition('F')
        result.current.handlePlayerHover(mockPlayers[0], null)
        result.current.showComplianceReportModal({ violations: [] })
        result.current.triggerForceUpdate()
      })

      const summary = result.current.getUIStateSummary()

      expect(summary).toEqual({
        hasSearch: true,
        hasPositionFilter: true,
        hasTeamFilter: false,
        hasHoveredPlayer: true,
        showingComplianceReport: true,
        tooltipPosition: { x: 0, y: 0 },
        forceUpdateCount: 1
      })
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const { result } = renderHook(() => useUI())

      expect(() => {
        result.current.handlePlayerHover(null, null)
      }).not.toThrow()

      expect(() => {
        result.current.filterPlayers(null)
      }).not.toThrow()

      expect(() => {
        result.current.updateSearchTerm(null)
      }).not.toThrow()

      expect(() => {
        result.current.updateSelectedPosition(null)
      }).not.toThrow()

      expect(() => {
        result.current.showComplianceReportModal(null)
      }).not.toThrow()
    })

    it('should handle malformed event objects', () => {
      const { result } = renderHook(() => useUI())

      const malformedEvent = {
        currentTarget: null
      }

      expect(() => {
        act(() => {
          result.current.handlePlayerHover(mockPlayers[0], malformedEvent)
        })
      }).not.toThrow()

      expect(result.current.hoveredPlayer).toEqual(mockPlayers[0])
    })

    it('should handle malformed player objects in filtering', () => {
      const { result } = renderHook(() => useUI())

      const malformedPlayers = [
        { name: 'Player 1' }, // Missing position, team
        { position: 'F' }, // Missing name, team
        null, // Null player
        { name: 'Valid Player', position: 'M', team: 'LIV' }
      ]

      act(() => {
        result.current.updateSearchTerm('valid')
      })

      expect(() => {
        const filtered = result.current.filterPlayers(malformedPlayers)
        expect(Array.isArray(filtered)).toBe(true)
      }).not.toThrow()
    })

    it('should handle concurrent state updates', () => {
      const { result } = renderHook(() => useUI())

      act(() => {
        result.current.updateSearchTerm('test1')
        result.current.updateSearchTerm('test2')
        result.current.updateSearchTerm('test3')
        result.current.updateSelectedPosition('F')
        result.current.updateSelectedPosition('M')
        result.current.triggerForceUpdate()
        result.current.triggerForceUpdate()
      })

      expect(result.current.searchTerm).toBe('test3')
      expect(result.current.selectedPosition).toBe('M')
      expect(result.current.forceUpdate).toBe(2)
    })

    it('should maintain referential equality when appropriate', () => {
      const { result, rerender } = renderHook(() => useUI())

      const firstFunctions = {
        updateSearchTerm: result.current.updateSearchTerm,
        clearFilters: result.current.clearFilters,
        resetUIState: result.current.resetUIState
      }

      rerender()

      expect(result.current.updateSearchTerm).toBe(firstFunctions.updateSearchTerm)
      expect(result.current.clearFilters).toBe(firstFunctions.clearFilters)
      expect(result.current.resetUIState).toBe(firstFunctions.resetUIState)
    })
  })
}) 