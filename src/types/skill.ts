export interface SkillAttribute {
  name: string;
  value: string | number | boolean;
}

export interface Skill {
  name: string;
  description?: string;
  attributes: Record<string, unknown>;
}

export interface SkillsResponse {
  data: Skill[];
}

export interface SkillsState {
  skills: Skill[];
  loading: boolean;
  error: string | null;
}
