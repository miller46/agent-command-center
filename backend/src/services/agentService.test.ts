import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { listAgentRuns, parseRunsQuery } from "./agentService.js";

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
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "agent-runs-test-"));
  process.env.OPENCLAW_AGENTS_ROOT = tempRoot;

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
  delete process.env.OPENCLAW_AGENTS_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
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
