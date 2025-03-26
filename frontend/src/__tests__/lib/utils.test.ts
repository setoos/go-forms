import { describe, it, expect } from 'vitest';
import { calculateScore, getScoreResponse } from '../../lib/utils';

describe('Quiz Utilities', () => {
  describe('calculateScore', () => {
    it('should calculate total score correctly', () => {
      const answers = { '1': 10, '2': 5, '3': 8 };
      expect(calculateScore(answers)).toBe(23);
    });

    it('should handle empty answers', () => {
      expect(calculateScore({})).toBe(0);
    });

    it('should handle negative scores', () => {
      const answers = { '1': -5, '2': 10 };
      expect(calculateScore(answers)).toBe(5);
    });
  });

  describe('getScoreResponse', () => {
    it('should return excellent response for high scores', () => {
      const response = getScoreResponse(85);
      expect(response.message).toContain('Excellent');
    });

    it('should return good response for medium scores', () => {
      const response = getScoreResponse(65);
      expect(response.message).toContain('Good');
    });

    it('should return needs improvement response for low scores', () => {
      const response = getScoreResponse(35);
      expect(response.message).toContain('Needs improvement');
    });

    it('should return guidance response for very low scores', () => {
      const response = getScoreResponse(15);
      expect(response.message).toContain('You need guidance');
    });
  });
});