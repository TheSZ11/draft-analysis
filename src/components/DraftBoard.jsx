import React from 'react';
import { LEAGUE_CONFIG } from '../leagueConfig.js';
import { ROSTER_CATEGORIES } from '../utils/constants.js';
import { 
  getRosterCounts, 
  validateRoster, 
  validateLeagueCompliance, 
  validateLineupLegality 
} from '../utils/rosterValidation.js';
import { useDraftContext, useUIContext } from '../contexts/index.js';

/**
 * DraftBoard Component - Shows team listings, picks, and roster management
 * Now uses React Context instead of prop drilling with performance optimizations
 * @param {Object} props
 * @param {Function} props.getCurrentTeam - Temporary prop for getCurrentTeam function (will be moved to context later)
 * @param {Function} props.showTeamComplianceReport - Temporary prop for compliance function (will be moved to context later) 
 * @param {Function} props.movePlayerToCategory - Temporary prop for move function (will be moved to context later)
 * @returns {JSX.Element}
 */
const DraftBoardComponent = ({
  getCurrentTeam,
  showTeamComplianceReport,
  movePlayerToCategory
}) => {
  // Get data from contexts instead of props
  const {
    isSimulationMode,
    teams,
    simulationTeams,
    currentPick
  } = useDraftContext();
  
  const {
    forceUpdate
  } = useUIContext();
  const teamsToShow = isSimulationMode ? simulationTeams : teams;

  return (
    <div className="w-full lg:w-80 bg-slate-800 border-b lg:border-b-0 lg:border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Draft Board</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 p-4" key={`draft-board-${isSimulationMode ? simulationTeams.length : teams.length}-${currentPick}-${forceUpdate}`}>
          {teamsToShow.map((team) => (
            <div 
              key={team.id} 
              className={`p-3 rounded-lg border transition-all ${
                team.id === 1 
                  ? 'border-blue-400 bg-blue-900/50 shadow-md' 
                  : isSimulationMode && team.id !== 1
                  ? 'border-purple-400 bg-purple-900/20 hover:border-purple-300'
                  : getCurrentTeam()?.id === team.id 
                  ? 'border-blue-500 bg-blue-900/50' 
                  : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold text-sm ${
                    team.id === 1 ? 'text-blue-300' : isSimulationMode && team.id !== 1 ? 'text-purple-300' : 'text-slate-100'
                  }`}>
                    {team.name}
                    {team.id === 1 && <span className="ml-1 text-xs bg-blue-700 text-blue-200 px-1 rounded">YOU</span>}
                    {isSimulationMode && team.id !== 1 && <span className="ml-1 text-xs bg-purple-700 text-purple-200 px-1 rounded">AI</span>}
                  </h3>
                  
                  {/* Compliance score and report button for user's team */}
                  {team.id === 1 && (() => {
                    const compliance = validateLeagueCompliance(team);
                    return (
                      <button
                        onClick={() => showTeamComplianceReport(team)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          compliance.complianceScore >= 90 ? 'bg-green-700 text-green-200 hover:bg-green-600' :
                          compliance.complianceScore >= 70 ? 'bg-yellow-700 text-yellow-200 hover:bg-yellow-600' :
                          'bg-red-700 text-red-200 hover:bg-red-600'
                        }`}
                        title="Click to view detailed compliance report"
                      >
                        {compliance.complianceScore}%
                      </button>
                    );
                  })()}
                </div>
                <span className="text-xs text-slate-400">{team.picks.length}/{LEAGUE_CONFIG.rosterLimits.maxTotalPlayers}</span>
              </div>
              
              {/* Roster Summary */}
              <div className="mb-2">
                {(() => {
                  const counts = getRosterCounts(team);
                  const validation = validateRoster(team);
                  return (
                    <div className="space-y-1">
                      {/* Roster counts */}
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-300">
                          Active: {counts.active.total}/{team.maxActivePlayers}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
                          Reserve: {counts.reserve.total}/{team.maxReservePlayers}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-900/50 text-purple-300">
                          IR: {counts.injured_reserve.total}/{team.maxInjuredReservePlayers}
                        </span>
                      </div>
                      
                      {/* Position breakdown for active players */}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(team.positionLimits).map(([pos, limits]) => {
                          const activeCount = counts.active.byPosition[pos];
                          const totalCount = counts.active.byPosition[pos] + counts.reserve.byPosition[pos] + counts.injured_reserve.byPosition[pos];
                          const isActiveFull = activeCount >= limits.maxActive;
                          const isTotalFull = totalCount >= limits.totalMax;
                          
                          return (
                            <span 
                              key={pos}
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                isTotalFull 
                                  ? 'bg-red-900/50 text-red-300' 
                                  : isActiveFull
                                  ? 'bg-yellow-900/50 text-yellow-300'
                                  : 'bg-slate-600 text-slate-300'
                              }`}
                              title={`${pos}: ${activeCount}/${limits.maxActive} active, ${totalCount}/${limits.totalMax} total`}
                            >
                              {pos}: {activeCount}/{limits.maxActive}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Validation errors and warnings */}
                      {!validation.isValid && (
                        <div className="text-xs text-red-400">
                          {validation.errors[0]}
                        </div>
                      )}
                      
                      {/* Lineup validation for user's team */}
                      {team.id === 1 && (() => {
                        const lineupValidation = validateLineupLegality(team);
                        return (
                          <>
                            {lineupValidation.errors.length > 0 && (
                              <div className="text-xs text-red-400">
                                Lineup: {lineupValidation.errors[0]}
                              </div>
                            )}
                            {lineupValidation.warnings.length > 0 && lineupValidation.errors.length === 0 && (
                              <div className="text-xs text-yellow-400">
                                {lineupValidation.warnings[0]}
                              </div>
                            )}
                            {lineupValidation.isValid && lineupValidation.isComplete && (
                              <div className="text-xs text-green-400">
                                ✓ Lineup is valid and complete
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {team.picks.length === 0 ? (
                  <p className="text-xs text-slate-500">No picks yet</p>
                ) : (
                  team.picks.map((pick, index) => {
                    const category = pick.rosterCategory || ROSTER_CATEGORIES.ACTIVE;
                    const categoryColors = {
                      [ROSTER_CATEGORIES.ACTIVE]: 'bg-green-400',
                      [ROSTER_CATEGORIES.RESERVE]: 'bg-blue-400', 
                      [ROSTER_CATEGORIES.INJURED_RESERVE]: 'bg-purple-400'
                    };
                    const categoryLabels = {
                      [ROSTER_CATEGORIES.ACTIVE]: 'A',
                      [ROSTER_CATEGORIES.RESERVE]: 'R',
                      [ROSTER_CATEGORIES.INJURED_RESERVE]: 'IR'
                    };
                    
                    return (
                      <div key={index} className="text-xs flex justify-between items-center p-1 hover:bg-slate-600 rounded group">
                        <div className="flex-1 min-w-0">
                          <span className="truncate block font-medium">{pick.name}</span>
                          <span className="text-slate-400">{pick.position} • R{pick.round}</span>
                        </div>
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          {/* Position indicator */}
                          <span className={`w-2 h-2 rounded-full ${
                            pick.position === 'F' ? 'bg-red-400' :
                            pick.position === 'M' ? 'bg-green-400' :
                            pick.position === 'D' ? 'bg-blue-400' :
                            'bg-yellow-400'
                          }`}></span>
                          
                          {/* Roster category indicator */}
                          <span 
                            className={`w-4 h-4 rounded text-white text-xs flex items-center justify-center font-bold ${categoryColors[category]}`}
                            title={`${category === ROSTER_CATEGORIES.ACTIVE ? 'Active' : category === ROSTER_CATEGORIES.RESERVE ? 'Reserve' : 'Injured Reserve'}`}
                          >
                            {categoryLabels[category]}
                          </span>
                          
                          {/* Category change dropdown (only show for user's team) */}
                          {team.id === 1 && (
                            <select
                              value={category}
                              onChange={(e) => movePlayerToCategory(team.id, pick.id, e.target.value)}
                              className="text-xs bg-slate-700 border border-slate-600 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value={ROSTER_CATEGORIES.ACTIVE}>Active</option>
                              <option value={ROSTER_CATEGORIES.RESERVE}>Reserve</option>
                              <option value={ROSTER_CATEGORIES.INJURED_RESERVE}>IR</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Export with React.memo for performance optimization
export const DraftBoard = React.memo(DraftBoardComponent); 