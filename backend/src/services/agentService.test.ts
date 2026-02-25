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

    assert.equal(parsed.name, "alpha");
    assert.equal(parsed.version, 2);
  });

  it("returns empty object for invalid YAML", () => {
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nlist: [x\n---\n# Body`);

    assert.deepEqual(parsed, {});
  });

  it("lists skills and handles corrupt frontmatter gracefully", async () => {
    const skills = await listAgentSkills("alpha");

    assert.equal(skills.length, 2);

    const good = skills.find((skill) => skill.name === "good-skill");
    assert.ok(good);
    assert.equal(good.attributes.description, "Useful helper");

    const broken = skills.find((skill) => skill.name === "broken-skill");
    assert.ok(broken);
    assert.deepEqual(broken.attributes, {});
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

    assert.equal(result.valid, true);
    if (result.valid) {
      assert.deepEqual(result.value, {
        agent: "alpha",
        from: "2026-02-20T00:00:00.000Z",
        to: "2026-02-23T00:00:00.000Z",
        status: "idle",
        limit: 10,
        offset: 2,
      });
    }
  });

  it("rejects invalid status", () => {
    const result = parseRunsQuery({ status: "done" });
    assert.equal(result.valid, false);
  });
});

describe("listAgentRuns", () => {
  it("returns paginated runs with metadata and logs", async () => {
    const query = parseRunsQuery({ limit: "2", offset: "0" });
    assert.equal(query.valid, true);
    if (!query.valid) return;

    const result = await listAgentRuns(query.value);

    assert.equal(result.pagination.total, 3);
    assert.equal(result.data.length, 2);
    assert.ok(result.data[0].id);
    assert.ok(result.data[0].agent);
    assert.ok(typeof result.data[0].logs === "string");
  });

  it("filters by agent and status", async () => {
    const query = parseRunsQuery({ agent: "alpha", status: "error", limit: "50" });
    assert.equal(query.valid, true);
    if (!query.valid) return;

    const result = await listAgentRuns(query.value);

    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].agent, "alpha");
    assert.equal(result.data[0].status, "error");
  });
});
