import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Application, Profile, Workspace } from './domain';
import { demoWorkspace, localDate, newApplication } from './demo';
import { applicationSchema, profileSchema } from './validation';
import { modeSchema, readStored, readWorkspace, writeStored } from './storage';

type Mode = 'real' | 'demo';
type State = { mode: Mode; real: Workspace; demo: Workspace; recovered: boolean };
type Action =
  | { type: 'mode'; mode: Mode }
  | { type: 'profile'; mode: Mode; profile: Profile }
  | { type: 'application'; mode: Mode; id: string; change: (item: Application) => Application }
  | { type: 'document'; mode: Mode; id: string; document: string; checked: boolean; today: string }
  | { type: 'reset'; mode: Mode; workspace: Workspace };

const empty = (): Workspace => ({ profile: null, applications: [] });
function initialState(): State {
  const real = readWorkspace('real', empty);
  const demo = readWorkspace('demo', demoWorkspace);
  const mode = readStored('mode', modeSchema, () => 'real' as const);
  return {
    real: real.data,
    demo: demo.data,
    mode: mode.data,
    recovered: real.recovered || demo.recovered || mode.recovered,
  };
}

function reducer(state: State, action: Action): State {
  if (action.type === 'mode') return { ...state, mode: action.mode };
  const workspace = state[action.mode];
  let next: Workspace;
  switch (action.type) {
    case 'reset':
      next = action.workspace;
      break;
    case 'profile':
      next = { ...workspace, profile: profileSchema.parse(action.profile) };
      break;
    case 'application': {
      const existing =
        workspace.applications.find((item) => item.id === action.id) ?? newApplication(action.id);
      const application = applicationSchema.parse({ ...action.change(existing), id: action.id });
      next = {
        ...workspace,
        applications: [
          ...workspace.applications.filter((item) => item.id !== action.id),
          application,
        ],
      };
      break;
    }
    case 'document': {
      const profile = workspace.profile ?? { documents: [] };
      const documents = action.checked
        ? [...new Set([...profile.documents, action.document])]
        : profile.documents.filter((item) => item !== action.document);
      const application =
        workspace.applications.find((item) => item.id === action.id) ??
        newApplication(action.id, 'In progress');
      const applications = [
        ...workspace.applications.filter((item) => item.id !== action.id),
        application,
      ].map((item) => ({
        ...item,
        documents: action.checked
          ? [...new Set([...item.documents, action.document])]
          : item.documents.filter((document) => document !== action.document),
        status:
          item.id === action.id && item.status === 'Saved' ? ('In progress' as const) : item.status,
        updated: item.id === action.id ? action.today : item.updated,
      }));
      next = { profile: { ...profile, documents }, applications };
      break;
    }
  }
  return { ...state, [action.mode]: next };
}

function useWorkspace() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [warning, setWarning] = useState(false);
  const previous = useRef(state);
  useEffect(() => {
    // Persist changed namespaces only; retain malformed originals until the user edits.
    let saved = true;
    for (const mode of ['real', 'demo'] as const) {
      if (previous.current[mode] !== state[mode])
        saved = writeStored(mode + ':v1', state[mode]) && saved;
    }
    if (previous.current.mode !== state.mode) saved = writeStored('mode', state.mode) && saved;
    previous.current = state;
    if (!saved) setWarning(true);
  }, [state]);
  return useMemo(
    () => ({
      mode: state.mode,
      workspace: state[state.mode],
      warning,
      recovered: state.recovered,
      switchMode(mode: Mode) {
        dispatch({ type: 'mode', mode });
      },
      saveProfile(profile: Profile) {
        dispatch({ type: 'profile', mode: state.mode, profile });
      },
      saveApplication(id: string, change: (item: Application) => Application = (item) => item) {
        dispatch({ type: 'application', mode: state.mode, id, change });
      },
      saveDocument(id: string, document: string, checked: boolean) {
        dispatch({ type: 'document', mode: state.mode, id, document, checked, today: localDate() });
      },
      resetDemo() {
        dispatch({ type: 'reset', mode: 'demo', workspace: demoWorkspace() });
      },
      clearReal() {
        dispatch({ type: 'reset', mode: 'real', workspace: empty() });
      },
    }),
    [state, warning],
  );
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
