import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PlayerList } from './PlayerList.jsx'
import { usePlayerContext, useDraftContext, useUIContext, useFixtureContext } from '../contexts'

vi.mock('../contexts', () => ({
  usePlayerContext: vi.fn(),
  useDraftContext: vi.fn(),
  useUIContext: vi.fn(),
  useFixtureContext: vi.fn(),
}))

const mockAvailablePlayers = [
  { id: '1', name: 'Player One', position: 'F', team: 'ARS' },
  { id: '2', name: 'Player Two', position: 'M', team: 'LIV' },
  { id: '3', name: 'Another Player', position: 'F', team: 'ARS' },
]

describe('PlayerList Search and Filter', () => {
  const setupMocks = (uiOverrides = {}) => {
    usePlayerContext.mockReturnValue({
      loading: false,
      getAvailablePlayers: () => mockAvailablePlayers,
      playerTiers: {},
      strategicData: { recommendations: [] },
    })
    
    useDraftContext.mockReturnValue({
      isSimulationMode: false,
      userDraftPosition: 1,
      currentPick: 1,
      teams: [{ id: 1, name: 'Test Team', picks: [] }],
    })
    
    useUIContext.mockReturnValue({
      handlePlayerHover: vi.fn(),
      clearPlayerHover: vi.fn(),
      selectedPosition: 'ALL',
      selectedTeam: 'ALL',
      updateSelectedPosition: vi.fn(),
      updateSelectedTeam: vi.fn(),
      searchTerm: '',
      updateSearchTerm: vi.fn(),
      ...uiOverrides,
    })
    
    useFixtureContext.mockReturnValue({
      getUpcomingIndicators: vi.fn(() => []),
    })
  }

  beforeEach(() => {
    setupMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render the search input', () => {
    render(<PlayerList draftPlayer={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search players...')).toBeInTheDocument()
  })

  it('should filter players by search term', () => {
    setupMocks({ searchTerm: 'One' })
    render(<PlayerList draftPlayer={vi.fn()} />)
    
    // Should show only players matching the search term
    expect(screen.getByText('Player One')).toBeInTheDocument()
    expect(screen.queryByText('Player Two')).not.toBeInTheDocument()
    expect(screen.queryByText('Another Player')).not.toBeInTheDocument()
  })

  it('should filter players by position', () => {
    setupMocks({ selectedPosition: 'M' })
    render(<PlayerList draftPlayer={vi.fn()} />)
    
    // Should show only midfielders
    expect(screen.queryByText('Player One')).not.toBeInTheDocument()
    expect(screen.getByText('Player Two')).toBeInTheDocument()
    expect(screen.queryByText('Another Player')).not.toBeInTheDocument()
  })

  it('should filter players by team', () => {
    setupMocks({ selectedTeam: 'LIV' })
    render(<PlayerList draftPlayer={vi.fn()} />)
    
    // Should show only Liverpool players
    expect(screen.queryByText('Player One')).not.toBeInTheDocument()
    expect(screen.getByText('Player Two')).toBeInTheDocument()
    expect(screen.queryByText('Another Player')).not.toBeInTheDocument()
  })

  it('should call updateSearchTerm when typing in search input', () => {
    const mockUpdateSearchTerm = vi.fn()
    setupMocks({ updateSearchTerm: mockUpdateSearchTerm })
    
    render(<PlayerList draftPlayer={vi.fn()} />)
    const searchInput = screen.getByPlaceholderText('Search players...')
    
    fireEvent.change(searchInput, { target: { value: 'test' } })
    expect(mockUpdateSearchTerm).toHaveBeenCalledWith('test')
  })
}) 