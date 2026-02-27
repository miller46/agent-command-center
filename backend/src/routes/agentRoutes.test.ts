import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import express from "express";
import request from "supertest";
import agentRoutes from "./agentRoutes.js";

let tempRoot = "";

const buildApp = () => {
  const app = express();
  app.use("/api", agentRoutes);
  return app;
};

before(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "agent-routes-test-"));

  process.env.OPENCLAW_ROOT = tempRoot;
  process.env.OPENCLAW_AGENTS_ROOT = tempRoot;
  process.env.OPENCLAW_CONFIG_PATH = path.join(tempRoot, "openclaw.json");

  await writeFile(
    process.env.OPENCLAW_CONFIG_PATH,
    JSON.stringify({ agents: ["main", "backend-dev", "research"] }, null, 2),
    "utf8",
  );

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
  delete process.env.OPENCLAW_CONFIG_PATH;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("GET /api/agents", () => {
  it("returns agent list from openclaw.json", async () => {
    const response = await request(buildApp()).get("/api/agents");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, ["main", "backend-dev", "research"]);
  });

  it("returns 500 when config cannot be read", async () => {
    const originalConfigPath = process.env.OPENCLAW_CONFIG_PATH;
    process.env.OPENCLAW_CONFIG_PATH = path.join(tempRoot, "missing-openclaw.json");

    const response = await request(buildApp()).get("/api/agents");

    process.env.OPENCLAW_CONFIG_PATH = originalConfigPath;

    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Failed to load agents");
  });
});

describe("GET /api/v1/agents/:id/skills", () => {
  it("returns parsed skill metadata", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/bravo/skills");

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body.data), true);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].name, "route-skill");
    assert.equal(response.body.data[0].attributes.description, "From route test");
  });

  it("supports name filtering", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/bravo/skills?name=missing");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);
  });
});

describe("GET /api/v1/agents/runs", () => {
  it("returns run history with pagination", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/runs?limit=10&offset=0");

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body.data), true);
    assert.equal(response.body.pagination.total, 1);
    assert.equal(response.body.data[0].agent, "gamma");
    assert.equal(typeof response.body.data[0].logs, "string");
  });

  it("validates bad query params", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/runs?status=not-real");

    assert.equal(response.status, 400);
    assert.match(response.body.error, /Invalid 'status'/);
  });
});
