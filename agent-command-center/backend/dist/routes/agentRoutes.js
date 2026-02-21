import { Router } from "express";
import { getAgent, getAgentSkillByName, getAgentSkills, getAgents } from "../controllers/agentsController.js";
const agentRoutes = Router();
agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);
agentRoutes.get("/agents/:id/skills", getAgentSkills);
agentRoutes.get("/agents/:id/skills/:skillName", getAgentSkillByName);
export default agentRoutes;
