import { Router } from "express";
import { getAgent, getAgents } from "../controllers/agentsController.js";

const agentRoutes = Router();

agentRoutes.get("/agents", getAgents);
agentRoutes.get("/agents/:id", getAgent);

export default agentRoutes;
