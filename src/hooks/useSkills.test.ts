import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSkills, fetchSkillsByAgentId } from './useSkills';

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
    it('initializes with empty state when no agentId is provided', () => {
      const { result } = renderHook(() => useSkills(undefined));

      expect(result.current.skills).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('fetches skills successfully', async () => {
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

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual(mockSkillData.data);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/agents/agent-1/skills');
    });

    it('defaults to empty skills when response has no data array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ meta: { source: 'test' } }),
      });

      const { result } = renderHook(() => useSkills('agent-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('handles API error responses', async () => {
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

    it('handles network failures with fallback message', async () => {
      mockFetch.mockRejectedValueOnce('network-down');

      const { result } = renderHook(() => useSkills('agent-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual([]);
      expect(result.current.error).toBe('Unknown error occurred');
    });

    it('refetches when refetch is called', async () => {
      const mockSkillData = {
        data: [{ name: 'test-skill', description: 'Test description', attributes: {} }],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSkillData,
      });

      const { result } = renderHook(() => useSkills('agent-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(result.current.skills).toEqual(mockSkillData.data);
    });

    it('resets state when agent changes to undefined', async () => {
      const mockSkillData = {
        data: [{ name: 'test-skill', description: 'Test description', attributes: {} }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkillData,
      });

      const { result, rerender } = renderHook(({ agentId }) => useSkills(agentId), {
        initialProps: { agentId: 'agent-1' as string | undefined },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.skills).toEqual(mockSkillData.data);

      rerender({ agentId: undefined });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.skills).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchSkillsByAgentId', () => {
    it('fetches skills by agent ID', async () => {
      const mockSkillData = {
        data: [{ name: 'test-skill', description: 'Test description', attributes: {} }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkillData,
      });

      const result = await fetchSkillsByAgentId('agent-1');

      expect(result).toEqual(mockSkillData.data);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/agents/agent-1/skills');
    });

    it('returns empty list when response has no data field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ foo: 'bar' }),
      });

      const result = await fetchSkillsByAgentId('agent-1');

      expect(result).toEqual([]);
    });

    it('throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
      });

      await expect(fetchSkillsByAgentId('agent-1')).rejects.toThrow('Failed to fetch skills: Server Error');
    });
  });
});
