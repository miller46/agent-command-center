import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillsDisplay } from './SkillsDisplay';
import type { Skill } from '../types/skill';

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
      enabled: false,
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
  it('renders loading skeleton', () => {
    render(<SkillsDisplay agentId="agent-1" skills={[]} loading={true} error={null} />);

    expect(screen.getByText('CAPABILITIES')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders error state and retries when callback is provided', () => {
    const onRetry = vi.fn();
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[]}
        loading={false}
        error="Failed to fetch skills"
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByText('RETRY'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when no retry callback is provided', () => {
    render(
      <SkillsDisplay
        agentId="agent-1"
        skills={[]}
        loading={false}
        error="Failed to fetch skills"
      />,
    );

    expect(screen.queryByText('RETRY')).not.toBeInTheDocument();
  });

  it('renders empty state when no skills exist', () => {
    render(<SkillsDisplay agentId="agent-1" skills={[]} loading={false} error={null} />);

    expect(screen.getByText('NO CAPABILITIES REGISTERED FOR THIS AGENT')).toBeInTheDocument();
  });

  it('renders skills and pluralized count', () => {
    render(<SkillsDisplay agentId="agent-1" skills={mockSkills} loading={false} error={null} />);

    expect(screen.getByText('2 SKILLS')).toBeInTheDocument();
    expect(screen.getByText('CODE-REVIEW')).toBeInTheDocument();
    expect(screen.getByText('API-DESIGN')).toBeInTheDocument();
  });

  it('renders singular count for a single skill', () => {
    render(<SkillsDisplay agentId="agent-1" skills={[mockSkills[0]]} loading={false} error={null} />);

    expect(screen.getByText('1 SKILL')).toBeInTheDocument();
  });

  it('expands and collapses skill card with keyboard interactions', () => {
    render(<SkillsDisplay agentId="agent-1" skills={mockSkills} loading={false} error={null} />);

    const skillHeader = screen.getByText('CODE-REVIEW').closest('[role="button"]');
    expect(skillHeader).toBeInTheDocument();
    if (!skillHeader) return;

    fireEvent.keyDown(skillHeader, { key: 'Enter' });
    expect(screen.getByText('Attributes')).toBeInTheDocument();

    fireEvent.keyDown(skillHeader, { key: ' ' });
    expect(screen.queryByText('Attributes')).not.toBeInTheDocument();
  });

  it('formats array and boolean attributes in expanded view', () => {
    render(<SkillsDisplay agentId="agent-1" skills={mockSkills} loading={false} error={null} />);

    const skillHeader = screen.getByText('CODE-REVIEW').closest('[role="button"]');
    if (!skillHeader) return;
    fireEvent.click(skillHeader);

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();

    const apiHeader = screen.getByText('API-DESIGN').closest('[role="button"]');
    if (!apiHeader) return;
    fireEvent.click(apiHeader);

    expect(screen.getByText((content) => content.includes('REST') && content.includes('GraphQL'))).toBeInTheDocument();
  });

  it('shows +N preview label for skills with many attributes', () => {
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
      />,
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('does not render an empty description element when description is missing', () => {
    const noDescriptionSkill: Skill = {
      name: 'minimal-skill',
      attributes: { language: 'typescript' },
    };

    render(<SkillsDisplay agentId="agent-1" skills={[noDescriptionSkill]} loading={false} error={null} />);

    expect(screen.getByText('MINIMAL-SKILL')).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });
});
