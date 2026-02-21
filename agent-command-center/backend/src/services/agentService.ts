import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  AgentDetail,
  AgentIdentity,
  AgentLogMessage,
  AgentLogsResponse,
  AgentProfileUsageStats,
  AgentStatus,
  AgentSummary,
  SessionMetadata,
  UsageStatsValue,
} from "../types/agent.js";

const AGENTS_ROOT = path.join(os.homedir(), ".openclaw", "agents");
const DEFAULT_RECENT_MESSAGE_LIMIT = 50;
const ACTIVE_WINDOW_MINUTES = 10;

const isAgentStatus = (value: unknown): value is AgentStatus =>
  value === "idle" || value === "busy" || value === "error";

const safeJsonParse = <T>(input: string): T | null => {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
};

const readIdentity = async (agentDir: string): Promise<AgentIdentity | null> => {
  try {
    const content = await fs.readFile(path.join(agentDir, "identity.json"), "utf8");
    return safeJsonParse<AgentIdentity>(content);
  } catch {
    return null;
  }
};

const findLatestSessionFile = async (
  sessionsDir: string,
): Promise<{ fileName?: string; fileCount: number }> => {
  try {
    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));
    if (files.length === 0) return { fileCount: 0 };

    let latest: { name: string; mtimeMs: number } | null = null;
    for (const file of files) {
      const stats = await fs.stat(path.join(sessionsDir, file.name));
      if (!latest || stats.mtimeMs > latest.mtimeMs) latest = { name: file.name, mtimeMs: stats.mtimeMs };
    }

    return { fileName: latest?.name, fileCount: files.length };
  } catch {
    return { fileCount: 0 };
  }
};

const parseSessionMetadata = async (sessionsDir: string): Promise<SessionMetadata> => {
  const { fileName } = await findLatestSessionFile(sessionsDir);
  if (!fileName) return { status: "idle" };

  try {
    const content = await fs.readFile(path.join(sessionsDir, fileName), "utf8");
    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const event = safeJsonParse<Record<string, unknown>>(lines[i]);
      if (!event) continue;

      const statusCandidate = event.status ?? event.state;
      const tsCandidate = event.timestamp ?? event.time ?? event.createdAt;

      if (isAgentStatus(statusCandidate)) {
        return { status: statusCandidate, lastActive: typeof tsCandidate === "string" ? tsCandidate : undefined };
      }

      if (event.level === "error") {
        return { status: "error", lastActive: typeof tsCandidate === "string" ? tsCandidate : undefined };
      }

      if (typeof tsCandidate === "string") return { status: "busy", lastActive: tsCandidate };
    }
  } catch {
    // ignore
  }

  return { status: "idle" };
};

const extractContentText = (value: unknown): string => {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof (item as Record<string, unknown>).text === "string") {
          return (item as Record<string, unknown>).text as string;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (record.content !== undefined) return extractContentText(record.content);
  }

  return "";
};

const parseLogMessage = (line: string): AgentLogMessage | null => {
  const event = safeJsonParse<Record<string, unknown>>(line);
  if (!event) return null;

  const timestampCandidate = event.timestamp ?? event.time ?? event.createdAt;
  const timestamp = typeof timestampCandidate === "string" ? timestampCandidate : undefined;
  const type = typeof event.type === "string" ? event.type : undefined;

  let role: string | undefined;
  let content = "";

  if (event.message && typeof event.message === "object") {
    const msg = event.message as Record<string, unknown>;
    if (typeof msg.role === "string") role = msg.role;
    content = extractContentText(msg.content);
  }

  if (!role && typeof event.role === "string") role = event.role;
  if (!content) content = extractContentText(event.content);
  if (!content) return null;

  return { timestamp, role, content, type };
};

const readRecentMessages = async (filePath: string, limit = DEFAULT_RECENT_MESSAGE_LIMIT): Promise<AgentLogMessage[]> => {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const messages: AgentLogMessage[] = [];

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const parsed = parseLogMessage(lines[i]);
    if (!parsed) continue;
    messages.push(parsed);
    if (messages.length >= limit) break;
  }

  return messages.reverse();
};

const isRunning = (lastActive?: string): boolean => {
  if (!lastActive) return false;
  const ts = Date.parse(lastActive);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= ACTIVE_WINDOW_MINUTES * 60_000;
};

const mapAgent = async (agentId: string): Promise<AgentDetail> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);
  const identity = await readIdentity(agentDir);
  const sessionsDir = path.join(agentDir, "sessions");
  const sessionMeta = await parseSessionMetadata(sessionsDir);
  const { fileName, fileCount } = await findLatestSessionFile(sessionsDir);

  return {
    id: agentId,
    name: identity?.name ?? agentId,
    type: identity?.type ?? "agent",
    status: sessionMeta.status,
    description: typeof identity?.description === "string" ? identity.description : undefined,
    lastActive: sessionMeta.lastActive,
    identity,
    sessions: { count: fileCount, latestFile: fileName },
  };
};

const isUsageStatsValue = (value: unknown): value is UsageStatsValue =>
  ["string", "number", "boolean"].includes(typeof value) || value === null;

const coerceUsageStatsRecord = (value: unknown): Record<string, UsageStatsValue> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, v]) => isUsageStatsValue(v)));
};

const aggregateUsageStats = (profiles: Record<string, Record<string, UsageStatsValue>>): Record<string, UsageStatsValue> => {
  const aggregate: Record<string, UsageStatsValue> = {};
  for (const usage of Object.values(profiles)) {
    for (const [key, value] of Object.entries(usage)) {
      if (typeof value === "number") {
        const current = aggregate[key];
        aggregate[key] = typeof current === "number" ? current + value : value;
      } else if (!(key in aggregate)) {
        aggregate[key] = value;
      }
    }
  }
  return aggregate;
};

export const listAgents = async (): Promise<AgentSummary[]> => {
  const entries = await fs.readdir(AGENTS_ROOT, { withFileTypes: true });
  const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const details = await Promise.all(ids.map((id) => mapAgent(id)));
  return details.map(({ identity: _identity, sessions: _sessions, ...summary }) => summary);
};

export const getAgentById = async (agentId: string): Promise<AgentDetail | null> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);
  try {
    const stats = await fs.stat(agentDir);
    if (!stats.isDirectory()) return null;
  } catch {
    return null;
  }
  return mapAgent(agentId);
};

export const getAgentLogsById = async (agentId: string): Promise<AgentLogsResponse | null> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);
  try {
    const stats = await fs.stat(agentDir);
    if (!stats.isDirectory()) return null;
  } catch {
    return null;
  }

  const sessionsDir = path.join(agentDir, "sessions");
  const { fileName } = await findLatestSessionFile(sessionsDir);
  if (!fileName) return { isRunning: false, recentMessages: [] };

  const recentMessages = await readRecentMessages(path.join(sessionsDir, fileName));
  const lastActive = recentMessages.at(-1)?.timestamp;

  return {
    isRunning: isRunning(lastActive),
    lastActive,
    sessionId: fileName.replace(/\.jsonl$/i, ""),
    recentMessages,
  };
};

export const getAgentUsageStatsById = async (agentId: string): Promise<AgentProfileUsageStats | null> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);
  try {
    const stats = await fs.stat(agentDir);
    if (!stats.isDirectory()) return null;
  } catch {
    return null;
  }

  const authProfilesPath = path.join(agentDir, "agent", "auth-profiles.json");
  let authProfiles: Record<string, unknown> | null = null;
  try {
    const content = await fs.readFile(authProfilesPath, "utf8");
    authProfiles = safeJsonParse<Record<string, unknown>>(content);
  } catch {
    return { aggregate: {}, profiles: {} };
  }

  const profilesValue = authProfiles?.profiles;
  if (!profilesValue || typeof profilesValue !== "object" || Array.isArray(profilesValue)) {
    return { aggregate: {}, profiles: {} };
  }

  const profiles: Record<string, Record<string, UsageStatsValue>> = {};
  for (const [profileName, profileData] of Object.entries(profilesValue)) {
    if (!profileData || typeof profileData !== "object" || Array.isArray(profileData)) continue;
    const usage = coerceUsageStatsRecord((profileData as Record<string, unknown>).usageStats);
    if (Object.keys(usage).length > 0) profiles[profileName] = usage;
  }

  return { aggregate: aggregateUsageStats(profiles), profiles };
};

export const getAgentsRoot = (): string => AGENTS_ROOT;
