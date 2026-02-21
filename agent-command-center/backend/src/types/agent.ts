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

export type AgentUsageResponse =
  | Record<string, unknown>
  | {
      profiles: Record<string, unknown>;
    };

export interface AgentLogMessage {
  timestamp: string;
  role: string;
  content: string;
}

export interface AgentLogsResponse {
  isRunning: boolean;
  lastActive?: string;
  sessionId?: string;
  recentMessages: AgentLogMessage[];
}
