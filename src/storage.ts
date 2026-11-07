import * as z from 'zod/mini';
import { workspaceSchema } from './validation';
import type { Workspace } from './domain';

export const modeSchema = z.enum(['real', 'demo']);
export function readStored<T>(
  key: string,
  schema: z.ZodMiniType<T>,
  fallback: () => T,
): { data: T; recovered: boolean } {
  try {
    const raw = localStorage.getItem('grantly:' + key);
    if (raw === null) return { data: fallback(), recovered: false };
    const result = schema.safeParse(JSON.parse(raw));
    return result.success
      ? { data: result.data, recovered: false }
      : { data: fallback(), recovered: true };
  } catch {
    return { data: fallback(), recovered: true };
  }
}
export function readWorkspace(key: string, fallback: () => Workspace) {
  return readStored(key + ':v1', workspaceSchema, fallback);
}
export function writeStored(key: string, data: unknown) {
  try {
    localStorage.setItem('grantly:' + key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
