import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSkills, fetchSkillsByAgentId } from './useSkills';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSkills hook', () => {
    it('should initialize with empty state when no agentId is provided', () => {
      const { result } = renderHook(() => useSkills(undefined));

      expect(result.current.skills).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch skills successfully', async () => {
      const mockSkillData = {
        data: [
          {
            name: 'test-skill',
            description: 'Test description',
            attributes: { key: 'value' },
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkillData,
      });

      const { result } = renderHook(() => useSkills('agent-1'));

      // Should start loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual(mockSkillData.data);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/agents/agent-1/skills');
    });

    it('should handle empty skills response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { result } = renderHook(() => useSkills('agent-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useSkills('agent-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch skills: Not Found');
    });

    it('should refetch when refetch is called', async () => {
      const mockSkillData = {
        data: [
          {
            name: 'test-skill',
            description: 'Test description',
            attributes: {},
          },
        ],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSkillData,
      });

      const { result } = renderHook(() => useSkills('agent-1'));

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Refetch
      act(() => {
        result.current.refetch();
      });

      // Wait for second fetch to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(result.current.skills).toEqual(mockSkillData.data);
    });
  });

  describe('fetchSkillsByAgentId', () => {
    it('should fetch skills by agent ID', async () => {
      const mockSkillData = {
        data: [
          {
            name: 'test-skill',
            description: 'Test description',
            attributes: {},
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkillData,
      });

      const result = await fetchSkillsByAgentId('agent-1');

      expect(result).toEqual(mockSkillData.data);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/agents/agent-1/skills');
    });

    it('should throw on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
      });

      await expect(fetchSkillsByAgentId('agent-1')).rejects.toThrow(
        'Failed to fetch skills: Server Error'
      );
    });
  });
});
