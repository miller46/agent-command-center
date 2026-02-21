import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  AgentDetail,
  AgentIdentity,
  AgentLogsResponse,
  AgentLogMessage,
  AgentStatus,
  AgentSummary,
  AgentUsageResponse,
  SessionMetadata,
} from "../types/agent.js";

const AGENTS_ROOT = path.join(os.homedir(), ".openclaw", "agents");
const RUNNING_THRESHOLD_MS = 10 * 60 * 1000;
const DEFAULT_LOG_LIMIT = 50;

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
  const identityPath = path.join(agentDir, "identity.json");

  try {
    const content = await fs.readFile(identityPath, "utf8");
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

    if (files.length === 0) {
      return { fileCount: 0 };
    }

    let latest: { name: string; mtimeMs: number } | null = null;

    for (const file of files) {
      const fullPath = path.join(sessionsDir, file.name);
      const stats = await fs.stat(fullPath);

      if (!latest || stats.mtimeMs > latest.mtimeMs) {
        latest = { name: file.name, mtimeMs: stats.mtimeMs };
      }
    }

    return { fileName: latest?.name, fileCount: files.length };
  } catch {
    return { fileCount: 0 };
  }
};

const parseSessionMetadata = async (sessionsDir: string): Promise<SessionMetadata> => {
  const { fileName } = await findLatestSessionFile(sessionsDir);

  if (!fileName) {
    return { status: "idle" };
  }

  const filePath = path.join(sessionsDir, fileName);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const event = safeJsonParse<Record<string, unknown>>(lines[i]);

      if (!event) {
        continue;
      }

      const statusCandidate = event.status ?? event.state;
      const tsCandidate = event.timestamp ?? event.time ?? event.createdAt;

      if (isAgentStatus(statusCandidate)) {
        return {
          status: statusCandidate,
          lastActive: typeof tsCandidate === "string" ? tsCandidate : undefined,
        };
      }

      const level = event.level;
      if (level === "error") {
        return {
          status: "error",
          lastActive: typeof tsCandidate === "string" ? tsCandidate : undefined,
        };
      }

      if (typeof tsCandidate === "string") {
        return {
          status: "busy",
          lastActive: tsCandidate,
        };
      }
    }

    return { status: "idle" };
  } catch {
    return { status: "idle" };
  }
};

const toTextContent = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const textParts = value
    .map((part) => {
      if (!part || typeof part !== "object") {
        return null;
      }

      const maybeText = (part as { text?: unknown }).text;
      return typeof maybeText === "string" ? maybeText : null;
    })
    .filter((text): text is string => Boolean(text));

  return textParts.length > 0 ? textParts.join("\n") : null;
};

const parseLogMessage = (line: string): AgentLogMessage | null => {
  const event = safeJsonParse<Record<string, unknown>>(line);

  if (!event) {
    return null;
  }

  const eventTimestamp =
    typeof event.timestamp === "string"
      ? event.timestamp
      : typeof event.time === "string"
        ? event.time
        : typeof event.createdAt === "string"
          ? event.createdAt
          : null;

  const maybeMessage = event.message;
  if (!maybeMessage || typeof maybeMessage !== "object") {
    return null;
  }

  const roleValue = (maybeMessage as { role?: unknown }).role;
  const contentValue = (maybeMessage as { content?: unknown }).content;
  const messageTimestamp = (maybeMessage as { timestamp?: unknown }).timestamp;

  const role = typeof roleValue === "string" ? roleValue : null;
  const content = toTextContent(contentValue);
  const timestamp =
    typeof messageTimestamp === "number"
      ? new Date(messageTimestamp).toISOString()
      : eventTimestamp;

  if (!role || !content || !timestamp) {
    return null;
  }

  return { timestamp, role, content };
};

const isWithinRunningThreshold = (isoTimestamp?: string): boolean => {
  if (!isoTimestamp) {
    return false;
  }

  const timestampMs = Date.parse(isoTimestamp);
  if (Number.isNaN(timestampMs)) {
    return false;
  }

  return Date.now() - timestampMs <= RUNNING_THRESHOLD_MS;
};

const mapAgent = async (agentId: string): Promise<AgentDetail> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);
  const identity = await readIdentity(agentDir);
  const sessionDir = path.join(agentDir, "sessions");
  const sessionMeta = await parseSessionMetadata(sessionDir);
  const { fileName, fileCount } = await findLatestSessionFile(sessionDir);

  return {
    id: agentId,
    name: identity?.name ?? agentId,
    type: identity?.type ?? "agent",
    status: sessionMeta.status,
    description:
      typeof identity?.description === "string" ? identity.description : undefined,
    lastActive: sessionMeta.lastActive,
    identity,
    sessions: {
      count: fileCount,
      latestFile: fileName,
    },
  };
};

export const listAgents = async (): Promise<AgentSummary[]> => {
  const entries = await fs.readdir(AGENTS_ROOT, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  const details = await Promise.all(dirs.map((id) => mapAgent(id)));
  return details.map(({ identity: _identity, sessions: _sessions, ...summary }) => summary);
};

export const getAgentById = async (agentId: string): Promise<AgentDetail | null> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);

  try {
    const stats = await fs.stat(agentDir);
    if (!stats.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  return mapAgent(agentId);
};

export const getAgentLogsById = async (
  agentId: string,
  limit = DEFAULT_LOG_LIMIT,
): Promise<AgentLogsResponse | null> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);

  try {
    const stats = await fs.stat(agentDir);
    if (!stats.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  const sessionDir = path.join(agentDir, "sessions");
  const { fileName } = await findLatestSessionFile(sessionDir);

  if (!fileName) {
    return {
      isRunning: false,
      recentMessages: [],
    };
  }

  const filePath = path.join(sessionDir, fileName);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedMessages = lines
      .map((line) => parseLogMessage(line))
      .filter((message): message is AgentLogMessage => message !== null);

    const recentMessages = parsedMessages.slice(-Math.max(1, limit));
    const lastActive = recentMessages.at(-1)?.timestamp;

    return {
      isRunning: isWithinRunningThreshold(lastActive),
      lastActive,
      sessionId: path.basename(fileName, ".jsonl"),
      recentMessages,
    };
  } catch {
    return {
      isRunning: false,
      recentMessages: [],
      sessionId: path.basename(fileName, ".jsonl"),
    };
  }
};

export const getAgentUsageById = async (
  agentId: string,
): Promise<AgentUsageResponse | null> => {
  const agentDir = path.join(AGENTS_ROOT, agentId);

  try {
    const stats = await fs.stat(agentDir);
    if (!stats.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  const authProfilesPath = path.join(agentDir, "agent", "auth-profiles.json");

  try {
    const content = await fs.readFile(authProfilesPath, "utf8");
    const parsed = safeJsonParse<{ profiles?: Record<string, unknown> }>(content);

    if (!parsed?.profiles || typeof parsed.profiles !== "object") {
      return {};
    }

    const usageByProfile: Record<string, unknown> = {};

    for (const [profileName, profileValue] of Object.entries(parsed.profiles)) {
      if (!profileValue || typeof profileValue !== "object") {
        continue;
      }

      const usageStats = (profileValue as Record<string, unknown>).usageStats;
      if (usageStats && typeof usageStats === "object") {
        usageByProfile[profileName] = usageStats;
      }
    }

    if (Object.keys(usageByProfile).length === 0) {
      return {};
    }

    if (Object.keys(usageByProfile).length === 1) {
      return Object.values(usageByProfile)[0] as AgentUsageResponse;
    }

    return { profiles: usageByProfile };
  } catch {
    return {};
  }
};

export const getAgentsRoot = (): string => AGENTS_ROOT;
