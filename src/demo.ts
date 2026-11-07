import type { Application, Profile, Scheme, Workspace } from './domain.ts';

export const demoProfile: Profile = { level: 'Undergraduate', course: 'Engineering', category: 'OBC', income: 240000, state: 'Telangana', gender: 'Male', marks: 86, year: 1, documents: ['Income certificate'] };
const base = { provider: 'Illustrative scholarship provider', documents: ['Income certificate', 'Marksheet', 'Admission letter'], summary: 'A fictional scholarship that shows how profile matching and application preparation work.', tags: ['student aid'] };
const level = { field: 'level', label: 'Undergraduate study', equals: 'Undergraduate' } as const;
const income = { field: 'income', label: 'Family income up to ₹3 lakh', max: 300000 } as const;
const course = { field: 'course', label: 'Engineering course', equals: 'Engineering' } as const;
const demo = (id: string, name: string, type: Scheme['type'], rules: Scheme['rules'], amount: number, days: number): Scheme => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return { ...base, id, name, type, rules, amount, benefit: 'One-time sample award', deadline: localDate(deadline) };
};
export function localDate(date = new Date()) {
  const part = (value: number) => String(value).padStart(2, '0');
  return [date.getFullYear(), part(date.getMonth() + 1), part(date.getDate())].join('-');
}
export const demoSchemes = [
  demo('horizon', 'Horizon Engineering Grant', 'Central', [level, course, income], 50000, 6),
  demo('pathways', 'Pathways Access Award', 'State', [level, income, { field: 'state', label: 'Telangana residence', equals: 'Telangana' }], 24000, 22),
  demo('orbit', 'Orbit Merit Scholarship', 'Private', [level, { field: 'marks', label: 'At least 80% in the last exam', min: 80 }], 75000, 42),
  demo('bridge', 'Bridge First-Year Bursary', 'Private', [level, { field: 'year', label: 'First year of study', min: 1, max: 1 }], 30000, 16),
  demo('vector', 'Vector Technical Fellowship', 'Private', [level, course, { field: 'regular', label: 'Regular course attendance', equals: 'Yes' }], 60000, 60),
  demo('access', 'Open Access Study Grant', 'Central', [level, { field: 'disability', label: 'Student with a disability', equals: 'Yes' }], 36000, 85),
  demo('step', 'Step Forward School Award', 'State', [{ field: 'level', label: 'School education', equals: 'School' }, income], 12000, 10),
  demo('lantern', 'Lantern Women in STEM Award', 'Private', [level, course, { field: 'gender', label: 'Women students', equals: 'Female' }], 40000, 120),
  demo('meridian', 'Meridian Degree Grant', 'Central', [level, { field: 'marks', label: 'At least 90% in the last exam', min: 90 }], 18000, 39),
];
export function newApplication(id: string, status: Application['status'] = 'Saved'): Application {
  return { id, status, documents: [], steps: [], updated: localDate() };
}
export function demoWorkspace(): Workspace {
  const stages = ['In progress', 'Submitted', 'Under review', 'Approved', 'Rejected', 'Saved'] as const;
  return {
    profile: { ...demoProfile, documents: [...demoProfile.documents] },
    applications: stages.map((status, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index * 9 - 2);
      const applied = index >= 1 && index <= 4 ? localDate(date) : undefined;
      date.setDate(date.getDate() + 6);
      return {
        ...newApplication(demoSchemes[index].id, status), applied,
        reviewed: index === 2 ? localDate(date) : undefined,
        result: index === 3 || index === 4 ? localDate(date) : undefined,
        documents: index >= 1 && index <= 4 ? ['Marksheet', 'Admission letter'] : [],
        steps: index >= 1 && index <= 4 ? [0, 1] : [],
      };
    }),
  };
}

export const documentHints: Record<string, string> = {
  'Income certificate': 'Request an annual family income certificate from your local revenue authority.',
  Marksheet: 'Keep the marksheet issued by your school or examination board ready.',
  'Admission letter': 'Use the admission confirmation issued by your institution.',
};
