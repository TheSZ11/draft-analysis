import { useState, useCallback } from 'react';
import { fplDataTeamMapping } from '../utils/constants.js';

/**
 * Custom hook for managing UI state and interactions
 * @returns {Object} UI state and operations
 */
export const useUI = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [complianceReportData, setComplianceReportData] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  /**
   * Handle player hover for tooltips
   * @param {Object} player - Player object
   * @param {Event} event - Mouse event
   */
  const handlePlayerHover = useCallback((player, event) => {
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 10,
        y: rect.top
      });
    }
    setHoveredPlayer(player);
  }, []);

  /**
   * Clear player hover
   */
  const clearPlayerHover = useCallback(() => {
    setHoveredPlayer(null);
  }, []);

  /**
   * Show compliance report modal
   * @param {Object} reportData - Compliance report data
   */
  const showComplianceReportModal = useCallback((reportData) => {
    setComplianceReportData(reportData);
    setShowComplianceReport(true);
  }, []);

  /**
   * Hide compliance report modal
   */
  const hideComplianceReportModal = useCallback(() => {
    setShowComplianceReport(false);
    setComplianceReportData(null);
  }, []);

  /**
   * Filter players based on search, position, and team
   * @param {Array} players - Array of players
   * @returns {Array} Filtered players
   */
  const filterPlayers = useCallback((players) => {
    if (!Array.isArray(players)) {
      return [];
    }
    
    return players.filter(player => {
      if (!player) return false;
      
      // Position filter
      const matchesPosition = selectedPosition === 'ALL' || player.position === selectedPosition;
      
      // Team filter - convert selected team name to team code for comparison
      let matchesTeam = true;
      if (selectedTeam !== 'ALL') {
        const selectedTeamCode = fplDataTeamMapping[selectedTeam] || selectedTeam;
        matchesTeam = player.team === selectedTeamCode;
      }
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        (player.name && player.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (player.team && player.team.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesPosition && matchesTeam && matchesSearch;
    });
  }, [selectedPosition, selectedTeam, searchTerm]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedPosition('ALL');
    setSelectedTeam('ALL');
  }, []);

  /**
   * Force a component re-render (anti-pattern, should be eliminated)
   */
  const triggerForceUpdate = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  /**
   * Update search term
   * @param {string} term - Search term
   */
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  /**
   * Update selected position
   * @param {string} position - Position filter ('ALL', 'F', 'M', 'D', 'G')
   */
  const updateSelectedPosition = useCallback((position) => {
    setSelectedPosition(position);
  }, []);

  /**
   * Update selected team
   * @param {string} team - Team filter ('ALL' or team name)
   */
  const updateSelectedTeam = useCallback((team) => {
    setSelectedTeam(team);
  }, []);

  /**
   * Get tooltip style based on position
   * @param {number} windowWidth - Window width for positioning
   * @returns {Object} Style object for tooltip
   */
  const getTooltipStyle = useCallback((windowWidth = window.innerWidth) => {
    return {
      left: Math.min(tooltipPosition.x, windowWidth - 320),
      top: tooltipPosition.y,
      transform: 'translateY(-50%)'
    };
  }, [tooltipPosition]);

  /**
   * Reset all UI state
   */
  const resetUIState = useCallback(() => {
    setSearchTerm('');
    setSelectedPosition('ALL');
    setSelectedTeam('ALL');
    setHoveredPlayer(null);
    setTooltipPosition({ x: 0, y: 0 });
    setShowComplianceReport(false);
    setComplianceReportData(null);
    setForceUpdate(0);
  }, []);

  /**
   * Get UI state summary for debugging
   * @returns {Object} UI state summary
   */
  const getUIStateSummary = useCallback(() => {
    return {
      hasSearch: searchTerm.length > 0,
      hasPositionFilter: selectedPosition !== 'ALL',
      hasTeamFilter: selectedTeam !== 'ALL',
      hasHoveredPlayer: hoveredPlayer !== null,
      showingComplianceReport: showComplianceReport,
      tooltipPosition,
      forceUpdateCount: forceUpdate
    };
  }, [searchTerm, selectedPosition, selectedTeam, hoveredPlayer, showComplianceReport, tooltipPosition, forceUpdate]);

  return {
    // State
    searchTerm,
    selectedPosition,
    selectedTeam,
    hoveredPlayer,
    tooltipPosition,
    showComplianceReport,
    complianceReportData,
    forceUpdate,
    
    // Setters (for direct updates when needed)
    setSearchTerm,
    setSelectedPosition,
    setSelectedTeam,
    setHoveredPlayer,
    setTooltipPosition,
    setShowComplianceReport,
    setComplianceReportData,
    setForceUpdate,
    
    // Operations
    handlePlayerHover,
    clearPlayerHover,
    showComplianceReportModal,
    hideComplianceReportModal,
    filterPlayers,
    clearFilters,
    triggerForceUpdate,
    updateSearchTerm,
    updateSelectedPosition,
    updateSelectedTeam,
    getTooltipStyle,
    resetUIState,
    getUIStateSummary
  };
}; 