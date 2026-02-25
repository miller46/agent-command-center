import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSkills, fetchSkillsByAgentId } from './useSkills';
import { getMockSkills } from '../data/mockSkills';

// Mock the mockSkills module
vi.mock('../data/mockSkills', () => ({
  getMockSkills: vi.fn(),
}));

describe('useSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useSkills hook', () => {
    it('should initialize with empty state when no agentId is provided', () => {
      const { result } = renderHook(() => useSkills(undefined));

      expect(result.current.skills).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch skills successfully', async () => {
      const mockSkillData = [
        {
          name: 'test-skill',
          description: 'Test description',
          attributes: { key: 'value' },
        },
      ];
      vi.mocked(getMockSkills).mockReturnValue(mockSkillData);

      const { result } = renderHook(() => useSkills('agent-1'));

      // Should start loading
      expect(result.current.loading).toBe(true);

      // Advance timers to complete the mock delay
      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual(mockSkillData);
      expect(result.current.error).toBeNull();
      expect(getMockSkills).toHaveBeenCalledWith('agent-1');
    });

    it('should handle empty skills response', async () => {
      vi.mocked(getMockSkills).mockReturnValue([]);

      const { result } = renderHook(() => useSkills('agent-1'));

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should refetch when refetch is called', async () => {
      const mockSkillData = [
        {
          name: 'test-skill',
          description: 'Test description',
          attributes: {},
        },
      ];
      vi.mocked(getMockSkills).mockReturnValue(mockSkillData);

      const { result } = renderHook(() => useSkills('agent-1'));

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock to track next call
      vi.mocked(getMockSkills).mockClear();
      vi.mocked(getMockSkills).mockReturnValue(mockSkillData);

      // Refetch
      await act(async () => {
        result.current.refetch();
      });

      // Wait for loading state to update
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMockSkills).toHaveBeenCalledTimes(1);
    });

    it('should update when agentId changes', async () => {
      const mockSkills1 = [{ name: 'skill-1', attributes: {} }];
      const mockSkills2 = [{ name: 'skill-2', attributes: {} }];

      vi.mocked(getMockSkills)
        .mockReturnValueOnce(mockSkills1)
        .mockReturnValueOnce(mockSkills2);

      const { result, rerender } = renderHook(
        ({ agentId }) => useSkills(agentId),
        { initialProps: { agentId: 'agent-1' } }
      );

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(result.current.skills).toEqual(mockSkills1);
      });

      // Change agentId
      rerender({ agentId: 'agent-2' });

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(() => {
        expect(result.current.skills).toEqual(mockSkills2);
      });
    });
  });

  describe('fetchSkillsByAgentId', () => {
    it('should fetch skills by agent ID', async () => {
      const mockSkillData = [
        {
          name: 'test-skill',
          description: 'Test description',
          attributes: {},
        },
      ];
      vi.mocked(getMockSkills).mockReturnValue(mockSkillData);

      const promise = fetchSkillsByAgentId('agent-1');
      await vi.advanceTimersByTimeAsync(500);

      const result = await promise;

      expect(result).toEqual(mockSkillData);
      expect(getMockSkills).toHaveBeenCalledWith('agent-1');
    });
  });
});
