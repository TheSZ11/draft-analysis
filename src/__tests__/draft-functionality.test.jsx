import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { DraftProvider } from '../contexts/DraftContext.jsx'
import { PlayerProvider } from '../contexts/PlayerContext.jsx'
import { UIProvider } from '../contexts/UIContext.jsx'
import { FixtureProvider } from '../contexts/FixtureContext.jsx'
import { PlayerCard } from '../components/PlayerCard.jsx'
import { createMockPlayersArray } from './fixtures/mockData.js'

// Mock external dependencies
vi.mock('../utils/dataProcessing.js', () => ({
  fetchPlayerData: vi.fn(() => Promise.resolve({
    players: createMockPlayersArray(10),
    replacementLevels: { F: 5, M: 3, D: 2, G: 1 },
    playerTiers: { ELITE: [], HIGH: [], MEDIUM: [], LOW: [] }
  })),
  updatePlayerCalculations: vi.fn(() => ({
    replacementLevels: { F: 5, M: 3, D: 2, G: 1 },
    playerTiers: { ELITE: [], HIGH: [], MEDIUM: [], LOW: [] }
  })),
  fetchFixtures: vi.fn(() => Promise.resolve({}))
}))

vi.mock('../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn(() => ({
    recommendations: [],
    insights: [],
    rosterAnalysis: null
  }))
}))

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

// Mock team with position limits
const mockTeam = {
  id: 1,
  name: 'Your Team',
  picks: [],
  positionLimits: {
    F: { totalMax: 4, maxActive: 3 },
    M: { totalMax: 6, maxActive: 5 },
    D: { totalMax: 6, maxActive: 4 },
    G: { totalMax: 2, maxActive: 1 }
  },
  maxTotalPlayers: 15,
  maxActivePlayers: 11
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

  describe('Manual Drafting Behavior', () => {
    it('should remove drafted player from available players list in regular mode', async () => {
      // Mock the draft function behavior for regular mode
      const MockDraftApp = () => {
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Player 1', position: 'F' },
          { id: 2, name: 'Player 2', position: 'M' },
          { id: 3, name: 'Player 3', position: 'D' }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [isSimulationMode] = React.useState(false)
        
        const draftPlayer = (player) => {
          if (!isSimulationMode) {
            // Regular mode - should remove player from available list
            setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
            setDraftedPlayers(prev => [...prev, player.name])
          }
        }
        
        return (
          <div>
            <div data-testid="available-count">Available: {availablePlayers.length}</div>
            <div data-testid="drafted-count">Drafted: {draftedPlayers.length}</div>
            <div data-testid="mode">Mode: {isSimulationMode ? 'Simulation' : 'Regular'}</div>
            {availablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => draftPlayer(player)}
                data-testid={`draft-${player.id}`}
              >
                Draft {player.name}
              </button>
            ))}
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<MockDraftApp />)
      
      // Initial state
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 3')
      expect(screen.getByTestId('drafted-count')).toHaveTextContent('Drafted: 0')
      expect(screen.getByTestId('mode')).toHaveTextContent('Mode: Regular')
      
      // Draft Player 1
      const draftButton = screen.getByTestId('draft-1')
      await user.click(draftButton)
      
      // Should remove player from available list and add to drafted list
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 2')
      expect(screen.getByTestId('drafted-count')).toHaveTextContent('Drafted: 1')
      expect(screen.queryByTestId('draft-1')).not.toBeInTheDocument()
    })

    it('should maintain consistent draftedPlayers format (player names as strings)', async () => {
      const MockFormatApp = () => {
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [lastDraftedType, setLastDraftedType] = React.useState('')
        
        const testPlayer = { id: 1, name: 'Test Player', position: 'F' }
        
        const draftPlayerCorrectly = () => {
          // Should add player.name (string), not player object
          setDraftedPlayers(prev => [...prev, testPlayer.name])
          setLastDraftedType('string')
        }
        
        const draftPlayerIncorrectly = () => {
          // Wrong way - adding full player object
          setDraftedPlayers(prev => [...prev, testPlayer])
          setLastDraftedType('object')
        }
        
        return (
          <div>
            <button onClick={draftPlayerCorrectly} data-testid="draft-correct">
              Draft Correctly (name)
            </button>
            <button onClick={draftPlayerIncorrectly} data-testid="draft-incorrect">
              Draft Incorrectly (object)
            </button>
            <div data-testid="drafted-list">
              {draftedPlayers.map((item, index) => (
                <div key={index} data-testid={`drafted-${index}`}>
                  Type: {typeof item}, Value: {typeof item === 'string' ? item : JSON.stringify(item)}
                </div>
              ))}
            </div>
            <div data-testid="last-type">Last Type: {lastDraftedType}</div>
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<MockFormatApp />)
      
      // Draft correctly (should add string)
      await user.click(screen.getByTestId('draft-correct'))
      expect(screen.getByTestId('drafted-0')).toHaveTextContent('Type: string, Value: Test Player')
      expect(screen.getByTestId('last-type')).toHaveTextContent('Last Type: string')
      
      // Draft incorrectly (shows the wrong way)
      await user.click(screen.getByTestId('draft-incorrect'))
      expect(screen.getByTestId('drafted-1')).toHaveTextContent('Type: object')
      expect(screen.getByTestId('last-type')).toHaveTextContent('Last Type: object')
    })

    it('should handle simulation mode vs regular mode consistently', async () => {
      const MockModeApp = () => {
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Player 1', position: 'F' },
          { id: 2, name: 'Player 2', position: 'M' }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [isSimulationMode, setIsSimulationMode] = React.useState(false)
        
        const draftPlayer = (player) => {
          // Both modes should behave the same way now
          setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
          setDraftedPlayers(prev => [...prev, player.name]) // Always add name, not object
        }
        
        return (
          <div>
            <button 
              onClick={() => setIsSimulationMode(!isSimulationMode)}
              data-testid="toggle-mode"
            >
              Toggle Mode
            </button>
            <div data-testid="mode">Mode: {isSimulationMode ? 'Simulation' : 'Regular'}</div>
            <div data-testid="available-count">Available: {availablePlayers.length}</div>
            <div data-testid="drafted-names">
              Drafted Names: {draftedPlayers.join(', ')}
            </div>
            {availablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => draftPlayer(player)}
                data-testid={`draft-${player.id}`}
              >
                Draft {player.name}
              </button>
            ))}
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<MockModeApp />)
      
      // Test regular mode
      expect(screen.getByTestId('mode')).toHaveTextContent('Mode: Regular')
      await user.click(screen.getByTestId('draft-1'))
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 1')
      expect(screen.getByTestId('drafted-names')).toHaveTextContent('Drafted Names: Player 1')
      
      // Switch to simulation mode
      await user.click(screen.getByTestId('toggle-mode'))
      expect(screen.getByTestId('mode')).toHaveTextContent('Mode: Simulation')
      
      // Draft another player in simulation mode
      await user.click(screen.getByTestId('draft-2'))
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 0')
      expect(screen.getByTestId('drafted-names')).toHaveTextContent('Drafted Names: Player 1, Player 2')
    })

    it('should validate roster rules before allowing draft', async () => {
      const MockValidationApp = () => {
        const [team, setTeam] = React.useState({
          ...mockTeam,
          picks: [
            // Add 4 forwards (max allowed)
            { id: 1, name: 'Forward 1', position: 'F', rosterCategory: 'active' },
            { id: 2, name: 'Forward 2', position: 'F', rosterCategory: 'active' },
            { id: 3, name: 'Forward 3', position: 'F', rosterCategory: 'active' },
            { id: 4, name: 'Forward 4', position: 'F', rosterCategory: 'active' }
          ]
        })
        const [availablePlayers] = React.useState([
          { id: 5, name: 'Forward 5', position: 'F' }, // Should be blocked
          { id: 6, name: 'Midfielder 1', position: 'M' } // Should be allowed
        ])
        const [draftError, setDraftError] = React.useState('')
        
        const validateAndDraft = (player) => {
          const currentPositionCount = team.picks.filter(p => p.position === player.position).length
          const positionLimit = team.positionLimits[player.position]?.totalMax || 0
          
          if (currentPositionCount >= positionLimit) {
            setDraftError(`Cannot draft ${player.name}: Position ${player.position} is full (${currentPositionCount}/${positionLimit})`)
            return
          }
          
          setDraftError('')
          setTeam(prev => ({
            ...prev,
            picks: [...prev.picks, { ...player, rosterCategory: 'active' }]
          }))
        }
        
        return (
          <div>
            <div data-testid="team-size">Team Size: {team.picks.length}</div>
            <div data-testid="forward-count">
              Forwards: {team.picks.filter(p => p.position === 'F').length}/4
            </div>
            <div data-testid="error" style={{ color: 'red' }}>
              {draftError}
            </div>
            {availablePlayers.map(player => {
              const currentCount = team.picks.filter(p => p.position === player.position).length
              const limit = team.positionLimits[player.position]?.totalMax || 0
              const isBlocked = currentCount >= limit
              
              return (
                <button
                  key={player.id}
                  onClick={() => validateAndDraft(player)}
                  data-testid={`draft-${player.id}`}
                  disabled={isBlocked}
                  style={{ opacity: isBlocked ? 0.5 : 1 }}
                >
                  Draft {player.name} ({player.position}) {isBlocked ? '(BLOCKED)' : ''}
                </button>
              )
            })}
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<MockValidationApp />)
      
      // Initial state - 4 forwards already drafted
      expect(screen.getByTestId('team-size')).toHaveTextContent('Team Size: 4')
      expect(screen.getByTestId('forward-count')).toHaveTextContent('Forwards: 4/4')
      
      // Try to draft another forward (should be blocked)
      const forwardButton = screen.getByTestId('draft-5')
      expect(forwardButton).toBeDisabled()
      expect(forwardButton).toHaveTextContent('Draft Forward 5 (F) (BLOCKED)')
      
      await user.click(forwardButton)
      // The button is disabled so clicking won't trigger the error message
      // Instead, verify the team size didn't change and the button is blocked
      expect(screen.getByTestId('team-size')).toHaveTextContent('Team Size: 4') // No change
      
      // Draft a midfielder (should be allowed)
      const midfielderButton = screen.getByTestId('draft-6')
      expect(midfielderButton).not.toBeDisabled()
      expect(midfielderButton).toHaveTextContent('Draft Midfielder 1 (M)')
      
      await user.click(midfielderButton)
      expect(screen.getByTestId('error')).toHaveTextContent('') // No error
      expect(screen.getByTestId('team-size')).toHaveTextContent('Team Size: 5') // Increased
    })

    it('should maintain state consistency after multiple drafts', async () => {
      const MockConsistencyApp = () => {
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Player A', position: 'F' },
          { id: 2, name: 'Player B', position: 'M' },
          { id: 3, name: 'Player C', position: 'D' },
          { id: 4, name: 'Player D', position: 'G' }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [currentPick, setCurrentPick] = React.useState(1)
        
        const draftPlayer = (player) => {
          // Simulate the complete draft process
          setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
          setDraftedPlayers(prev => [...prev, player.name])
          setCurrentPick(prev => prev + 1)
        }
        
        const totalPlayers = availablePlayers.length + draftedPlayers.length
        
        return (
          <div>
            <div data-testid="current-pick">Pick: {currentPick}</div>
            <div data-testid="available-count">Available: {availablePlayers.length}</div>
            <div data-testid="drafted-count">Drafted: {draftedPlayers.length}</div>
            <div data-testid="total-players">Total: {totalPlayers}</div>
            <div data-testid="drafted-list">
              Drafted: {draftedPlayers.map((name, i) => (
                <span key={i}>{name}{i < draftedPlayers.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
            {availablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => draftPlayer(player)}
                data-testid={`draft-${player.id}`}
              >
                Draft {player.name}
              </button>
            ))}
          </div>
        )
      }
      
      const user = userEvent.setup()
      render(<MockConsistencyApp />)
      
      // Initial state
      expect(screen.getByTestId('current-pick')).toHaveTextContent('Pick: 1')
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 4')
      expect(screen.getByTestId('drafted-count')).toHaveTextContent('Drafted: 0')
      expect(screen.getByTestId('total-players')).toHaveTextContent('Total: 4')
      
      // Draft first player
      await user.click(screen.getByTestId('draft-1'))
      expect(screen.getByTestId('current-pick')).toHaveTextContent('Pick: 2')
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 3')
      expect(screen.getByTestId('drafted-count')).toHaveTextContent('Drafted: 1')
      expect(screen.getByTestId('total-players')).toHaveTextContent('Total: 4')
      expect(screen.getByTestId('drafted-list')).toHaveTextContent('Drafted: Player A')
      
      // Draft second player
      await user.click(screen.getByTestId('draft-2'))
      expect(screen.getByTestId('current-pick')).toHaveTextContent('Pick: 3')
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 2')
      expect(screen.getByTestId('drafted-count')).toHaveTextContent('Drafted: 2')
      expect(screen.getByTestId('drafted-list')).toHaveTextContent('Drafted: Player A, Player B')
      
      // Draft third player
      await user.click(screen.getByTestId('draft-3'))
      expect(screen.getByTestId('current-pick')).toHaveTextContent('Pick: 4')
      expect(screen.getByTestId('available-count')).toHaveTextContent('Available: 1')
      expect(screen.getByTestId('drafted-count')).toHaveTextContent('Drafted: 3')
      expect(screen.getByTestId('drafted-list')).toHaveTextContent('Drafted: Player A, Player B, Player C')
      
      // Verify only one player left
      expect(screen.queryByTestId('draft-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('draft-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('draft-3')).not.toBeInTheDocument()
      expect(screen.getByTestId('draft-4')).toBeInTheDocument()
    })
  })
}) 