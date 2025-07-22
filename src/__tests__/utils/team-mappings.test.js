import { describe, it, expect } from 'vitest';
import { fplDataTeamMapping } from '../../utils/constants.js';
import { fetchFixtures } from '../../utils/dataProcessing.js';

describe('Team Mappings', () => {
  describe('fplDataTeamMapping', () => {
    it('should map Manchester United variations correctly', () => {
      expect(fplDataTeamMapping['Manchester United']).toBe('MUN');
      expect(fplDataTeamMapping['Manchester Utd']).toBe('MUN');
    });

    it('should map Newcastle United variations correctly', () => {
      expect(fplDataTeamMapping['Newcastle United']).toBe('NEW');
      expect(fplDataTeamMapping['Newcastle Utd']).toBe('NEW');
      expect(fplDataTeamMapping['Newcastle']).toBe('NEW');
    });

    it('should map all major team variations', () => {
      // Test commonly abbreviated team names from player data
      expect(fplDataTeamMapping['Brighton']).toBe('BHA');
      expect(fplDataTeamMapping['Brighton & Hove Albion']).toBe('BHA');
      expect(fplDataTeamMapping['Tottenham']).toBe('TOT');
      expect(fplDataTeamMapping['Tottenham Hotspur']).toBe('TOT');
      expect(fplDataTeamMapping['West Ham']).toBe('WHU');
      expect(fplDataTeamMapping['West Ham United']).toBe('WHU');
      expect(fplDataTeamMapping['Wolves']).toBe('WOL');
      expect(fplDataTeamMapping['Wolverhampton Wanderers']).toBe('WOL');
      expect(fplDataTeamMapping['Nott\'ham Forest']).toBe('NFO');
      expect(fplDataTeamMapping['Nottingham Forest']).toBe('NFO');
    });

    it('should cover all teams that appear in player data', () => {
      // These are the exact team names from our player data analysis
      const playerDataTeams = [
        'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
        'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
        'Leicester City', 'Liverpool', 'Manchester City', 'Manchester Utd',
        'Newcastle Utd', 'Nott\'ham Forest', 'Southampton', 'Tottenham',
        'West Ham', 'Wolves'
      ];

      playerDataTeams.forEach(team => {
        expect(fplDataTeamMapping[team]).toBeDefined();
        expect(fplDataTeamMapping[team]).toMatch(/^[A-Z]{3}$/);
      });
    });
  });

  describe('fetchFixtures team mapping', () => {
    it('should process fixtures for teams with mapping issues', () => {
      const mockFixtureData = {
        fixtures: [
          {
            matchweek: 1,
            homeTeam: 'Manchester United',
            awayTeam: 'Arsenal',
            date: '2025-08-16',
            time: '15:00'
          },
          {
            matchweek: 1,
            homeTeam: 'Liverpool',
            awayTeam: 'Newcastle United',
            date: '2025-08-16',
            time: '17:30'
          },
          {
            matchweek: 2,
            homeTeam: 'Brighton & Hove Albion',
            awayTeam: 'Tottenham Hotspur',
            date: '2025-08-23',
            time: '15:00'
          }
        ]
      };

      const result = fetchFixtures(mockFixtureData);

      // Verify Manchester United fixtures are processed
      expect(result['MUN']).toBeDefined();
      expect(result['MUN'].length).toBeGreaterThan(0);
      expect(result['MUN'][0]).toMatchObject({
        matchweek: 1,
        opponent: 'ARS',
        home: true,
        difficulty: expect.any(Number)
      });

      // Verify Newcastle United fixtures are processed
      expect(result['NEW']).toBeDefined();
      expect(result['NEW'].length).toBeGreaterThan(0);
      expect(result['NEW'][0]).toMatchObject({
        matchweek: 1,
        opponent: 'LIV',
        home: false,
        difficulty: expect.any(Number)
      });

      // Verify Brighton & Hove Albion fixtures are processed
      expect(result['BHA']).toBeDefined();
      expect(result['BHA'].length).toBeGreaterThan(0);
      expect(result['BHA'][0]).toMatchObject({
        matchweek: 2,
        opponent: 'TOT',
        home: true,
        difficulty: expect.any(Number)
      });
    });

    it('should handle team name variations gracefully', () => {
      const mockFixtureData = {
        fixtures: [
          {
            matchweek: 1,
            homeTeam: 'AFC Bournemouth',
            awayTeam: 'Wolves',
            date: '2025-08-16',
            time: '15:00'
          },
          {
            matchweek: 1,
            homeTeam: 'Nott\'ham Forest',
            awayTeam: 'West Ham',
            date: '2025-08-16',
            time: '17:30'
          }
        ]
      };

      const result = fetchFixtures(mockFixtureData);

      // Should map AFC Bournemouth to BOU
      expect(result['BOU']).toBeDefined();
      expect(result['BOU'][0]).toMatchObject({
        opponent: 'WOL',
        home: true
      });

      // Should map Wolves to WOL
      expect(result['WOL']).toBeDefined();
      expect(result['WOL'][0]).toMatchObject({
        opponent: 'BOU',
        home: false
      });

      // Should map Nott'ham Forest to NFO
      expect(result['NFO']).toBeDefined();
      expect(result['NFO'][0]).toMatchObject({
        opponent: 'WHU',
        home: true
      });
    });

    it('should generate difficulty scores for all fixtures', () => {
      const mockFixtureData = {
        fixtures: [
          {
            matchweek: 1,
            homeTeam: 'Brighton',
            awayTeam: 'Manchester City',
            date: '2025-08-16',
            time: '15:00'
          }
        ]
      };

      const result = fetchFixtures(mockFixtureData);

      // Brighton (home) vs Man City (away) - should have high difficulty for Brighton
      expect(result['BHA'][0].difficulty).toBeGreaterThanOrEqual(1);
      expect(result['BHA'][0].difficulty).toBeLessThanOrEqual(5);
      
      // Man City (away) vs Brighton (home) - should have lower difficulty for City
      expect(result['MCI'][0].difficulty).toBeGreaterThanOrEqual(1);
      expect(result['MCI'][0].difficulty).toBeLessThanOrEqual(5);
      
      // City should have easier fixture than Brighton
      expect(result['MCI'][0].difficulty).toBeLessThan(result['BHA'][0].difficulty);
    });
  });
}); 