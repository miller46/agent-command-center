import { Router } from "express";
import { getAgent, getAgentSessionLogs, getAgents } from "../controllers/agentsController.js";

const agentRoutes = Router();

agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/agents/:id/logs", getAgentSessionLogs);

export default agentRoutes;
