import React, { useMemo, useCallback } from 'react';
import { TrendingUp, Lightbulb, AlertTriangle, Target, Clock, Info, Search } from 'lucide-react';
import { getPlayerTierByName, getTierColor } from '../utils/playerCalculations.js';
import { difficultyColors } from '../utils/constants.js';
import { usePlayerContext, useDraftContext, useUIContext, useFixtureContext } from '../contexts/index.js';
import { PlayerCard } from './PlayerCard.jsx';

/**
 * PlayerList Component - Shows available players, strategic insights, and recommendations
 * Now uses React Context instead of prop drilling with performance optimizations
 * @param {Object} props
 * @param {Function} props.draftPlayer - Temporary prop for draft function (will be moved to context later)
 * @returns {JSX.Element}
 */
const PlayerListComponent = ({ draftPlayer }) => {
  // Get data from contexts instead of props
  const { 
    loading, 
    getAvailablePlayers, 
    playerTiers, 
    strategicData 
  } = usePlayerContext();
  
  const { 
    isSimulationMode, 
    userDraftPosition, 
    currentPick, 
    teams 
  } = useDraftContext();
  
  const { 
    handlePlayerHover, 
    clearPlayerHover,
    selectedPosition,
    selectedTeam,
    updateSelectedPosition,
    updateSelectedTeam,
    searchTerm,
    updateSearchTerm
  } = useUIContext();
  
  const { 
    getUpcomingIndicators: getTeamFixtureIndicators 
  } = useFixtureContext();

  // Get strategic recommendations from player context
  const recommendations = strategicData?.recommendations || [];

  // Get unique team codes directly from available players
  const availableTeams = useMemo(() => {
    const allPlayers = getAvailablePlayers();
    const teamCodes = new Set(allPlayers.map(player => player.team));
    const sortedTeamCodes = Array.from(teamCodes).sort();
    return ['ALL', ...sortedTeamCodes];
  }, [getAvailablePlayers]);

  // Memoize available players with position and team filtering to prevent unnecessary recalculations
  const availablePlayersList = useMemo(() => {
    const allPlayers = getAvailablePlayers();
    
    // Apply position filter
    let filteredPlayers = allPlayers;
    if (selectedPosition !== 'ALL') {
      filteredPlayers = filteredPlayers.filter(player => player.position === selectedPosition);
    }
    
    // Apply team filter - directly compare team codes since dropdown now shows codes
    if (selectedTeam !== 'ALL') {
      filteredPlayers = filteredPlayers.filter(player => player.team === selectedTeam);
    }

    // Apply search term filter
    if (searchTerm) {
      filteredPlayers = filteredPlayers.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredPlayers;
  }, [getAvailablePlayers, selectedPosition, selectedTeam, searchTerm]);

  // Stable event handlers using useCallback to prevent child re-renders
  const handlePlayerDraft = useCallback((player) => {
    draftPlayer(player);
  }, [draftPlayer]);

  const handlePlayerMouseEnter = useCallback((player, event) => {
    handlePlayerHover(player, event);
  }, [handlePlayerHover]);

  const handlePlayerMouseLeave = useCallback(() => {
    clearPlayerHover();
  }, [clearPlayerHover]);

  // Memoize fixture indicators to prevent recalculation on every render
  const getFixtureIndicatorsMemo = useCallback((team) => {
    return getTeamFixtureIndicators(team);
  }, [getTeamFixtureIndicators]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
      {/* Available Players */}
      <div className="lg:col-span-1 xl:col-span-2 2xl:col-span-2 bg-slate-800 rounded-lg shadow-sm border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-100">Available Players</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => updateSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-700 text-slate-100 placeholder-slate-400"
              />
            </div>
            <select
              value={selectedPosition}
              onChange={(e) => updateSelectedPosition(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Positions</option>
              <option value="F">Forwards</option>
              <option value="M">Midfielders</option>
              <option value="D">Defenders</option>
              <option value="G">Goalkeepers</option>
            </select>
            <select
              value={selectedTeam}
              onChange={(e) => updateSelectedTeam(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Teams</option>
              {availableTeams.slice(1).map((teamCode) => (
                <option key={teamCode} value={teamCode}>{teamCode}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(100vh-16rem)] lg:max-h-[calc(100vh-12rem)]">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-slate-400">Loading players...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {availablePlayersList.map((player, index) => (
                <PlayerCard
                  key={player.id || player.name}
                  player={player}
                  index={index}
                  fixtureIndicators={getFixtureIndicatorsMemo(player.team)}
                  playerTiers={playerTiers}
                  onDraft={handlePlayerDraft}
                  onMouseEnter={handlePlayerMouseEnter}
                  onMouseLeave={handlePlayerMouseLeave}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strategic Insights */}
      {strategicData && (
        <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
              Draft Strategy
            </h2>
          </div>
          
          <div className="p-4">
            {/* Draft Position Strategy */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">
                Position {strategicData.strategy?.position ? (isSimulationMode ? userDraftPosition : 1) : ''} Strategy
              </h3>
              {strategicData.strategy?.position && (
                <div className="text-xs text-slate-400 mb-2">
                  {strategicData.strategy.position.philosophy}
                </div>
              )}
              {strategicData.strategy?.round?.roundSpecific && (
                <div className="text-xs text-blue-400">
                  Round {Math.floor((currentPick - 1) / (isSimulationMode ? 10 : teams.length)) + 1}: {strategicData.strategy.round.roundSpecific.focus}
                </div>
              )}
            </div>
            
            {/* Strategic Insights */}
            {strategicData.insights && strategicData.insights.length > 0 && (
              <div className="space-y-2">
                {strategicData.insights.map((insight, index) => {
                  const iconMap = {
                    URGENT: AlertTriangle,
                    WARNING: AlertTriangle,
                    STRATEGY: Target,
                    TIMING: Clock,
                    INFO: Info
                  };
                  const colorMap = {
                    HIGH: 'text-red-400',
                    MEDIUM: 'text-yellow-400',
                    LOW: 'text-blue-400'
                  };
                  const Icon = iconMap[insight.type] || Info;
                  
                  return (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <Icon className={`w-3 h-3 ${colorMap[insight.priority] || 'text-slate-400'}`} />
                      <span className="text-slate-300">{insight.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Roster Analysis */}
            {strategicData.rosterAnalysis && (
              <div className="mt-4 pt-3 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">
                    Elite Players: <span className="text-slate-200">{strategicData.rosterAnalysis.eliteCount}</span>
                  </div>
                  <div className="text-slate-400">
                    Roster Strength: <span className={`font-medium ${
                      strategicData.rosterAnalysis.rosterStrength === 'STRONG' ? 'text-green-400' :
                      strategicData.rosterAnalysis.rosterStrength === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{strategicData.rosterAnalysis.rosterStrength}</span>
                  </div>
                  <div className="text-slate-400">
                    Remaining Picks: <span className="text-slate-200">{strategicData.rosterAnalysis.remainingRounds}</span>
                  </div>
                  <div className="text-slate-400">
                    Draft Phase: <span className="text-blue-400">{strategicData.rosterAnalysis.phase}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Strategic Recommendations
          </h2>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(100vh-16rem)] lg:max-h-[calc(100vh-12rem)]">
          <div className="divide-y divide-slate-700">
            {(recommendations || []).slice(0, 12).map((rec, index) => (
              <div
                key={rec.name}
                className="p-3 hover:bg-green-900/50 cursor-pointer transition-colors"
                onClick={() => draftPlayer(rec)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-400 w-6">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-slate-100 truncate">{rec.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.position === 'F' ? 'bg-red-900/50 text-red-300' :
                            rec.position === 'M' ? 'bg-green-900/50 text-green-300' :
                            rec.position === 'D' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {rec.position}
                          </span>
                          {rec.tier && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              rec.tier === 'ELITE' ? 'bg-purple-900/50 text-purple-300' :
                              rec.tier === 'HIGH' ? 'bg-blue-900/50 text-blue-300' :
                              rec.tier === 'MID' ? 'bg-green-900/50 text-green-300' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {rec.tier}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">{rec.team} • Age: {rec.age}</div>
                        <div className="text-xs text-green-400 mt-1 truncate">{rec.recommendation}</div>
                        {rec.scoring && (
                          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                            <span>Talent: {(rec.scoring.talent || 0).toFixed(0)}</span>
                            <span>Need: {(rec.scoring.positionNeed || 0).toFixed(0)}</span>
                            <span>Scarcity: {(rec.scoring.scarcity || 0).toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="text-lg font-bold text-green-400">{rec.strategicScore?.toFixed(0) || rec.score?.toFixed(0) || '0'}</div>
                    <div className="text-sm text-purple-400">{rec.vorp?.toFixed(1) || '0.0'}</div>
                    <div className="text-xs text-slate-400">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export with React.memo for performance optimization
export const PlayerList = React.memo(PlayerListComponent); 