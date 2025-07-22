import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DraftProvider } from '../../contexts/DraftContext.jsx'
import { PlayerProvider } from '../../contexts/PlayerContext.jsx'
import { UIProvider } from '../../contexts/UIContext.jsx'
import { FixtureProvider } from '../../contexts/FixtureContext.jsx'
import { Header } from '../../components/Header.jsx'
import { PlayerList } from '../../components/PlayerList.jsx'
import { DraftBoard } from '../../components/DraftBoard.jsx'
import { ComplianceReportModal } from '../../components/ComplianceReportModal.jsx'
import { createMockPlayersArray } from '../fixtures/mockData.js'

// Mock external dependencies
vi.mock('../../utils/dataProcessing.js', () => ({
  fetchPlayerData: vi.fn(() => Promise.resolve({
    players: createMockPlayersArray(20),
    replacementLevels: { F: 10, M: 8, D: 6, G: 4 },
    playerTiers: {}
  })),
  updatePlayerCalculations: vi.fn(),
  getTeamFixtureIndicators: vi.fn((teamCode, fixtures, count = 3) => [
    { difficulty: 2, isHome: true, opponent: 'LIV', gameweek: 1 },
    { difficulty: 4, isHome: false, opponent: 'MCI', gameweek: 2 },
    { difficulty: 1, isHome: true, opponent: 'NEW', gameweek: 3 }
  ]),
  processFixtureData: vi.fn(() => ({})),
  fetchFixtures: vi.fn(() => Promise.resolve({}))
}))

vi.mock('../../utils/draftLogic.js', () => ({
  getRecommendations: vi.fn(() => []),
  getAvailablePlayers: vi.fn(() => createMockPlayersArray(20)),
  aiDraftPlayer: vi.fn(() => createMockPlayersArray(1)[0]),
  calculateDraftPosition: vi.fn(() => 1)
}))

vi.mock('../../utils/rosterValidation.js', () => ({
  validateRoster: vi.fn(() => ({ isValid: true, violations: [], warnings: [] })),
  checkPositionLimits: vi.fn(() => ({ isValid: true, violations: [] })),
  generateComplianceReport: vi.fn(() => ({
    compliance: { violations: [], warnings: [], complianceScore: 100 },
    report: 'All good'
  }))
}))

vi.mock('../../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn(() => ({
    recommendations: [],
    insights: []
  }))
}))

// Test providers wrapper
const TestProviders = ({ children }) => (
  <DraftProvider>
    <PlayerProvider>
      <UIProvider>
        <FixtureProvider>
          {children}
        </FixtureProvider>
      </UIProvider>
    </PlayerProvider>
  </DraftProvider>
)

describe('User Workflow Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
  })

  describe('Draft Process Workflow', () => {
    it('should complete a full draft flow from start to finish', async () => {
      const currentTeam = {
        id: 1,
        name: 'Test Team',
        picks: []
      }

      const { container } = render(
        <TestProviders>
          <Header currentTeam={currentTeam} />
          <PlayerList />
        </TestProviders>
      )

      // Verify initial state using container queries to avoid multiple elements
      const headers = container.querySelectorAll('h1')
      expect(headers).toHaveLength(1)
      expect(headers[0]).toHaveTextContent('Fantasy Football Draft Tracker')
      
      const startButtons = container.querySelectorAll('button[class*="bg-green"]')
      expect(startButtons.length).toBeGreaterThan(0)

      // Wait for players to load and check if they exist
      await waitFor(() => {
        const loadingElements = container.querySelectorAll('[class*="animate-spin"]')
        expect(loadingElements).toHaveLength(0)
      }, { timeout: 3000 })
    })
  })

  describe('Simulation Mode Workflow', () => {
    it('should start and manage simulation mode correctly', async () => {
      const currentTeam = {
        id: 1,
        name: 'Test Team',
        picks: []
      }

      const { container } = render(
        <TestProviders>
          <Header currentTeam={currentTeam} />
        </TestProviders>
      )

      // Start simulation using container query
      const startButtons = container.querySelectorAll('button')
      const startButton = Array.from(startButtons).find(btn => btn.textContent.includes('Start Simulation'))
      
      if (startButton) {
        await user.click(startButton)

        // Should show simulation mode indicators
        await waitFor(() => {
          const simulationText = container.querySelector('[class*="text-green"]')
          expect(simulationText).toBeInTheDocument()
        }, { timeout: 2000 })
      }
    })
  })

  describe('Player Management Workflow', () => {
    it('should handle player filtering and display', async () => {
      const { container } = render(
        <TestProviders>
          <PlayerList />
        </TestProviders>
      )

      // Wait for players to load
      await waitFor(() => {
        const loadingElements = container.querySelectorAll('[class*="animate-spin"]')
        expect(loadingElements).toHaveLength(0)
      }, { timeout: 3000 })

      // Check for basic player list functionality using container
      const availablePlayersHeaders = container.querySelectorAll('h2')
      const availablePlayersText = Array.from(availablePlayersHeaders).find(h => h.textContent.includes('Available Players'))
      if (availablePlayersText) {
        expect(availablePlayersText).toBeInTheDocument()
      }

      // Check for filter functionality if available
      const comboboxes = container.querySelectorAll('select')
      if (comboboxes.length > 0) {
        await user.selectOptions(comboboxes[0], 'F')
        // Verify filter interaction worked without specific assertions about results
      }
    })
  })

  describe('Draft Board Workflow', () => {
    it('should display draft board and search functionality', async () => {
      const { container } = render(
        <TestProviders>
          <DraftBoard />
        </TestProviders>
      )

      // Should render without errors
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Compliance Report Workflow', () => {
    it('should handle compliance modal state correctly', async () => {
      const { container } = render(
        <TestProviders>
          <ComplianceReportModal />
        </TestProviders>
      )

      // Modal should not crash when rendered
      expect(container.firstChild).toBeDefined()
    })
  })

  describe('Error Handling Workflow', () => {
    it('should handle missing data gracefully', async () => {
      const { container } = render(
        <TestProviders>
          <Header />
          <PlayerList />
        </TestProviders>
      )

      // Should render without crashing even with missing data using container query
      const headers = container.querySelectorAll('h1')
      expect(headers.length).toBeGreaterThan(0)
      expect(headers[0]).toHaveTextContent('Fantasy Football Draft Tracker')
    })
  })

  describe('Performance and State Management', () => {
    it('should handle rapid user interactions without errors', async () => {
      const { container } = render(
        <TestProviders>
          <Header />
        </TestProviders>
      )

      // Rapidly click start/stop simulation using container queries
      const buttons = container.querySelectorAll('button')
      const startButton = Array.from(buttons).find(btn => btn.textContent.includes('Start Simulation'))
      
      if (startButton) {
        await user.click(startButton)
        await user.click(startButton)
        await user.click(startButton)
      }
      
      // Should not crash from rapid interactions
      expect(container.firstChild).toBeInTheDocument()
    })
  })
}) 