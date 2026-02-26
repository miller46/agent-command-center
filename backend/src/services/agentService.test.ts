import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { listAgentRuns, listAgentSkills, parseRunsQuery, parseSkillFrontmatter } from "./agentService.js";

let tempRoot = "";

const writeSession = async (
  agentId: string,
  fileName: string,
  lines: Array<Record<string, unknown>>,
): Promise<void> => {
  const sessionDir = path.join(tempRoot, agentId, "sessions");
  await mkdir(sessionDir, { recursive: true });
  await writeFile(
    path.join(sessionDir, fileName),
    `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`,
    "utf8",
  );
};

beforeAll(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "agent-service-test-"));

  process.env.OPENCLAW_ROOT = tempRoot;
  process.env.OPENCLAW_AGENTS_ROOT = tempRoot;

  const alphaSkillsRoot = path.join(tempRoot, "workspace-alpha", "skills");
  await mkdir(path.join(alphaSkillsRoot, "good-skill"), { recursive: true });
  await mkdir(path.join(alphaSkillsRoot, "broken-skill"), { recursive: true });
  await mkdir(path.join(alphaSkillsRoot, "nameless-skill"), { recursive: true });

  await writeFile(
    path.join(alphaSkillsRoot, "good-skill", "SKILL.md"),
    `---\nname: good-skill\ndescription: Useful helper\nversion: 1.0.0\n---\n\n# Good Skill\n`,
    "utf8",
  );

  await writeFile(
    path.join(alphaSkillsRoot, "broken-skill", "SKILL.md"),
    `---\nname: broken-skill\ndescription: [oops\n---\n\n# Broken\n`,
    "utf8",
  );

  await writeFile(
    path.join(alphaSkillsRoot, "nameless-skill", "SKILL.md"),
    `---\ndescription: Missing explicit name\n---\n\n# Nameless Skill\n`,
    "utf8",
  );

  await writeSession("alpha", "run-1.jsonl", [
    { timestamp: "2026-02-20T10:00:00.000Z", message: "started", status: "busy" },
    { timestamp: "2026-02-20T10:03:00.000Z", message: "completed", status: "idle" },
  ]);

  await writeSession("alpha", "run-2.jsonl", [
    { timestamp: "2026-02-21T12:00:00.000Z", message: "started", status: "busy" },
    { timestamp: "2026-02-21T12:01:00.000Z", level: "error", message: "failed" },
  ]);

  await writeSession("beta", "run-1.jsonl", [
    { timestamp: "2026-02-22T09:00:00.000Z", message: "started", status: "busy" },
    { timestamp: "2026-02-22T09:05:00.000Z", message: "still running", status: "busy" },
  ]);

  const longMessage = "x".repeat(9000);
  await writeSession("gamma", "run-1.jsonl", [
    { timestamp: "2026-02-22T11:00:00.000Z", message: longMessage, status: "busy" },
  ]);
});

afterAll(async () => {
  delete process.env.OPENCLAW_ROOT;
  delete process.env.OPENCLAW_AGENTS_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("agentService skill parsing", () => {
  it("parses YAML frontmatter into attributes", () => {
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nversion: 2\n---\n# Body`);
    expect(parsed).toMatchObject({ name: "alpha", version: 2 });
  });

  it("returns empty object for invalid YAML", () => {
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nlist: [x\n---\n# Body`);
    expect(parsed).toEqual({});
  });

  it("lists skills and handles corrupt frontmatter gracefully", async () => {
    const skills = await listAgentSkills("alpha");

    expect(skills).toHaveLength(3);
    expect(skills.find((skill) => skill.name === "good-skill")?.attributes.description).toBe("Useful helper");
    expect(skills.find((skill) => skill.name === "broken-skill")?.attributes).toEqual({});
  });

  it("falls back to directory name when frontmatter name is missing", async () => {
    const skills = await listAgentSkills("alpha");
    const nameless = skills.find((skill) => skill.name === "nameless-skill");

    expect(nameless).toBeTruthy();
    expect(nameless?.attributes.description).toBe("Missing explicit name");
  });

  it("supports exact skill-name filtering", async () => {
    const filtered = await listAgentSkills("alpha", "good-skill");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("good-skill");
  });
});

describe("parseRunsQuery", () => {
  it("accepts valid query params", () => {
    const result = parseRunsQuery({
      agent: "alpha",
      from: "2026-02-20T00:00:00.000Z",
      to: "2026-02-23T00:00:00.000Z",
      status: "idle",
      limit: "10",
      offset: "2",
    });

    expect(result).toEqual({
      valid: true,
      value: {
        agent: "alpha",
        from: "2026-02-20T00:00:00.000Z",
        to: "2026-02-23T00:00:00.000Z",
        status: "idle",
        limit: 10,
        offset: 2,
      },
    });
  });

  it("rejects invalid date, status, and range-boundary values", () => {
    expect(parseRunsQuery({ from: "not-a-date" })).toEqual({ valid: false, error: "Invalid 'from' date" });
    expect(parseRunsQuery({ to: "still-not-a-date" })).toEqual({ valid: false, error: "Invalid 'to' date" });
    expect(parseRunsQuery({ status: "done" })).toEqual({
      valid: false,
      error: "Invalid 'status'. Must be one of: idle, busy, error",
    });
    expect(parseRunsQuery({ limit: "0" })).toEqual({ valid: false, error: "Invalid 'limit'. Must be between 1 and 200" });
    expect(parseRunsQuery({ limit: "201" })).toEqual({ valid: false, error: "Invalid 'limit'. Must be between 1 and 200" });
  });

  it("falls back to defaults for empty offset and limit", () => {
    const result = parseRunsQuery({ limit: "", offset: "" });
    expect(result).toEqual({
      valid: true,
      value: { agent: undefined, from: undefined, to: undefined, status: undefined, limit: 50, offset: 0 },
    });
  });

  it("defaults offset when provided offset is invalid", () => {
    const result = parseRunsQuery({ offset: "-1" });
    expect(result).toEqual({
      valid: true,
      value: { agent: undefined, from: undefined, to: undefined, status: undefined, limit: 50, offset: 0 },
    });
  });
});

describe("listAgentRuns", () => {
  it("returns paginated runs with metadata and logs", async () => {
    const query = parseRunsQuery({ limit: "2", offset: "0" });
    expect(query.valid).toBe(true);
    if (!query.valid) return;

    const result = await listAgentRuns(query.value);

    expect(result.pagination.total).toBe(4);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.id).toBeTruthy();
    expect(result.data[0]?.agent).toBeTruthy();
    expect(typeof result.data[0]?.logs).toBe("string");
  });

  it("filters by agent and status", async () => {
    const query = parseRunsQuery({ agent: "alpha", status: "error", limit: "50" });
    expect(query.valid).toBe(true);
    if (!query.valid) return;

    const result = await listAgentRuns(query.value);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.agent).toBe("alpha");
    expect(result.data[0]?.status).toBe("error");
  });

  it("applies inclusive time filters and truncates oversized logs", async () => {
    const boundaryQuery = parseRunsQuery({
      from: "2026-02-22T09:00:00.000Z",
      to: "2026-02-22T09:00:00.000Z",
      limit: "50",
    });
    expect(boundaryQuery.valid).toBe(true);
    if (!boundaryQuery.valid) return;

    const boundaryResult = await listAgentRuns(boundaryQuery.value);
    expect(boundaryResult.data).toHaveLength(1);
    expect(boundaryResult.data[0]?.agent).toBe("beta");

    const longLogQuery = parseRunsQuery({ agent: "gamma", limit: "5" });
    expect(longLogQuery.valid).toBe(true);
    if (!longLogQuery.valid) return;

    const longLogResult = await listAgentRuns(longLogQuery.value);
    expect(longLogResult.data[0]?.logs.endsWith("...[truncated]")).toBe(true);
  });
});
