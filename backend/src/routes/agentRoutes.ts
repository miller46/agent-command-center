import { Router } from "express";
import { getAgent, getAgentSkills, getAgents } from "../controllers/agentsController.js";

const agentRoutes = Router();

agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/v1/agents/:id/skills", getAgentSkills);

export default agentRoutes;
