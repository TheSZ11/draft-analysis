import { describe, it, expect, beforeEach } from 'vitest'
import { 
  getRosterCounts, 
  canAddToCategory, 
  validateRoster,
  validateRosterMove,
  generateComplianceReport,
  validateLeagueCompliance,
  validateDraftMove,
  validateLineupLegality,
  determineRosterCategory
} from '../../utils/rosterValidation.js'
import { ROSTER_CATEGORIES } from '../../utils/constants.js'

describe('Roster Validation Utils', () => {
  let mockTeam
  let mockPlayer

  beforeEach(() => {
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
      maxActivePlayers: 11,
      maxReservePlayers: 4,
      maxInjuredReservePlayers: 2
    }

    mockPlayer = {
      id: 1,
      name: 'Test Player',
      position: 'M',
      team: 'ARS',
      rosterCategory: ROSTER_CATEGORIES.ACTIVE
    }
  })

  describe('getRosterCounts', () => {
    it('should return correct counts for empty team', () => {
      const counts = getRosterCounts(mockTeam)
      
      expect(counts.total).toBe(0)
      expect(counts.active.total).toBe(0)
      expect(counts.reserve.total).toBe(0)
      expect(counts.injured_reserve.total).toBe(0)
      expect(counts.active.byPosition.M).toBe(0)
    })

    it('should correctly count players by category and position', () => {
      mockTeam.picks = [
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.RESERVE },
        { position: 'F', rosterCategory: ROSTER_CATEGORIES.INJURED_RESERVE }
      ]

      const counts = getRosterCounts(mockTeam)
      
      expect(counts.total).toBe(4)
      expect(counts.active.total).toBe(2)
      expect(counts.active.byPosition.M).toBe(2)
      expect(counts.reserve.total).toBe(1)
      expect(counts.reserve.byPosition.D).toBe(1)
      expect(counts.injured_reserve.total).toBe(1)
      expect(counts.injured_reserve.byPosition.F).toBe(1)
    })

    it('should default to active category for players without rosterCategory', () => {
      mockTeam.picks = [
        { position: 'M' }, // No rosterCategory specified
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.RESERVE }
      ]

      const counts = getRosterCounts(mockTeam)
      
      expect(counts.active.total).toBe(1)
      expect(counts.active.byPosition.M).toBe(1)
      expect(counts.reserve.total).toBe(1)
    })
  })

  describe('canAddToCategory', () => {
    it('should allow adding to active when under limits', () => {
      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.ACTIVE, 'M')).toBe(true)
    })

    it('should prevent adding to active when at position limit', () => {
      // Add 5 midfielders (max active for position)
      mockTeam.picks = Array(5).fill().map(() => ({ 
        position: 'M', 
        rosterCategory: ROSTER_CATEGORIES.ACTIVE 
      }))

      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.ACTIVE, 'M')).toBe(false)
    })

    it('should prevent adding to active when at total active limit', () => {
      // Add 11 active players (max active total)
      mockTeam.picks = Array(11).fill().map(() => ({ 
        position: 'D', 
        rosterCategory: ROSTER_CATEGORIES.ACTIVE 
      }))

      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.ACTIVE, 'M')).toBe(false)
    })

    it('should allow adding to reserve when under limit', () => {
      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.RESERVE, 'M')).toBe(true)
    })

    it('should prevent adding to reserve when at limit', () => {
      mockTeam.picks = Array(4).fill().map(() => ({ 
        position: 'M', 
        rosterCategory: ROSTER_CATEGORIES.RESERVE 
      }))

      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.RESERVE, 'M')).toBe(false)
    })

    it('should allow adding to injured reserve when under limit', () => {
      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.INJURED_RESERVE, 'M')).toBe(true)
    })

    it('should prevent adding to injured reserve when at limit', () => {
      mockTeam.picks = Array(2).fill().map(() => ({ 
        position: 'M', 
        rosterCategory: ROSTER_CATEGORIES.INJURED_RESERVE 
      }))

      expect(canAddToCategory(mockTeam, ROSTER_CATEGORIES.INJURED_RESERVE, 'M')).toBe(false)
    })
  })

  describe('validateDraftMove', () => {
    it('should allow valid draft move', () => {
      const validation = validateDraftMove(mockTeam, mockPlayer)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should prevent drafting when team is full', () => {
      mockTeam.picks = Array(15).fill().map(() => ({ position: 'M' }))
      
      const validation = validateDraftMove(mockTeam, mockPlayer)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Team roster is full (15/15 players)')
    })

    it('should prevent drafting when position is full', () => {
      mockTeam.picks = Array(6).fill().map(() => ({ position: 'M' }))
      
      const validation = validateDraftMove(mockTeam, mockPlayer)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('position is full'))).toBe(true)
    })

    it('should prevent drafting already drafted player', () => {
      mockTeam.picks = [{ ...mockPlayer }]
      
      const validation = validateDraftMove(mockTeam, mockPlayer)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('already on team'))).toBe(true)
    })
  })

  describe('validateRosterMove', () => {
    beforeEach(() => {
      mockTeam.picks = [{ ...mockPlayer, id: 1 }]
    })

    it('should allow valid category move', () => {
      const validation = validateRosterMove(mockTeam, mockPlayer, ROSTER_CATEGORIES.RESERVE)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should prevent move to same category', () => {
      const validation = validateRosterMove(mockTeam, mockPlayer, ROSTER_CATEGORIES.ACTIVE)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('already in'))).toBe(true)
    })

    it('should prevent move when target category is full', () => {
      // Fill reserve category
      mockTeam.picks.push(
        ...Array(4).fill().map((_, i) => ({ 
          id: i + 2, 
          position: 'D', 
          rosterCategory: ROSTER_CATEGORIES.RESERVE 
        }))
      )
      
      const validation = validateRosterMove(mockTeam, mockPlayer, ROSTER_CATEGORIES.RESERVE)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('category is full'))).toBe(true)
    })
  })

  describe('determineRosterCategory', () => {
    it('should assign to active when space available', () => {
      const category = determineRosterCategory(mockTeam, mockPlayer)
      expect(category).toBe(ROSTER_CATEGORIES.ACTIVE)
    })

    it('should assign to reserve when active is full but reserve available', () => {
      // Fill active spots for midfielders
      mockTeam.picks = Array(5).fill().map(() => ({ 
        position: 'M', 
        rosterCategory: ROSTER_CATEGORIES.ACTIVE 
      }))
      
      const category = determineRosterCategory(mockTeam, mockPlayer)
      expect(category).toBe(ROSTER_CATEGORIES.RESERVE)
    })

    it('should assign to injured reserve when both active and reserve are full', () => {
      // Fill active and reserve
      mockTeam.picks = [
        ...Array(11).fill().map(() => ({ 
          position: 'D', 
          rosterCategory: ROSTER_CATEGORIES.ACTIVE 
        })),
        ...Array(4).fill().map(() => ({ 
          position: 'M', 
          rosterCategory: ROSTER_CATEGORIES.RESERVE 
        }))
      ]
      
      const category = determineRosterCategory(mockTeam, mockPlayer)
      expect(category).toBe(ROSTER_CATEGORIES.INJURED_RESERVE)
    })
  })

  describe('validateLineupLegality', () => {
    it('should validate legal starting lineup', () => {
      const lineup = [
        { position: 'G', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'F', rosterCategory: ROSTER_CATEGORIES.ACTIVE }
      ]
      
      mockTeam.picks = lineup
      const validation = validateLineupLegality(mockTeam)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should catch illegal lineup with too few goalkeepers', () => {
      const lineup = Array(11).fill().map(() => ({ 
        position: 'M', 
        rosterCategory: ROSTER_CATEGORIES.ACTIVE 
      }))
      
      mockTeam.picks = lineup
      const validation = validateLineupLegality(mockTeam)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('goalkeeper'))).toBe(true)
    })

    it('should catch lineup with reserve players in active positions', () => {
      const lineup = [
        { position: 'G', rosterCategory: ROSTER_CATEGORIES.RESERVE }, // Invalid
        ...Array(10).fill().map(() => ({ 
          position: 'M', 
          rosterCategory: ROSTER_CATEGORIES.ACTIVE 
        }))
      ]
      
      mockTeam.picks = lineup
      const validation = validateLineupLegality(mockTeam)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('reserve'))).toBe(true)
    })
  })

  describe('generateComplianceReport', () => {
    it('should generate comprehensive compliance report', () => {
      mockTeam.picks = [
        { position: 'G', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'D', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'M', rosterCategory: ROSTER_CATEGORIES.ACTIVE },
        { position: 'F', rosterCategory: ROSTER_CATEGORIES.RESERVE }
      ]
      
      const report = generateComplianceReport(mockTeam)
      
      expect(report).toHaveProperty('rosterCounts')
      expect(report).toHaveProperty('complianceStatus')
      expect(report).toHaveProperty('violations')
      expect(report).toHaveProperty('recommendations')
      expect(report.rosterCounts.total).toBe(4)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle team with no picks', () => {
      expect(() => getRosterCounts(mockTeam)).not.toThrow()
      expect(() => validateDraftMove(mockTeam, mockPlayer)).not.toThrow()
      expect(() => generateComplianceReport(mockTeam)).not.toThrow()
    })

    it('should handle invalid position', () => {
      const invalidPlayer = { ...mockPlayer, position: 'INVALID' }
      const validation = validateDraftMove(mockTeam, invalidPlayer)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('Invalid position'))).toBe(true)
    })

    it('should handle missing team properties gracefully', () => {
      const incompleteTeam = { id: 1, picks: [] }
      
      expect(() => getRosterCounts(incompleteTeam)).not.toThrow()
    })

    it('should handle null/undefined inputs', () => {
      expect(() => getRosterCounts(null)).toThrow()
      expect(() => validateDraftMove(null, mockPlayer)).toThrow()
      expect(() => validateDraftMove(mockTeam, null)).toThrow()
    })
  })
}) 