import React from 'react';
import { calculateVORP } from '../utils/playerCalculations.js';
import { useUIContext, usePlayerContext, useFixtureContext } from '../contexts/index.js';

/**
 * PlayerTooltip Component - Shows detailed player information on hover
 * Now uses React Context instead of prop drilling
 * @returns {JSX.Element}
 */
export const PlayerTooltip = () => {
  // Get data from contexts instead of props
  const { hoveredPlayer: player, tooltipPosition } = useUIContext();
  const { replacementLevels } = usePlayerContext();
  const { fixtures } = useFixtureContext();
  
  // Don't render if no player is being hovered
  if (!player || !tooltipPosition) return null;
  // Player team is already in FPL code format
  const teamFixtures = fixtures[player.team] || [];
  const upcomingFixtures = teamFixtures.slice(0, 5);
  const avgDifficulty = upcomingFixtures.length > 0 ? 
    upcomingFixtures.reduce((sum, f) => sum + f.difficulty, 0) / upcomingFixtures.length : 3;

  return (
    <div 
      className="fixed bg-slate-800 border border-slate-600 rounded-lg shadow-lg p-3 sm:p-4 w-80 sm:w-96 z-50 pointer-events-none"
      style={{ 
        left: Math.min(tooltipPosition.x, window.innerWidth - 320), 
        top: tooltipPosition.y,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="mb-3">
        <h3 className="font-bold text-base sm:text-lg text-slate-100">{player.name}</h3>
        <p className="text-xs sm:text-sm text-slate-400">{player.team} • {player.position} • Age: {player.age}</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
          <span className="font-semibold text-blue-400">Historical: {player.historicalPoints}</span>
          <span className="font-semibold text-green-400">FP/90: {player.fp90}</span>
          <span className="font-semibold text-purple-400">VORP: {calculateVORP(player, replacementLevels).toFixed(1)}</span>
          <span className="text-slate-300">Difficulty: {avgDifficulty.toFixed(1)}</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Minutes: {player.minutes.toLocaleString()}
        </div>
      </div>

      {/* Key Statistics */}
      <div className="mb-3">
        <h4 className="font-semibold mb-2 text-xs sm:text-sm text-slate-100">Key Stats</h4>
        <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs text-slate-300">
          <div>Goals: {player.goals}</div>
          <div>Assists: {player.assists}</div>
          <div>2nd Assists: {player.assistsSecond}</div>
          <div>Shots: {player.shots}</div>
          <div>Shots on Target: {player.shotsOnTarget}</div>
          <div>Key Passes: {player.keyPasses}</div>
          <div>Clean Sheets: {player.cleanSheets}</div>
          <div>Saves: {player.saves}</div>
        </div>
      </div>

      {/* Defensive Stats */}
      {(player.position === 'D' || player.position === 'M') && (
        <div className="mb-3">
          <h4 className="font-semibold mb-2 text-xs sm:text-sm text-slate-100">Defensive Stats</h4>
          <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs text-slate-300">
            <div>Tackles Won: {player.tacklesWon}</div>
            <div>Interceptions: {player.interceptions}</div>
            <div>Blocked Shots: {player.blockedShots}</div>
            <div>Clearances: {player.clearances}</div>
            <div>Recoveries: {player.recoveries}</div>
            <div>Aerials Won: {player.aerialsWon}</div>
          </div>
        </div>
      )}

      {/* Attacking Stats */}
      {(player.position === 'M' || player.position === 'F') && (
        <div className="mb-3">
          <h4 className="font-semibold mb-2 text-xs sm:text-sm text-slate-100">Attacking Stats</h4>
          <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs text-slate-300">
            <div>Dribbles: {player.dribbles}</div>
            <div>Acc. Crosses: {player.accCrosses}</div>
            <div>PK Drawn: {player.pkDrawn}</div>
            <div>Fouls Suffered: {player.foulsSuffered}</div>
          </div>
        </div>
      )}

      {/* Disciplinary Stats */}
      <div className="mb-3">
        <h4 className="font-semibold mb-2 text-xs sm:text-sm text-slate-100">Disciplinary</h4>
        <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs text-slate-300">
          <div>Yellow Cards: {player.yellowCards}</div>
          <div>Red Cards: {player.redCards}</div>
          <div>Own Goals: {player.ownGoals}</div>
          <div>Penalties Missed: {player.pkMissed}</div>
        </div>
      </div>

      {/* Upcoming Fixtures */}
      <div>
        <h4 className="font-semibold mb-2 text-xs sm:text-sm text-slate-100">Next 5 Fixtures</h4>
        <div className="space-y-1">
          {upcomingFixtures.length > 0 ? (
            upcomingFixtures.map((fixture, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-slate-300">
                  {fixture.home ? 'vs' : '@'} {fixture.opponent}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  fixture.difficulty <= 2 ? 'bg-green-900/50 text-green-300' :
                  fixture.difficulty <= 3 ? 'bg-yellow-900/50 text-yellow-300' :
                  'bg-red-900/50 text-red-300'
                }`}>
                  {fixture.difficulty}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-xs">No fixture data available</div>
          )}
        </div>
      </div>
    </div>
  );
}; 