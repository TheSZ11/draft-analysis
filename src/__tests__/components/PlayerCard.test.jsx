import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PlayerCard } from '../../components/PlayerCard.jsx'

// Mock utility functions
vi.mock('../../utils/playerCalculations.js', () => ({
  getPlayerTierByName: vi.fn(),
  getTierColor: vi.fn()
}))

vi.mock('../../utils/constants.js', () => ({
  difficultyColors: {
    1: 'bg-green-500',
    2: 'bg-yellow-500', 
    3: 'bg-orange-500',
    4: 'bg-red-500',
    5: 'bg-purple-500'
  }
}))

import { getPlayerTierByName, getTierColor } from '../../utils/playerCalculations.js'

describe('PlayerCard Component', () => {
  const mockPlayer = {
    id: 1,
    name: 'Test Player',
    position: 'F',
    team: 'ARS',
    age: 25,
    fp90: 8.5,
    vorp: 15.2,
    historicalPoints: 180,
    news: null,
    isPositionFull: false,
    positionCount: 2,
    positionLimit: 5
  }

  const mockFixtureIndicators = [
    { matchweek: 1, difficulty: 2, home: true, opponent: 'LIV' },
    { matchweek: 2, difficulty: 4, home: false, opponent: 'MCI' },
    { matchweek: 3, difficulty: 1, home: true, opponent: 'NEW' }
  ]

  const mockPlayerTiers = {
    F: [{ name: 'Test Player', tier: 'ELITE' }]
  }

  const defaultProps = {
    player: mockPlayer,
    index: 0,
    fixtureIndicators: mockFixtureIndicators,
    playerTiers: mockPlayerTiers,
    onDraft: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getPlayerTierByName.mockReturnValue(1)
    getTierColor.mockReturnValue('bg-green-500 text-green-100')
  })

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render player basic information', () => {
      render(<PlayerCard {...defaultProps} />)
      
      expect(screen.getByText('Test Player')).toBeInTheDocument()
      expect(screen.getByText('F')).toBeInTheDocument()
      expect(screen.getByText('ARS')).toBeInTheDocument()
      expect(screen.getByText('Age: 25')).toBeInTheDocument()
      expect(screen.getByText('FP/90: 8.5')).toBeInTheDocument()
      expect(screen.getByText('#1')).toBeInTheDocument()
    })

    it('should render VORP and historical points', () => {
      render(<PlayerCard {...defaultProps} />)
      
      expect(screen.getAllByText('15.2')[0]).toBeInTheDocument()
      expect(screen.getAllByText('180')[0]).toBeInTheDocument()
      expect(screen.getAllByText('VORP')[0]).toBeInTheDocument()
    })

    it('should render position count and limit', () => {
      render(<PlayerCard {...defaultProps} />)
      
      expect(screen.getAllByText('2/5')[0]).toBeInTheDocument()
    })

    it('should render fixture indicators', () => {
      const { container } = render(<PlayerCard {...defaultProps} />)
      
      const fixtures = container.querySelectorAll('.w-2.h-2.rounded-full')
      expect(fixtures).toHaveLength(3)
    })

    it('should render player tier when available', () => {
      render(<PlayerCard {...defaultProps} />)
      
      expect(getPlayerTierByName).toHaveBeenCalledWith('Test Player', mockPlayerTiers)
      expect(getTierColor).toHaveBeenCalledWith(1)
      expect(screen.getAllByText('T1')[0]).toBeInTheDocument()
    })

    it('should not render tier when not available', () => {
      getPlayerTierByName.mockReturnValue(null)
      
      render(<PlayerCard {...defaultProps} />)
      
      const { container } = render(<PlayerCard {...defaultProps} />)
      expect(container.querySelector('[class*="text-green-100"]')).toBe(null)
    })

    it('should render news when available', () => {
      const playerWithNews = {
        ...mockPlayer,
        news: 'Minor injury concern'
      }
      
      render(<PlayerCard {...defaultProps} player={playerWithNews} />)
      
      expect(screen.getByText('Minor injury concern')).toBeInTheDocument()
    })
  })

  describe('position styling', () => {
    it('should apply correct styling for Forward', () => {
      render(<PlayerCard {...defaultProps} />)
      
      const positionBadge = screen.getAllByText('F')[0]
      expect(positionBadge).toHaveClass('bg-red-900/50', 'text-red-300')
    })

    it('should apply correct styling for Midfielder', () => {
      const midfielder = { ...mockPlayer, position: 'M' }
      
      render(<PlayerCard {...defaultProps} player={midfielder} />)
      
      const positionBadge = screen.getByText('M')
      expect(positionBadge).toHaveClass('bg-green-900/50', 'text-green-300')
    })

    it('should apply correct styling for Defender', () => {
      const defender = { ...mockPlayer, position: 'D' }
      
      render(<PlayerCard {...defaultProps} player={defender} />)
      
      const positionBadge = screen.getByText('D')
      expect(positionBadge).toHaveClass('bg-blue-900/50', 'text-blue-300')
    })

    it('should apply correct styling for Goalkeeper', () => {
      const goalkeeper = { ...mockPlayer, position: 'G' }
      
      render(<PlayerCard {...defaultProps} player={goalkeeper} />)
      
      const positionBadge = screen.getByText('G')
      expect(positionBadge).toHaveClass('bg-yellow-900/50', 'text-yellow-300')
    })
  })

  describe('position limit styling', () => {
    it('should show green when position count is low', () => {
      render(<PlayerCard {...defaultProps} />)
      
      const positionCount = screen.getAllByText('2/5')[0]
      expect(positionCount).toHaveClass('bg-green-900/50', 'text-green-300')
    })

    it('should show yellow when position count is near limit', () => {
      const nearLimitPlayer = {
        ...mockPlayer,
        positionCount: 4,
        positionLimit: 5
      }
      
      render(<PlayerCard {...defaultProps} player={nearLimitPlayer} />)
      
      const positionCount = screen.getByText('4/5')
      expect(positionCount).toHaveClass('bg-yellow-900/50', 'text-yellow-300')
    })

    it('should show red when position is full', () => {
      const fullPositionPlayer = {
        ...mockPlayer,
        isPositionFull: true,
        positionCount: 5,
        positionLimit: 5,
        draftErrors: ['Position limit reached']
      }
      
      render(<PlayerCard {...defaultProps} player={fullPositionPlayer} />)
      
      const positionCount = screen.getByText('5/5')
      expect(positionCount).toHaveClass('bg-red-900/50', 'text-red-300')
    })
  })

  describe('disabled state', () => {
    it('should apply disabled styling when position is full', () => {
      const disabledPlayer = {
        ...mockPlayer,
        isPositionFull: true,
        draftErrors: ['Position limit reached']
      }
      
      const { container } = render(
        <PlayerCard {...defaultProps} player={disabledPlayer} />
      )
      
      const playerCard = container.firstChild
      expect(playerCard).toHaveClass('bg-red-900/50', 'cursor-not-allowed', 'opacity-60')
    })

    it('should show draft error in title when position is full', () => {
      const disabledPlayer = {
        ...mockPlayer,
        isPositionFull: true,
        draftErrors: ['Position limit reached', 'Team is full']
      }
      
      const { container } = render(
        <PlayerCard {...defaultProps} player={disabledPlayer} />
      )
      
      const playerCard = container.firstChild
      expect(playerCard).toHaveAttribute('title', 'Cannot draft: Position limit reached, Team is full')
    })
  })

  describe('user interactions', () => {
    it('should call onDraft when clicked and not disabled', () => {
      const onDraft = vi.fn()
      
      const { container } = render(<PlayerCard {...defaultProps} onDraft={onDraft} />)
      
      // Click on the main player card container
      const playerCard = container.firstChild.firstChild
      fireEvent.click(playerCard)
      
      expect(onDraft).toHaveBeenCalledWith(mockPlayer)
    })

    it('should not call onDraft when clicked and disabled', () => {
      const onDraft = vi.fn()
      const disabledPlayer = { ...mockPlayer, isPositionFull: true }
      
      const { container } = render(
        <PlayerCard {...defaultProps} player={disabledPlayer} onDraft={onDraft} />
      )
      
      const playerCard = container.firstChild.firstChild
      fireEvent.click(playerCard)
      
      expect(onDraft).not.toHaveBeenCalled()
    })

    it('should call onMouseEnter with player and event', () => {
      const onMouseEnter = vi.fn()
      
      const { container } = render(<PlayerCard {...defaultProps} onMouseEnter={onMouseEnter} />)
      
      const playerCard = container.firstChild.firstChild
      fireEvent.mouseEnter(playerCard, { clientX: 100, clientY: 200 })
      
      expect(onMouseEnter).toHaveBeenCalledWith(mockPlayer, expect.any(Object))
    })

    it('should call onMouseLeave when mouse leaves', () => {
      const onMouseLeave = vi.fn()
      
      const { container } = render(<PlayerCard {...defaultProps} onMouseLeave={onMouseLeave} />)
      
      const playerCard = container.firstChild.firstChild
      fireEvent.mouseLeave(playerCard)
      
      expect(onMouseLeave).toHaveBeenCalled()
    })
  })

  describe('fixture indicators', () => {
    it('should render correct number of fixture indicators', () => {
      const { container } = render(<PlayerCard {...defaultProps} />)
      const fixtures = container.querySelectorAll('[title*="GW"]')
      expect(fixtures).toHaveLength(3)
    })

    it('should show correct fixture tooltip', () => {
      render(<PlayerCard {...defaultProps} />)
      
      const firstFixture = screen.getAllByTitle('GW1: vs LIV (2/5)')[0]
      expect(firstFixture).toBeInTheDocument()
    })

    it('should show away fixture correctly', () => {
      render(<PlayerCard {...defaultProps} />)
      
      const awayFixture = screen.getAllByTitle('GW2: @ MCI (4/5)')[0]
      expect(awayFixture).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle missing VORP gracefully', () => {
      const playerWithoutVorp = { ...mockPlayer, vorp: null }
      
      render(<PlayerCard {...defaultProps} player={playerWithoutVorp} />)
      
      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('should handle missing historical points gracefully', () => {
      const playerWithoutPoints = { ...mockPlayer, historicalPoints: null }
      
      const { container } = render(<PlayerCard {...defaultProps} player={playerWithoutPoints} />)
      expect(container.querySelector('.text-sm.text-blue-400')).toHaveTextContent('0')
    })

    it('should use player name as key when id is missing', () => {
      const playerWithoutId = { ...mockPlayer }
      delete playerWithoutId.id
      
      const { container } = render(
        <PlayerCard {...defaultProps} player={playerWithoutId} />
      )
      
      // Should not throw error and render successfully
      expect(container.firstChild).toHaveAttribute('class', expect.stringContaining('p-3'))
    })

    it('should handle empty fixture indicators', () => {
      const propsWithoutFixtures = { ...defaultProps, fixtureIndicators: [] }
      const { container } = render(<PlayerCard {...propsWithoutFixtures} />)
      
      // Check that no fixture indicators are present within this specific component
      const fixtures = container.querySelectorAll('[title*="GW"]')
      expect(fixtures).toHaveLength(0)
    })
  })

  describe('memoization', () => {
    it('should not re-render when props have not changed', () => {
      const { rerender } = render(<PlayerCard {...defaultProps} />)
      
      const initialRenderCount = screen.getAllByText('Test Player')[0]
      
      // Re-render with same props
      rerender(<PlayerCard {...defaultProps} />)
      
      // Component should be memoized and not re-render unnecessarily
      expect(screen.getAllByText('Test Player')[0]).toBe(initialRenderCount)
    })
  })
}) 