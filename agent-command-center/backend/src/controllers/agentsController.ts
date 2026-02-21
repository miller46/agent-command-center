import type { Request, Response } from "express";
import { getAgentById, getAgentLogsById, getAgentUsageById, listAgents } from "../services/agentService.js";
import { logError } from "../utils/logger.js";

export const getAgents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const agents = await listAgents();
    res.json({ data: agents });
  } catch (error) {
    logError("Failed to load agents", error);
    res.status(500).json({ error: "Failed to load agents" });
  }
};

export const getAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const agent = await getAgentById(agentId);

    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    res.json({ data: agent });
  } catch (error) {
    logError(`Failed to load agent ${String(req.params.id)}`, error);
    res.status(500).json({ error: "Failed to load agent" });
  }
};

export const getAgentLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const logs = await getAgentLogsById(agentId);

    if (!logs) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    res.json({ data: logs });
  } catch (error) {
    logError(`Failed to load logs for agent ${String(req.params.id)}`, error);
    res.status(500).json({ error: "Failed to load agent logs" });
  }
};

export const getAgentUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const usage = await getAgentUsageById(agentId);

    if (!usage) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    res.json({ data: usage });
  } catch (error) {
    logError(`Failed to load usage for agent ${String(req.params.id)}`, error);
    res.status(500).json({ error: "Failed to load agent usage" });
  }
};
