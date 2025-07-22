import React, { memo } from 'react';
import { getPlayerTierByName, getTierColor } from '../utils/playerCalculations.js';
import { difficultyColors } from '../utils/constants.js';

/**
 * PlayerCard Component - Individual player item with memoization for performance
 * @param {Object} props
 * @param {Object} props.player - Player data
 * @param {number} props.index - Player index for numbering
 * @param {Array} props.fixtureIndicators - Fixture difficulty indicators
 * @param {Array} props.playerTiers - Player tier data
 * @param {Function} props.onDraft - Function to draft player
 * @param {Function} props.onMouseEnter - Mouse enter handler
 * @param {Function} props.onMouseLeave - Mouse leave handler
 * @returns {JSX.Element}
 */
const PlayerCard = memo(({
  player,
  index,
  fixtureIndicators,
  playerTiers,
  onDraft,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      key={player.id || player.name}
      className={`p-3 hover:bg-slate-700 cursor-pointer transition-colors ${
        player.isPositionFull 
          ? 'bg-red-900/50 cursor-not-allowed opacity-60' 
          : ''
      }`}
      onClick={() => !player.isPositionFull && onDraft(player)}
      onMouseEnter={(e) => onMouseEnter(player, e)}
      onMouseLeave={onMouseLeave}
      title={player.isPositionFull ? `Cannot draft: ${player.draftErrors?.join(', ')}` : ''}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-400 w-8">#{index + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-slate-100 truncate">{player.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  player.position === 'F' ? 'bg-red-900/50 text-red-300' :
                  player.position === 'M' ? 'bg-green-900/50 text-green-300' :
                  player.position === 'D' ? 'bg-blue-900/50 text-blue-300' :
                  'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {player.position}
                </span>
                {getPlayerTierByName(player.name, playerTiers) && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTierColor(getPlayerTierByName(player.name, playerTiers))}`}>
                    T{getPlayerTierByName(player.name, playerTiers)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                <span>{player.team}</span>
                <span>•</span>
                <span>Age: {player.age}</span>
                <span>•</span>
                <span>FP/90: {player.fp90}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center space-x-1">
              {fixtureIndicators.map((fixture, idx) => (
                <span 
                  key={idx}
                  className={`w-2 h-2 rounded-full ${difficultyColors[fixture.difficulty]}`}
                  title={`GW${fixture.matchweek}: ${fixture.home ? 'vs' : '@'} ${fixture.opponent} (${fixture.difficulty}/5)`}
                ></span>
              ))}
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              player.isPositionFull 
                ? 'bg-red-900/50 text-red-300' 
                : player.positionCount >= player.positionLimit * 0.8
                ? 'bg-yellow-900/50 text-yellow-300'
                : 'bg-green-900/50 text-green-300'
            }`}>
              {player.positionCount}/{player.positionLimit}
            </span>
            {player.news && (
              <span className="text-xs text-red-400 truncate">{player.news}</span>
            )}
          </div>
        </div>
        
        <div className="text-right ml-4 flex-shrink-0">
          <div className="text-lg font-bold text-purple-400">
            {(player.vorp || 0).toFixed(1)}
          </div>
          <div className="text-sm text-blue-400">{player.historicalPoints || 0}</div>
          <div className="text-xs text-slate-400">VORP</div>
        </div>
      </div>
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export { PlayerCard }; 