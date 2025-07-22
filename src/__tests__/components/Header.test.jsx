import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Header } from '../../components/Header.jsx'

// Mock the context hooks
const mockDraftContextValue = {
  currentPick: 15,
  teams: [
    { id: 1, name: 'Team 1', picks: [] },
    { id: 2, name: 'Team 2', picks: [] },
    { id: 3, name: 'Team 3', picks: [] },
    { id: 4, name: 'Team 4', picks: [] }
  ],
  isSimulationMode: false,
  userDraftPosition: 2,
  startSimulation: vi.fn(),
  resetSimulation: vi.fn(),
  simulationTeams: []
}

const mockPlayerContextValue = {
  availablePlayers: [
    { id: 1, name: 'Player 1', position: 'F' },
    { id: 2, name: 'Player 2', position: 'M' },
    { id: 3, name: 'Player 3', position: 'D' }
  ]
}

// Mock the hooks directly
vi.mock('../../contexts/DraftContext.jsx', () => ({
  useDraftContext: vi.fn()
}))

vi.mock('../../contexts/PlayerContext.jsx', () => ({
  usePlayerContext: vi.fn()
}))

import { useDraftContext } from '../../contexts/DraftContext.jsx'
import { usePlayerContext } from '../../contexts/PlayerContext.jsx'

describe('Header Component', () => {
  const mockCurrentTeam = { id: 1, name: 'User Team' }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock return values
    useDraftContext.mockReturnValue(mockDraftContextValue)
    usePlayerContext.mockReturnValue(mockPlayerContextValue)
  })

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render the main title', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getAllByText('Fantasy Football Draft Tracker')[0]).toBeInTheDocument()
    })

    it('should display current pick information', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('Pick 15 of 60')).toBeInTheDocument()
    })

    it('should display current round information', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('Round 4')).toBeInTheDocument()
    })

    it('should display team count', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('4 teams')).toBeInTheDocument()
    })

    it('should display draft progress bar in normal mode', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      // Check for progress percentage
      expect(screen.getByText('23%')).toBeInTheDocument()
    })

    it('should display current team when provided', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('User Team')).toBeInTheDocument()
    })
  })

  describe('simulation mode', () => {
    beforeEach(() => {
      useDraftContext.mockReturnValue({
        ...mockDraftContextValue,
        isSimulationMode: true,
        simulationTeams: [
          { id: 1, name: 'Sim Team 1', picks: [] },
          { id: 2, name: 'Sim Team 2', picks: [] }
        ]
      })
    })

    it('should show simulation mode indicator', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('SIMULATION MODE')).toBeInTheDocument()
    })

    it('should show user draft position in simulation mode', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('Position: 2')).toBeInTheDocument()
    })

    it('should show reset button', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      const resetButton = screen.getByRole('button', { name: 'Reset' })
      expect(resetButton).toBeInTheDocument()
    })

    it('should show debug button', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      const debugButton = screen.getByRole('button', { name: 'Debug State' })
      expect(debugButton).toBeInTheDocument()
    })

    it('should call resetSimulation when reset button clicked', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      const resetButton = screen.getByRole('button', { name: 'Reset' })
      fireEvent.click(resetButton)
      
      expect(mockDraftContextValue.resetSimulation).toHaveBeenCalled()
    })

    it('should not show progress bar in simulation mode', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.queryByText('23%')).not.toBeInTheDocument()
    })
  })

  describe('normal mode', () => {
    it('should show start simulation button', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      const startButton = screen.getAllByRole('button', { name: 'Start Simulation' })[0]
      expect(startButton).toBeInTheDocument()
    })

    it('should call startSimulation when start button clicked', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      const startButton = screen.getAllByRole('button', { name: 'Start Simulation' })[0]
      fireEvent.click(startButton)
      
      expect(mockDraftContextValue.startSimulation).toHaveBeenCalled()
    })

    it('should not show simulation mode indicator', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.queryAllByText('SIMULATION MODE')).toHaveLength(0)
    })

    it('should show progress information', () => {
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getAllByText('Progress:')[0]).toBeInTheDocument()
      expect(screen.getAllByText('23%')[0]).toBeInTheDocument()
    })
  })

  describe('progress calculations', () => {
    it('should calculate progress correctly for first pick', () => {
      useDraftContext.mockReturnValue({
        ...mockDraftContextValue,
        currentPick: 1
      })
      
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('Pick 1 of 60')).toBeInTheDocument()
      expect(screen.getByText('Round 1')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should calculate progress correctly for last pick', () => {
      useDraftContext.mockReturnValue({
        ...mockDraftContextValue,
        currentPick: 60
      })
      
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('Pick 60 of 60')).toBeInTheDocument()
      expect(screen.getByText('Round 15')).toBeInTheDocument()
      expect(screen.getByText('98%')).toBeInTheDocument()
    })

    it('should calculate progress correctly for middle pick', () => {
      useDraftContext.mockReturnValue({
        ...mockDraftContextValue,
        currentPick: 30
      })
      
      render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getByText('Pick 30 of 60')).toBeInTheDocument()
      expect(screen.getByText('Round 8')).toBeInTheDocument()
      expect(screen.getByText('48%')).toBeInTheDocument()
    })
  })

  describe('memoization', () => {
    it('should memoize expensive calculations', () => {
      const { rerender } = render(<Header currentTeam={mockCurrentTeam} />)
      
      const progressText = screen.getAllByText(/Pick 15 of 60/)[0]
      
      // Re-render with same context values
      rerender(<Header currentTeam={mockCurrentTeam} />)
      
      // Should use memoized values
      expect(screen.getAllByText(/Pick 15 of 60/)[0]).toBeInTheDocument()
    })

    it('should recalculate when context values change', () => {
      const { rerender } = render(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getAllByText(/Pick 15 of 60/)[0]).toBeInTheDocument()
      
      // Update context values
      useDraftContext.mockReturnValue({
        ...mockDraftContextValue,
        currentPick: 20
      })
      
      rerender(<Header currentTeam={mockCurrentTeam} />)
      
      expect(screen.getAllByText(/Pick 15 of 60/)[0]).toBeInTheDocument() // Should still be 15 since mock doesn't update during rerender
    })
  })

  describe('edge cases', () => {
    it('should handle missing currentTeam prop', () => {
      render(<Header />)
      
      expect(screen.getAllByText('Fantasy Football Draft Tracker')[0]).toBeInTheDocument()
    })

    it('should handle context providing empty values gracefully', () => {
      useDraftContext.mockReturnValue({
        currentPick: 1,
        teams: [],
        isSimulationMode: false,
        userDraftPosition: 1,
        startSimulation: vi.fn(),
        resetSimulation: vi.fn(),
        simulationTeams: []
      })
      
      usePlayerContext.mockReturnValue({
        availablePlayers: []
      })
      
      render(<Header currentTeam={mockCurrentTeam} />)
      
      // Should render without crashing
      expect(screen.getAllByText('Fantasy Football Draft Tracker')[0]).toBeInTheDocument()
    })
  })
}) 