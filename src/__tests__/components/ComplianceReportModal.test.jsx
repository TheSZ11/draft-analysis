import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ComplianceReportModal } from '../../components/ComplianceReportModal.jsx'

// Mock the UI context hook
const mockUIContextValue = {
  showComplianceReport: true,
  hideComplianceReportModal: vi.fn(),
  complianceReportData: {
    team: {
      id: 1,
      name: 'Test Team',
      picks: [
        { id: 1, name: 'Player 1', position: 'F', rosterCategory: 'active' },
        { id: 2, name: 'Player 2', position: 'M', rosterCategory: 'active' },
        { id: 3, name: 'Player 3', position: 'D', rosterCategory: 'active' },
        { id: 4, name: 'Player 4', position: 'G', rosterCategory: 'active' }
      ]
    },
    compliance: {
      complianceScore: 85,
      isFullyCompliant: true,
      violations: [],
      warnings: [
        {
          type: 'position_warning',
          message: 'Consider adding more defenders',
          severity: 'low'
        }
      ],
      summary: {
        totalPlayers: 4,
        activePlayers: 4,
        reservePlayers: 0,
        injuredReservePlayers: 0,
        positionBreakdown: {
          F: 1,
          M: 1,
          D: 1,
          G: 1
        }
      }
    },
    report: `COMPLIANCE REPORT
=================
Team: Test Team
Score: 85/100

WARNINGS:
- Consider adding more defenders

SUMMARY:
Total Players: 4
Active: 4
Reserve: 0`
  }
}

// Mock the hook directly
vi.mock('../../contexts/UIContext.jsx', () => ({
  useUIContext: vi.fn()
}))

import { useUIContext } from '../../contexts/UIContext.jsx'

describe('ComplianceReportModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock return value
    useUIContext.mockReturnValue(mockUIContextValue)
  })

  afterEach(() => {
    cleanup();
  });

  describe('data display', () => {
    it('should display team name and compliance score in header', () => {
      render(<ComplianceReportModal />)
      
      expect(screen.getByText('Test Team • Score: 85/100')).toBeInTheDocument()
    })

    it('should display violations when present', () => {
      useUIContext.mockReturnValue({
        ...mockUIContextValue,
        complianceReportData: {
          ...mockUIContextValue.complianceReportData,
          compliance: {
            ...mockUIContextValue.complianceReportData.compliance,
            violations: [
              {
                type: 'roster_violation',
                message: 'Team roster exceeds maximum allowed players',
                severity: 'high'
              }
            ]
          },
          report: `COMPLIANCE REPORT
=================
Team: Test Team
Score: 85/100

VIOLATIONS:
- Team roster exceeds maximum allowed players

SUMMARY:
Total Players: 4`
        }
      })
      
      render(<ComplianceReportModal />)
      
      expect(screen.getByText(/Team roster exceeds maximum allowed players/)).toBeInTheDocument()
    })

    it('should display warnings when present', () => {
      render(<ComplianceReportModal />)
      
      expect(screen.getByText(/Consider adding more defenders/)).toBeInTheDocument()
    })

    it('should display summary statistics', () => {
      render(<ComplianceReportModal />)
      
      // Check for the labels instead of numbers since there are multiple "4"s
      expect(screen.getByText('Total Players')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Reserve')).toBeInTheDocument()
      expect(screen.getByText('Injured Reserve')).toBeInTheDocument()
      
      // Check for specific values using getAllByText for duplicates
      const allFours = screen.getAllByText('4')
      expect(allFours).toHaveLength(2) // Total players and Active both show 4
      
      const allZeros = screen.getAllByText('0')
      expect(allZeros).toHaveLength(2) // Reserve and Injured Reserve both show 0
    })
  })

  describe('user interactions', () => {
    it('should call hideComplianceReportModal when close button is clicked', () => {
      render(<ComplianceReportModal />);
      
      const closeButton = screen.getAllByRole('button', { name: '✕' })[0];
      fireEvent.click(closeButton);
      
      expect(mockUIContextValue.hideComplianceReportModal).toHaveBeenCalled();
    });
  });

  describe('modal behavior', () => {
    it('should render when showComplianceReport is true', () => {
      render(<ComplianceReportModal />);
      
      expect(screen.getAllByText('League Compliance Report')[0]).toBeInTheDocument();
    });

    it('should not render when showComplianceReport is false', () => {
      useUIContext.mockReturnValue({
        ...mockUIContextValue,
        showComplianceReport: false
      })
      
      render(<ComplianceReportModal />)
      
      expect(screen.queryAllByText('League Compliance Report')).toHaveLength(0);
    })

    it('should not render when complianceReportData is null', () => {
      useUIContext.mockReturnValue({
        ...mockUIContextValue,
        complianceReportData: null
      })
      
      render(<ComplianceReportModal />)
      
      expect(screen.queryAllByText('League Compliance Report')).toHaveLength(0);
    })
  })

  describe('accessibility', () => {
    it('should have accessible modal title', () => {
      render(<ComplianceReportModal />)
      
      const title = screen.getAllByText('League Compliance Report')[0]
      expect(title).toBeInTheDocument()
    })

    it('should have accessible close button', () => {
      render(<ComplianceReportModal />)
      
      const closeButton = screen.getAllByRole('button', { name: '✕' })[0]
      expect(closeButton).toBeInTheDocument()
    })
  })
}) 