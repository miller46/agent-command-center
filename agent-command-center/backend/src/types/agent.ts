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

export interface AgentLogMessage {
  role: string;
  content: string;
  timestamp: string | null;
}

export interface AgentLogsResponse {
  isRunning: boolean;
  lastActive: string | null;
  sessionId: string | null;
  recentMessages: AgentLogMessage[];
}
