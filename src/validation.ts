import * as z from 'zod/mini';
import { statuses } from './domain';

const text = z
  .string()
  .check(
    z.trim(),
    z.minLength(1, 'Enter a value'),
    z.maxLength(200, 'Use 200 characters or fewer'),
  );
const names = z.array(text).check(
  z.maxLength(100),
  z.overwrite((values) => [...new Set(values)]),
);
const optionalNumber = z.optional(z.number());
const yesNo = z.optional(z.enum(['Yes', 'No']));
const percentage = z.optional(
  z.number().check(z.minimum(0, 'Enter 0 or more'), z.maximum(100, 'Enter 100 or less')),
);

export const dateSchema = z.string().check(
  z.regex(/^\d{4}-\d{2}-\d{2}$/),
  z.refine((value) => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
  }, 'Enter a valid calendar date'),
);
export const sourceUrlSchema = z.url().check(
  z.refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  }, 'Source links must use HTTPS without embedded credentials'),
);

export const profileSchema = z.object({
  level: z.optional(text),
  course: z.optional(text),
  category: z.optional(text),
  state: z.optional(text),
  gender: z.optional(text),
  citizenship: z.optional(text),
  disability: yesNo,
  minority: yesNo,
  regular: yesNo,
  aid: yesNo,
  gap: yesNo,
  income: z.optional(
    z.number().check(z.minimum(0, 'Income must be 0 or more'), z.maximum(Number.MAX_SAFE_INTEGER)),
  ),
  marks: percentage,
  percentile: percentage,
  year: z.optional(
    z
      .int()
      .check(z.minimum(1, 'Enter a year from 1 to 12'), z.maximum(12, 'Enter a year from 1 to 12')),
  ),
  age: z.optional(z.int().check(z.minimum(0), z.maximum(120))),
  documents: names,
});
export const applicationSchema = z.object({
  id: text,
  status: z.enum(statuses),
  documents: names,
  steps: z.array(z.int().check(z.minimum(0), z.maximum(100))).check(
    z.maxLength(100),
    z.overwrite((values) => [...new Set(values)]),
  ),
  applied: z.optional(dateSchema),
  reviewed: z.optional(dateSchema),
  result: z.optional(dateSchema),
  updated: dateSchema,
});
export const workspaceSchema = z.object({
  profile: z.nullable(profileSchema),
  applications: z.array(applicationSchema).check(
    z.maxLength(1000),
    z.refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      'Duplicate applications',
    ),
  ),
});
const numericFields = ['income', 'marks', 'percentile', 'year', 'age'] as const;
const categoricalFields = [
  'level',
  'course',
  'category',
  'state',
  'gender',
  'disability',
  'minority',
  'citizenship',
  'regular',
  'aid',
  'gap',
] as const;
const numericRule = z
  .strictObject({
    field: z.enum(numericFields),
    label: text,
    min: optionalNumber,
    max: optionalNumber,
    above: optionalNumber,
    below: optionalNumber,
  })
  .check(
    z.refine(
      (rule) => [rule.min, rule.max, rule.above, rule.below].some((value) => value !== undefined),
      'A numeric rule needs a bound',
    ),
    z.refine(
      (rule) =>
        Math.max(rule.min ?? -Infinity, rule.above ?? -Infinity) <=
        Math.min(rule.max ?? Infinity, rule.below ?? Infinity),
      'Contradictory numeric bounds',
    ),
  );
export const ruleSchema = z.union([
  z.strictObject({ field: z.enum(categoricalFields), label: text, equals: text }),
  numericRule,
]);
export const schemeSchema = z.object({
  id: text,
  name: text,
  provider: text,
  type: z.enum(['Central', 'State', 'Private']),
  summary: z.string().check(z.minLength(1), z.maxLength(3000)),
  tags: names,
  rules: z.array(ruleSchema).check(z.minLength(1), z.maxLength(100)),
  documents: names,
  amount: z.optional(z.number().check(z.minimum(0))),
  benefit: z.optional(text),
  deadline: z.optional(dateSchema),
  source: z.optional(sourceUrlSchema),
  sourceYear: z.optional(text),
  sourceChecked: z.optional(dateSchema),
  guidelines: z.optional(sourceUrlSchema),
  partial: z.optional(z.boolean()),
});
export const catalogueSchema = z
  .array(schemeSchema)
  .check(
    z.refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      'Duplicate scholarship IDs',
    ),
  );
