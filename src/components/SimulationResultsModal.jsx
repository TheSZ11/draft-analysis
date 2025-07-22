import React from 'react';
import { calculateVORP } from '../utils/playerCalculations.js';
import { useDraftContext, usePlayerContext } from '../contexts/index.js';

/**
 * SimulationResultsModal Component - Shows simulation results with team rankings and analysis
 * Now uses React Context instead of prop drilling
 * @returns {JSX.Element}
 */
export const SimulationResultsModal = () => {
  // Get data from contexts instead of props
  const {
    showResultsModal,
    simulationResults,
    resetSimulation,
    simulation
  } = useDraftContext();
  
  const { replacementLevels } = usePlayerContext();
  
  const closeModal = () => simulation.setShowResultsModal(false);
  if (!showResultsModal || !simulationResults) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-100">Simulation Results</h2>
            <button
              onClick={closeModal}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-400 mt-2">
            Draft Position: {simulationResults.userPosition} • Total VORP: {simulationResults.analysis.userVorp.toFixed(1)}
          </p>
        </div>
        
        <div className="p-6">
          {/* Team Rankings */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Team Rankings</h3>
            <div className="space-y-2">
              {simulationResults.teams
                .map(team => ({
                  ...team,
                  totalVorp: team.picks.reduce((sum, p) => sum + calculateVORP(p, replacementLevels), 0)
                }))
                .sort((a, b) => b.totalVorp - a.totalVorp)
                .map((team, index) => (
                  <div key={team.id} className={`flex justify-between items-center p-3 rounded-lg ${
                    team.id === 1 ? 'bg-blue-900/50 border border-blue-600' : 'bg-slate-700'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <span className={`font-bold text-lg ${
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-orange-400' : 'text-slate-400'
                      }`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-100">
                          {team.name}
                          {team.id === 1 && <span className="ml-2 text-xs bg-blue-600 text-blue-200 px-2 py-1 rounded">YOU</span>}
                        </div>
                        <div className="text-sm text-slate-400">
                          {team.picks.length} players • {team.totalVorp.toFixed(1)} VORP
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100">{team.totalVorp.toFixed(1)}</div>
                      <div className="text-xs text-slate-400">VORP</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Your Team Analysis */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Your Team Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Position Breakdown */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-100 mb-3">Position Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(simulationResults.analysis.userTeam.positionLimits).map(([pos, limits]) => {
                    const players = simulationResults.analysis.userTeam.picks.filter(p => p.position === pos);
                    const totalVorp = players.reduce((sum, p) => sum + calculateVORP(p, replacementLevels), 0);
                    return (
                      <div key={pos} className="flex justify-between items-center">
                        <span className="text-slate-300">{pos}</span>
                        <div className="text-right">
                          <div className="text-slate-100">{players.length}/{limits.totalMax}</div>
                          <div className="text-xs text-slate-400">{totalVorp.toFixed(1)} VORP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Draft Picks */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-100 mb-3">Your Picks</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {simulationResults.analysis.userTeam.picks.map((pick, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">#{index + 1}</span>
                        <span className="text-slate-100">{pick.name}</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          pick.position === 'F' ? 'bg-red-900/50 text-red-300' :
                          pick.position === 'M' ? 'bg-green-900/50 text-green-300' :
                          pick.position === 'D' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {pick.position}
                        </span>
                      </div>
                      <span className="text-slate-400">{calculateVORP(pick, replacementLevels).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Comparison */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">League Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-100">{simulationResults.analysis.userVorp.toFixed(1)}</div>
                <div className="text-slate-400">Your VORP</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-100">{simulationResults.analysis.averageAiVorp.toFixed(1)}</div>
                <div className="text-slate-400">Average AI VORP</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${
                  simulationResults.analysis.userVorp > simulationResults.analysis.averageAiVorp ? 'text-green-400' : 'text-red-400'
                }`}>
                  {simulationResults.analysis.userVorp > simulationResults.analysis.averageAiVorp ? '+' : ''}
                  {(simulationResults.analysis.userVorp - simulationResults.analysis.averageAiVorp).toFixed(1)}
                </div>
                <div className="text-slate-400">VORP Difference</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={resetSimulation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              New Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 