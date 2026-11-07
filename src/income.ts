import type { Profile } from './domain';

/** Only an explicitly labelled annual income may become a profile suggestion. */
export function extractIncome(text: string): Partial<Profile> {
  const pattern =
    /(?:annual\s+(?:family\s+)?income|family\s+annual\s+income)\s*(?:is|of|:|=)?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)\s*(lakh(?:s)?|lac(?:s)?|crore(?:s)?|thousand)?\b/gi;
  const amounts = [...text.matchAll(pattern)].map((found) => {
    const unit = found[2]?.toLowerCase();
    const multiplier = unit?.startsWith('la')
      ? 100000
      : unit?.startsWith('crore')
        ? 10000000
        : unit === 'thousand'
          ? 1000
          : 1;
    return Number(found[1].replaceAll(',', '')) * multiplier;
  });
  if (
    !amounts.length ||
    amounts.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0 ||
        value > Number.MAX_SAFE_INTEGER ||
        value !== amounts[0],
    )
  )
    return {};
  return { income: amounts[0], documents: ['Income certificate'] };
}
