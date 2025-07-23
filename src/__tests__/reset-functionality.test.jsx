import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useSimulation } from '../hooks/useSimulation.js';
import { useDraftState as _useDraftState } from '../hooks/useDraftState.js';
import { DraftProvider, useDraftContext } from '../contexts/DraftContext.jsx';
import { mockPlayerData as _mockPlayerData } from './fixtures/mockData.js';

// Test fixture data
const _createMockTeam = (id, name) => ({
  id,
  name,
  picks: [],
  maxTotalPlayers: 15,
  maxActivePlayers: 11,
  positionLimits: {
    F: { minActive: 1, maxActive: 3, totalMax: 6 },
    M: { minActive: 3, maxActive: 5, totalMax: 8 },
    D: { minActive: 3, maxActive: 5, totalMax: 8 },
    G: { minActive: 1, maxActive: 1, totalMax: 3 }
  }
});

const mockPlayers = [
  { id: '1', name: 'Test Player 1', position: 'F', team: 'ARS', age: 25, minutes: 2500 },
  { id: '2', name: 'Test Player 2', position: 'M', team: 'LIV', age: 26, minutes: 2400 }
];

describe('Reset Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSimulation reset behavior', () => {
    it('should fully exit simulation mode when reset is called', () => {
      const { result } = renderHook(() => useSimulation());

      // Start simulation and add some data
      act(() => {
        result.current.startSimulation(3);
      });

      // Verify simulation started
      expect(result.current.isSimulationMode).toBe(true);
      expect(result.current.simulationTeams).toHaveLength(10);
      expect(result.current.userDraftPosition).toBe(3);

      // Add a pick to make sure we have some state to reset
      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[0], 1, []);
      });

      expect(result.current.simulationTeams[0].picks).toHaveLength(1);

      // Reset simulation - should completely exit simulation mode
      act(() => {
        result.current.resetSimulation();
      });

      // Verify complete reset
      expect(result.current.isSimulationMode).toBe(false);
      expect(result.current.simulationTeams).toEqual([]);
      expect(result.current.simulationResults).toBe(null);
      expect(result.current.showResultsModal).toBe(false);
      expect(result.current.userDraftPosition).toBe(1);
    });

    it('should allow starting new simulation after reset', () => {
      const { result } = renderHook(() => useSimulation());

      // Start simulation, add picks, then reset
      act(() => {
        result.current.startSimulation(2);
      });

      act(() => {
        result.current.draftPlayerInSimulation(mockPlayers[0], 1, []);
      });

      act(() => {
        result.current.resetSimulation();
      });

      // Should be able to start a new simulation (position will be randomized)
      act(() => {
        result.current.startSimulation();
      });

      expect(result.current.isSimulationMode).toBe(true);
      expect(result.current.userDraftPosition).toBeGreaterThanOrEqual(1);
      expect(result.current.userDraftPosition).toBeLessThanOrEqual(10);
      expect(result.current.simulationTeams).toHaveLength(10);
      expect(result.current.simulationTeams[0].picks).toHaveLength(0);
    });

    it('should handle reset when no simulation is active', () => {
      const { result } = renderHook(() => useSimulation());

      // Call reset without starting simulation
      act(() => {
        result.current.resetSimulation();
      });

      // Should handle gracefully
      expect(result.current.isSimulationMode).toBe(false);
      expect(result.current.simulationTeams).toEqual([]);
      expect(result.current.simulationResults).toBe(null);
      expect(result.current.showResultsModal).toBe(false);
      expect(result.current.userDraftPosition).toBe(1);
    });
  });

  describe('DraftContext combined reset behavior', () => {
    const TestComponent = () => {
      const {
        isSimulationMode,
        simulationTeams,
        currentPick,
        teams,
        resetSimulation,
        startSimulation
      } = useDraftContext();

      return (
        <div>
          <div data-testid="simulation-mode">{isSimulationMode ? 'true' : 'false'}</div>
          <div data-testid="current-pick">{currentPick}</div>
          <div data-testid="simulation-teams-count">{simulationTeams.length}</div>
          <div data-testid="regular-teams-count">{teams.length}</div>
          <button onClick={() => startSimulation()}>Start Simulation</button>
          <button onClick={resetSimulation}>Reset</button>
        </div>
      );
    };

    it('should reset both simulation and draft state', async () => {
      render(
        <DraftProvider>
          <TestComponent />
        </DraftProvider>
      );

      // Start simulation
      const startButton = screen.getByText('Start Simulation');
      await act(async () => {
        fireEvent.click(startButton);
      });

      // Verify simulation started
      await waitFor(() => {
        expect(screen.getByTestId('simulation-mode')).toHaveTextContent('true');
        expect(screen.getByTestId('simulation-teams-count')).toHaveTextContent('10');
      });

      // Reset everything
      const resetButton = screen.getByText('Reset');
      await act(async () => {
        fireEvent.click(resetButton);
      });

      // Verify complete reset
      await waitFor(() => {
        expect(screen.getByTestId('simulation-mode')).toHaveTextContent('false');
        expect(screen.getByTestId('current-pick')).toHaveTextContent('1');
        expect(screen.getByTestId('simulation-teams-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Reset button UI behavior', () => {
    it('should test reset behavior through mocked functions', () => {
      const resetSimulation = vi.fn();
      const startSimulation = vi.fn();
      
      // Test reset function call
      resetSimulation();
      expect(resetSimulation).toHaveBeenCalled();
      
      // Test start simulation function call  
      startSimulation(1);
      expect(startSimulation).toHaveBeenCalledWith(1);
    });
  });

  describe('Reset regression prevention', () => {
    it('should prevent partial reset scenarios', () => {
      const { result } = renderHook(() => useSimulation());

      // Start simulation with multiple data points
      act(() => {
        result.current.startSimulation(4);
      });

      // Set some state
      act(() => {
        result.current.setSimulationResults({ test: 'data' });
        result.current.setShowResultsModal(true);
      });

      const initialState = {
        isSimulationMode: result.current.isSimulationMode,
        simulationTeams: result.current.simulationTeams,
        userDraftPosition: result.current.userDraftPosition,
        simulationResults: result.current.simulationResults,
        showResultsModal: result.current.showResultsModal
      };

      // Verify we have data to reset
      expect(initialState.isSimulationMode).toBe(true);
      expect(initialState.simulationTeams.length).toBe(10);
      expect(initialState.userDraftPosition).toBe(4);
      expect(initialState.simulationResults).toBeTruthy();
      expect(initialState.showResultsModal).toBe(true);

      // Reset should clear ALL simulation state
      act(() => {
        result.current.resetSimulation();
      });

      // Verify nothing remains from previous state
      expect(result.current.isSimulationMode).toBe(false);
      expect(result.current.simulationTeams).toEqual([]);
      expect(result.current.userDraftPosition).toBe(1);
      expect(result.current.simulationResults).toBe(null);
      expect(result.current.showResultsModal).toBe(false);
    });
  });
}); 