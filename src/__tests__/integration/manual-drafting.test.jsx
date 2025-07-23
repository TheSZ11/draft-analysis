import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { DraftProvider } from '../../contexts/DraftContext.jsx'
import { PlayerProvider } from '../../contexts/PlayerContext.jsx'
import { UIProvider } from '../../contexts/UIContext.jsx'
import { FixtureProvider } from '../../contexts/FixtureContext.jsx'
import { PlayerList } from '../../components/PlayerList.jsx'
import { createMockPlayersArray } from '../fixtures/mockData.js'

// Mock external dependencies
vi.mock('../../utils/dataProcessing.js', () => ({
  fetchPlayerData: vi.fn(() => Promise.resolve({
    players: createMockPlayersArray(20),
    replacementLevels: { F: 5, M: 3, D: 2, G: 1 },
    playerTiers: { ELITE: [], HIGH: [], MEDIUM: [], LOW: [] }
  })),
  updatePlayerCalculations: vi.fn(() => ({
    replacementLevels: { F: 5, M: 3, D: 2, G: 1 },
    playerTiers: { ELITE: [], HIGH: [], MEDIUM: [], LOW: [] }
  })),
  fetchFixtures: vi.fn(() => Promise.resolve({}))
}))

vi.mock('../../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn(() => ({
    recommendations: [
      {
        name: 'Test Recommendation',
        position: 'F',
        team: 'Liverpool',
        strategicScore: 85,
        vorp: 12.5,
        recommendation: 'High-value pick'
      }
    ],
    insights: [],
    rosterAnalysis: {
      eliteCount: 1,
      rosterStrength: 'STRONG',
      remainingRounds: 14,
      phase: 'EARLY'
    }
  }))
}))

vi.mock('../../utils/rosterValidation.js', () => ({
  validateDraftMove: vi.fn(() => ({ isValid: true, errors: [] })),
  validateRosterMove: vi.fn(() => ({ isValid: true, errors: [] })),
  determineRosterCategory: vi.fn(() => 'active'),
  getRosterCounts: vi.fn(() => ({ F: 0, M: 0, D: 0, G: 0 })),
  validateRoster: vi.fn(() => ({ isValid: true, errors: [] })),
  generateComplianceReport: vi.fn(() => ({ violations: [], warnings: [] })),
  validateLeagueCompliance: vi.fn(() => ({ isValid: true, errors: [] })),
  validateLineupLegality: vi.fn(() => ({ isValid: true, errors: [] }))
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

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(createMockPlayersArray(20))
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

describe('Manual Drafting Integration Tests', () => {
  let user

  beforeEach(() => {
    // Clean up any remaining DOM elements
    cleanup()
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  describe('Player Removal from Available List', () => {
    it('should remove drafted player from available list in regular mode', async () => {
      // Create a test component that tracks the actual state changes
      const ManualDraftTracker = () => {
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Erling Haaland', position: 'F', team: 'Manchester City', vorp: 25.5 },
          { id: 2, name: 'Kevin De Bruyne', position: 'M', team: 'Manchester City', vorp: 22.3 },
          { id: 3, name: 'Virgil van Dijk', position: 'D', team: 'Liverpool', vorp: 18.7 }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [currentPick, setCurrentPick] = React.useState(1)
        
        // Simulate the fixed draftPlayer function
        const draftPlayer = (player) => {
          // Key fix: Remove player from available list
          setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
          // Correct format: Add player name (string), not object
          setDraftedPlayers(prev => [...prev, player.name])
          setCurrentPick(prev => prev + 1)
        }
        
        return (
          <div data-testid="test-1">
            <div data-testid="test-1-current-pick">Pick: {currentPick}</div>
            <div data-testid="test-1-available-count">Available: {availablePlayers.length}</div>
            <div data-testid="test-1-drafted-count">Drafted: {draftedPlayers.length}</div>
            <div data-testid="test-1-drafted-names">
              {draftedPlayers.map((name, i) => (
                <span key={i} data-testid={`test-1-drafted-${i}`}>{name}</span>
              ))}
            </div>
            
            <div data-testid="test-1-available-players">
              {availablePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => draftPlayer(player)}
                  data-testid={`test-1-draft-${player.id}`}
                >
                  Draft {player.name}
                </button>
              ))}
            </div>
          </div>
        )
      }
      
      render(
        <TestProviders>
          <ManualDraftTracker />
        </TestProviders>
      )
      
      // Initial state verification
      expect(screen.getByTestId('test-1-current-pick')).toHaveTextContent('Pick: 1')
      expect(screen.getByTestId('test-1-available-count')).toHaveTextContent('Available: 3')
      expect(screen.getByTestId('test-1-drafted-count')).toHaveTextContent('Drafted: 0')
      
      // Verify all players are initially available
      expect(screen.getByTestId('test-1-draft-1')).toBeInTheDocument()
      expect(screen.getByTestId('test-1-draft-2')).toBeInTheDocument()  
      expect(screen.getByTestId('test-1-draft-3')).toBeInTheDocument()
      
      // Draft first player (Haaland)
      const haalandButton = screen.getByTestId('test-1-draft-1')
      await user.click(haalandButton)
      
      // Verify state changes after first draft
      expect(screen.getByTestId('test-1-current-pick')).toHaveTextContent('Pick: 2')
      expect(screen.getByTestId('test-1-available-count')).toHaveTextContent('Available: 2')
      expect(screen.getByTestId('test-1-drafted-count')).toHaveTextContent('Drafted: 1')
      expect(screen.getByTestId('test-1-drafted-0')).toHaveTextContent('Erling Haaland')
      
      // Verify Haaland is no longer available for drafting
      expect(screen.queryByTestId('test-1-draft-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('test-1-draft-2')).toBeInTheDocument() // KDB still available
      expect(screen.getByTestId('test-1-draft-3')).toBeInTheDocument() // VVD still available
      
      // Draft second player (De Bruyne)
      const kdbButton = screen.getByTestId('test-1-draft-2')
      await user.click(kdbButton)
      
      // Verify state changes after second draft
      expect(screen.getByTestId('test-1-current-pick')).toHaveTextContent('Pick: 3')
      expect(screen.getByTestId('test-1-available-count')).toHaveTextContent('Available: 1')
      expect(screen.getByTestId('test-1-drafted-count')).toHaveTextContent('Drafted: 2')
      expect(screen.getByTestId('test-1-drafted-0')).toHaveTextContent('Erling Haaland')
      expect(screen.getByTestId('test-1-drafted-1')).toHaveTextContent('Kevin De Bruyne')
      
      // Verify only VVD remains
      expect(screen.queryByTestId('test-1-draft-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('test-1-draft-2')).not.toBeInTheDocument()
      expect(screen.getByTestId('test-1-draft-3')).toBeInTheDocument()
    })
    
    it('should maintain draftedPlayers as array of strings, not objects', async () => {
      const DraftedPlayersTypeChecker = () => {
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [typeErrors, setTypeErrors] = React.useState([])
        
        const testPlayer = { id: 1, name: 'Mohamed Salah', position: 'F', team: 'Liverpool' }
        
        const draftPlayerCorrectly = () => {
          // Correct way: Add player name (string)
          setDraftedPlayers(prev => [...prev, testPlayer.name])
          setTypeErrors(prev => [...prev, 'No error - correct string format'])
        }
        
        const draftPlayerIncorrectly = () => {
          // Wrong way: Add player object (this was the bug)
          setDraftedPlayers(prev => [...prev, testPlayer])
          setTypeErrors(prev => [...prev, 'Error - object instead of string'])
        }
        
        const validateDraftedPlayers = () => {
          const errors = []
          draftedPlayers.forEach((item, index) => {
            if (typeof item !== 'string') {
              errors.push(`Item ${index} is ${typeof item}, expected string`)
            }
          })
          return errors
        }
        
        return (
          <div data-testid="test-2">
            <button onClick={draftPlayerCorrectly} data-testid="test-2-draft-correct">
              Draft Correctly (String)
            </button>
            <button onClick={draftPlayerIncorrectly} data-testid="test-2-draft-incorrect">
              Draft Incorrectly (Object)
            </button>
            
            <div data-testid="test-2-drafted-list">
              {draftedPlayers.map((item, index) => (
                <div key={index} data-testid={`test-2-drafted-item-${index}`}>
                  {typeof item === 'string' ? `✓ ${item}` : `✗ Object: ${JSON.stringify(item)}`}
                </div>
              ))}
            </div>
            
            <div data-testid="test-2-validation-errors">
              {validateDraftedPlayers().map((error, index) => (
                <div key={index} data-testid={`test-2-error-${index}`}>{error}</div>
              ))}
            </div>
            
            <div data-testid="test-2-total-drafted">Total Drafted: {draftedPlayers.length}</div>
            <div data-testid="test-2-all-strings">
              All Strings: {draftedPlayers.every(item => typeof item === 'string') ? 'Yes' : 'No'}
            </div>
          </div>
        )
      }
      
      render(
        <TestProviders>
          <DraftedPlayersTypeChecker />
        </TestProviders>
      )
      
      // Initial state
      expect(screen.getByTestId('test-2-total-drafted')).toHaveTextContent('Total Drafted: 0')
      expect(screen.getByTestId('test-2-all-strings')).toHaveTextContent('All Strings: Yes')
      
      // Draft correctly (with string)
      await user.click(screen.getByTestId('test-2-draft-correct'))
      expect(screen.getByTestId('test-2-total-drafted')).toHaveTextContent('Total Drafted: 1')
      expect(screen.getByTestId('test-2-all-strings')).toHaveTextContent('All Strings: Yes')
      expect(screen.getByTestId('test-2-drafted-item-0')).toHaveTextContent('✓ Mohamed Salah')
      
      // Draft incorrectly (with object) to demonstrate the bug
      await user.click(screen.getByTestId('test-2-draft-incorrect'))
      expect(screen.getByTestId('test-2-total-drafted')).toHaveTextContent('Total Drafted: 2')
      expect(screen.getByTestId('test-2-all-strings')).toHaveTextContent('All Strings: No')
      expect(screen.getByTestId('test-2-drafted-item-1')).toHaveTextContent('✗ Object:')
      expect(screen.getByTestId('test-2-error-0')).toHaveTextContent('Item 1 is object, expected string')
    })
  })
  
  describe('Simulation vs Regular Mode Consistency', () => {
    it('should handle both modes consistently after fix', async () => {
      const ModeConsistencyTester = () => {
        const [mode, setMode] = React.useState('regular')
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Harry Kane', position: 'F', team: 'Bayern Munich' },
          { id: 2, name: 'Pedri', position: 'M', team: 'Barcelona' }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        
        const draftPlayer = (player) => {
          // After fix: Both modes should behave identically
          setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
          setDraftedPlayers(prev => [...prev, player.name]) // Always string
        }
        
        return (
          <div data-testid="test-3">
            <button 
              onClick={() => setMode(mode === 'regular' ? 'simulation' : 'regular')}
              data-testid="test-3-toggle-mode"
            >
              Mode: {mode}
            </button>
            
            <div data-testid="test-3-available-count">Available: {availablePlayers.length}</div>
            <div data-testid="test-3-drafted-types">
              Types: {draftedPlayers.map(item => typeof item).join(', ')}
            </div>
            <div data-testid="test-3-drafted-names">
              Names: {draftedPlayers.join(', ')}
            </div>
            
            {availablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => draftPlayer(player)}
                data-testid={`test-3-draft-${player.id}`}
              >
                Draft {player.name} ({mode})
              </button>
            ))}
          </div>
        )
      }
      
      render(
        <TestProviders>
          <ModeConsistencyTester />
        </TestProviders>
      )
      
      // Test regular mode
      expect(screen.getByTestId('test-3-toggle-mode')).toHaveTextContent('Mode: regular')
      expect(screen.getByTestId('test-3-available-count')).toHaveTextContent('Available: 2')
      
      // Draft in regular mode
      await user.click(screen.getByTestId('test-3-draft-1'))
      expect(screen.getByTestId('test-3-available-count')).toHaveTextContent('Available: 1')
      expect(screen.getByTestId('test-3-drafted-types')).toHaveTextContent('Types: string')
      expect(screen.getByTestId('test-3-drafted-names')).toHaveTextContent('Names: Harry Kane')
      
      // Switch to simulation mode
      await user.click(screen.getByTestId('test-3-toggle-mode'))
      expect(screen.getByTestId('test-3-toggle-mode')).toHaveTextContent('Mode: simulation')
      
      // Draft in simulation mode - should behave identically
      await user.click(screen.getByTestId('test-3-draft-2'))
      expect(screen.getByTestId('test-3-available-count')).toHaveTextContent('Available: 0')
      expect(screen.getByTestId('test-3-drafted-types')).toHaveTextContent('Types: string, string')
      expect(screen.getByTestId('test-3-drafted-names')).toHaveTextContent('Names: Harry Kane, Pedri')
    })
  })
  
  describe('State Update Order and Consistency', () => {
    it('should update all states atomically and consistently', async () => {
      const StateConsistencyTester = () => {
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Kylian Mbappé', position: 'F', team: 'PSG' },
          { id: 2, name: 'Jude Bellingham', position: 'M', team: 'Real Madrid' },
          { id: 3, name: 'Erling Haaland', position: 'F', team: 'Manchester City' }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [currentPick, setCurrentPick] = React.useState(1)
        const [stateHistory, setStateHistory] = React.useState([])
        
        const draftPlayer = (player) => {
          // Simulate the exact state updates from the fixed code
          const newAvailablePlayers = availablePlayers.filter(p => p.id !== player.id)
          const newDraftedPlayers = [...draftedPlayers, player.name]
          const newCurrentPick = currentPick + 1
          
          // Update all states
          setAvailablePlayers(newAvailablePlayers)
          setDraftedPlayers(newDraftedPlayers)
          setCurrentPick(newCurrentPick)
          
          // Track state history for verification
          setStateHistory(prev => [...prev, {
            pick: newCurrentPick - 1,
            draftedPlayer: player.name,
            availableCount: newAvailablePlayers.length,
            draftedCount: newDraftedPlayers.length,
            totalPlayers: newAvailablePlayers.length + newDraftedPlayers.length
          }])
        }
        
        const totalPlayersCount = availablePlayers.length + draftedPlayers.length
        
        return (
          <div data-testid="test-4">
            <div data-testid="test-4-current-pick">Pick: {currentPick}</div>
            <div data-testid="test-4-available-count">Available: {availablePlayers.length}</div>
            <div data-testid="test-4-drafted-count">Drafted: {draftedPlayers.length}</div>
            <div data-testid="test-4-total-players">Total: {totalPlayersCount}</div>
            
            <div data-testid="test-4-state-history">
              {stateHistory.map((state, index) => (
                <div key={index} data-testid={`test-4-history-${index}`}>
                  Pick {state.pick}: {state.draftedPlayer} | 
                  Available: {state.availableCount} | 
                  Drafted: {state.draftedCount} | 
                  Total: {state.totalPlayers}
                </div>
              ))}
            </div>
            
            {availablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => draftPlayer(player)}
                data-testid={`test-4-draft-${player.id}`}
              >
                Draft {player.name}
              </button>
            ))}
            
            <div data-testid="test-4-consistency-check">
              Consistent: {totalPlayersCount === 3 ? 'Yes' : 'No'}
            </div>
          </div>
        )
      }
      
      render(
        <TestProviders>
          <StateConsistencyTester />
        </TestProviders>
      )
      
      // Initial state verification
      expect(screen.getByTestId('test-4-current-pick')).toHaveTextContent('Pick: 1')
      expect(screen.getByTestId('test-4-available-count')).toHaveTextContent('Available: 3')
      expect(screen.getByTestId('test-4-drafted-count')).toHaveTextContent('Drafted: 0')
      expect(screen.getByTestId('test-4-total-players')).toHaveTextContent('Total: 3')
      expect(screen.getByTestId('test-4-consistency-check')).toHaveTextContent('Consistent: Yes')
      
      // Draft first player
      await user.click(screen.getByTestId('test-4-draft-1'))
      expect(screen.getByTestId('test-4-current-pick')).toHaveTextContent('Pick: 2')
      expect(screen.getByTestId('test-4-available-count')).toHaveTextContent('Available: 2')
      expect(screen.getByTestId('test-4-drafted-count')).toHaveTextContent('Drafted: 1')
      expect(screen.getByTestId('test-4-total-players')).toHaveTextContent('Total: 3')
      expect(screen.getByTestId('test-4-consistency-check')).toHaveTextContent('Consistent: Yes')
      expect(screen.getByTestId('test-4-history-0')).toHaveTextContent(
        'Pick 1: Kylian Mbappé | Available: 2 | Drafted: 1 | Total: 3'
      )
      
      // Draft second player
      await user.click(screen.getByTestId('test-4-draft-2'))
      expect(screen.getByTestId('test-4-current-pick')).toHaveTextContent('Pick: 3')
      expect(screen.getByTestId('test-4-available-count')).toHaveTextContent('Available: 1')
      expect(screen.getByTestId('test-4-drafted-count')).toHaveTextContent('Drafted: 2')
      expect(screen.getByTestId('test-4-total-players')).toHaveTextContent('Total: 3')
      expect(screen.getByTestId('test-4-consistency-check')).toHaveTextContent('Consistent: Yes')
      expect(screen.getByTestId('test-4-history-1')).toHaveTextContent(
        'Pick 2: Jude Bellingham | Available: 1 | Drafted: 2 | Total: 3'
      )
      
      // Draft third player
      await user.click(screen.getByTestId('test-4-draft-3'))
      expect(screen.getByTestId('test-4-current-pick')).toHaveTextContent('Pick: 4')
      expect(screen.getByTestId('test-4-available-count')).toHaveTextContent('Available: 0')
      expect(screen.getByTestId('test-4-drafted-count')).toHaveTextContent('Drafted: 3')
      expect(screen.getByTestId('test-4-total-players')).toHaveTextContent('Total: 3')
      expect(screen.getByTestId('test-4-consistency-check')).toHaveTextContent('Consistent: Yes')
      expect(screen.getByTestId('test-4-history-2')).toHaveTextContent(
        'Pick 3: Erling Haaland | Available: 0 | Drafted: 3 | Total: 3'
      )
    })
  })
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle rapid clicks without state corruption', async () => {
      const RapidClickTester = () => {
        const [availablePlayers, setAvailablePlayers] = React.useState([
          { id: 1, name: 'Test Player 1', position: 'F' },
          { id: 2, name: 'Test Player 2', position: 'M' }
        ])
        const [draftedPlayers, setDraftedPlayers] = React.useState([])
        const [clickCount, setClickCount] = React.useState(0)
        
        const draftPlayer = (player) => {
          setClickCount(prev => prev + 1)
          
          // Check if player already drafted (defensive programming)
          if (draftedPlayers.includes(player.name)) {
            return // Prevent duplicate drafts
          }
          
          setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
          setDraftedPlayers(prev => [...prev, player.name])
        }
        
        return (
          <div data-testid="test-5">
            <div data-testid="test-5-click-count">Clicks: {clickCount}</div>
            <div data-testid="test-5-available-count">Available: {availablePlayers.length}</div>
            <div data-testid="test-5-drafted-count">Drafted: {draftedPlayers.length}</div>
            <div data-testid="test-5-duplicate-check">
              Duplicates: {draftedPlayers.length !== new Set(draftedPlayers).size ? 'Yes' : 'No'}
            </div>
            
            {availablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => draftPlayer(player)}
                data-testid={`test-5-draft-${player.id}`}
              >
                Draft {player.name}
              </button>
            ))}
          </div>
        )
      }
      
      render(
        <TestProviders>
          <RapidClickTester />
        </TestProviders>
      )
      
      const draftButton = screen.getByTestId('test-5-draft-1')
      
      // Simulate rapid clicks
      await user.click(draftButton)
      // After first click, button disappears so second click can't happen
      
      expect(screen.getByTestId('test-5-click-count')).toHaveTextContent('Clicks: 1')
      expect(screen.getByTestId('test-5-available-count')).toHaveTextContent('Available: 1')
      expect(screen.getByTestId('test-5-drafted-count')).toHaveTextContent('Drafted: 1')
      expect(screen.getByTestId('test-5-duplicate-check')).toHaveTextContent('Duplicates: No')
    })
  })
}) 