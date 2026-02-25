import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import express from "express";
import request from "supertest";
import agentRoutes from "./agentRoutes.js";

let tempRoot = "";

before(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "agent-routes-test-"));

  process.env.OPENCLAW_ROOT = tempRoot;
  process.env.OPENCLAW_AGENTS_ROOT = tempRoot;

  const skillsRoot = path.join(tempRoot, "workspace-bravo", "skills", "route-skill");
  await mkdir(skillsRoot, { recursive: true });
  await writeFile(
    path.join(skillsRoot, "SKILL.md"),
    `---\nname: route-skill\ndescription: From route test\n---\n\n# Route Skill\n`,
    "utf8",
  );

  const sessionDir = path.join(tempRoot, "gamma", "sessions");
  await mkdir(sessionDir, { recursive: true });
  await writeFile(
    path.join(sessionDir, "run-1.jsonl"),
    [
      JSON.stringify({ timestamp: "2026-02-25T10:00:00.000Z", message: "start", status: "busy" }),
      JSON.stringify({ timestamp: "2026-02-25T10:01:00.000Z", message: "done", status: "idle" }),
    ].join("\n"),
    "utf8",
  );
});

after(async () => {
  delete process.env.OPENCLAW_ROOT;
  delete process.env.OPENCLAW_AGENTS_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("GET /api/v1/agents/:id/skills", () => {
  it("returns parsed skill metadata", async () => {
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
    const app = express();
    app.use("/api", agentRoutes);

    const response = await request(app).get("/api/v1/agents/bravo/skills?name=missing");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);
  });
});

describe("GET /api/v1/agents/runs", () => {
  it("returns run history with pagination", async () => {
    const app = express();
    app.use("/api", agentRoutes);

    const response = await request(app).get("/api/v1/agents/runs?limit=10&offset=0");

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body.data), true);
    assert.equal(response.body.pagination.total, 1);
    assert.equal(response.body.data[0].agent, "gamma");
    assert.equal(typeof response.body.data[0].logs, "string");
  });

  it("validates bad query params", async () => {
    const app = express();
    app.use("/api", agentRoutes);

    const response = await request(app).get("/api/v1/agents/runs?status=not-real");

    assert.equal(response.status, 400);
    assert.match(response.body.error, /Invalid 'status'/);
  });
});
