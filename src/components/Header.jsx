import React, { useMemo } from 'react';
import { Clock, Users, Target } from 'lucide-react';
import { useDraftContext, usePlayerContext } from '../contexts/index.js';

/**
 * Header Component - Shows draft progress, controls, and title
 * Now uses React Context instead of prop drilling with performance optimizations
 * @param {Object} props
 * @param {Object} props.currentTeam - Temporary prop for current team (will be moved to context later)
 * @param {Function} props.startDraft - Function to start manual draft
 * @param {Function} props.resetDraft - Function to reset manual draft
 * @returns {JSX.Element}
 */
const HeaderComponent = ({ currentTeam, startDraft, resetDraft }) => {
  // Get data from contexts instead of props
  const {
    currentPick,
    teams,
    isSimulationMode,
    userDraftPosition,
    startSimulation,
    resetSimulation,
    simulationTeams
  } = useDraftContext();
  
  const { availablePlayers } = usePlayerContext();

  // Memoize expensive calculations
  const draftProgress = useMemo(() => {
    const totalPicks = teams.length * 15;
    const progressPercent = Math.round((currentPick - 1) / totalPicks * 100);
    const currentRound = Math.floor((currentPick - 1) / teams.length) + 1;
    
    return {
      totalPicks,
      progressPercent,
      currentRound
    };
  }, [currentPick, teams.length]);

  // Determine if draft is active
  const isDraftActive = teams.length > 0;
  const _hasNoTeams = teams.length === 0;
  return (
    <header className="bg-slate-800 shadow-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg lg:text-xl font-bold text-slate-100">Fantasy Football Draft Tracker</h1>
            <div className="hidden md:flex items-center space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Pick {currentPick} of {draftProgress.totalPicks}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{teams.length} teams</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>Round {draftProgress.currentRound}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            {isSimulationMode ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-400 font-medium">SIMULATION MODE</span>
                  <span className="text-slate-400">Position: {userDraftPosition}</span>
                </div>
                <button
                  onClick={() => resetSimulation()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    console.log('=== CURRENT SIMULATION STATE ===');
                    console.log('simulationTeams:', simulationTeams.map(t => `${t.name}: ${t.picks.length} players`));
                    console.log('currentPick:', currentPick);
                    console.log('userDraftPosition:', userDraftPosition);
                    console.log('availablePlayers:', availablePlayers.length);
                    simulationTeams.forEach(team => {
                      console.log(`${team.name} picks:`, team.picks.map(p => `${p.name} (${p.position})`));
                    });
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg transition-colors"
                >
                  Debug State
                </button>
              </>
            ) : (
              <>
                {isDraftActive ? (
                  <>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-blue-400 font-medium">MANUAL DRAFT</span>
                      <span className="text-slate-400 hidden sm:inline">Progress:</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-16 sm:w-20 lg:w-32 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${draftProgress.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {draftProgress.progressPercent}%
                        </span>
                      </div>
                    </div>
                    
                    {currentTeam && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-slate-400 hidden sm:inline">Current:</span>
                        <span className={`font-medium px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm ${
                          currentTeam.id === 1 
                            ? 'bg-blue-700 text-blue-200' 
                            : 'bg-slate-600 text-slate-200'
                        }`}>
                          {currentTeam.name}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => resetDraft && resetDraft()}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                    >
                      Reset Draft
                    </button>
                    <button
                      onClick={() => startSimulation()}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                    >
                      Start Simulation
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-slate-400">Ready to Draft</span>
                      <span className="text-slate-500 text-xs">No active draft</span>
                    </div>
                    
                    <button
                      onClick={() => startDraft && startDraft()}
                      disabled={availablePlayers.length === 0}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
                      title={availablePlayers.length === 0 ? "Loading players..." : "Start manual draft"}
                    >
                      {availablePlayers.length === 0 ? 'Loading Players...' : 'Start Draft'}
                    </button>
                    <button
                      onClick={() => startSimulation()}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                    >
                      Start Simulation
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Export with React.memo for performance optimization
export const Header = React.memo(HeaderComponent); 