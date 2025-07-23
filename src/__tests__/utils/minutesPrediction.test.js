import { describe, it, expect } from 'vitest';
import {
  POSITION_AGE_CURVES,
  TEAM_DEPTH_FACTORS,
  PLAYING_STYLE_FACTORS,
  INJURY_RISK_FACTORS,
  getTeamDepthCategory,
  getAgeFactor,
  calculateCompetitionFactor,
  predictPlayerMinutes,
  adjustPlayerForPredictedMinutes,
  batchPredictMinutes
} from '../../utils/minutesPrediction.js';

describe('Minutes Prediction Model', () => {
  describe('Position Age Curves', () => {
    it('should have age curves for all positions', () => {
      const positions = ['F', 'M', 'D', 'G'];
      
      positions.forEach(position => {
        expect(POSITION_AGE_CURVES[position]).toBeDefined();
        expect(POSITION_AGE_CURVES[position]).toHaveProperty('peakAge');
        expect(POSITION_AGE_CURVES[position]).toHaveProperty('peakMinutes');
        expect(POSITION_AGE_CURVES[position]).toHaveProperty('ageFactors');
      });
    });

    it('should have realistic peak ages by position', () => {
      // Goalkeepers should peak latest
      expect(POSITION_AGE_CURVES['G'].peakAge).toBeGreaterThan(POSITION_AGE_CURVES['F'].peakAge);
      
      // Defenders should peak later than forwards
      expect(POSITION_AGE_CURVES['D'].peakAge).toBeGreaterThan(POSITION_AGE_CURVES['F'].peakAge);
    });

    it('should have age factors that peak at the specified age', () => {
      Object.entries(POSITION_AGE_CURVES).forEach(([_position, curve]) => {
        const peakAge = curve.peakAge;
        const peakFactor = curve.ageFactors[peakAge];
        
        // Peak age should have one of the highest factors
        const allFactors = Object.values(curve.ageFactors);
        const maxFactor = Math.max(...allFactors);
        
        expect(peakFactor).toBeGreaterThanOrEqual(maxFactor * 0.98); // Within 2% of max
      });
    });

    it('should show decline with age', () => {
      Object.entries(POSITION_AGE_CURVES).forEach(([_position, curve]) => {
        const factor25 = curve.ageFactors[25];
        const factor35 = curve.ageFactors[35];
        
        // 35-year-old should have lower factor than 25-year-old
        expect(factor35).toBeLessThan(factor25);
      });
    });
  });

  describe('Team Depth Factors', () => {
    it('should categorize teams correctly', () => {
      // Elite teams should have lower depth multipliers (more competition)
      expect(TEAM_DEPTH_FACTORS.elite.depthMultiplier).toBeLessThan(TEAM_DEPTH_FACTORS.weak.depthMultiplier);
      
      // Should include major teams in appropriate categories
      expect(TEAM_DEPTH_FACTORS.elite.teamCodes).toContain('MCI');
      expect(TEAM_DEPTH_FACTORS.weak.teamCodes).toContain('IPS');
    });

    it('should have all required properties', () => {
      Object.values(TEAM_DEPTH_FACTORS).forEach(category => {
        expect(category).toHaveProperty('teamCodes');
        expect(category).toHaveProperty('depthMultiplier');
        expect(category).toHaveProperty('competitionFactor');
        expect(Array.isArray(category.teamCodes)).toBe(true);
      });
    });
  });

  describe('getTeamDepthCategory', () => {
    it('should return correct category for known teams', () => {
      const cityCategory = getTeamDepthCategory('MCI');
      expect(cityCategory.category).toBe('elite');
      
      const ipswichCategory = getTeamDepthCategory('IPS');
      expect(ipswichCategory.category).toBe('weak');
    });

    it('should return default category for unknown teams', () => {
      const unknownCategory = getTeamDepthCategory('UNKNOWN');
      expect(unknownCategory.category).toBe('mid');
    });

    it('should include all depth factor properties', () => {
      const category = getTeamDepthCategory('MCI');
      expect(category).toHaveProperty('depthMultiplier');
      expect(category).toHaveProperty('competitionFactor');
    });
  });

  describe('getAgeFactor', () => {
    it('should return correct factors for known ages and positions', () => {
      // Test peak ages
      const forwardPeak = getAgeFactor(26, 'F');
      const goalkeeperPeak = getAgeFactor(29, 'G');
      
      expect(forwardPeak).toBeGreaterThan(0.9);
      expect(goalkeeperPeak).toBeGreaterThan(0.9);
    });

    it('should handle young players appropriately', () => {
      const youngForward = getAgeFactor(19, 'F');
      const youngGoalkeeper = getAgeFactor(19, 'G');
      
      // Young forwards should get more minutes than young goalkeepers
      expect(youngForward).toBeGreaterThan(youngGoalkeeper);
    });

    it('should handle old players appropriately', () => {
      const oldForward = getAgeFactor(35, 'F');
      const oldGoalkeeper = getAgeFactor(35, 'G');
      
      // Old goalkeepers should retain more value than old forwards
      expect(oldGoalkeeper).toBeGreaterThan(oldForward);
    });

    it('should handle invalid positions gracefully', () => {
      const invalidPosition = getAgeFactor(25, 'INVALID');
      expect(invalidPosition).toBe(0.80); // Default conservative value
    });

    it('should clamp extreme ages', () => {
      const tooYoung = getAgeFactor(15, 'F');
      const tooOld = getAgeFactor(45, 'F');
      
      expect(tooYoung).toBeGreaterThan(0);
      expect(tooOld).toBeGreaterThan(0);
    });
  });

  describe('calculateCompetitionFactor', () => {
    const mockPlayers = {
      elite: { historicalPoints: 250, name: 'Elite Player' },
      good: { historicalPoints: 180, name: 'Good Player' },
      average: { historicalPoints: 120, name: 'Average Player' },
      poor: { historicalPoints: 40, name: 'Poor Player' }
    };

    it('should give higher factors for better players', () => {
      const eliteFactor = calculateCompetitionFactor(mockPlayers.elite, 'MCI');
      const averageFactor = calculateCompetitionFactor(mockPlayers.average, 'MCI');
      
      expect(eliteFactor).toBeGreaterThan(averageFactor);
    });

    it('should be more forgiving on weaker teams', () => {
      const averageOnElite = calculateCompetitionFactor(mockPlayers.average, 'MCI');
      const averageOnWeak = calculateCompetitionFactor(mockPlayers.average, 'IPS');
      
      expect(averageOnWeak).toBeGreaterThan(averageOnElite);
    });

    it('should handle unknown teams gracefully', () => {
      const factor = calculateCompetitionFactor(mockPlayers.good, 'UNKNOWN');
      expect(factor).toBe(1.0);
    });

    it('should return reasonable factors', () => {
      const factor = calculateCompetitionFactor(mockPlayers.good, 'CHE');
      expect(factor).toBeGreaterThan(0.5);
      expect(factor).toBeLessThan(2.0);
    });
  });

  describe('predictPlayerMinutes', () => {
    const mockPlayers = {
      youngStar: {
        name: 'Young Star',
        age: 22,
        position: 'F',
        team: 'MCI',
        minutes: 2500,
        historicalPoints: 180
      },
      peakPlayer: {
        name: 'Peak Player',
        age: 27,
        position: 'M',
        team: 'AVL',
        minutes: 3000,
        historicalPoints: 300
      },
      agingPlayer: {
        name: 'Aging Player',
        age: 33,
        position: 'D',
        team: 'BOU',
        minutes: 2200,
        historicalPoints: 200
      },
      goalkeeper: {
        name: 'Goalkeeper',
        age: 28,
        position: 'G',
        team: 'LIV',
        minutes: 3200,
        historicalPoints: 250
      }
    };

    it('should predict reasonable minutes for peak players', () => {
      const prediction = predictPlayerMinutes(mockPlayers.peakPlayer);
      
      expect(prediction.predictedMinutes).toBeGreaterThan(1500);
      expect(prediction.minutesPerGame).toBeGreaterThan(40);
      expect(prediction.confidence).toBeGreaterThan(0.5);
      expect(prediction.playingStatus).toBeDefined();
    });

    it('should penalize players on strong teams appropriately', () => {
      const youngStarPrediction = predictPlayerMinutes(mockPlayers.youngStar);
      
      // Young star on City should have reduced minutes due to competition (180 pts vs elite team)
      expect(youngStarPrediction.predictedMinutes).toBeGreaterThan(1200);
      expect(youngStarPrediction.predictedMinutes).toBeLessThan(2000); // Show penalty is working
      expect(youngStarPrediction.confidence).toBeGreaterThan(0.4);
    });

    it('should handle aging players correctly', () => {
      const agingPrediction = predictPlayerMinutes(mockPlayers.agingPlayer);
      
      // Aging player should have reduced minutes
      expect(agingPrediction.predictedMinutes).toBeLessThan(3000);
      expect(['starter', 'regular', 'rotation', 'fringe']).toContain(agingPrediction.playingStatus);
    });

    it('should handle goalkeepers with higher minutes', () => {
      const gkPrediction = predictPlayerMinutes(mockPlayers.goalkeeper);
      
      // Goalkeepers typically play more minutes when they start
      expect(gkPrediction.predictedMinutes).toBeGreaterThan(2000);
    });

    it('should return all required properties', () => {
      const prediction = predictPlayerMinutes(mockPlayers.peakPlayer);
      
      expect(prediction).toHaveProperty('predictedMinutes');
      expect(prediction).toHaveProperty('minutesPerGame');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('playingStatus');
      expect(prediction).toHaveProperty('factors');
      expect(prediction).toHaveProperty('analysis');
    });

    it('should handle invalid player data gracefully', () => {
      const invalidPlayer = { name: 'Invalid' };
      const prediction = predictPlayerMinutes(invalidPlayer);
      
      expect(prediction.confidence).toBe(0.3);
      expect(prediction.factors).toHaveProperty('error');
    });

    it('should handle European competition option', () => {
      const baseMinutes = predictPlayerMinutes(mockPlayers.peakPlayer);
      const europeanMinutes = predictPlayerMinutes(mockPlayers.peakPlayer, { includeEuropeanCompetition: true });
      
      expect(europeanMinutes.predictedMinutes).toBeGreaterThan(baseMinutes.predictedMinutes);
    });
  });

  describe('adjustPlayerForPredictedMinutes', () => {
    const mockPlayer = {
      name: 'Test Player',
      historicalPoints: 300,
      minutes: 2500,
      fp90: 10.8
    };

    const mockPrediction = {
      predictedMinutes: 3000,
      minutesPerGame: 79,
      confidence: 0.8,
      playingStatus: 'starter'
    };

    it('should adjust points correctly for increased minutes', () => {
      const adjusted = adjustPlayerForPredictedMinutes(mockPlayer, mockPrediction);
      
      expect(adjusted.adjustedPoints).toBeGreaterThan(mockPlayer.historicalPoints);
      expect(adjusted.minutesMultiplier).toBeGreaterThan(1.0);
      expect(adjusted.confidence).toBe(0.8);
    });

    it('should penalize very low minutes predictions', () => {
      const lowMinutesPrediction = {
        predictedMinutes: 800,
        minutesPerGame: 21,
        confidence: 0.7,
        playingStatus: 'fringe'
      };
      
      const adjusted = adjustPlayerForPredictedMinutes(mockPlayer, lowMinutesPrediction);
      
      expect(adjusted.adjustedPoints).toBeLessThan(mockPlayer.historicalPoints);
    });

    it('should handle missing data gracefully', () => {
      const incompletePlayer = { name: 'Incomplete' };
      const incompletePrediction = { predictedMinutes: 0 };
      
      const adjusted = adjustPlayerForPredictedMinutes(incompletePlayer, incompletePrediction);
      
      expect(adjusted.adjustedPoints).toBe(0);
      expect(adjusted.confidence).toBe(0.5);
    });

    it('should return all required properties', () => {
      const adjusted = adjustPlayerForPredictedMinutes(mockPlayer, mockPrediction);
      
      expect(adjusted).toHaveProperty('adjustedPoints');
      expect(adjusted).toHaveProperty('adjustedPP90');
      expect(adjusted).toHaveProperty('minutesMultiplier');
      expect(adjusted).toHaveProperty('confidence');
      expect(adjusted).toHaveProperty('playingStatus');
    });
  });

  describe('batchPredictMinutes', () => {
    const mockPlayers = [
      {
        name: 'Player 1',
        age: 25,
        position: 'F',
        team: 'MCI',
        minutes: 2000,
        historicalPoints: 300
      },
      {
        name: 'Player 2',
        age: 30,
        position: 'M',
        team: 'IPS',
        minutes: 2800,
        historicalPoints: 200
      }
    ];

    it('should process multiple players correctly', () => {
      const results = batchPredictMinutes(mockPlayers);
      
      expect(results.length).toBe(2);
      expect(results[0]).toHaveProperty('minutesPrediction');
      expect(results[0]).toHaveProperty('adjustedStats');
      expect(results[0]).toHaveProperty('projectedMinutes');
      expect(results[0]).toHaveProperty('projectedPoints');
    });

    it('should handle empty array', () => {
      const results = batchPredictMinutes([]);
      expect(results).toEqual([]);
    });

    it('should handle invalid input gracefully', () => {
      const results = batchPredictMinutes('not an array');
      expect(results).toEqual([]);
    });

    it('should handle players with errors gracefully', () => {
      const playersWithErrors = [
        { name: 'Valid Player', age: 25, position: 'F', team: 'MCI', minutes: 2000, historicalPoints: 300 },
        { name: 'Invalid Player' } // Missing required fields
      ];
      
      const results = batchPredictMinutes(playersWithErrors);
      
      expect(results.length).toBe(2);
      expect(results[1]).toHaveProperty('minutesPrediction');
      expect(results[1].minutesPrediction.confidence).toBe(0.3); // Fallback confidence
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent results across functions', () => {
      const player = {
        name: 'Integration Test Player',
        age: 26,
        position: 'M',
        team: 'CHE',
        minutes: 2400,
        historicalPoints: 280
      };

      const prediction = predictPlayerMinutes(player);
      const adjusted = adjustPlayerForPredictedMinutes(player, prediction);

      // Consistency checks
      expect(prediction.confidence).toBeGreaterThanOrEqual(0.4);
      expect(prediction.confidence).toBeLessThanOrEqual(0.95);
      expect(adjusted.confidence).toBe(prediction.confidence);
      expect(adjusted.playingStatus).toBe(prediction.playingStatus);
    });

    it('should show logical relationships between different player types', () => {
      const eliteYoungPlayer = {
        name: 'Elite Young',
        age: 23,
        position: 'F',
        team: 'MCI',
        minutes: 2800,
        historicalPoints: 500
      };

      const averageOldPlayer = {
        name: 'Average Old',
        age: 34,
        position: 'F',
        team: 'MCI',
        minutes: 1800,
        historicalPoints: 150
      };

      const elitePrediction = predictPlayerMinutes(eliteYoungPlayer);
      const averagePrediction = predictPlayerMinutes(averageOldPlayer);

      // Elite young player should be predicted to play more than average old player
      expect(elitePrediction.predictedMinutes).toBeGreaterThan(averagePrediction.predictedMinutes);
      expect(elitePrediction.confidence).toBeGreaterThan(averagePrediction.confidence);
    });

    it('should handle extreme cases appropriately', () => {
      const extremeCases = [
        { name: 'Very Young', age: 18, position: 'F', team: 'MCI', minutes: 100, historicalPoints: 50 },
        { name: 'Very Old', age: 37, position: 'F', team: 'IPS', minutes: 1000, historicalPoints: 80 },
        { name: 'Elite on Weak Team', age: 25, position: 'F', team: 'IPS', minutes: 3200, historicalPoints: 200 }
      ];

      extremeCases.forEach(player => {
        const prediction = predictPlayerMinutes(player);
        
        expect(prediction.predictedMinutes).toBeGreaterThanOrEqual(0);
        expect(prediction.minutesPerGame).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeGreaterThan(0.3);
        expect(['starter', 'regular', 'rotation', 'fringe']).toContain(prediction.playingStatus);
      });
    });
  });
}); 