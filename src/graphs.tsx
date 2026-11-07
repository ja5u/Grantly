import { Compass } from 'lucide-react';
export { ScholarshipNetwork as Radar } from './ScholarshipNetwork';
import type { Scheme } from './domain';
import { match } from './domain';

export type Match = ReturnType<typeof match>;
export type Result = { scheme: Scheme; match: Match };

export function EligibilityGraph({ result }: { result: Match }) {
  const height = Math.max(130, result.rules.length * 48 + 26);
  return (
    <div className="eligibility">
      <svg viewBox={'0 0 480 ' + height} aria-hidden="true">
        {result.rules.map((rule, index) => {
          const y = index * 48 + 36;
          const tone =
            rule.outcome === 'Matched' ? 'pass' : rule.outcome === 'Failed' ? 'fail' : 'unknown';
          const label = rule.label.length > 39 ? rule.label.slice(0, 38) + '…' : rule.label;
          return (
            <g key={rule.field + index} className={tone}>
              <path
                className="edge"
                d={'M228 ' + y + ' C305 ' + y + ' 303 ' + height / 2 + ' 370 ' + height / 2}
              />
              <rect className="rule-box" x="6" y={y - 16} width="222" height="32" rx="8" />
              <text x="17" y={y + 4}>
                {label}
              </text>
            </g>
          );
        })}
        <rect
          x="369"
          y={height / 2 - 21}
          width="105"
          height="42"
          rx="12"
          className="radar-center"
        />
        <text x="421" y={height / 2 + 4} textAnchor="middle" fill="white">
          Scholarship
        </text>
      </svg>
      <ul className="rules">
        {result.rules.map((rule, index) => (
          <li key={rule.field + index}>
            <span>{rule.label}</span>
            <b className={'pill ' + rule.outcome.toLowerCase()}>{rule.outcome}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty">
      <Compass size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
