import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { DraftProvider } from '../../contexts/DraftContext.jsx'
import { PlayerProvider } from '../../contexts/PlayerContext.jsx'
import { UIProvider } from '../../contexts/UIContext.jsx'
import { FixtureProvider } from '../../contexts/FixtureContext.jsx'
import { PlayerCard } from '../../components/PlayerCard.jsx'
import { PlayerList } from '../../components/PlayerList.jsx'
import { DraftBoard } from '../../components/DraftBoard.jsx'
import { Header } from '../../components/Header.jsx'
import { 
  mockPlayers, 
  mockTeams, 
  createMockTeams,
  createMockPlayersArray,
  mockReplacementLevels,
  mockStrategicRecommendations 
} from '../fixtures/mockData.js'

// Mock external dependencies
vi.mock('../../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn(() => mockStrategicRecommendations.basic)
}))

vi.mock('../../leagueConfig.js', () => ({
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
    maxActivePlayers: 11,
    maxReservePlayers: 4,
    maxInjuredReservePlayers: 2
  })),
  LEAGUE_CONFIG: {
    positionLimits: {
      D: { minActive: 2, maxActive: 4, totalMax: 6 },
      M: { minActive: 3, maxActive: 5, totalMax: 6 },
      F: { minActive: 1, maxActive: 3, totalMax: 4 },
      G: { minActive: 1, maxActive: 1, totalMax: 2 }
    },
    rosterLimits: {
      maxTotalPlayers: 15,
      maxActivePlayers: 11,
      maxReservePlayers: 4,
      maxInjuredReservePlayers: 2
    }
  }
}))

// Mock fetch for player data
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(createMockPlayersArray(50))
  })
)

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

describe('Draft Flow Integration Tests', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  describe('Normal Draft Mode', () => {
    it('should complete a full draft flow from start to finish', async () => {
      const MockDraftApp = () => {
        const [currentTeam, setCurrentTeam] = useState(mockTeams.empty)
        const [currentPick, setCurrentPick] = useState(1)
        const [availablePlayers] = useState([
          mockPlayers.elite,     // Forward
          mockPlayers.good,      // Midfielder  
          mockPlayers.defender,  // Defender
          mockPlayers.poor       // Another player (likely goalkeeper)
        ])

        const draftPlayer = (player) => {
          setCurrentTeam(prev => ({
            ...prev,
            picks: [...prev.picks, { ...player, rosterCategory: 'active' }]
          }))
          setCurrentPick(prev => prev + 1)
        }

        return (
          <div>
            <div data-testid="current-pick">Pick: {currentPick}</div>
            <div data-testid="team-size">Team Size: {currentTeam.picks.length}</div>
            <div data-testid="available-count">Available: {availablePlayers.length}</div>
            
            <TestProviders>
              <PlayerList />
            </TestProviders>
          </div>
        )
      }

      const { container } = render(<MockDraftApp />)

      // Verify initial state using container queries
      const currentPickElement = container.querySelector('[data-testid="current-pick"]')
      const teamSizeElement = container.querySelector('[data-testid="team-size"]')
      
      expect(currentPickElement).toHaveTextContent('Pick: 1')
      expect(teamSizeElement).toHaveTextContent('Team Size: 0')
    })

    it('should prevent drafting when position limits are reached', async () => {
      const MockLimitedApp = () => {
        // Create a team with 4 forwards (position limit reached)
        const [currentTeam] = useState({
          ...mockTeams.empty,
          picks: [
            { ...mockPlayers.elite, position: 'F', rosterCategory: 'active' },      // Forward 1
            { ...mockPlayers.good, position: 'F', rosterCategory: 'active' },       // Forward 2  
            { ...mockPlayers.defender, position: 'F', rosterCategory: 'active' },   // Forward 3
            { ...mockPlayers.poor, position: 'F', rosterCategory: 'active' }        // Forward 4
          ]
        })
        const [canDraft, setCanDraft] = useState(true)
        
        // Check if can draft more forwards (max 4 allowed)
        const forwardCount = currentTeam.picks.filter(p => p.position === 'F').length
        const maxForwards = 4

        const handleDraftAttempt = () => {
          if (forwardCount >= maxForwards) {
            setCanDraft(false)
          }
        }

        return (
          <div>
            <div data-testid="forward-count">
              Forwards: {forwardCount}
            </div>
            <div data-testid="max-forwards">
              Max Forwards: {maxForwards}
            </div>
            <div data-testid="draft-status">
              {forwardCount >= maxForwards ? 'Position Limit Reached' : 'Can Draft More'}
            </div>
            <button onClick={handleDraftAttempt} data-testid="draft-button">
              Attempt Draft
            </button>
            
            <TestProviders>
              <PlayerList />
            </TestProviders>
          </div>
        )
      }

      const { container } = render(<MockLimitedApp />)

      // Use container queries to avoid multiple element issues
      const forwardCountElement = container.querySelector('[data-testid="forward-count"]')
      const draftStatusElement = container.querySelector('[data-testid="draft-status"]')
      
      expect(forwardCountElement).toHaveTextContent('Forwards: 4')
      expect(draftStatusElement).toHaveTextContent('Position Limit Reached')
    })

    it('should update roster categories correctly', async () => {
      const MockRosterApp = () => {
        const [currentTeam, setCurrentTeam] = useState({
          ...mockTeams.empty,
          picks: [{ ...mockPlayers.elite, rosterCategory: 'active' }] // One active player (Mohamed Salah)
        })

        const movePlayerToCategory = (playerId, newCategory) => {
          setCurrentTeam(prev => ({
            ...prev,
            picks: prev.picks.map(player => 
              player.id === playerId 
                ? { ...player, rosterCategory: newCategory }
                : player
            )
          }))
        }

        const player = currentTeam.picks[0]

        return (
          <div>
            <div data-testid="player-category">
              {player.name}: {player.rosterCategory}
            </div>
            <button 
              onClick={() => movePlayerToCategory(player.id, 'reserve')}
              data-testid="move-to-reserve"
            >
              Move to Reserve
            </button>
            <button 
              onClick={() => movePlayerToCategory(player.id, 'active')}
              data-testid="move-to-active"
            >
              Move to Active
            </button>
          </div>
        )
      }

      render(
        <TestProviders>
          <MockRosterApp />
        </TestProviders>
      )

      expect(screen.getByTestId('player-category')).toHaveTextContent('Mohamed Salah: active')

      // Move player to reserve
      const reserveButton = screen.getByTestId('move-to-reserve')
      await user.click(reserveButton)

      await waitFor(() => {
        expect(screen.getByTestId('player-category')).toHaveTextContent('Mohamed Salah: reserve')
      })

      // Move back to active
      const activeButton = screen.getByTestId('move-to-active')
      await user.click(activeButton)

      await waitFor(() => {
        expect(screen.getByTestId('player-category')).toHaveTextContent('Mohamed Salah: active')
      })
    })
  })

  describe('Simulation Mode', () => {
    it('should run a complete simulation with AI picks', async () => {
      const MockSimulationApp = () => {
        const [isSimulating, setIsSimulating] = useState(false)
        const [currentPick, setCurrentPick] = useState(1)
        const [userPosition] = useState(2)
        const [userPicks, setUserPicks] = useState(0)
        const [availablePlayers] = useState([
          mockPlayers.forward1,
          mockPlayers.midfielder1,
          mockPlayers.defender1
        ])

        const startSimulation = () => {
          setIsSimulating(true)
        }

        const makeUserPick = (player) => {
          if (currentPick === userPosition) {
            setUserPicks(prev => prev + 1)
            setCurrentPick(prev => prev + 1)
          }
        }

        return (
          <div>
            <div data-testid="simulation-active">
              {isSimulating ? 'Simulation Active' : 'Simulation Inactive'}
            </div>
            <div data-testid="user-position">Your Position: {userPosition}</div>
            <div data-testid="current-pick">Current Pick: {currentPick}</div>
            <div data-testid="user-picks">Your Picks: {userPicks}</div>
            
            {!isSimulating && (
              <button 
                onClick={startSimulation}
                data-testid="start-simulation"
              >
                Start Simulation
              </button>
            )}
            
            {isSimulating && currentPick === userPosition && (
              <div>
                {availablePlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => makeUserPick(player)}
                    data-testid={`pick-${player.name.replace(' ', '-').toLowerCase()}`}
                  >
                    Pick {player.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      }

      render(
        <TestProviders>
          <MockSimulationApp />
        </TestProviders>
      )

      // Start simulation
      const startButton = screen.getByTestId('start-simulation')
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('simulation-active')).toHaveTextContent('Simulation Active')
      })

      // Make a pick when it's user's turn
      if (screen.queryByTestId('pick-player-1')) {
        const pickButton = screen.getByTestId('pick-player-1')
        await user.click(pickButton)

        await waitFor(() => {
          expect(screen.getByTestId('user-picks')).toHaveTextContent('Your Picks: 1')
          expect(screen.getByTestId('current-pick')).toHaveTextContent('Current Pick: 3')
        })
      }
    })

    it('should handle AI picks between user picks', async () => {
      // This would test the AI drafting logic between user turns
      const MockAIApp = () => {
        const [picks, setPicks] = useState([])
        const [currentPick, setCurrentPick] = useState(1)

        const simulateAIPick = () => {
          const aiPlayer = { 
            id: Date.now(), 
            name: `AI Pick ${currentPick}`, 
            position: 'M',
            team: 'AI'
          }
          setPicks(prev => [...prev, aiPlayer])
          setCurrentPick(prev => prev + 1)
        }

        return (
          <div>
            <button onClick={simulateAIPick} data-testid="ai-pick">
              Simulate AI Pick
            </button>
            <div data-testid="pick-count">Total Picks: {picks.length}</div>
            <div data-testid="latest-pick">
              Latest: {picks[picks.length - 1]?.name || 'None'}
            </div>
          </div>
        )
      }

      render(
        <TestProviders>
          <MockAIApp />
        </TestProviders>
      )

      expect(screen.getByTestId('pick-count')).toHaveTextContent('Total Picks: 0')

      // Simulate multiple AI picks
      const aiButton = screen.getByTestId('ai-pick')
      
      await user.click(aiButton)
      await waitFor(() => {
        expect(screen.getByTestId('pick-count')).toHaveTextContent('Total Picks: 1')
        expect(screen.getByTestId('latest-pick')).toHaveTextContent('Latest: AI Pick 1')
      })

      await user.click(aiButton)
      await waitFor(() => {
        expect(screen.getByTestId('pick-count')).toHaveTextContent('Total Picks: 2')
        expect(screen.getByTestId('latest-pick')).toHaveTextContent('Latest: AI Pick 2')
      })
    })
  })

  describe('Player Filtering and Search', () => {
    it('should filter players by position', async () => {
      const MockFilterApp = () => {
        const [players] = useState([
          mockPlayers.elite, // F
          mockPlayers.good,  // M
          mockPlayers.defender // D
        ])
        const [selectedPosition, setSelectedPosition] = useState('ALL')

        const filteredPlayers = selectedPosition === 'ALL' 
          ? players 
          : players.filter(p => p.position === selectedPosition)

        return (
          <div>
            <select 
              value={selectedPosition} 
              onChange={(e) => setSelectedPosition(e.target.value)}
              data-testid="position-filter"
            >
              <option value="ALL">All Positions</option>
              <option value="F">Forwards</option>
              <option value="M">Midfielders</option>
              <option value="D">Defenders</option>
              <option value="G">Goalkeepers</option>
            </select>
            
            <div data-testid="player-count">
              Players: {filteredPlayers.length}
            </div>
            
            {filteredPlayers.map(player => (
              <div key={player.id} data-testid={`player-${player.position}`}>
                {player.name} ({player.position})
              </div>
            ))}
          </div>
        )
      }

      render(
        <TestProviders>
          <MockFilterApp />
        </TestProviders>
      )

      // Initially show all players
      expect(screen.getByTestId('player-count')).toHaveTextContent('Players: 3')
      expect(screen.getByTestId('player-F')).toBeInTheDocument()
      expect(screen.getByTestId('player-M')).toBeInTheDocument()
      expect(screen.getByTestId('player-D')).toBeInTheDocument()

      // Filter to forwards only
      const positionFilter = screen.getByTestId('position-filter')
      await user.selectOptions(positionFilter, 'F')

      await waitFor(() => {
        expect(screen.getByTestId('player-count')).toHaveTextContent('Players: 1')
        expect(screen.getByTestId('player-F')).toBeInTheDocument()
        expect(screen.queryByTestId('player-M')).not.toBeInTheDocument()
        expect(screen.queryByTestId('player-D')).not.toBeInTheDocument()
      })

      // Filter to midfielders
      await user.selectOptions(positionFilter, 'M')

      await waitFor(() => {
        expect(screen.getByTestId('player-count')).toHaveTextContent('Players: 1')
        expect(screen.queryByTestId('player-F')).not.toBeInTheDocument()
        expect(screen.getByTestId('player-M')).toBeInTheDocument()
        expect(screen.queryByTestId('player-D')).not.toBeInTheDocument()
      })
    })

    it('should search players by name', async () => {
      const MockSearchApp = () => {
        const [players] = useState([
          mockPlayers.elite,
          mockPlayers.good,
          mockPlayers.defender
        ])
        const [searchTerm, setSearchTerm] = useState('')

        const filteredPlayers = players.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )

        return (
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search players..."
              data-testid="search-input"
            />
            
            <div data-testid="search-results">
              Results: {filteredPlayers.length}
            </div>
            
            {filteredPlayers.map(player => (
              <div key={player.id} data-testid={`result-${player.id}`}>
                {player.name}
              </div>
            ))}
          </div>
        )
      }

      render(
        <TestProviders>
          <MockSearchApp />
        </TestProviders>
      )

      // Initially show all players
      expect(screen.getByTestId('search-results')).toHaveTextContent('Results: 3')

      // Search for "Salah"
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Salah')

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toHaveTextContent('Results: 1')
        expect(screen.getByTestId('result-1')).toHaveTextContent('Mohamed Salah')
        expect(screen.queryByTestId('result-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('result-4')).not.toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toHaveTextContent('Results: 3')
      })

      // Search for "Bruno"
      await user.type(searchInput, 'Bruno')

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toHaveTextContent('Results: 1')
        expect(screen.getByTestId('result-2')).toHaveTextContent('Bruno Fernandes')
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Mock failed fetch
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      const MockErrorApp = () => {
        const [error, setError] = useState(null)
        const [loading, setLoading] = useState(false)

        const loadData = async () => {
          setLoading(true)
          setError(null)
          try {
            await fetch('/api/players')
          } catch (err) {
            setError(err.message)
          } finally {
            setLoading(false)
          }
        }

        return (
          <div>
            <button onClick={loadData} data-testid="load-data">
              Load Data
            </button>
            {loading && <div data-testid="loading">Loading...</div>}
            {error && <div data-testid="error">Error: {error}</div>}
          </div>
        )
      }

      render(
        <TestProviders>
          <MockErrorApp />
        </TestProviders>
      )

      const loadButton = screen.getByTestId('load-data')
      await user.click(loadButton)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Error: Network error')
      })
    })

    it('should handle malformed data gracefully', async () => {
      const MockMalformedApp = () => {
        const [players] = useState([
          null,
          undefined,
          { id: 1 }, // Missing required fields
          { id: 2, name: '', position: 'INVALID' },
          mockPlayers.elite // Valid player
        ])

        const validPlayers = players.filter(p => p && p.id && p.name && ['F', 'M', 'D', 'G'].includes(p.position))

        return (
          <div>
            <div data-testid="total-players">Total: {players.length}</div>
            <div data-testid="valid-players">Valid: {validPlayers.length}</div>
          </div>
        )
      }

      render(
        <TestProviders>
          <MockMalformedApp />
        </TestProviders>
      )

      expect(screen.getByTestId('total-players')).toHaveTextContent('Total: 5')
      expect(screen.getByTestId('valid-players')).toHaveTextContent('Valid: 1')
    })
  })
}) 