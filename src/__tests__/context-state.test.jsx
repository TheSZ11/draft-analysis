import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { useDraftContext, useUIContext } from '../contexts/index.js'
import { DraftProvider } from '../contexts/DraftContext.jsx'
import { PlayerProvider } from '../contexts/PlayerContext.jsx'
import { UIProvider } from '../contexts/UIContext.jsx'
import { FixtureProvider } from '../contexts/FixtureContext.jsx'

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

// Test component to verify context data
const TestComponent = () => {
  const { teams, currentPick, draftedPlayers } = useDraftContext()
  const { selectedPosition } = useUIContext()
  
  return (
    <div>
      <div data-testid="teams-count">{teams?.length || 0}</div>
      <div data-testid="current-pick">{currentPick || 1}</div>
      <div data-testid="drafted-count">{draftedPlayers?.length || 0}</div>
      <div data-testid="selected-position">{selectedPosition || 'ALL'}</div>
    </div>
  )
}

describe('Context State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup();
  });

  it('should provide draft context with initial state', () => {
    render(
      <TestProviders>
        <TestComponent />
      </TestProviders>
    )

    // Should have initial draft state - teams start empty until initialized
    expect(screen.getByTestId('teams-count')).toHaveTextContent('0') // Teams start empty
    expect(screen.getAllByTestId('current-pick')[0]).toHaveTextContent('1') // First pick
    expect(screen.getByTestId('drafted-count')).toHaveTextContent('0') // No players drafted
  })

  it('should provide UI context with initial state', () => {
    render(
      <TestProviders>
        <TestComponent />
      </TestProviders>
    )

    // Should have initial UI state
    expect(screen.getAllByTestId('selected-position')[0]).toHaveTextContent('ALL') // All positions selected
  })

  it('should not throw errors when contexts are used', () => {
    // This test verifies that all contexts are properly set up and don't cause errors
    expect(() => {
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      )
    }).not.toThrow()
  })

  it('should provide all required context methods', () => {
    const TestMethodsComponent = () => {
      const draftContext = useDraftContext()
      const uiContext = useUIContext()
      
      // Test that key methods exist
      const hasRequiredMethods = !!(
        draftContext.getCurrentDraftTeam &&
        draftContext.draftPlayerToTeam &&
        draftContext.getDraftProgress &&
        uiContext.updateSelectedPosition &&
        uiContext.handlePlayerHover &&
        uiContext.clearPlayerHover
      )
      
      return <div data-testid="has-methods">{hasRequiredMethods ? 'true' : 'false'}</div>
    }
    
    render(
      <TestProviders>
        <TestMethodsComponent />
      </TestProviders>
    )

    expect(screen.getByTestId('has-methods')).toHaveTextContent('true')
  })
}) 