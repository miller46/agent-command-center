import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import yaml from "yaml";
import type {
  AgentDetail,
  AgentIdentity,
  AgentRun,
  AgentRunsQuery,
  AgentSkill,
  AgentStatus,
  AgentSummary,
  SessionMetadata,
} from "../types/agent.js";

const DEFAULT_OPENCLAW_ROOT = path.join(os.homedir(), ".openclaw");
const DEFAULT_OPENCLAW_CONFIG_PATH = path.join(DEFAULT_OPENCLAW_ROOT, "openclaw.json");
const DEFAULT_AGENTS_ROOT = path.join(DEFAULT_OPENCLAW_ROOT, "agents");
const MAIN_AGENT_ID = "main";
const MAIN_SKILLS_ROOT = "/workspace/skills";
const DEFAULT_RUN_LIMIT = 50;
const MAX_RUN_LIMIT = 200;
const LOG_TRUNCATE_LIMIT = 8000;

const getConfiguredOpenclawRoot = (): string => process.env.OPENCLAW_ROOT ?? DEFAULT_OPENCLAW_ROOT;
const getConfiguredOpenclawConfigPath = (): string =>
  process.env.OPENCLAW_CONFIG_PATH ?? DEFAULT_OPENCLAW_CONFIG_PATH;
const getConfiguredAgentsRoot = (): string => process.env.OPENCLAW_AGENTS_ROOT ?? DEFAULT_AGENTS_ROOT;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
  const agentDir = path.join(getConfiguredAgentsRoot(), agentId);
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

interface ParsedEvent {
  timestamp?: string;
  status?: AgentStatus;
  level?: string;
  message?: string;
  raw: string;
}

const parseEventLine = (line: string): ParsedEvent | null => {
  const parsed = safeJsonParse<Record<string, unknown>>(line);

  if (!parsed) {
    return { raw: line };
  }

  const timestampCandidate = parsed.timestamp ?? parsed.time ?? parsed.createdAt;
  const statusCandidate = parsed.status ?? parsed.state;

  return {
    timestamp: typeof timestampCandidate === "string" ? timestampCandidate : undefined,
    status: isAgentStatus(statusCandidate) ? statusCandidate : undefined,
    level: typeof parsed.level === "string" ? parsed.level : undefined,
    message: typeof parsed.message === "string" ? parsed.message : undefined,
    raw: line,
  };
};

const statusFromEvents = (events: ParsedEvent[]): AgentStatus => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.status) {
      return event.status;
    }
    if (event.level === "error") {
      return "error";
    }
  }

  return events.length > 0 ? "busy" : "idle";
};

const truncateLogs = (logOutput: string): string => {
  if (logOutput.length <= LOG_TRUNCATE_LIMIT) {
    return logOutput;
  }

  return `${logOutput.slice(0, LOG_TRUNCATE_LIMIT)}\n...[truncated]`;
};

const readRunFromSessionFile = async (agentId: string, sessionsDir: string, fileName: string): Promise<AgentRun> => {
  const filePath = path.join(sessionsDir, fileName);
  const content = await fs.readFile(filePath, "utf8");
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const events = lines
    .map((line) => parseEventLine(line))
    .filter((event): event is ParsedEvent => event !== null);

  const startedAt = events.find((event) => typeof event.timestamp === "string")?.timestamp;
  const completedAt = [...events]
    .reverse()
    .find((event) => typeof event.timestamp === "string")?.timestamp;
  const logs = truncateLogs(
    events
      .map((event) => event.message ?? event.raw)
      .filter(Boolean)
      .join("\n"),
  );

  return {
    id: `${agentId}:${fileName}`,
    agent: agentId,
    started_at: startedAt,
    completed_at: completedAt,
    status: statusFromEvents(events),
    logs,
  };
};

const toComparableTime = (value?: string): number => {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

export const parseRunsQuery = (
  query: Record<string, unknown>,
): { valid: true; value: AgentRunsQuery } | { valid: false; error: string } => {
  const agent = typeof query.agent === "string" && query.agent.trim() !== "" ? query.agent.trim() : undefined;
  const from = typeof query.from === "string" && query.from.trim() !== "" ? query.from.trim() : undefined;
  const to = typeof query.to === "string" && query.to.trim() !== "" ? query.to.trim() : undefined;
  const statusCandidate = typeof query.status === "string" ? query.status : undefined;

  if (from && Number.isNaN(Date.parse(from))) {
    return { valid: false, error: "Invalid 'from' date" };
  }

  if (to && Number.isNaN(Date.parse(to))) {
    return { valid: false, error: "Invalid 'to' date" };
  }

  if (statusCandidate && !isAgentStatus(statusCandidate)) {
    return { valid: false, error: "Invalid 'status'. Must be one of: idle, busy, error" };
  }

  const status = statusCandidate && isAgentStatus(statusCandidate) ? statusCandidate : undefined;

  const parsedLimit = parsePositiveInt(query.limit);
  const parsedOffset = parsePositiveInt(query.offset);

  const limit = parsedLimit ?? DEFAULT_RUN_LIMIT;
  const offset = parsedOffset ?? 0;

  if (limit < 1 || limit > MAX_RUN_LIMIT) {
    return { valid: false, error: `Invalid 'limit'. Must be between 1 and ${MAX_RUN_LIMIT}` };
  }

  return {
    valid: true,
    value: {
      agent,
      from,
      to,
      status,
      limit,
      offset,
    },
  };
};

export const listAgentsFromConfig = async (): Promise<unknown[]> => {
  const configPath = getConfiguredOpenclawConfigPath();
  const configContent = await fs.readFile(configPath, "utf8");
  const parsed = safeJsonParse<Record<string, unknown>>(configContent);

  if (!parsed || !Array.isArray(parsed.agents)) {
    return [];
  }

  return parsed.agents;
};

export const listAgents = async (): Promise<AgentSummary[]> => {
  const entries = await fs.readdir(getConfiguredAgentsRoot(), { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  const details = await Promise.all(dirs.map((id) => mapAgent(id)));
  return details.map(({ identity: _identity, sessions: _sessions, ...summary }) => summary);
};

export const getAgentById = async (agentId: string): Promise<AgentDetail | null> => {
  const agentDir = path.join(getConfiguredAgentsRoot(), agentId);

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

export const getAgentSkillsRoot = (agentId: string): string => {
  if (agentId === MAIN_AGENT_ID) {
    return process.env.OPENCLAW_MAIN_SKILLS_ROOT ?? MAIN_SKILLS_ROOT;
  }

  return path.join(getConfiguredOpenclawRoot(), `workspace-${agentId}`, "skills");
};

const findSkillFiles = async (root: string): Promise<string[]> => {
  const files: string[] = [];

  const walk = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
          return;
        }

        if (entry.isFile() && entry.name === "SKILL.md") {
          files.push(fullPath);
        }
      }),
    );
  };

  await walk(root);
  return files;
};

export const parseSkillFrontmatter = (content: string): Record<string, unknown> => {
  const frontmatterMatch = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(content);

  if (!frontmatterMatch) {
    return {};
  }

  try {
    const parsed = yaml.parse(frontmatterMatch[1]);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const listAgentSkills = async (
  agentId: string,
  filterByName?: string,
): Promise<AgentSkill[]> => {
  const skillsRoot = getAgentSkillsRoot(agentId);

  let stats;
  try {
    stats = await fs.stat(skillsRoot);
  } catch {
    return [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const skillFiles = await findSkillFiles(skillsRoot);

  const parsedSkills = await Promise.all(
    skillFiles.map(async (filePath) => {
      let content = "";
      try {
        content = await fs.readFile(filePath, "utf8");
      } catch {
        return null;
      }

      const attributes = parseSkillFrontmatter(content);
      const skillDirName = path.basename(path.dirname(filePath));
      const frontmatterName = attributes.name;
      const name = typeof frontmatterName === "string" && frontmatterName.length > 0
        ? frontmatterName
        : skillDirName;

      return {
        name,
        path: path.relative(skillsRoot, filePath),
        attributes,
      } satisfies AgentSkill;
    }),
  );

  const skills = parsedSkills.filter((skill): skill is AgentSkill => skill !== null);

  if (!filterByName) {
    return skills;
  }

  return skills.filter((skill) => skill.name === filterByName);
};

export const listAgentRuns = async (query: AgentRunsQuery): Promise<{
  data: AgentRun[];
  pagination: { limit: number; offset: number; total: number };
  filters: { agent?: string; from?: string; to?: string; status?: AgentStatus };
}> => {
  const entries = await fs.readdir(getConfiguredAgentsRoot(), { withFileTypes: true });
  const agentIds = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((id) => (query.agent ? id === query.agent : true));

  const runs: AgentRun[] = [];

  for (const agentId of agentIds) {
    const sessionsDir = path.join(getConfiguredAgentsRoot(), agentId, "sessions");
    let sessionEntries;

    try {
      sessionEntries = await fs.readdir(sessionsDir, { withFileTypes: true });
    } catch {
      continue;
    }

    const sessionFiles = sessionEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .map((entry) => entry.name);

    const agentRuns = await Promise.all(
      sessionFiles.map(async (fileName) => readRunFromSessionFile(agentId, sessionsDir, fileName)),
    );

    runs.push(...agentRuns);
  }

  const filtered = runs.filter((run) => {
    if (query.status && run.status !== query.status) {
      return false;
    }

    const started = toComparableTime(run.started_at ?? run.completed_at);
    if (query.from && started < toComparableTime(query.from)) {
      return false;
    }

    if (query.to && started > toComparableTime(query.to)) {
      return false;
    }

    return true;
  });

  filtered.sort((a, b) => toComparableTime(b.started_at ?? b.completed_at) - toComparableTime(a.started_at ?? a.completed_at));

  const paginated = filtered.slice(query.offset, query.offset + query.limit);

  return {
    data: paginated,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: filtered.length,
    },
    filters: {
      agent: query.agent,
      from: query.from,
      to: query.to,
      status: query.status,
    },
  };
};

export const getAgentsRoot = (): string => getConfiguredAgentsRoot();
