import { describe, expect, it } from 'vitest';
import {
  catalogueSchema,
  profileSchema,
  ruleSchema,
  sourceUrlSchema,
  workspaceSchema,
} from '../src/validation';
import { daysUntil, match, type Profile } from '../src/domain';
import { demoProfile, demoSchemes, demoWorkspace } from '../src/demo';
import references from '../src/scholarships.json';
import { extractIncome } from '../src/income';

describe('untrusted data boundaries', () => {
  it('validates both catalogues and the demo seed', () => {
    expect(catalogueSchema.safeParse(demoSchemes).success).toBe(true);
    expect(catalogueSchema.safeParse(references).success).toBe(true);
    expect(workspaceSchema.safeParse(demoWorkspace()).success).toBe(true);
  });
  it.each([-1, Infinity, NaN, '240000'])('rejects invalid income %s', (income) => {
    expect(profileSchema.safeParse({ income, documents: [] }).success).toBe(false);
  });
  it('strips unrecognized identity fields', () => {
    expect(
      profileSchema.parse({ documents: [], aadhaar: 'sensitive', password: 'secret' }),
    ).toEqual({ documents: [] });
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,test',
    'http://example.com',
    'https://user:password@example.com',
  ])('rejects unsafe source %s', (url) => {
    expect(sourceUrlSchema.safeParse(url).success).toBe(false);
  });
  it('rejects unknown fields, empty numeric rules, and contradictory bounds', () => {
    expect(ruleSchema.safeParse({ field: 'income', label: 'Income' }).success).toBe(false);
    expect(
      ruleSchema.safeParse({ field: 'income', label: 'Income', min: 300, max: 200 }).success,
    ).toBe(false);
    expect(ruleSchema.safeParse({ field: 'constructor', label: 'Bad', equals: 'x' }).success).toBe(
      false,
    );
  });
  it('rejects invalid statuses and duplicate application records', () => {
    const state = demoWorkspace();
    expect(
      workspaceSchema.safeParse({
        ...state,
        applications: [{ ...state.applications[0], status: 'Invented' }],
      }).success,
    ).toBe(false);
    expect(
      workspaceSchema.safeParse({
        ...state,
        applications: [state.applications[0], state.applications[0]],
      }).success,
    ).toBe(false);
  });
  it('never treats an unexpected numeric category or absent rules as eligible', () => {
    const profile = { ...demoProfile, category: 0 } as unknown as Profile;
    expect(
      match(profile, {
        ...demoSchemes[0],
        rules: [{ field: 'category', equals: 'SC', label: 'SC category' }],
      }).status,
    ).toBe('Not eligible');
    expect(match(demoProfile, { ...demoSchemes[0], rules: [] }).status).toBe('Needs information');
  });
  it('rejects impossible calendar dates', () => {
    expect(daysUntil('2026-02-30')).toBeNull();
    expect(daysUntil('2026-13-01')).toBeNull();
  });
});

describe('income suggestions', () => {
  it.each([
    ['240,000', 240000],
    ['2.4 lakh', 240000],
    ['240000.50', 240000.5],
    ['0', 0],
  ])('parses %s correctly', (input, expected) => {
    expect(extractIncome('Annual family income: INR ' + input).income).toBe(expected);
  });
  it('ignores identity numbers and conflicting annual incomes', () => {
    expect(extractIncome('Identification 123456789012')).toEqual({});
    expect(extractIncome('Annual income: 240000. Annual income: 120000.')).toEqual({});
  });
});
