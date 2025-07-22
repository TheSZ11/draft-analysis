import React, { createContext, useContext } from 'react';
import { useFixtures } from '../hooks/useFixtures.js';

/**
 * FixtureContext - Provides fixture data and difficulty calculations
 */
const FixtureContext = createContext(null);

/**
 * FixtureProvider - Wraps components with fixture context
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const FixtureProvider = ({ children }) => {
  // Fixture state hook
  const fixtureState = useFixtures();

  // Extract commonly used values for convenience
  const {
    fixtures,
    getUpcomingIndicators,
    getDifficultyScore
  } = fixtureState;

  // Context value with all fixture-related functionality
  const contextValue = {
    // Fixture state
    fixtures,
    
    // Fixture functions
    getUpcomingIndicators,
    getDifficultyScore,
    
    // Full hook object (for components that need everything)
    fixtureState
  };

  return (
    <FixtureContext.Provider value={contextValue}>
      {children}
    </FixtureContext.Provider>
  );
};

/**
 * useFixtureContext - Hook to access fixture context
 * @returns {Object} Fixture context value
 */
export const useFixtureContext = () => {
  const context = useContext(FixtureContext);
  if (!context) {
    throw new Error('useFixtureContext must be used within a FixtureProvider');
  }
  return context;
}; 