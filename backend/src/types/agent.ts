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

export type RunStatus = AgentStatus;

export interface AgentRun {
  id: string;
  agent: string;
  started_at?: string;
  completed_at?: string;
  status: RunStatus;
  logs: string;
}

export interface AgentRunsQuery {
  agent?: string;
  from?: string;
  to?: string;
  status?: RunStatus;
  limit: number;
  offset: number;
}
