import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillsDisplay } from './SkillsDisplay';
import type { Skill } from '../types/skill';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Wrench: () => <span data-testid="wrench-icon">Wrench</span>,
  RefreshCw: () => <span data-testid="refresh-icon">Refresh</span>,
  AlertCircle: () => <span data-testid="alert-icon">Alert</span>,
  ChevronRight: () => <span data-testid="chevron-icon">&gt;</span>,
  Code: () => <span data-testid="code-icon">Code</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
}));

const mockSkills: Skill[] = [
  {
    name: 'code-review',
    description: 'Reviews code for quality',
    attributes: {
      language: 'typescript',
      strictness: 'high',
      autoFix: true,
    },
  },
  {
    name: 'api-design',
    description: 'Designs RESTful APIs',
    attributes: {
      protocols: ['REST', 'GraphQL'],
      auth: 'OAuth2',
    },
  },
];

describe('SkillsDisplay', () => {
  it('renders loading state', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[]}
        loading={true}
        error={null}
      />
    );

    expect(screen.getByText('CAPABILITIES')).toBeInTheDocument();
    expect(screen.getAllByTestId('wrench-icon')).toHaveLength(1);
    // Should show skeleton loaders
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[]}
        loading={false}
        error="Failed to fetch skills"
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Failed to fetch skills')).toBeInTheDocument();
    const retryButton = screen.getByText('RETRY');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders error state without retry button when onRetry not provided', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[]}
        loading={false}
        error="Failed to fetch skills"
      />
    );

    expect(screen.getByText('Failed to fetch skills')).toBeInTheDocument();
    expect(screen.queryByText('RETRY')).not.toBeInTheDocument();
  });

  it('renders empty state when no skills available', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[]}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('NO CAPABILITIES REGISTERED FOR THIS AGENT')).toBeInTheDocument();
  });

  it('renders skills list correctly', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={mockSkills}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('CAPABILITIES')).toBeInTheDocument();
    expect(screen.getByText('2 SKILLS')).toBeInTheDocument();

    // Check skill names are displayed (uppercased)
    expect(screen.getByText('CODE-REVIEW')).toBeInTheDocument();
    expect(screen.getByText('API-DESIGN')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('Reviews code for quality')).toBeInTheDocument();
    expect(screen.getByText('Designs RESTful APIs')).toBeInTheDocument();
  });

  it('expands skill card when clicked', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={mockSkills}
        loading={false}
        error={null}
      />
    );

    const skillHeader = screen.getByText('CODE-REVIEW').closest('[role="button"]');
    expect(skillHeader).toBeInTheDocument();

    // Click to expand
    if (skillHeader) {
      fireEvent.click(skillHeader);
    }

    // Should now show expanded attributes section - use a function matcher for more flexibility
    expect(screen.getByText((content) => content.includes('Attributes'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('language'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('strictness'))).toBeInTheDocument();
  });

  it('toggles skill card expansion on enter key', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={mockSkills}
        loading={false}
        error={null}
      />
    );

    const skillHeader = screen.getByText('CODE-REVIEW').closest('[role="button"]');
    expect(skillHeader).toBeInTheDocument();

    if (skillHeader) {
      fireEvent.keyDown(skillHeader, { key: 'Enter' });
    }

    expect(screen.getByText('Attributes')).toBeInTheDocument();
  });

  it('displays single skill count correctly', () => {
    const singleSkill = [mockSkills[0]];
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={singleSkill}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('1 SKILL')).toBeInTheDocument();
  });

  it('formats array attributes correctly', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={mockSkills}
        loading={false}
        error={null}
      />
    );

    // Find and expand the api-design card
    const skillHeader = screen.getByText('API-DESIGN').closest('[role="button"]');
    if (skillHeader) {
      fireEvent.click(skillHeader);
    }

    // Array should be formatted as comma-separated string - use function matcher
    expect(screen.getByText((content) => content.includes('REST') && content.includes('GraphQL'))).toBeInTheDocument();
  });

  it('formats boolean attributes correctly', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={mockSkills}
        loading={false}
        error={null}
      />
    );

    const skillHeader = screen.getByText('CODE-REVIEW').closest('[role="button"]');
    if (skillHeader) {
      fireEvent.click(skillHeader);
    }

    // Boolean true should be formatted as 'Yes' - use function matcher
    expect(screen.getByText((content) => content === 'Yes')).toBeInTheDocument();
  });

  it('shows +N more for skills with many attributes', () => {
    const skillWithManyAttributes: Skill = {
      name: 'multi-attr-skill',
      description: 'Has many attributes',
      attributes: {
        attr1: 'value1',
        attr2: 'value2',
        attr3: 'value3',
        attr4: 'value4',
        attr5: 'value5',
      },
    };

    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[skillWithManyAttributes]}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });
});
