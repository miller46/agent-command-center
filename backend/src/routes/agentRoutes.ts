import { Router } from "express";
import { getAgent, getAgentRuns, getAgents } from "../controllers/agentsController.js";

const agentRoutes = Router();

agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/v1/agents/runs", getAgentRuns);

export default agentRoutes;
