import { Router } from "express";
import { getAgent, getAgents, getAgentUsage } from "../controllers/agentsController.js";

const agentRoutes = Router();

agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/agents/:id/usage", getAgentUsage);

export default agentRoutes;
