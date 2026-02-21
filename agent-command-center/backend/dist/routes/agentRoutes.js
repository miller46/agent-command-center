import { Router } from "express";
import { getAgent, getAgentLogs, getAgents, getAgentUsage } from "../controllers/agentsController.js";
const agentRoutes = Router();
agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/agents/:id/logs", getAgentLogs);
agentRoutes.get("/agents/:id/usage", getAgentUsage);
export default agentRoutes;
