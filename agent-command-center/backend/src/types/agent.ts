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
  timestamp?: string;
  role?: string;
  content: string;
  type?: string;
}

export interface AgentLogsResponse {
  isRunning: boolean;
  lastActive?: string;
  sessionId?: string;
  recentMessages: AgentLogMessage[];
}

export type UsageStatsValue = string | number | boolean | null;

export interface AgentProfileUsageStats {
  aggregate: Record<string, UsageStatsValue>;
  profiles: Record<string, Record<string, UsageStatsValue>>;
}

export type AgentUsageStatsResponse = AgentProfileUsageStats;
