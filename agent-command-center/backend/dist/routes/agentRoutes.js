import { Router } from "express";
import { getAgent, getAgentLogs, getAgents, getAgentUsage, } from "../controllers/agentsController.js";
const agentRoutes = Router();
agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/agents/:id/usage", getAgentUsage);
agentRoutes.get("/agents/:id/logs", getAgentLogs);
export default agentRoutes;
