import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSkills, fetchSkillsByAgentId } from './useSkills';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useSkills', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('initializes idle state when agentId is missing', () => {
    const { result } = renderHook(() => useSkills(undefined));

    expect(result.current).toMatchObject({ skills: [], loading: false, error: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches skills successfully', async () => {
    const payload = {
      data: [{ name: 'test-skill', description: 'Test description', attributes: { key: 'value' } }],
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => payload });

    const { result } = renderHook(() => useSkills('agent-1'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.skills).toEqual(payload.data);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/agents/agent-1/skills');
  });

  it('falls back to empty skills when response data is missing', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useSkills('agent-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.skills).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('handles API error responses', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: 'Not Found' });

    const { result } = renderHook(() => useSkills('agent-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.skills).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch skills: Not Found');
  });

  it('handles non-Error throw values', async () => {
    mockFetch.mockRejectedValueOnce('network down');

    const { result } = renderHook(() => useSkills('agent-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.skills).toEqual([]);
    expect(result.current.error).toBe('Unknown error occurred');
  });

  it('refetches when refetch is called', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [{ name: 'a', attributes: {} }] }) });

    const { result } = renderHook(() => useSkills('agent-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    act(() => result.current.refetch());
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('resets state when agent changes to undefined', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ name: 'a', attributes: {} }] }) });

    const { result, rerender } = renderHook(({ agentId }) => useSkills(agentId), {
      initialProps: { agentId: 'agent-1' as string | undefined },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.skills).toHaveLength(1);

    rerender({ agentId: undefined });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.skills).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchSkillsByAgentId', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns parsed skills and defaults to empty list when missing', async () => {
    const payload = { data: [{ name: 'test-skill', attributes: {} }] };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => payload });
    await expect(fetchSkillsByAgentId('agent-1')).resolves.toEqual(payload.data);

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(fetchSkillsByAgentId('agent-1')).resolves.toEqual([]);
  });

  it('throws on bad response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: 'Server Error' });

    await expect(fetchSkillsByAgentId('agent-1')).rejects.toThrow('Failed to fetch skills: Server Error');
  });
});
