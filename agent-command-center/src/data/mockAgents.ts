import type { Agent } from '../types/agent';

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Backend Dev Agent',
    type: 'backend-dev',
    status: 'busy',
    description: 'Handles backend development tasks and API integrations',
    lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: 'agent-2',
    name: 'Frontend Dev Agent',
    type: 'frontend-dev',
    status: 'idle',
    description: 'Builds UI components and handles frontend development',
    lastActive: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: 'agent-3',
    name: 'Database Agent',
    type: 'database',
    status: 'idle',
    description: 'Manages database migrations and queries',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'agent-4',
    name: 'DevOps Agent',
    type: 'devops',
    status: 'error',
    description: 'Handles CI/CD pipelines and deployments',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 'agent-5',
    name: 'Testing Agent',
    type: 'testing',
    status: 'busy',
    description: 'Runs automated tests and quality checks',
    lastActive: new Date(),
  },
];
