import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiDraftPlayer } from '../../utils/draftLogic.js';
import { validateRoster, getRosterCounts, determineRosterCategory } from '../../utils/rosterValidation.js';
import { LEAGUE_CONFIG } from '../../leagueConfig.js';
import { mockPlayers as _mockPlayers } from '../fixtures/mockData.js';

// Use the real strategic recommendation system to test actual AI behavior

describe('AI Draft Strategy Analysis', () => {
  let availablePlayers;
  let replacementLevels;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a comprehensive set of available players
    availablePlayers = [
      // Elite players (should be picked early)
      { id: 1, name: 'Elite Midfielder 1', position: 'M', historicalPoints: 520, vorp: 120 },
      { id: 2, name: 'Elite Forward 1', position: 'F', historicalPoints: 510, vorp: 110 },
      { id: 3, name: 'Elite Midfielder 2', position: 'M', historicalPoints: 500, vorp: 100 },
      
      // High-tier players  
      { id: 4, name: 'High Forward 1', position: 'F', historicalPoints: 450, vorp: 50 },
      { id: 5, name: 'High Defender 1', position: 'D', historicalPoints: 440, vorp: 40 },
      { id: 6, name: 'High Midfielder 1', position: 'M', historicalPoints: 430, vorp: 30 },
      
      // Mid-tier players
      { id: 7, name: 'Mid Defender 1', position: 'D', historicalPoints: 350, vorp: 20 },
      { id: 8, name: 'Mid Defender 2', position: 'D', historicalPoints: 340, vorp: 15 },
      { id: 9, name: 'Mid Midfielder 1', position: 'M', historicalPoints: 330, vorp: 10 },
      { id: 10, name: 'Mid Forward 1', position: 'F', historicalPoints: 320, vorp: 5 },
      
      // Goalkeepers - various quality levels
      { id: 11, name: 'Elite Goalkeeper', position: 'G', historicalPoints: 180, vorp: 30 },
      { id: 12, name: 'Good Goalkeeper', position: 'G', historicalPoints: 160, vorp: 20 },
      { id: 13, name: 'Average Goalkeeper', position: 'G', historicalPoints: 140, vorp: 10 },
      { id: 14, name: 'Backup Goalkeeper', position: 'G', historicalPoints: 120, vorp: 5 },
      
      // Additional depth players
      ...Array.from({ length: 50 }, (_, i) => ({
        id: i + 15,
        name: `Depth Player ${i + 1}`,
        position: ['D', 'M', 'F'][i % 3],
        historicalPoints: 280 - (i * 5),
        vorp: Math.max(0, 20 - i)
      }))
    ];

    replacementLevels = { D: 150, M: 180, F: 200, G: 100 };
  });

  describe('AI Position Strategy', () => {
    it('should not pick multiple goalkeepers early when one is sufficient', () => {
      const team = {
        id: 1,
        name: 'AI Team 1',
        picks: [
          { id: 11, name: 'Elite Goalkeeper', position: 'G', historicalPoints: 180 }
        ],
        positionLimits: LEAGUE_CONFIG.positionLimits,
        maxTotalPlayers: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers,
        maxActivePlayers: LEAGUE_CONFIG.rosterLimits.maxActivePlayers
      };

      // Simulate picks for rounds 2-5 (early rounds)
      for (let round = 2; round <= 5; round++) {
        const pick = aiDraftPlayer(
          team,
          availablePlayers.filter(p => !team.picks.some(pick => pick.id === p.id)),
          replacementLevels,
          round,
          1, // Early draft position
          team.picks.map(p => p.name),
          true,
          10
        );

                 if (pick) {
           // Properly determine roster category like in real app
           const rosterCategory = determineRosterCategory(team, pick);
           team.picks.push({ ...pick, round, rosterCategory });
           
           // Should NOT pick another goalkeeper in early rounds
           expect(pick.position).not.toBe('G');
         }
      }

      // Count goalkeepers - should still be just 1
      const goalkeepers = team.picks.filter(p => p.position === 'G');
      expect(goalkeepers.length).toBe(1);
    });

         it('should prioritize meeting minimum position requirements with proper timing', () => {
       // Create a team that has picked some players but is missing minimum positions
       const team = {
         id: 2,
         name: 'AI Team 2',
         picks: [
           { id: 1, name: 'Elite Midfielder 1', position: 'M', historicalPoints: 520 },
           { id: 2, name: 'Elite Forward 1', position: 'F', historicalPoints: 510 },
           { id: 3, name: 'High Midfielder 1', position: 'M', historicalPoints: 430 },
           // Missing: Defenders (need 3 min) and Goalkeepers (need 1 min)
         ],
         positionLimits: LEAGUE_CONFIG.positionLimits,
         maxTotalPlayers: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers,
         maxActivePlayers: LEAGUE_CONFIG.rosterLimits.maxActivePlayers
       };

                // Track when positions are drafted
         const firstGKRound = [];
         let picksAttempted = 0;
         const maxPicks = team.maxTotalPlayers; // Complete the roster

                  while (team.picks.length < team.maxTotalPlayers && picksAttempted < maxPicks) {
           const currentRound = team.picks.length + 1; // Simpler round calculation for fuller test
           
           const pick = aiDraftPlayer(
             team,
             availablePlayers.filter(p => !team.picks.some(pick => pick.id === p.id)),
             replacementLevels,
             currentRound,
             1,
             team.picks.map(p => p.name),
             true,
             10
           );

           if (pick) {
             // Properly determine roster category like in real app
             const rosterCategory = determineRosterCategory(team, pick);
             team.picks.push({ ...pick, round: currentRound, rosterCategory });
             if (pick.position === 'G' && firstGKRound.length === 0) {
               firstGKRound.push(currentRound);
             }
           }
           
           picksAttempted++;
         }

       // Analyze final roster
       const finalCounts = getRosterCounts(team);
       const totalByPosition = {
         D: finalCounts.active.byPosition.D + finalCounts.reserve.byPosition.D + finalCounts.injured_reserve.byPosition.D,
         M: finalCounts.active.byPosition.M + finalCounts.reserve.byPosition.M + finalCounts.injured_reserve.byPosition.M,
         F: finalCounts.active.byPosition.F + finalCounts.reserve.byPosition.F + finalCounts.injured_reserve.byPosition.F,
         G: finalCounts.active.byPosition.G + finalCounts.reserve.byPosition.G + finalCounts.injured_reserve.byPosition.G
       };

       // Should meet minimum requirements
       expect(totalByPosition.D).toBeGreaterThanOrEqual(LEAGUE_CONFIG.positionLimits.D.minActive);
       expect(totalByPosition.M).toBeGreaterThanOrEqual(LEAGUE_CONFIG.positionLimits.M.minActive);
       expect(totalByPosition.F).toBeGreaterThanOrEqual(LEAGUE_CONFIG.positionLimits.F.minActive);
       expect(totalByPosition.G).toBeGreaterThanOrEqual(LEAGUE_CONFIG.positionLimits.G.minActive);

       // Should not exceed maximum limits
       expect(totalByPosition.D).toBeLessThanOrEqual(LEAGUE_CONFIG.positionLimits.D.totalMax);
       expect(totalByPosition.M).toBeLessThanOrEqual(LEAGUE_CONFIG.positionLimits.M.totalMax);
       expect(totalByPosition.F).toBeLessThanOrEqual(LEAGUE_CONFIG.positionLimits.F.totalMax);
       expect(totalByPosition.G).toBeLessThanOrEqual(LEAGUE_CONFIG.positionLimits.G.totalMax);

       // Should have exactly 1 goalkeeper (not more)
       expect(totalByPosition.G).toBe(1);

       // Goalkeeper should be drafted in round 10 or later
       if (firstGKRound.length > 0) {
         expect(firstGKRound[0]).toBeGreaterThanOrEqual(10);
       }
     });

    it('should avoid picking too many players in any single position', () => {
      const team = {
        id: 3,
        name: 'AI Team 3',
        picks: [],
        positionLimits: LEAGUE_CONFIG.positionLimits,
        maxTotalPlayers: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers,
        maxActivePlayers: LEAGUE_CONFIG.rosterLimits.maxActivePlayers
      };

      // Simulate a full draft
      let picksAttempted = 0;
      const maxPicks = team.maxTotalPlayers;

             while (team.picks.length < team.maxTotalPlayers && picksAttempted < maxPicks) {
         const currentRound = team.picks.length + 1; // Simpler round calculation for fuller test
         
         const pick = aiDraftPlayer(
           team,
           availablePlayers.filter(p => !team.picks.some(pick => pick.id === p.id)),
           replacementLevels,
           currentRound,
           1,
           team.picks.map(p => p.name),
           true,
           10
         );

         if (pick) {
           // Properly determine roster category like in real app
           const rosterCategory = determineRosterCategory(team, pick);
           team.picks.push({ ...pick, round: currentRound, rosterCategory });
         } else {
           break; // No valid picks available
         }
         
         picksAttempted++;
       }

             // Analyze final roster balance
       const finalCounts = getRosterCounts(team);
      const totalByPosition = {
        D: finalCounts.active.byPosition.D + finalCounts.reserve.byPosition.D + finalCounts.injured_reserve.byPosition.D,
        M: finalCounts.active.byPosition.M + finalCounts.reserve.byPosition.M + finalCounts.injured_reserve.byPosition.M,
        F: finalCounts.active.byPosition.F + finalCounts.reserve.byPosition.F + finalCounts.injured_reserve.byPosition.F,
        G: finalCounts.active.byPosition.G + finalCounts.reserve.byPosition.G + finalCounts.injured_reserve.byPosition.G
      };

      // Check for reasonable balance - no position should be massively over-represented
      // Allow some variance but flag egregious cases
      Object.entries(totalByPosition).forEach(([position, count]) => {
        const maxAllowed = LEAGUE_CONFIG.positionLimits[position].totalMax;
        
        // Should not exceed limits
        expect(count).toBeLessThanOrEqual(maxAllowed);
        
        // Should not be completely unbalanced (e.g., 8 defenders, 1 midfielder)
        if (position !== 'G') { // Goalkeepers are naturally limited
          expect(count).toBeGreaterThan(0);
        }
      });

             // Final roster should be valid
       const rosterValidation = validateRoster(team);
       if (!rosterValidation.isValid) {
         console.log('Roster validation failed:', rosterValidation.errors);
         console.log('Final roster composition:', totalByPosition);
       }
       expect(rosterValidation.isValid).toBe(true);
    });
  });

  describe('Full Simulation Strategic Analysis', () => {
    it('should produce sensible rosters across multiple AI teams', () => {
      // Create 10 teams like in real simulation
      const teams = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: i === 0 ? 'User Team' : `AI Team ${i}`,
        picks: [],
        positionLimits: LEAGUE_CONFIG.positionLimits,
        maxTotalPlayers: LEAGUE_CONFIG.rosterLimits.maxTotalPlayers,
        maxActivePlayers: LEAGUE_CONFIG.rosterLimits.maxActivePlayers
      }));

      let currentAvailable = [...availablePlayers];
      const draftedPlayers = [];

      // Simulate first 5 rounds of drafting for each team
      for (let round = 1; round <= 5; round++) {
        for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
          const team = teams[teamIndex];
          
          if (team.picks.length >= team.maxTotalPlayers) continue;

          const pick = aiDraftPlayer(
            team,
            currentAvailable,
            replacementLevels,
            round,
            teamIndex + 1,
            draftedPlayers,
            true,
            10
          );

                   if (pick) {
           // Properly determine roster category like in real app
           const rosterCategory = determineRosterCategory(team, pick);
           team.picks.push({ ...pick, round, rosterCategory });
           draftedPlayers.push(pick.name);
           currentAvailable = currentAvailable.filter(p => p.id !== pick.id);
         }
        }
      }

             // Analyze the results across all teams
       teams.forEach((team, index) => {
         const counts = getRosterCounts(team);
        const totalByPosition = {
          D: counts.active.byPosition.D + counts.reserve.byPosition.D + counts.injured_reserve.byPosition.D,
          M: counts.active.byPosition.M + counts.reserve.byPosition.M + counts.injured_reserve.byPosition.M,
          F: counts.active.byPosition.F + counts.reserve.byPosition.F + counts.injured_reserve.byPosition.F,
          G: counts.active.byPosition.G + counts.reserve.byPosition.G + counts.injured_reserve.byPosition.G
        };

        // Each team should have made some reasonable picks
        expect(team.picks.length).toBeGreaterThan(0);
        expect(team.picks.length).toBeLessThanOrEqual(5); // 5 rounds max

                 // No team should have goalkeepers in first 5 rounds
         expect(totalByPosition.G).toBe(0);

         // Teams should prioritize high-value positions early
         const earlyPositions = team.picks.slice(0, 3).map(p => p.position);
         const goalkeepersInFirstThree = earlyPositions.filter(pos => pos === 'G').length;
         expect(goalkeepersInFirstThree).toBe(0); // No goalkeepers in first 3 picks
      });

      // Elite players should be distributed among teams (not all on one team)
      const elitePlayerCount = teams.reduce((sum, team) => {
        return sum + team.picks.filter(p => p.historicalPoints >= 500).length;
      }, 0);
      
      expect(elitePlayerCount).toBeGreaterThan(0);
      expect(elitePlayerCount).toBeLessThan(teams.length); // Not every team gets elite player in 5 rounds
    });
  });
}); 