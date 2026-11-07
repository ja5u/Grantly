import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Compass, GitBranch, GraduationCap, LayoutList, LockKeyhole, Orbit, Sparkles, UserRound } from 'lucide-react';
import { Apply, Track } from './Applications';
import { Detail, Discover } from './Discover';
import { demoProfile, demoSchemes } from './demo';
import { match, type Scheme } from './domain';
import { Empty, Radar } from './graphs';
import { ProfilePage } from './ProfilePage';
import { StoreProvider, useStore } from './store';
import realSchemes from './scholarships.json';
import './styles.css';

const catalogue = realSchemes as Scheme[];
const features = [
  { icon: Compass, label: 'Discover', description: 'Find opportunities that fit your studies and circumstances.' },
  { icon: GitBranch, label: 'Understand', description: 'See the scholarship rules you match and which details are missing.' },
  { icon: ClipboardCheck, label: 'Apply', description: 'Prepare a document checklist before visiting the official site.' },
  { icon: LayoutList, label: 'Track', description: 'Follow your preparation and record application updates.' },
];

function Shell() {
  const { mode, workspace, warning, switchMode } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [location.pathname]);
  const relevantId = /^\/(?:scholarship|apply)\/([^/]+)/.exec(location.pathname)?.[1]
    ?? new URLSearchParams(location.search).get('scheme') ?? workspace.applications[0]?.id;
  function toggle() {
    switchMode(mode === 'demo' ? 'real' : 'demo');
    navigate('/discover');
  }
  return <><a className="skip" href="#main">Skip to content</a><header><div className="header-inner">
    <Link className="brand" to="/"><span><GraduationCap size={22}/></span>Grantly</Link>
    <nav aria-label="Scholarship journey">
      <NavLink to="/discover"><Compass size={17}/>Discover</NavLink>
      <Link to={relevantId ? '/scholarship/' + relevantId : '/discover'} className={location.pathname.startsWith('/scholarship/') ? 'active' : ''}><GitBranch size={17}/>Understand</Link>
      <Link to={relevantId ? '/apply/' + relevantId : '/discover'} className={location.pathname.startsWith('/apply/') ? 'active' : ''}><ClipboardCheck size={17}/>Apply</Link>
      <NavLink to="/dashboard"><LayoutList size={17}/>Track</NavLink>
    </nav>
    <div className="header-actions"><button className="button demo-toggle" aria-pressed={mode === 'demo'} onClick={toggle}><Sparkles size={16}/> Demo<span className="mode-word"> mode</span></button>
    <Link className="icon-button" aria-label="Your profile" to="/profile"><UserRound size={19}/></Link></div>
  </div></header>
  {mode === 'demo' && <div className="demo-banner"><Sparkles size={14}/> Demo mode · Fictional scholarships and application data</div>}
  {warning && <div role="status" className="demo-banner">Browser storage is unavailable. Changes are kept for this session.</div>}
  <main ref={main} id="main" tabIndex={-1}><Outlet/></main>
  <footer><div><Link className="brand" to="/"><span><GraduationCap size={18}/></span>Grantly</Link><p>Scholarship navigation for students.</p></div><p>Reference data from public sources. Verify current details with the provider. Explore more at <a href="https://www.myscheme.gov.in/" target="_blank" rel="noopener noreferrer">myScheme</a>.</p></footer></>;
}

function Home() {
  const { workspace, switchMode } = useStore();
  const navigate = useNavigate();
  const preview = demoSchemes.slice(0, 6).map(scheme => ({ scheme, match: match(demoProfile, scheme) }));
  function demo(id?: string) {
    switchMode('demo');
    navigate('/discover' + (id ? '?scheme=' + id : ''));
  }
  return <div className="page home"><section className="hero"><div><div className="hero-label"><Orbit size={17}/> SCHOLARSHIP NAVIGATOR</div>
    <h1>Find scholarships<br className="wide"/> that <em>fit you.</em></h1><p>Discover opportunities, understand your eligibility, and take your next step with confidence.</p>
    <div className="actions"><Link className="button primary" to={workspace.profile ? '/discover' : '/onboarding'}>Find my scholarships <ArrowRight size={19}/></Link>
    <button className="button secondary" onClick={() => demo()}><Sparkles size={17}/> Try the demo</button></div>
    <div className="privacy"><LockKeyhole size={16}/> No account. Your profile stays in this browser.</div></div>
    <div className="hero-preview card"><div className="preview-title"><span><Orbit size={17}/> Scholarship radar</span><span className="pill matched">Demo preview</span></div><Radar results={preview} select={demo}/></div>
  </section><section className="feature-grid" aria-label="Your scholarship journey">{features.map(({ icon: Icon, label, description }, index) => <article className="card feature" key={label}><div><Icon size={22}/><span>0{index + 1}</span></div><h2>{label}</h2><p>{description}</p></article>)}</section></div>;
}

function CurrentPage({ kind }: { kind: 'detail' | 'apply' | 'discover' | 'track' }) {
  const { mode, workspace } = useStore();
  const { id } = useParams();
  const schemes = mode === 'demo' ? demoSchemes : catalogue;
  if (kind === 'discover') return <Discover key={mode} schemes={schemes}/>;
  if (kind === 'track') return <Track key={mode} schemes={schemes}/>;
  const scheme = schemes.find(item => item.id === id);
  if (!scheme) return <Missing scholarship/>;
  return kind === 'apply' ? <Apply key={mode + id} scheme={scheme}/> : <Detail result={{ scheme, match: match(workspace.profile, scheme) }}/>;
}
function Missing({ scholarship = false }: { scholarship?: boolean }) {
  return <div className="page narrow"><Empty title={scholarship ? 'Scholarship unavailable' : 'Page not found'} description={scholarship ? 'This scholarship is unavailable in the active catalogue.' : 'This address does not point to a Grantly page.'}/><Link className="button primary" to={scholarship ? '/discover' : '/'}>{scholarship ? 'Back to Discover' : 'Back home'}<ArrowRight size={17}/></Link></div>;
}
function ProfileRoute({ onboarding = false }: { onboarding?: boolean }) {
  const { mode } = useStore();
  return <ProfilePage key={mode + onboarding} onboarding={onboarding}/>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><StoreProvider><Routes>
  <Route element={<Shell/>}><Route index element={<Home/>}/><Route path="onboarding" element={<ProfileRoute onboarding/>}/><Route path="discover" element={<CurrentPage kind="discover"/>}/><Route path="scholarship/:id" element={<CurrentPage kind="detail"/>}/><Route path="apply/:id" element={<CurrentPage kind="apply"/>}/><Route path="dashboard" element={<CurrentPage kind="track"/>}/><Route path="profile" element={<ProfileRoute/>}/><Route path="*" element={<Missing/>}/></Route>
</Routes></StoreProvider></BrowserRouter></StrictMode>);
