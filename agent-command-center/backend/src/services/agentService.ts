import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";
import os from "node:os";
import type {
  AgentDetail,
  AgentIdentity,
  AgentStatus,
  AgentLogsResponse,
  AgentSummary,
  SessionMetadata,
} from "../types/agent.js";

const AGENTS_ROOT = path.join(os.homedir(), ".openclaw", "agents");

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

const getTimestampFromEvent = (event: Record<string, unknown>): string | null => {
  const timestampCandidate =
    event.timestamp ?? event.time ?? event.createdAt ?? event.ts;

  if (typeof timestampCandidate !== "string") {
    return null;
  }

  const parsedTimestamp = Date.parse(timestampCandidate);
  return Number.isNaN(parsedTimestamp) ? null : new Date(parsedTimestamp).toISOString();
};

const extractMessageFromEvent = (
  event: Record<string, unknown>,
): { role: string; content: string; timestamp: string | null } | null => {
  const eventType = typeof event.type === "string" ? event.type.toLowerCase() : "";
  const eventKind = typeof event.kind === "string" ? event.kind.toLowerCase() : "";
  const eventName = typeof event.event === "string" ? event.event.toLowerCase() : "";

  const isMessageLike =
    eventType.includes("message") ||
    eventKind.includes("message") ||
    eventName.includes("message") ||
    "message" in event ||
    "content" in event ||
    "role" in event;

  if (!isMessageLike) {
    return null;
  }

  const messageObject =
    event.message && typeof event.message === "object"
      ? (event.message as Record<string, unknown>)
      : null;

  const roleCandidate =
    event.role ?? event.sender ?? event.author ?? messageObject?.role;
  const role = typeof roleCandidate === "string" ? roleCandidate : "unknown";

  if (role === "toolResult") {
    return null;
  }

  let content: string | null = null;

  if (typeof event.content === "string") {
    content = event.content;
  } else if (typeof event.message === "string") {
    content = event.message;
  } else if (typeof messageObject?.content === "string") {
    content = messageObject.content;
  } else if (Array.isArray(event.content)) {
    content = event.content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  } else if (Array.isArray(messageObject?.content)) {
    content = messageObject.content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  if (!content || !content.trim()) {
    return null;
  }

  const normalizedContent = content.trim();

  return {
    role,
    content:
      normalizedContent.length > 2000
        ? `${normalizedContent.slice(0, 2000)}…`
        : normalizedContent,
    timestamp: getTimestampFromEvent(event),
  };
};

export const getAgentLogs = async (agentId: string): Promise<AgentLogsResponse> => {
  const sessionsDir = path.join(AGENTS_ROOT, agentId, "sessions");

  let entries: Dirent[];

  try {
    entries = await fs.readdir(sessionsDir, { withFileTypes: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        isRunning: false,
        lastActive: null,
        sessionId: null,
        recentMessages: [],
      };
    }

    throw error;
  }

  const sessionFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));

  if (sessionFiles.length === 0) {
    return {
      isRunning: false,
      lastActive: null,
      sessionId: null,
      recentMessages: [],
    };
  }

  const filesWithStats = await Promise.all(
    sessionFiles.map(async (file) => {
      const filePath = path.join(sessionsDir, file.name);
      const stats = await fs.stat(filePath);
      return { filePath, fileName: file.name, mtimeMs: stats.mtimeMs };
    }),
  );

  filesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const latestSession = filesWithStats[0];
  const rawSession = await fs.readFile(latestSession.filePath, "utf8");
  const lines = rawSession.split("\n").map((line) => line.trim()).filter(Boolean);

  let lastActive = new Date(latestSession.mtimeMs).toISOString();
  const messages: AgentLogsResponse["recentMessages"] = [];

  for (const line of lines) {
    const event = safeJsonParse<Record<string, unknown>>(line);

    if (!event) {
      continue;
    }

    const eventTimestamp = getTimestampFromEvent(event);
    if (eventTimestamp && Date.parse(eventTimestamp) > Date.parse(lastActive)) {
      lastActive = eventTimestamp;
    }

    const message = extractMessageFromEvent(event);
    if (message) {
      messages.push(message);
    }
  }

  const isRunning = Date.parse(lastActive) >= Date.now() - 10 * 60 * 1000;

  return {
    isRunning,
    lastActive,
    sessionId: latestSession.fileName.replace(/\.jsonl$/i, ""),
    recentMessages: messages.slice(-50),
  };
};

export const getAgentsRoot = (): string => AGENTS_ROOT;
