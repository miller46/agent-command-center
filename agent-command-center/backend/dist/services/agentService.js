import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
const OPENCLAW_ROOT = path.join(os.homedir(), ".openclaw");
const AGENTS_ROOT = path.join(OPENCLAW_ROOT, "agents");
const isAgentStatus = (value) => value === "idle" || value === "busy" || value === "error";
const safeJsonParse = (input) => {
    try {
        return JSON.parse(input);
    }
    catch {
        return null;
    }
};
const readIdentity = async (agentDir) => {
    const identityPath = path.join(agentDir, "identity.json");
    try {
        const content = await fs.readFile(identityPath, "utf8");
        return safeJsonParse(content);
    }
    catch {
        return null;
    }
};
const findLatestSessionFile = async (sessionsDir) => {
    try {
        const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
        const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));
        if (files.length === 0) {
            return { fileCount: 0 };
        }
        let latest = null;
        for (const file of files) {
            const fullPath = path.join(sessionsDir, file.name);
            const stats = await fs.stat(fullPath);
            if (!latest || stats.mtimeMs > latest.mtimeMs) {
                latest = { name: file.name, mtimeMs: stats.mtimeMs };
            }
        }
        return { fileName: latest?.name, fileCount: files.length };
    }
    catch {
        return { fileCount: 0 };
    }
};
const parseSessionMetadata = async (sessionsDir) => {
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
            const event = safeJsonParse(lines[i]);
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
    }
    catch {
        return { status: "idle" };
    }
};
const mapAgent = async (agentId) => {
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
        description: typeof identity?.description === "string" ? identity.description : undefined,
        lastActive: sessionMeta.lastActive,
        identity,
        sessions: {
            count: fileCount,
            latestFile: fileName,
        },
    };
};
const getTimestampFromEvent = (event) => {
    if (!event || typeof event !== "object") {
        return null;
    }
    const tsCandidate = event.timestamp ?? event.time ?? event.createdAt ?? event.ts;
    if (typeof tsCandidate !== "string") {
        return null;
    }
    const parsed = Date.parse(tsCandidate);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
};
const extractMessageFromEvent = (event) => {
    if (!event || typeof event !== "object") {
        return null;
    }
    const type = typeof event.type === "string" ? event.type.toLowerCase() : "";
    const kind = typeof event.kind === "string" ? event.kind.toLowerCase() : "";
    const name = typeof event.event === "string" ? event.event.toLowerCase() : "";
    const likelyMessage = type.includes("message") || kind.includes("message") || name.includes("message") || "role" in event || "content" in event || "message" in event;
    if (!likelyMessage) {
        return null;
    }
    const roleCandidate = event.role ?? event.sender ?? event.author ?? event.message?.role;
    const role = typeof roleCandidate === "string" ? roleCandidate : "unknown";
    if (role === "toolResult") {
        return null;
    }
    let content = null;
    if (typeof event.content === "string") {
        content = event.content;
    }
    else if (typeof event.message === "string") {
        content = event.message;
    }
    else if (typeof event.message?.content === "string") {
        content = event.message.content;
    }
    else if (Array.isArray(event.content)) {
        content = event.content.map((part) => {
            if (typeof part === "string") {
                return part;
            }
            if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
                return part.text;
            }
            return "";
        }).join("\n").trim();
    }
    else if (Array.isArray(event.message?.content)) {
        content = event.message.content.map((part) => {
            if (typeof part === "string") {
                return part;
            }
            if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
                return part.text;
            }
            return "";
        }).join("\n").trim();
    }
    if (!content || !content.trim()) {
        return null;
    }
    const normalizedContent = content.trim();
    return {
        role,
        content: normalizedContent.length > 2000 ? `${normalizedContent.slice(0, 2000)}…` : normalizedContent,
        timestamp: getTimestampFromEvent(event),
    };
};
export const listAgents = async () => {
    const entries = await fs.readdir(AGENTS_ROOT, { withFileTypes: true });
    const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const details = await Promise.all(dirs.map((id) => mapAgent(id)));
    return details.map(({ identity: _identity, sessions: _sessions, ...summary }) => summary);
};
export const getAgentById = async (agentId) => {
    const agentDir = path.join(AGENTS_ROOT, agentId);
    try {
        const stats = await fs.stat(agentDir);
        if (!stats.isDirectory()) {
            return null;
        }
    }
    catch {
        return null;
    }
    return mapAgent(agentId);
};
export const listAgentSkills = async (agentId) => {
    const skillsRoot = path.join(OPENCLAW_ROOT, `workspace-${agentId}`, "skills");
    try {
        const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
        return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    }
    catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
};
export const getAgentSkill = async (agentId, skillName) => {
    const skillsRoot = path.join(OPENCLAW_ROOT, `workspace-${agentId}`, "skills");
    const resolvedSkillPath = path.resolve(skillsRoot, skillName);
    if (!resolvedSkillPath.startsWith(path.resolve(skillsRoot) + path.sep)) {
        return null;
    }
    const skillFilePath = path.join(resolvedSkillPath, "SKILL.md");
    try {
        const content = await fs.readFile(skillFilePath, "utf8");
        return { name: skillName, content };
    }
    catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
};
export const getAgentUsageStats = async (agentId) => {
    const profilesPath = path.join(AGENTS_ROOT, agentId, "agent", "auth-profiles.json");
    let content;
    try {
        content = await fs.readFile(profilesPath, "utf8");
    }
    catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return {};
        }
        throw error;
    }
    const parsed = safeJsonParse(content);
    if (!parsed || typeof parsed !== "object") {
        return {};
    }
    const profiles = "profiles" in parsed && parsed.profiles && typeof parsed.profiles === "object"
        ? parsed.profiles
        : {};
    const usageStats = {};
    for (const [profileName, profileValue] of Object.entries(profiles)) {
        if (!profileValue || typeof profileValue !== "object" || !("usageStats" in profileValue)) {
            continue;
        }
        usageStats[profileName] = profileValue.usageStats;
    }
    return usageStats;
};
export const getAgentLogs = async (agentId) => {
    const sessionsDir = path.join(AGENTS_ROOT, agentId, "sessions");
    let entries;
    try {
        entries = await fs.readdir(sessionsDir, { withFileTypes: true });
    }
    catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return { isRunning: false, lastActive: null, sessionId: null, recentMessages: [] };
        }
        throw error;
    }
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));
    if (files.length === 0) {
        return { isRunning: false, lastActive: null, sessionId: null, recentMessages: [] };
    }
    const candidates = await Promise.all(files.map(async (file) => {
        const filePath = path.join(sessionsDir, file.name);
        const stats = await fs.stat(filePath);
        return { filePath, fileName: file.name, mtimeMs: stats.mtimeMs };
    }));
    candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latest = candidates[0];
    const content = await fs.readFile(latest.filePath, "utf8");
    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
    const recentMessages = [];
    let lastActive = new Date(latest.mtimeMs).toISOString();
    for (const line of lines) {
        const event = safeJsonParse(line);
        if (!event) {
            continue;
        }
        const ts = getTimestampFromEvent(event);
        if (ts && Date.parse(ts) > Date.parse(lastActive)) {
            lastActive = ts;
        }
        const message = extractMessageFromEvent(event);
        if (message) {
            recentMessages.push(message);
        }
    }
    const isRunning = Date.parse(lastActive) >= Date.now() - 10 * 60 * 1000;
    return {
        isRunning,
        lastActive,
        sessionId: latest.fileName.replace(/\.jsonl$/i, ""),
        recentMessages: recentMessages.slice(-50),
    };
};
export const getAgentsRoot = () => AGENTS_ROOT;
