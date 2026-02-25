import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import yaml from "yaml";
import type {
  AgentDetail,
  AgentIdentity,
  AgentSkill,
  AgentStatus,
  AgentSummary,
  SessionMetadata,
} from "../types/agent.js";

const OPENCLAW_ROOT = process.env.OPENCLAW_ROOT ?? path.join(os.homedir(), ".openclaw");
const AGENTS_ROOT = process.env.OPENCLAW_AGENTS_ROOT ?? path.join(OPENCLAW_ROOT, "agents");
const MAIN_AGENT_ID = "main";
const MAIN_SKILLS_ROOT = "/workspace/skills";

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

export const getAgentSkillsRoot = (agentId: string): string => {
  if (agentId === MAIN_AGENT_ID) {
    return process.env.OPENCLAW_MAIN_SKILLS_ROOT ?? MAIN_SKILLS_ROOT;
  }

  return path.join(OPENCLAW_ROOT, `workspace-${agentId}`, "skills");
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

export const getAgentsRoot = (): string => AGENTS_ROOT;
