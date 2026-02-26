import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
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

before(async () => {
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

  await writeSession("beta", "run-long.jsonl", [
    { timestamp: "2026-02-23T09:00:00.000Z", message: "x".repeat(9000), status: "busy" },
  ]);
});

after(async () => {
  delete process.env.OPENCLAW_ROOT;
  delete process.env.OPENCLAW_AGENTS_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("agentService skill parsing", () => {
  it("parses YAML frontmatter into attributes", () => {
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nversion: 2\n---\n# Body`);
    assert.deepEqual(parsed, { name: "alpha", version: 2 });
  });

  it("returns empty object for invalid YAML", () => {
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nlist: [x\n---\n# Body`);
    assert.deepEqual(parsed, {});
  });

  it("lists skills and handles corrupt frontmatter gracefully", async () => {
    const skills = await listAgentSkills("alpha");

    assert.equal(skills.length, 3);
    const good = skills.find((skill) => skill.name === "good-skill");
    const broken = skills.find((skill) => skill.name === "broken-skill");

    assert.ok(good);
    assert.equal(good.attributes.description, "Useful helper");
    assert.ok(broken);
    assert.deepEqual(broken.attributes, {});
  });

  it("falls back to directory name when frontmatter name is missing", async () => {
    const skills = await listAgentSkills("alpha");
    const nameless = skills.find((skill) => skill.name === "nameless-skill");

    assert.ok(nameless);
    assert.equal(nameless.attributes.description, "Missing explicit name");
  });

  it("supports exact skill-name filtering", async () => {
    const filtered = await listAgentSkills("alpha", "good-skill");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].name, "good-skill");
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

    assert.deepEqual(result, {
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

  it("rejects invalid date, status, and limit boundary values", () => {
    assert.deepEqual(parseRunsQuery({ from: "not-a-date" }), { valid: false, error: "Invalid 'from' date" });
    assert.deepEqual(parseRunsQuery({ to: "still-not-a-date" }), { valid: false, error: "Invalid 'to' date" });
    assert.deepEqual(parseRunsQuery({ status: "done" }), {
      valid: false,
      error: "Invalid 'status'. Must be one of: idle, busy, error",
    });
    assert.deepEqual(parseRunsQuery({ limit: "0" }), { valid: false, error: "Invalid 'limit'. Must be between 1 and 200" });
    assert.deepEqual(parseRunsQuery({ limit: "201" }), { valid: false, error: "Invalid 'limit'. Must be between 1 and 200" });
  });

  it("falls back to defaults for empty/invalid offset and limit", () => {
    assert.deepEqual(parseRunsQuery({ limit: "", offset: "" }), {
      valid: true,
      value: { agent: undefined, from: undefined, to: undefined, status: undefined, limit: 50, offset: 0 },
    });

    assert.deepEqual(parseRunsQuery({ offset: "-1" }), {
      valid: true,
      value: { agent: undefined, from: undefined, to: undefined, status: undefined, limit: 50, offset: 0 },
    });
  });
});

describe("listAgentRuns", () => {
  it("returns paginated runs with metadata and logs", async () => {
    const query = parseRunsQuery({ limit: "2", offset: "0" });
    assert.equal(query.valid, true);
    if (!query.valid) return;

    const result = await listAgentRuns(query.value);

    assert.equal(result.pagination.total, 4);
    assert.equal(result.data.length, 2);
    assert.ok(result.data[0].id);
    assert.ok(result.data[0].agent);
    assert.ok(typeof result.data[0].logs === "string");
  });

  it("filters by agent/status and date range", async () => {
    const statusQuery = parseRunsQuery({ agent: "alpha", status: "error", limit: "50" });
    assert.equal(statusQuery.valid, true);
    if (!statusQuery.valid) return;

    const statusResult = await listAgentRuns(statusQuery.value);
    assert.equal(statusResult.data.length, 1);
    assert.equal(statusResult.data[0].agent, "alpha");
    assert.equal(statusResult.data[0].status, "error");

    const dateQuery = parseRunsQuery({ from: "2026-02-22T00:00:00.000Z", to: "2026-02-22T23:59:59.000Z" });
    assert.equal(dateQuery.valid, true);
    if (!dateQuery.valid) return;

    const dateResult = await listAgentRuns(dateQuery.value);
    assert.equal(dateResult.data.length, 1);
    assert.equal(dateResult.data[0].agent, "beta");
    assert.equal(dateResult.data[0].id, "beta:run-1.jsonl");
  });

  it("applies inclusive time filters and truncates oversized logs", async () => {
    const boundaryQuery = parseRunsQuery({
      from: "2026-02-22T09:00:00.000Z",
      to: "2026-02-22T09:00:00.000Z",
      limit: "50",
    });
    assert.equal(boundaryQuery.valid, true);
    if (!boundaryQuery.valid) return;

    const boundaryResult = await listAgentRuns(boundaryQuery.value);
    assert.equal(boundaryResult.data.length, 1);
    assert.equal(boundaryResult.data[0].agent, "beta");

    const longLogQuery = parseRunsQuery({ agent: "beta", limit: "10" });
    assert.equal(longLogQuery.valid, true);
    if (!longLogQuery.valid) return;

    const longLogResult = await listAgentRuns(longLogQuery.value);
    const longRun = longLogResult.data.find((run) => run.id === "beta:run-long.jsonl");

    assert.ok(longRun);
    assert.match(longRun.logs, /\.\.\.\[truncated\]$/);
    assert.ok(longRun.logs.length < 8200);
  });
});
