import type { Request, Response } from "express";
import {
  getAgentById,
  listAgentRuns,
  listAgentsFromConfig,
  listAgentSkills,
  parseRunsQuery,
} from "../services/agentService.js";
import { logError } from "../utils/logger.js";

export const getAgents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const agents = await listAgentsFromConfig();
    res.json(agents);
  } catch (error) {
    logError("Failed to load agents from openclaw config", error);
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

export const getAgentSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const nameQuery = req.query.name;
    const skillNameFilter = Array.isArray(nameQuery) ? nameQuery[0] : nameQuery;

    const skills = await listAgentSkills(
      agentId,
      typeof skillNameFilter === "string" && skillNameFilter.length > 0
        ? skillNameFilter
        : undefined,
    );

    res.json({ data: skills });
  } catch (error) {
    logError(`Failed to load skills for agent ${String(req.params.id)}`, error);
    res.status(500).json({ error: "Failed to load agent skills" });
  }
};

export const getAgentRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseRunsQuery(req.query as Record<string, unknown>);

    if (!query.valid) {
      res.status(400).json({ error: query.error });
      return;
    }

    const result = await listAgentRuns(query.value);
    res.json({
      data: result.data,
      pagination: result.pagination,
      filters: result.filters,
    });
  } catch (error) {
    logError("Failed to load agent runs", error);
    res.status(500).json({ error: "Failed to load agent runs" });
  }
};
