export type Profile = {
  level?: string;
  course?: string;
  category?: string;
  income?: number;
  state?: string;
  gender?: string;
  disability?: string;
  minority?: string;
  marks?: number;
  year?: number;
  age?: number;
  citizenship?: string;
  regular?: string;
  aid?: string;
  gap?: string;
  percentile?: number;
  documents: string[];
};

export type Rule = {
  field: Exclude<keyof Profile, 'documents'>;
  label: string;
  equals?: string;
  min?: number;
  max?: number;
  above?: number;
  below?: number;
};

export type Scheme = {
  id: string;
  name: string;
  provider: string;
  type: 'Central' | 'State' | 'Private';
  summary: string;
  tags: string[];
  rules: Rule[];
  documents: string[];
  amount?: number;
  benefit?: string;
  deadline?: string;
  source?: string;
  sourceYear?: string;
  sourceChecked?: string;
  guidelines?: string;
  partial?: boolean;
};

export const statuses = [
  'Saved',
  'In progress',
  'Submitted',
  'Under review',
  'Approved',
  'Rejected',
] as const;
export type Status = (typeof statuses)[number];
export type Application = {
  id: string;
  status: Status;
  documents: string[];
  steps: number[];
  applied?: string;
  reviewed?: string;
  result?: string;
  updated: string;
};
export type Workspace = { profile: Profile | null; applications: Application[] };

export function match(profile: Profile | null, scheme: Scheme) {
  const rules = scheme.rules.map((rule) => {
    const actual = profile?.[rule.field];
    let passes = false;
    const missing = actual === undefined || actual === null || actual === '';
    if (!missing) {
      passes =
        typeof actual === 'string'
          ? rule.equals !== undefined && actual.trim().toLowerCase() === rule.equals.toLowerCase()
          : Number.isFinite(actual) &&
            rule.equals === undefined &&
            [rule.min, rule.max, rule.above, rule.below].some((value) => value !== undefined) &&
            (rule.min === undefined || actual >= rule.min) &&
            (rule.max === undefined || actual <= rule.max) &&
            (rule.above === undefined || actual > rule.above) &&
            (rule.below === undefined || actual < rule.below);
    }
    const outcome = missing ? 'Missing' : passes ? 'Matched' : 'Failed';
    const weight = rule.field === 'course' || rule.field === 'level' ? 2 : 1;
    return { ...rule, actual, outcome, weight };
  });
  const matched = rules.filter((rule) => rule.outcome === 'Matched');
  const missing = rules.filter((rule) => rule.outcome === 'Missing');
  const failed = rules.filter((rule) => rule.outcome === 'Failed');
  const total = rules.reduce((sum, rule) => sum + rule.weight, 0);
  const score = total ? matched.reduce((sum, rule) => sum + rule.weight, 0) / total : 0;
  const status = failed.length
    ? 'Not eligible'
    : !profile || !rules.length || scheme.partial || missing.length > 1
      ? 'Needs information'
      : missing.length
        ? 'Almost there'
        : 'Eligible';
  return { rules, matched, missing, failed, score, status };
}

export function daysUntil(date?: string, now = new Date()) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.parse(date);
  return Number.isFinite(target) && new Date(target).toISOString().slice(0, 10) === date
    ? Math.round((target - today) / 86400000)
    : null;
}

export function rank(
  score: number,
  relevance: number | undefined,
  days: number | null,
  amount?: number,
  maxAmount = 0,
) {
  const urgency = days === null || days < 0 ? 0 : Math.max(0, 1 - days / 180);
  if (relevance === undefined) return (0.5 * score + 0.2 * urgency) / 0.7;
  return (
    0.5 * score +
    0.2 * relevance +
    0.2 * urgency +
    0.1 * (maxAmount ? (amount ?? 0) / maxAmount : 0)
  );
}

export function setStatus(application: Application, status: Status, now: string): Application {
  if (status === application.status) return application;
  const review = status === 'Under review';
  const result = status === 'Approved' || status === 'Rejected';
  const submitted = status === 'Submitted' || review || result;
  return {
    ...application,
    status,
    updated: now,
    applied: submitted
      ? (application.applied ?? (status === 'Submitted' ? now : undefined))
      : undefined,
    reviewed: review ? (application.reviewed ?? now) : result ? application.reviewed : undefined,
    result: result ? now : undefined,
  };
}
