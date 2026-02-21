import { getAgentById, getAgentSkill, listAgentSkills, listAgents } from "../services/agentService.js";
import { logError } from "../utils/logger.js";
export const getAgents = async (_req, res) => {
    try {
        const agents = await listAgents();
        res.json({ data: agents });
    }
    catch (error) {
        logError("Failed to load agents", error);
        res.status(500).json({ error: "Failed to load agents" });
    }
};
export const getAgent = async (req, res) => {
    try {
        const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const agent = await getAgentById(agentId);
        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }
        res.json({ data: agent });
    }
    catch (error) {
        logError(`Failed to load agent ${String(req.params.id)}`, error);
        res.status(500).json({ error: "Failed to load agent" });
    }
};
export const getAgentSkills = async (req, res) => {
    try {
        const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const agent = await getAgentById(agentId);
        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }
        const skills = await listAgentSkills(agentId);
        res.json(skills);
    }
    catch (error) {
        logError(`Failed to load skills for agent ${String(req.params.id)}`, error);
        res.status(500).json({ error: "Failed to load agent skills" });
    }
};
export const getAgentSkillByName = async (req, res) => {
    try {
        const agentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const skillName = Array.isArray(req.params.skillName) ? req.params.skillName[0] : req.params.skillName;
        const agent = await getAgentById(agentId);
        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }
        const skill = await getAgentSkill(agentId, skillName);
        if (!skill) {
            res.status(404).json({ error: "Skill not found" });
            return;
        }
        res.json(skill);
    }
    catch (error) {
        logError(`Failed to load skill ${String(req.params.skillName)} for agent ${String(req.params.id)}`, error);
        res.status(500).json({ error: "Failed to load agent skill" });
    }
};
