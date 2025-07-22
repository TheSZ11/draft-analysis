import React, { createContext, useContext } from 'react';
import { usePlayerData } from '../hooks/usePlayerData.js';

/**
 * PlayerContext - Provides player data, VORP calculations, and strategic analysis
 */
const PlayerContext = createContext(null);

/**
 * PlayerProvider - Wraps components with player context
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const PlayerProvider = ({ children }) => {
  // Player data hook
  const playerData = usePlayerData();

  // Extract commonly used values for convenience
  const {
    loading,
    availablePlayers,
    replacementLevels,
    playerTiers,
    strategicData,
    getAvailablePlayers,
    getStrategicRecommendations,
    updateCalculations
  } = playerData;

  // Context value with all player-related functionality
  const contextValue = {
    // Player state
    loading,
    availablePlayers,
    replacementLevels,
    playerTiers,
    strategicData,
    
    // Player functions
    getAvailablePlayers,
    getStrategicRecommendations,
    updateCalculations,
    
    // Full hook object (for components that need everything)
    playerData
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

/**
 * usePlayerContext - Hook to access player context
 * @returns {Object} Player context value
 */
export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
}; 