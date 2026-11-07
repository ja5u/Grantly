import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Application, Profile, Workspace } from './domain';
import { demoWorkspace, newApplication } from './demo';

const empty = (): Workspace => ({ profile: null, applications: [] });
function read<T>(key: string, fallback: () => T, validate: (value: unknown) => boolean): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('grantly:' + key) ?? 'null');
    return validate(value) ? value as T : fallback();
  } catch { return fallback(); }
}
function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const data = value as Workspace;
  return (data.profile === null || (typeof data.profile === 'object' && Array.isArray(data.profile.documents)))
    && Array.isArray(data.applications)
    && data.applications.every(item => item && typeof item.id === 'string' && Array.isArray(item.documents) && Array.isArray(item.steps));
}

function useWorkspace() {
  const [mode, setMode] = useState(() => read<'real' | 'demo'>('mode', () => 'real', value => value === 'real' || value === 'demo'));
  const [real, setReal] = useState(() => read('real:v1', empty, isWorkspace));
  const [demo, setDemo] = useState(() => read('demo:v1', demoWorkspace, isWorkspace));
  const [warning, setWarning] = useState(false);
  const workspace = mode === 'demo' ? demo : real;
  function persist(key: string, value: unknown) {
    try { localStorage.setItem('grantly:' + key, JSON.stringify(value)); }
    catch { setWarning(true); }
  }
  function update(data: Workspace, target = mode) {
    (target === 'demo' ? setDemo : setReal)(data);
    persist(target + ':v1', data);
  }
  return {
    mode, workspace, warning,
    switchMode(value: typeof mode) { setMode(value); persist('mode', value); },
    saveProfile(profile: Profile) { update({ ...workspace, profile }); },
    saveApplication(id: string, change: (item: Application) => Application = item => item) {
      const existing = workspace.applications.find(item => item.id === id);
      const application = change(existing ?? newApplication(id));
      update({ ...workspace, applications: [...workspace.applications.filter(item => item.id !== id), application] });
    },
    saveDocument(id: string, document: string, checked: boolean) {
      const profile = workspace.profile ?? { documents: [] };
      const documents = checked ? [...new Set([...profile.documents, document])] : profile.documents.filter(item => item !== document);
      const application = workspace.applications.find(item => item.id === id) ?? newApplication(id, 'In progress');
      update({
        profile: { ...profile, documents },
        applications: [...workspace.applications.filter(item => item.id !== id), {
          ...application, status: application.status === 'Saved' ? 'In progress' : application.status,
          documents: checked ? [...new Set([...application.documents, document])] : application.documents.filter(item => item !== document),
        }],
      });
    },
    resetDemo() { update(demoWorkspace(), 'demo'); },
    clearReal() { update(empty(), 'real'); },
  };
}
const Store = createContext<ReturnType<typeof useWorkspace> | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  return <Store.Provider value={useWorkspace()}>{children}</Store.Provider>;
}
export function useStore() {
  const store = useContext(Store);
  if (!store) throw new Error('Workspace provider missing');
  return store;
}
