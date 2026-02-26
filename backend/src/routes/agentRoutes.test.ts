import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

beforeAll(async () => {
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

afterAll(async () => {
  delete process.env.OPENCLAW_ROOT;
  delete process.env.OPENCLAW_AGENTS_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("GET /api/v1/agents/:id/skills", () => {
  it("returns parsed skill metadata", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/bravo/skills");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      name: "route-skill",
      attributes: { description: "From route test" },
    });
  });

  it("supports name filtering", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/bravo/skills?name=missing");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});

describe("GET /api/v1/agents/runs", () => {
  it("returns run history with pagination", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/runs?limit=10&offset=0");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0]?.agent).toBe("gamma");
    expect(typeof response.body.data[0]?.logs).toBe("string");
  });

  it("validates bad query params", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/runs?status=not-real");

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid 'status'/);
  });

  it("validates malformed date filters", async () => {
    const response = await request(buildApp()).get("/api/v1/agents/runs?from=not-a-date");

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid 'from' date/);
  });
});
