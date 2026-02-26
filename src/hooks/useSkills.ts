import { useState, useEffect, useCallback } from 'react';
import type { Skill, SkillsState } from '../types/skill';

const API_BASE_URL = '/api/v1';

export const useSkills = (agentId: string | undefined) => {
  const [state, setState] = useState<SkillsState>({
    skills: [],
    loading: false,
    error: null,
  });

  const fetchSkills = useCallback(async () => {
    if (!agentId) {
      setState({ skills: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/agents/${agentId}/skills`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch skills: ${response.statusText}`);
      }

      const data = await response.json();
      setState({ skills: data.data || [], loading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState({ skills: [], loading: false, error: errorMessage });
    }
  }, [agentId]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const refetch = useCallback(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    ...state,
    refetch,
  };
};

// Direct API function for non-hook usage
export const fetchSkillsByAgentId = async (agentId: string): Promise<Skill[]> => {
  const response = await fetch(`${API_BASE_URL}/agents/${agentId}/skills`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch skills: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
};
