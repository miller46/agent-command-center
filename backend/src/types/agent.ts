export type AgentStatus = "idle" | "busy" | "error";

export interface AgentIdentity {
  name?: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

export interface AgentSummary {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  description?: string;
  lastActive?: string;
}

export interface AgentDetail extends AgentSummary {
  identity: AgentIdentity | null;
  sessions: {
    count: number;
    latestFile?: string;
  };
}

export interface SessionMetadata {
  lastActive?: string;
  status: AgentStatus;
}

export interface AgentSkill {
  name: string;
  path: string;
  attributes: Record<string, unknown>;
}
