import React, { createContext, useContext } from 'react';
import { useDraftState } from '../hooks/useDraftState.js';
import { useSimulation } from '../hooks/useSimulation.js';

/**
 * DraftContext - Provides draft state, teams, and simulation functionality
 */
const DraftContext = createContext(null);

/**
 * DraftProvider - Wraps components with draft context
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const DraftProvider = ({ children }) => {
  // Draft state hook
  const draftState = useDraftState();
  
  // Simulation state hook  
  const simulation = useSimulation();

  // Extract commonly used values for convenience
  const {
    teams,
    currentPick,
    draftedPlayers,
    getCurrentDraftTeam,
    draftPlayerToTeam,
    getDraftProgress,
    resetDraft
  } = draftState;

  const {
    isSimulationMode,
    simulationTeams,
    userDraftPosition,
    simulationResults,
    showResultsModal,
    startSimulation,
    stopSimulation,
    resetSimulation: resetSimulationOnly,
    processAIPicks,
    draftPlayerInSimulation
  } = simulation;

  // Combined reset function that resets both simulation and draft state
  const resetSimulation = () => {
    resetSimulationOnly();
    resetDraft();
  };

  // Context value combining all draft-related functionality
  const contextValue = {
    // Core draft state
    teams,
    currentPick,
    draftedPlayers,
    
    // Draft functions
    getCurrentDraftTeam,
    draftPlayerToTeam,
    getDraftProgress,
    
    // Simulation state
    isSimulationMode,
    simulationTeams,
    userDraftPosition,
    simulationResults,
    showResultsModal,
    
    // Simulation functions
    startSimulation,
    stopSimulation,
    resetSimulation,
    processAIPicks,
    draftPlayerInSimulation,
    
    // Full hook objects (for components that need everything)
    draftState,
    simulation
  };

  return (
    <DraftContext.Provider value={contextValue}>
      {children}
    </DraftContext.Provider>
  );
};

/**
 * useDraftContext - Hook to access draft context
 * @returns {Object} Draft context value
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useDraftContext = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraftContext must be used within a DraftProvider');
  }
  return context;
}; 