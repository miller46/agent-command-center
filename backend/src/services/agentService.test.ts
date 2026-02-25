import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let tempRoot = "";

before(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "agent-skills-service-"));
  process.env.OPENCLAW_ROOT = tempRoot;

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
});

after(async () => {
  delete process.env.OPENCLAW_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("agentService skill parsing", () => {
  it("parses YAML frontmatter into attributes", async () => {
    const { parseSkillFrontmatter } = await import("./agentService.js");
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nversion: 2\n---\n# Body`);

    assert.equal(parsed.name, "alpha");
    assert.equal(parsed.version, 2);
  });

  it("returns empty object for invalid YAML", async () => {
    const { parseSkillFrontmatter } = await import("./agentService.js");
    const parsed = parseSkillFrontmatter(`---\nname: alpha\nlist: [x\n---\n# Body`);

    assert.deepEqual(parsed, {});
  });

  it("lists skills and handles corrupt frontmatter gracefully", async () => {
    const { listAgentSkills } = await import("./agentService.js");
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
    const { listAgentSkills } = await import("./agentService.js");
    const filtered = await listAgentSkills("alpha", "good-skill");

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].name, "good-skill");
  });
});
