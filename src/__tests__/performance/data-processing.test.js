/**
 * Data Processing Performance Tests
 * Tests the performance of data processing, calculations, and algorithms
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  processPlayerData,
  calculateReplacementLevels,
  createPlayerTiers,
  calculateVORP
} from '../../utils/playerCalculations.js';
import { 
  aiDraftPlayer,
  getAvailablePlayers
} from '../../utils/draftLogic.js';
import { 
  getStrategicRecommendations 
} from '../../draftStrategy.js';
import { createMockPlayersArray } from '../fixtures/mockData.js';

describe('Data Processing Performance', () => {
  describe('Player Data Processing', () => {
    it('should process small datasets quickly', () => {
      const smallDataset = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `Player ${i}`,
        position: ['F', 'M', 'D', 'G'][i % 4],
        team: 'LIV',
        points: Math.floor(Math.random() * 300),
        price: 5.0 + Math.random() * 10
      }));

      const start = performance.now();
      const processed = processPlayerData(smallDataset);
      const executionTime = performance.now() - start;

      expect(processed).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Under 100ms
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Player ${i}`,
        position: ['F', 'M', 'D', 'G'][i % 4],
        team: ['LIV', 'MCI', 'ARS', 'CHE'][i % 4],
        points: Math.floor(Math.random() * 300),
        price: 5.0 + Math.random() * 10,
        stats: {
          goals: Math.floor(Math.random() * 25),
          assists: Math.floor(Math.random() * 20),
          minutesPlayed: Math.floor(Math.random() * 3000)
        }
      }));

      const start = performance.now();
      const processed = processPlayerData(largeDataset);
      const executionTime = performance.now() - start;

      expect(processed).toBeDefined();
      expect(executionTime).toBeLessThan(500); // Under 500ms for large datasets
    });
  });

  describe('Calculation Performance', () => {
    it('should calculate replacement levels quickly', () => {
      const players = createMockPlayersArray(200);
      
      const start = performance.now();
      const replacementLevels = calculateReplacementLevels(players);
      const executionTime = performance.now() - start;

      expect(replacementLevels).toBeDefined();
      expect(executionTime).toBeLessThan(200);
    });

    it('should create player tiers efficiently', () => {
      const players = createMockPlayersArray(300);
      const replacementLevels = { F: 150, M: 120, D: 100, G: 80 };
      
      const start = performance.now();
      const tiers = createPlayerTiers(players, replacementLevels);
      const executionTime = performance.now() - start;

      expect(tiers).toBeDefined();
      expect(executionTime).toBeLessThan(300);
    });

    it('should calculate VORP for multiple players quickly', () => {
      const players = createMockPlayersArray(100);
      const replacementLevel = 100;
      
      const start = performance.now();
      players.forEach(player => {
        calculateVORP(player, replacementLevel);
      });
      const executionTime = performance.now() - start;
      
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Algorithm Performance', () => {
    it('should run AI draft selections efficiently', () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        picks: [],
        maxTotalPlayers: 15,
        positionLimits: { F: 3, M: 5, D: 5, G: 2 }
      };
      
      const availablePlayers = createMockPlayersArray(300);
      const replacementLevels = { F: 150, M: 120, D: 100, G: 80 };
      
      const start = performance.now();
      const selection = aiDraftPlayer(
        mockTeam,
        availablePlayers,
        replacementLevels,
        1,
        1
      );
      const executionTime = performance.now() - start;

      expect(executionTime).toBeLessThan(200); // AI should be fast
    });

    it('should generate strategic recommendations quickly', () => {
      const mockPlayers = createMockPlayersArray(5);
      const currentRoster = mockPlayers; // Array of picked players
      const availablePlayers = createMockPlayersArray(200);
      const replacementLevels = {
        F: { threshold: 100, value: 80 },
        M: { threshold: 90, value: 70 },
        D: { threshold: 80, value: 60 },
        G: { threshold: 70, value: 50 }
      };

      const start = performance.now();
      const recommendations = getStrategicRecommendations(
        currentRoster,    // Array of picked players
        6,               // currentRound
        3,               // draftPosition
        availablePlayers,
        replacementLevels,
        10               // totalTeams
      );
      const executionTime = performance.now() - start;

      expect(recommendations).toBeDefined();
      expect(executionTime).toBeLessThan(300);
    });

    it('should filter available players efficiently', () => {
      const allPlayers = createMockPlayersArray(500);
      const draftedPlayers = ['Player 1', 'Player 5', 'Player 10'];
      const mockTeam = {
        picks: [],
        positionLimits: { F: 3, M: 5, D: 5, G: 2 }
      };

      const start = performance.now();
      const available = getAvailablePlayers(
        allPlayers,
        draftedPlayers,
        mockTeam,
        'all',
        ''
      );
      const executionTime = performance.now() - start;

      expect(available).toBeDefined();
      expect(executionTime).toBeLessThan(150);
    });
  });

  describe('Stress Testing', () => {
    it('should handle repeated calculations without degradation', () => {
      const players = createMockPlayersArray(100);
      const times = [];

      // Run the same calculation 10 times
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        calculateReplacementLevels(players);
        const end = performance.now();
        times.push(end - start);
      }

      // Performance should not degrade significantly
      const firstTime = times[0];
      const lastTime = times[times.length - 1];
      const degradation = lastTime / firstTime;

      expect(degradation).toBeLessThan(3); // Less than 3x slower (more lenient)
    });

    it('should handle concurrent processing efficiently', async () => {
      const players = createMockPlayersArray(200);
      
      // Run multiple calculations concurrently
      const promises = Array.from({ length: 5 }, () => 
        Promise.resolve().then(() => {
          const start = performance.now();
          processPlayerData(players);
          return performance.now() - start;
        })
      );

      const times = await Promise.all(promises);
      const maxTime = Math.max(...times);

      // Concurrent processing shouldn't take too long
      expect(maxTime).toBeLessThan(1000);
    });
  });
}); 