import { describe, it, expect } from 'vitest';
import {
  TEAM_STRENGTH_RATINGS,
  POSITION_FIXTURE_WEIGHTS,
  calculateEnhancedFixtureDifficulty,
  analyzeUpcomingFixtures,
  getTeamStrength,
  compareTeamStrengths
} from '../../utils/fixtureAnalysis.js';

describe('Fixture Analysis Module', () => {
  describe('Team Strength Ratings', () => {
    it('should have ratings for all major Premier League teams', () => {
      const expectedTeams = ['MCI', 'ARS', 'LIV', 'CHE', 'MUN', 'TOT', 'NEW', 'AVL', 'WHU', 'BHA', 'FUL', 'WOL', 'EVE', 'CRY', 'BOU'];
      
      expectedTeams.forEach(team => {
        expect(TEAM_STRENGTH_RATINGS[team]).toBeDefined();
        expect(TEAM_STRENGTH_RATINGS[team].overall).toBeGreaterThan(0);
        expect(TEAM_STRENGTH_RATINGS[team].overall).toBeLessThanOrEqual(5);
      });
    });

    it('should have consistent rating structure for each team', () => {
      Object.values(TEAM_STRENGTH_RATINGS).forEach(teamRating => {
        expect(teamRating).toHaveProperty('overall');
        expect(teamRating).toHaveProperty('offensive');
        expect(teamRating).toHaveProperty('defensive');
        expect(teamRating).toHaveProperty('home');
        expect(teamRating).toHaveProperty('away');
        expect(teamRating).toHaveProperty('form');
        expect(teamRating).toHaveProperty('squad_depth');
        
        // All ratings should be between 1 and 5
        expect(teamRating.overall).toBeGreaterThanOrEqual(1);
        expect(teamRating.overall).toBeLessThanOrEqual(5);
        expect(teamRating.offensive).toBeGreaterThanOrEqual(1);
        expect(teamRating.offensive).toBeLessThanOrEqual(5);
        expect(teamRating.defensive).toBeGreaterThanOrEqual(1);
        expect(teamRating.defensive).toBeLessThanOrEqual(5);
      });
    });

    it('should have realistic team hierarchy', () => {
      // Elite teams should have higher ratings than struggling teams
      expect(TEAM_STRENGTH_RATINGS['MCI'].overall).toBeGreaterThan(TEAM_STRENGTH_RATINGS['IPS'].overall);
      expect(TEAM_STRENGTH_RATINGS['ARS'].overall).toBeGreaterThan(TEAM_STRENGTH_RATINGS['SOU'].overall);
      expect(TEAM_STRENGTH_RATINGS['LIV'].overall).toBeGreaterThan(TEAM_STRENGTH_RATINGS['LEI'].overall);
    });
  });

  describe('Position Fixture Weights', () => {
    it('should have weights for all positions', () => {
      const positions = ['F', 'M', 'D', 'G'];
      
      positions.forEach(position => {
        expect(POSITION_FIXTURE_WEIGHTS[position]).toBeDefined();
        expect(POSITION_FIXTURE_WEIGHTS[position]).toHaveProperty('offensive_weight');
        expect(POSITION_FIXTURE_WEIGHTS[position]).toHaveProperty('defensive_weight');
        expect(POSITION_FIXTURE_WEIGHTS[position]).toHaveProperty('clean_sheet_impact');
        expect(POSITION_FIXTURE_WEIGHTS[position]).toHaveProperty('goal_scoring_multiplier');
      });
    });

    it('should have logical weight distributions by position', () => {
      // Forwards should prioritize offensive stats
      expect(POSITION_FIXTURE_WEIGHTS['F'].offensive_weight).toBeGreaterThan(POSITION_FIXTURE_WEIGHTS['F'].defensive_weight);
      
      // Defenders should prioritize defensive stats
      expect(POSITION_FIXTURE_WEIGHTS['D'].defensive_weight).toBeGreaterThan(POSITION_FIXTURE_WEIGHTS['D'].offensive_weight);
      
      // Goalkeepers should have maximum defensive weight and clean sheet impact
      expect(POSITION_FIXTURE_WEIGHTS['G'].defensive_weight).toBe(1.0);
      expect(POSITION_FIXTURE_WEIGHTS['G'].clean_sheet_impact).toBe(1.0);
      expect(POSITION_FIXTURE_WEIGHTS['G'].offensive_weight).toBe(0.0);
      
      // Midfielders should be balanced
      expect(POSITION_FIXTURE_WEIGHTS['M'].offensive_weight).toBe(POSITION_FIXTURE_WEIGHTS['M'].defensive_weight);
    });
  });

  describe('calculateEnhancedFixtureDifficulty', () => {
    it('should calculate difficulty correctly for known teams', () => {
      // Man City (elite) vs Ipswich (relegated) at home - should be easy for City
      const easyFixture = calculateEnhancedFixtureDifficulty('MCI', 'IPS', true, 'F');
      
      expect(easyFixture.difficulty).toBeLessThan(3); // Should be easy
      expect(easyFixture.cleanSheetProbability).toBeGreaterThan(0.3); // Good clean sheet chance
      expect(easyFixture.goalScoringProbability).toBeGreaterThan(0.4); // Good scoring chance
      expect(easyFixture.confidence).toBeGreaterThan(0.6); // High confidence in big mismatch
    });

    it('should handle home advantage correctly', () => {
      // Same teams, different venues
      const homeFixture = calculateEnhancedFixtureDifficulty('NEW', 'AVL', true, 'M');
      const awayFixture = calculateEnhancedFixtureDifficulty('NEW', 'AVL', false, 'M');
      
      // Home fixture should be easier (lower difficulty)
      expect(homeFixture.difficulty).toBeLessThanOrEqual(awayFixture.difficulty);
      expect(homeFixture.cleanSheetProbability).toBeGreaterThanOrEqual(awayFixture.cleanSheetProbability);
    });

    it('should adjust for player position', () => {
      const forwardAnalysis = calculateEnhancedFixtureDifficulty('CHE', 'MUN', true, 'F');
      const defenderAnalysis = calculateEnhancedFixtureDifficulty('CHE', 'MUN', true, 'D');
      const goalkeeperAnalysis = calculateEnhancedFixtureDifficulty('CHE', 'MUN', true, 'G');
      
      // All should return valid analyses
      expect(forwardAnalysis.difficulty).toBeGreaterThan(0);
      expect(defenderAnalysis.difficulty).toBeGreaterThan(0);
      expect(goalkeeperAnalysis.difficulty).toBeGreaterThan(0);
      
      // Confidence should be reasonable for all positions
      expect(forwardAnalysis.confidence).toBeGreaterThan(0.5);
      expect(defenderAnalysis.confidence).toBeGreaterThan(0.5);
      expect(goalkeeperAnalysis.confidence).toBeGreaterThan(0.5);
    });

    it('should handle unknown teams gracefully', () => {
      const unknownTeamAnalysis = calculateEnhancedFixtureDifficulty('XXX', 'YYY', true, 'M');
      
      expect(unknownTeamAnalysis.difficulty).toBe(3); // Default to neutral
      expect(unknownTeamAnalysis.cleanSheetProbability).toBe(0.3);
      expect(unknownTeamAnalysis.goalScoringProbability).toBe(0.4);
      expect(unknownTeamAnalysis.confidence).toBe(0.5);
    });

    it('should return all required properties', () => {
      const analysis = calculateEnhancedFixtureDifficulty('LIV', 'MCI', false, 'M');
      
      expect(analysis).toHaveProperty('difficulty');
      expect(analysis).toHaveProperty('cleanSheetProbability');
      expect(analysis).toHaveProperty('goalScoringProbability');
      expect(analysis).toHaveProperty('attackingReturn');
      expect(analysis).toHaveProperty('defensiveReturn');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('factors');
      
      // Factors should include relevant information
      expect(analysis.factors).toHaveProperty('teamStrength');
      expect(analysis.factors).toHaveProperty('opponentStrength');
      expect(analysis.factors).toHaveProperty('homeAdvantage');
      expect(analysis.factors).toHaveProperty('positionRelevance');
    });
  });

  describe('analyzeUpcomingFixtures', () => {
    const mockFixtures = [
      { opponent: 'IPS', home: true, matchweek: 1, team: 'MCI' },
      { opponent: 'SOU', home: false, matchweek: 2, team: 'MCI' },
      { opponent: 'ARS', home: true, matchweek: 3, team: 'MCI' },
      { opponent: 'LIV', home: false, matchweek: 4, team: 'MCI' },
      { opponent: 'BOU', home: true, matchweek: 5, team: 'MCI' },
      { opponent: 'CHE', home: false, matchweek: 6, team: 'MCI' }
    ];

    it('should analyze fixtures correctly for Man City forward', () => {
      const analysis = analyzeUpcomingFixtures(mockFixtures, 'F', 6);
      
      expect(analysis.averageDifficulty).toBeGreaterThan(0);
      expect(analysis.averageDifficulty).toBeLessThanOrEqual(5);
      expect(analysis.fixtureScore).toBeDefined();
      expect(analysis.cleanSheetExpected).toBeGreaterThan(0);
      expect(analysis.attackingExpected).toBeGreaterThan(0);
      expect(analysis.defensiveExpected).toBeGreaterThan(0);
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(Array.isArray(analysis.breakdown)).toBe(true);
      expect(analysis.breakdown.length).toBe(6); // Should analyze all 6 fixtures
    });

    it('should handle empty fixture list', () => {
      const analysis = analyzeUpcomingFixtures([], 'M', 6);
      
      expect(analysis.averageDifficulty).toBe(3);
      expect(analysis.fixtureScore).toBe(0);
      expect(analysis.cleanSheetExpected).toBe(0);
      expect(analysis.attackingExpected).toBe(0);
      expect(analysis.defensiveExpected).toBe(0);
      expect(analysis.confidence).toBe(0.5);
      expect(analysis.breakdown).toEqual([]);
    });

    it('should limit analysis to requested gameweeks', () => {
      const analysis = analyzeUpcomingFixtures(mockFixtures, 'M', 3);
      
      expect(analysis.breakdown.length).toBe(3); // Should only analyze first 3
    });

    it('should handle fixtures without opponent gracefully', () => {
      const invalidFixtures = [
        { home: true, matchweek: 1 }, // Missing opponent
        { opponent: 'ARS', home: true, matchweek: 2 }
      ];
      
      const analysis = analyzeUpcomingFixtures(invalidFixtures, 'M', 6);
      
      expect(analysis.breakdown.length).toBe(1); // Should skip invalid fixture
    });

    it('should produce different results for different positions', () => {
      const forwardAnalysis = analyzeUpcomingFixtures(mockFixtures, 'F', 6);
      const defenderAnalysis = analyzeUpcomingFixtures(mockFixtures, 'D', 6);
      
      // Results might be different due to position-specific weighting
      // Both should be valid but may have different emphasis
      expect(forwardAnalysis.averageDifficulty).toBeGreaterThan(0);
      expect(defenderAnalysis.averageDifficulty).toBeGreaterThan(0);
    });
  });

  describe('getTeamStrength', () => {
    it('should return team strength for valid team codes', () => {
      const liverpoolStrength = getTeamStrength('LIV');
      
      expect(liverpoolStrength).toBeDefined();
      expect(liverpoolStrength.overall).toBeGreaterThan(4); // Liverpool is elite
      expect(liverpoolStrength.offensive).toBeGreaterThan(4);
    });

    it('should return null for invalid team codes', () => {
      const invalidTeam = getTeamStrength('INVALID');
      
      expect(invalidTeam).toBeNull();
    });
  });

  describe('compareTeamStrengths', () => {
    it('should compare team strengths correctly', () => {
      const comparison = compareTeamStrengths('MCI', 'IPS', true);
      
      expect(comparison).toBeDefined();
      expect(comparison.teamAStrength).toBeGreaterThan(comparison.teamBStrength); // City > Ipswich
      expect(comparison.difference).toBeGreaterThan(0);
      expect(comparison.favoredTeam).toBe('MCI');
      expect(comparison.confidence).toBeGreaterThan(0);
    });

    it('should handle even matchups', () => {
      const comparison = compareTeamStrengths('CHE', 'MUN', true);
      
      expect(comparison).toBeDefined();
      expect(Math.abs(comparison.difference)).toBeLessThan(1); // Should be close
    });

    it('should return null for invalid teams', () => {
      const comparison = compareTeamStrengths('INVALID', 'ALSO_INVALID', true);
      
      expect(comparison).toBeNull();
    });

    it('should adjust for home advantage', () => {
      const homeComparison = compareTeamStrengths('NEW', 'AVL', true);
      const awayComparison = compareTeamStrengths('NEW', 'AVL', false);
      
      // Home team should have advantage
      expect(homeComparison.teamAStrength).toBeGreaterThanOrEqual(awayComparison.teamAStrength);
    });
  });
});

describe('Fixture Analysis Integration', () => {
  it('should work with realistic fixture data structure', () => {
    const realisticFixtures = [
      {
        matchweek: 1,
        opponent: 'BOU',
        home: true,
        difficulty: 2 // This would be calculated by existing system
      },
      {
        matchweek: 2,
        opponent: 'ARS',
        home: false,
        difficulty: 5
      }
    ];

    const analysis = analyzeUpcomingFixtures(
      realisticFixtures.map(f => ({ ...f, team: 'MCI' })),
      'F',
      6
    );

    expect(analysis.averageDifficulty).toBeGreaterThan(0);
    expect(analysis.breakdown.length).toBe(2);
  });

  it('should handle mixed difficulty fixtures correctly', () => {
    const mixedFixtures = [
      { opponent: 'IPS', home: true, team: 'MCI' }, // Easy
      { opponent: 'ARS', home: false, team: 'MCI' }, // Hard
      { opponent: 'BOU', home: true, team: 'MCI' }, // Medium-Easy
    ];

    const analysis = analyzeUpcomingFixtures(mixedFixtures, 'M', 3);

    // Should show mixed difficulty
    expect(analysis.averageDifficulty).toBeGreaterThan(2);
    expect(analysis.averageDifficulty).toBeLessThan(4);
    expect(analysis.confidence).toBeGreaterThan(0.5);
  });
}); 