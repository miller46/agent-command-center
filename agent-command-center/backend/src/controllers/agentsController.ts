import type { Request, Response } from "express";
import { getAgentById, listAgents } from "../services/agentService.js";
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
