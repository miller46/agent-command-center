import type { Skill } from '../types/skill';

export const mockSkills: Record<string, Skill[]> = {
  'agent-1': [
    {
      name: 'code-review',
      description: 'Reviews code for quality and best practices',
      attributes: {
        language: 'typescript',
        strictness: 'high',
        autoFix: true,
        maxFileSize: 5000,
      },
    },
    {
      name: 'api-design',
      description: 'Designs RESTful APIs and GraphQL schemas',
      attributes: {
        protocols: ['REST', 'GraphQL', 'gRPC'],
        auth: 'OAuth2',
        documentation: true,
      },
    },
    {
      name: 'database-migration',
      description: 'Manages database schema migrations',
      attributes: {
        engines: ['PostgreSQL', 'MySQL', 'MongoDB'],
        rollback: true,
        backup: true,
      },
    },
  ],
  'agent-2': [
    {
      name: 'ui-component',
      description: 'Builds reusable UI components',
      attributes: {
        framework: 'React',
        styling: 'Tailwind CSS',
        typescript: true,
        testing: 'vitest',
      },
    },
    {
      name: 'state-management',
      description: 'Manages application state',
      attributes: {
        libraries: ['Redux', 'Zustand', 'React Query'],
        persistence: true,
        devtools: true,
      },
    },
  ],
  'agent-3': [
    {
      name: 'query-optimization',
      description: 'Optimizes database queries for performance',
      attributes: {
        engines: ['PostgreSQL', 'MySQL', 'Redis'],
        indexing: true,
        profiling: true,
      },
    },
    {
      name: 'backup-management',
      description: 'Manages database backups and recovery',
      attributes: {
        schedule: 'daily',
        retention: '30 days',
        encryption: 'AES-256',
      },
    },
  ],
  'agent-4': [
    {
      name: 'ci-cd',
      description: 'Manages continuous integration and deployment',
      attributes: {
        platforms: ['GitHub Actions', 'GitLab CI', 'Jenkins'],
        docker: true,
        kubernetes: true,
      },
    },
    {
      name: 'infrastructure',
      description: 'Manages cloud infrastructure',
      attributes: {
        providers: ['AWS', 'GCP', 'Azure'],
        iac: 'Terraform',
        monitoring: true,
      },
    },
  ],
  'agent-5': [
    {
      name: 'unit-testing',
      description: 'Writes and runs unit tests',
      attributes: {
        frameworks: ['Jest', 'Vitest', 'Mocha'],
        coverage: 90,
        watch: true,
      },
    },
    {
      name: 'e2e-testing',
      description: 'Runs end-to-end tests',
      attributes: {
        frameworks: ['Playwright', 'Cypress'],
        parallel: true,
        screenshot: true,
      },
    },
  ],
};

export const getMockSkills = (agentId: string): Skill[] => {
  return mockSkills[agentId] || [];
};
