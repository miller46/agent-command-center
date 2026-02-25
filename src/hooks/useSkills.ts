import { useState, useEffect, useCallback } from 'react';
import type { Skill, SkillsState } from '../types/skill';
import { getMockSkills } from '../data/mockSkills';

const API_BASE_URL = '/api/v1';
const USE_MOCK = true; // Set to false when backend endpoint is ready

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
      if (USE_MOCK) {
        // Simulate network delay for realistic loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        const skills = getMockSkills(agentId);
        setState({ skills, loading: false, error: null });
      } else {
        const response = await fetch(`${API_BASE_URL}/agents/${agentId}/skills`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch skills: ${response.statusText}`);
        }

        const data = await response.json();
        setState({ skills: data.data || [], loading: false, error: null });
      }
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
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockSkills(agentId);
  }

  const response = await fetch(`${API_BASE_URL}/agents/${agentId}/skills`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch skills: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
};
