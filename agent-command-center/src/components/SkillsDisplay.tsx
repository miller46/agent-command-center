import React from 'react';
import type { Skill } from '../types/skill';
import { Wrench, RefreshCw, AlertCircle, ChevronRight, Code, Settings } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
  index: number;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, index }) => {
  const [expanded, setExpanded] = React.useState(false);

  const getAttributeIcon = (key: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      language: <Code size={14} />,
      framework: <Code size={14} />,
      libraries: <Code size={14} />,
      engines: <Settings size={14} />,
      platforms: <Settings size={14} />,
      providers: <Settings size={14} />,
    };
    return iconMap[key] || <ChevronRight size={14} />;
  };

  const formatAttributeValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const attributeEntries = Object.entries(skill.attributes);

  return (
    <div
      className={`skill-card matrix-card matrix-border-glow transition-all duration-300 ${
        expanded ? 'ring-1 ring-[#00FF41]' : ''
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(!expanded);
          }
        }}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[#00FF41] flex items-center justify-center bg-[#001100]">
              <Wrench size={20} className="text-[#00FF41]" />
            </div>
            <div>
              <h3 className="font-mono text-[#00FF41] matrix-glow-subtle text-lg">
                {skill.name.toUpperCase()}
              </h3>
              {skill.description && (
                <p className="text-sm text-[#008F11] font-mono mt-1 line-clamp-2">
                  {skill.description}
                </p>
              )}
            </div>
          </div>
          <div
            className={`text-[#00FF41] transition-transform duration-300 ${
              expanded ? 'rotate-90' : ''
            }`}
          >
            <ChevronRight size={20} />
          </div>
        </div>

        {/* Attribute Preview (collapsed) */}
        {!expanded && attributeEntries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#003B00]">
            <div className="flex flex-wrap gap-2">
              {attributeEntries.slice(0, 3).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs font-mono text-[#008F11] bg-[#001100] px-2 py-1 border border-[#003B00]"
                >
                  {key}: {formatAttributeValue(value)}
                </span>
              ))}
              {attributeEntries.length > 3 && (
                <span className="text-xs font-mono text-[#008F11] px-2 py-1">
                  +{attributeEntries.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Attributes */}
      {expanded && attributeEntries.length > 0 && (
        <div className="px-4 pb-4 border-t border-[#003B00] pt-3">
          <h4 className="text-xs font-mono text-[#008F11] mb-3 uppercase tracking-wider">
            Attributes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attributeEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start gap-2 p-2 bg-[#001100] border border-[#003B00]"
              >
                <span className="text-[#008F11] mt-0.5">{getAttributeIcon(key)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#008F11] font-mono uppercase">{key}</p>
                  <p className="text-sm text-[#00FF41] font-mono truncate">
                    {formatAttributeValue(value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SkillsDisplayProps {
  agentId: string;
  skills: Skill[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({
  skills,
  loading,
  error,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="skills-display">
        <div className="flex items-center gap-3 mb-6">
          <Wrench size={20} className="text-[#00FF41]" />
          <h2 className="text-lg font-mono text-[#00FF41] matrix-glow-subtle">
            CAPABILITIES
          </h2>
          <div className="flex-1 border-b border-[#003B00] ml-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="matrix-card p-4 border border-[#003B00] animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#003B00]" />
                <div className="flex-1">
                  <div className="h-5 bg-[#003B00] rounded w-1/3 mb-2" />
                  <div className="h-3 bg-[#003B00] rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skills-display">
        <div className="flex items-center gap-3 mb-6">
          <Wrench size={20} className="text-[#00FF41]" />
          <h2 className="text-lg font-mono text-[#00FF41] matrix-glow-subtle">
            CAPABILITIES
          </h2>
          <div className="flex-1 border-b border-[#003B00] ml-4" />
        </div>
        <div className="matrix-card p-6 border border-[#FF4136] text-center">
          <AlertCircle size={32} className="text-[#FF4136] mx-auto mb-3" />
          <p className="text-[#FF4136] font-mono mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="matrix-button px-4 py-2 text-sm flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              RETRY
            </button>
          )}
        </div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="skills-display">
        <div className="flex items-center gap-3 mb-6">
          <Wrench size={20} className="text-[#00FF41]" />
          <h2 className="text-lg font-mono text-[#00FF41] matrix-glow-subtle">
            CAPABILITIES
          </h2>
          <div className="flex-1 border-b border-[#003B00] ml-4" />
        </div>
        <div className="matrix-card p-6 border border-[#003B00] text-center">
          <p className="text-[#008F11] font-mono">NO CAPABILITIES REGISTERED FOR THIS AGENT</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-display">
      <div className="flex items-center gap-3 mb-6">
        <Wrench size={20} className="text-[#00FF41]" />
        <h2 className="text-lg font-mono text-[#00FF41] matrix-glow-subtle">
          CAPABILITIES
        </h2>
        <div className="flex-1 border-b border-[#003B00] ml-4" />
        <span className="text-xs font-mono text-[#008F11]">
          {skills.length} SKILL{skills.length !== 1 ? 'S' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, index) => (
          <SkillCard key={skill.name} skill={skill} index={index} />
        ))}
      </div>
    </div>
  );
};

export default SkillsDisplay;
