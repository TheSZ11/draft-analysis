import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DraftProvider } from '../contexts/DraftContext.jsx'
import { PlayerProvider } from '../contexts/PlayerContext.jsx'
import { UIProvider } from '../contexts/UIContext.jsx'
import { FixtureProvider } from '../contexts/FixtureContext.jsx'
import { PlayerCard } from '../components/PlayerCard.jsx'

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

// Mock player data
const mockPlayer = {
  id: 1,
  name: 'Test Player',
  position: 'F',
  team: 'Arsenal',
  age: 25,
  historicalPoints: 350,
  vorp: 15.5,
  strategicScore: 45,
  tier: 'HIGH',
  isPositionFull: false
}

describe('Draft Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup();
  });

  it('should render a player card with correct information', () => {
    const mockDraftFn = vi.fn()
    
    render(
      <TestProviders>
        <PlayerCard 
          player={mockPlayer}
          index={0}
          fixtureIndicators={[]}
          playerTiers={{}}
          onDraft={mockDraftFn}
          onMouseEnter={vi.fn()}
          onMouseLeave={vi.fn()}
        />
      </TestProviders>
    )

    // Should display player information
    expect(screen.getByText('Test Player')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
    expect(screen.getByText(/arsenal/i)).toBeInTheDocument()
    expect(screen.getByText(/age: 25/i)).toBeInTheDocument()
  })

  it('should call onDraft when player card is clicked', async () => {
    const user = userEvent.setup()
    const mockDraftFn = vi.fn()
    
    render(
      <TestProviders>
        <PlayerCard 
          player={mockPlayer}
          index={0}
          fixtureIndicators={[]}
          playerTiers={{}}
          onDraft={mockDraftFn}
          onMouseEnter={vi.fn()}
          onMouseLeave={vi.fn()}
        />
      </TestProviders>
    )

    const playerCard = screen.getAllByText('Test Player')[0].closest('div[class*="cursor-pointer"]');
    
    if (playerCard) {
      await user.click(playerCard)
      expect(mockDraftFn).toHaveBeenCalledWith(mockPlayer)
    }
  })

  it('should not allow drafting when position is full', async () => {
    const user = userEvent.setup()
    const mockDraftFn = vi.fn()
    
    const fullPositionPlayer = {
      ...mockPlayer,
      isPositionFull: true
    }
    
    render(
      <TestProviders>
        <PlayerCard 
          player={fullPositionPlayer}
          index={0}
          fixtureIndicators={[]}
          playerTiers={{}}
          onDraft={mockDraftFn}
          onMouseEnter={vi.fn()}
          onMouseLeave={vi.fn()}
        />
      </TestProviders>
    )

    const playerCard = screen.getAllByText('Test Player')[0].closest('div');
    
    if (playerCard) {
      await user.click(playerCard)
      // Should not call draft function when position is full
      expect(mockDraftFn).not.toHaveBeenCalled()
    }
  })

  it('should display safe values for NaN properties', () => {
    const playerWithNaN = {
      ...mockPlayer,
      vorp: NaN,
      strategicScore: NaN,
      historicalPoints: NaN
    }
    
    render(
      <TestProviders>
        <PlayerCard 
          player={playerWithNaN}
          index={0}
          fixtureIndicators={[]}
          playerTiers={{}}
          onDraft={vi.fn()}
          onMouseEnter={vi.fn()}
          onMouseLeave={vi.fn()}
        />
      </TestProviders>
    )

    // Should not display NaN but show safe fallback values
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
    
    // Should display 0 or 0.0 as fallbacks
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0.0')).toBeInTheDocument()
  })
}) 