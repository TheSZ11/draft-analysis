import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSimulation } from '../../hooks/useSimulation.js';
import { aiDraftPlayer } from '../../utils/draftLogic.js';
import { validateDraftMove, validateRoster } from '../../utils/rosterValidation.js';
import { LEAGUE_CONFIG } from '../../leagueConfig.js';
import { mockPlayers as _mockPlayers } from '../fixtures/mockData.js';

// Mock the strategic recommendation system to return simple picks
vi.mock('../../draftStrategy.js', () => ({
  getStrategicRecommendations: vi.fn(() => ({
    recommendations: [
      { playerName: 'TestPlayer', reasoning: 'Test pick' }
    ]
  }))
}));

describe('Roster Validation During Simulation', () => {
  let mockTeams;
  let limitedAvailablePlayers;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create teams with proper league config
    mockTeams = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: i === 0 ? 'Your Team' : `AI Team ${i}`,
      picks: [],
      ...LEAGUE_CONFIG.rosterLimits,
      positionLimits: { ...LEAGUE_CONFIG.positionLimits }
    }));

    // Create a limited player pool to force position limits to be hit
    limitedAvailablePlayers = [
      // Only 2 goalkeepers available
      { id: 1, name: 'GK1', position: 'G', historicalPoints: 100 },
      { id: 2, name: 'GK2', position: 'G', historicalPoints: 90 },
      
      // Limited forwards (only 5 available, max 6 total allowed per team)
      { id: 11, name: 'FW1', position: 'F', historicalPoints: 120 },
      { id: 12, name: 'FW2', position: 'F', historicalPoints: 110 },
      { id: 13, name: 'FW3', position: 'F', historicalPoints: 105 },
      { id: 14, name: 'FW4', position: 'F', historicalPoints: 100 },
      { id: 15, name: 'FW5', position: 'F', historicalPoints: 95 },
      
      // Plenty of other positions
      ...Array.from({ length: 20 }, (_, i) => ({
        id: 20 + i,
        name: `DEF${i + 1}`,
        position: 'D',
        historicalPoints: 80 - i
      })),
      ...Array.from({ length: 20 }, (_, i) => ({
        id: 40 + i,
        name: `MID${i + 1}`,
        position: 'M',
        historicalPoints: 85 - i
      }))
    ];
  });

  describe('AI Draft Player Validation', () => {
    it('should reject AI picks that violate position limits', () => {
      const team = {
        ...mockTeams[1],
        picks: [
          // Already at max forwards (6 total)
          { id: 101, name: 'F1', position: 'F' },
          { id: 102, name: 'F2', position: 'F' },
          { id: 103, name: 'F3', position: 'F' },
          { id: 104, name: 'F4', position: 'F' },
          { id: 105, name: 'F5', position: 'F' },
          { id: 106, name: 'F6', position: 'F' }
        ]
      };

      const forwardPlayer = { id: 200, name: 'NewForward', position: 'F' };
      
      // AI should not be able to draft another forward
      const result = aiDraftPlayer(
        team,
        [forwardPlayer],
        {},
        1,
        1,
        [],
        true,
        10
      );

      expect(result).toBeNull(); // Should return null when no valid picks available
    });

    it('should reject AI picks when team is full', () => {
      const fullTeam = {
        ...mockTeams[1],
        picks: Array.from({ length: 14 }, (_, i) => ({
          id: i + 1,
          name: `Player${i + 1}`,
          position: i < 3 ? 'G' : i < 8 ? 'D' : i < 13 ? 'M' : 'F'
        }))
      };

      const availablePlayer = { id: 200, name: 'ExtraPlayer', position: 'M' };
      
      const result = aiDraftPlayer(
        fullTeam,
        [availablePlayer],
        {},
        1,
        1,
        [],
        true,
        10
      );

      expect(result).toBeNull();
    });

         it('should select valid players within position limits', () => {
       const team = {
         ...mockTeams[1],
         picks: [
           { id: 1, name: 'GK1', position: 'G' },
           { id: 2, name: 'DEF1', position: 'D' },
           { id: 3, name: 'MID1', position: 'M' }
         ]
       };

       const validMidfielder = { id: 4, name: 'MID2', position: 'M', historicalPoints: 80 };

       const result = aiDraftPlayer(
         team,
         [validMidfielder],
         {},
         1,
         1,
         [],
         true,
         10
       );

       // Verify the pick is valid
       const validation = validateDraftMove(team, validMidfielder);
       expect(validation.isValid).toBe(true);
       expect(result).toEqual(validMidfielder);
     });
  });

  describe('Simulation Mode User Pick Validation', () => {
    it('should prevent user from making illegal picks in simulation', () => {
      const { result } = renderHook(() => useSimulation());

      // Start simulation with a user team that's almost at position limits
      act(() => {
        result.current.startSimulation(1, mockTeams);
      });

      // Set up a team with maximum goalkeepers
      act(() => {
        result.current.setSimulationTeams([{
          ...mockTeams[0],
          picks: [
            { id: 1, name: 'GK1', position: 'G' },
            { id: 2, name: 'GK2', position: 'G' },
            { id: 3, name: 'GK3', position: 'G' } // At max goalkeeper limit
          ]
        }]);
      });

      const anotherGoalkeeper = { id: 4, name: 'GK4', position: 'G' };

      // Attempt to draft another goalkeeper should throw error
      expect(() => {
        act(() => {
          result.current.draftPlayerInSimulation(anotherGoalkeeper, 1, []);
        });
      }).toThrow(/Illegal draft pick.*G position is full/);
    });

    it('should allow valid user picks in simulation', () => {
      const { result } = renderHook(() => useSimulation());

      act(() => {
        result.current.startSimulation(1, mockTeams);
      });

      const validPlayer = { id: 1, name: 'ValidPlayer', position: 'M' };

      // Should not throw and should update teams
      act(() => {
        const updateResult = result.current.draftPlayerInSimulation(validPlayer, 1, []);
        expect(updateResult.playerWithCategory.name).toBe('ValidPlayer');
        expect(updateResult.newDraftedPlayers).toContain('ValidPlayer');
      });
    });
  });

  describe('Full Simulation Roster Compliance', () => {
    it('should maintain roster compliance throughout entire simulation', () => {
      const { result } = renderHook(() => useSimulation());

      act(() => {
        result.current.startSimulation(1, mockTeams);
      });

      // Simulate multiple rounds with AI picks
      const draftedPlayers = [];
      let availablePlayers = [...limitedAvailablePlayers];

      for (let round = 1; round <= 5; round++) {
        for (let teamIndex = 0; teamIndex < 10; teamIndex++) {
          if (availablePlayers.length === 0) break;

          const team = result.current.simulationTeams[teamIndex];
          if (!team || team.picks.length >= team.maxTotalPlayers) continue;

          // Mock AI pick
          const availableForThisTeam = availablePlayers.filter(p => {
            const validation = validateDraftMove(team, p);
            return validation.isValid;
          });

          if (availableForThisTeam.length > 0) {
            const pick = availableForThisTeam[0];
            
            // Validate the pick
            const validation = validateDraftMove(team, pick);
            expect(validation.isValid).toBe(true);

            // Add to team
            act(() => {
              result.current.setSimulationTeams(prev => 
                prev.map(t => 
                  t.id === team.id 
                    ? { ...t, picks: [...t.picks, { ...pick, round }] }
                    : t
                )
              );
            });

            // Remove from available
            availablePlayers = availablePlayers.filter(p => p.id !== pick.id);
            draftedPlayers.push(pick.name);
          }
        }
      }

      // Verify all teams still comply with roster rules
      result.current.simulationTeams.forEach(team => {
        const rosterValidation = validateRoster(team);
        expect(rosterValidation.isValid).toBe(true);
        
        // Verify position limits are respected
        const positionCounts = team.picks.reduce((acc, player) => {
          acc[player.position] = (acc[player.position] || 0) + 1;
          return acc;
        }, {});

        Object.entries(team.positionLimits).forEach(([position, limits]) => {
          const count = positionCounts[position] || 0;
          expect(count).toBeLessThanOrEqual(limits.totalMax);
        });
      });
    });

         it('should handle edge case where no valid picks remain for a team', () => {
       // Create a scenario where a team has filled almost all positions
       // and only illegal picks remain
       const _constrainedTeam = {
         ...mockTeams[1],
         picks: [
           // Max out forwards (6 is the limit)
           ...Array.from({ length: 6 }, (_, i) => ({ 
             id: i + 1, 
             name: `F${i + 1}`, 
             position: 'F' 
           })),
           // Max out goalkeepers (3 is the limit)
           ...Array.from({ length: 3 }, (_, i) => ({ 
             id: i + 10, 
             name: `G${i + 1}`, 
             position: 'G' 
           })),
           // Max out defenders (8 is the limit)
           ...Array.from({ length: 8 }, (_, i) => ({ 
             id: i + 20, 
             name: `D${i + 1}`, 
             position: 'D' 
           })),
           // Max out midfielders but one slot - team is almost full
           ...Array.from({ length: 7 }, (_, i) => ({ 
             id: i + 30, 
             name: `M${i + 1}`, 
             position: 'M' 
           }))
           // Total: 6F + 3G + 8D + 7M = 24 players, but max is 14 
           // Let's fix this to be realistic
         ]
       };

       // Reset to a more realistic constrained team
       const realisticConstrainedTeam = {
         ...mockTeams[1],
         picks: [
           // Max out forwards (6 is the limit)
           ...Array.from({ length: 6 }, (_, i) => ({ 
             id: i + 1, 
             name: `F${i + 1}`, 
             position: 'F' 
           })),
           // Max out goalkeepers (3 is the limit)  
           ...Array.from({ length: 3 }, (_, i) => ({ 
             id: i + 10, 
             name: `G${i + 1}`, 
             position: 'G' 
           })),
           // Add 5 more players to reach 14 total (max team size)
           ...Array.from({ length: 5 }, (_, i) => ({ 
             id: i + 20, 
             name: `D${i + 1}`, 
             position: 'D' 
           }))
         ]
       };

       // Only forward and goalkeeper players available (both illegal for this full team)
       const illegalPlayers = [
         { id: 100, name: 'IllegalF', position: 'F' },
         { id: 101, name: 'IllegalG', position: 'G' }
       ];

       const result = aiDraftPlayer(
         realisticConstrainedTeam,
         illegalPlayers,
         {},
         1,
         1,
         [],
         true,
         10
       );

       expect(result).toBeNull(); // Should return null when no valid picks
     });
  });

  describe('Cross-validation with Manual Picks', () => {
    it('should prevent manual picks that would create illegal rosters', () => {
      const teamWithManyForwards = {
        ...mockTeams[0],
        picks: Array.from({ length: 5 }, (_, i) => ({ 
          id: i + 1, 
          name: `F${i + 1}`, 
          position: 'F' 
        }))
      };

      const sixthForward = { id: 6, name: 'F6', position: 'F' };
      const seventhForward = { id: 7, name: 'F7', position: 'F' };

      // Sixth forward should be allowed (at limit)
      const validation1 = validateDraftMove(teamWithManyForwards, sixthForward);
      expect(validation1.isValid).toBe(true);

      // Add the sixth forward
      const updatedTeam = {
        ...teamWithManyForwards,
        picks: [...teamWithManyForwards.picks, sixthForward]
      };

      // Seventh forward should be rejected (over limit)
      const validation2 = validateDraftMove(updatedTeam, seventhForward);
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors[0]).toMatch(/position is full/);
    });
  });
}); 