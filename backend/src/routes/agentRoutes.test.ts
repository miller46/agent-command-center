import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";

let tempRoot = "";

before(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "agent-skills-route-"));
  process.env.OPENCLAW_ROOT = tempRoot;

  const skillsRoot = path.join(tempRoot, "workspace-bravo", "skills", "route-skill");
  await mkdir(skillsRoot, { recursive: true });
  await writeFile(
    path.join(skillsRoot, "SKILL.md"),
    `---\nname: route-skill\ndescription: From route test\n---\n\n# Route Skill\n`,
    "utf8",
  );
});

after(async () => {
  delete process.env.OPENCLAW_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("GET /api/v1/agents/:id/skills", () => {
  it("returns parsed skill metadata", async () => {
    const { default: agentRoutes } = await import("./agentRoutes.js");

    const app = express();
    app.use("/api", agentRoutes);

    const response = await request(app).get("/api/v1/agents/bravo/skills");

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body.data), true);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].name, "route-skill");
    assert.equal(response.body.data[0].attributes.description, "From route test");
  });

  it("supports name filtering", async () => {
    const { default: agentRoutes } = await import("./agentRoutes.js");

    const app = express();
    app.use("/api", agentRoutes);

    const response = await request(app).get("/api/v1/agents/bravo/skills?name=missing");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);
  });
});
