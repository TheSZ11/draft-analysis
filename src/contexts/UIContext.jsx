import React, { createContext, useContext } from 'react';
import { useUI } from '../hooks/useUI.js';

/**
 * UIContext - Provides UI state management for modals, hover states, and user interactions
 */
const UIContext = createContext(null);

/**
 * UIProvider - Wraps components with UI context
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const UIProvider = ({ children }) => {
  // UI state hook
  const ui = useUI();

  // Extract commonly used values for convenience
  const {
    searchTerm,
    selectedPosition,
    selectedTeam,
    hoveredPlayer,
    tooltipPosition,
    showComplianceReport,
    complianceReportData,
    forceUpdate,
    handlePlayerHover,
    clearPlayerHover,
    showComplianceReportModal,
    hideComplianceReportModal,
    triggerForceUpdate,
    updateSearchTerm,
    updateSelectedPosition,
    updateSelectedTeam
  } = ui;

  // Context value with all UI-related functionality
  const contextValue = {
    // UI state
    searchTerm,
    selectedPosition,
    selectedTeam,
    hoveredPlayer,
    tooltipPosition,
    showComplianceReport,
    complianceReportData,
    forceUpdate,
    
    // UI functions
    handlePlayerHover,
    clearPlayerHover,
    showComplianceReportModal,
    hideComplianceReportModal,
    triggerForceUpdate,
    updateSearchTerm,
    updateSelectedPosition,
    updateSelectedTeam,
    
    // Full hook object (for components that need everything)
    ui
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

/**
 * useUIContext - Hook to access UI context
 * @returns {Object} UI context value
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}; 