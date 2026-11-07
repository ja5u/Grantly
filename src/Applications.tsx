import { useState } from 'react';
import { ArrowRight, Check, ClipboardList, Clock, ExternalLink, FileCheck2, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { daysUntil, match, setStatus, statuses, type Application, type Profile, type Scheme, type Status } from './domain';
import { documentHints, localDate, newApplication } from './demo';
import { deadlineText, rupees } from './Discover';
import { Empty } from './graphs';
import { useStore } from './store';

const steps = ['Check the provider’s current rules and application window', 'Complete the official form and attach requested documents'];
const stages = ['Documents ready', 'Form filled', 'Submitted', 'Under review', 'Result'];
const statusClass = (status: Status) => status.toLowerCase().replaceAll(' ', '-');

function StatusBadge({ status }: { status: Status }) {
  const Icon = status === 'Approved' ? Check : status === 'Rejected' ? X : status === 'Submitted' ? Send : status === 'Under review' ? Clock : ClipboardList;
  return <span className={'pill application-status ' + statusClass(status)}><Icon size={14}/>{status}</span>;
}

export function Apply({ scheme }: { scheme: Scheme }) {
  const { workspace, saveDocument, saveApplication, mode } = useStore();
  const [simulation, setSimulation] = useState(false);
  const existing = workspace.applications.find(item => item.id === scheme.id);
  const item = existing ?? newApplication(scheme.id);
  const documents = workspace.profile?.documents ?? [];
  const ready = scheme.documents.filter(document => documents.includes(document)).length;
  const percent = scheme.documents.length ? Math.round(100 * ready / scheme.documents.length) : 100;
  const completed = [percent === 100, steps.every((_, index) => item.steps.includes(index)), !!item.applied, !!item.reviewed, !!item.result];
  const status = (value: Status) => saveApplication(scheme.id, application => setStatus(application, value, localDate()));
  return <section className="page">
    <div className="eyebrow">03 / Apply {mode === 'demo' && ' / Fictional scholarship'}</div><h1>Prepare your application<span className="period">.</span></h1><p className="lede">{scheme.name}</p>
    <div className="apply-grid"><article className="card form-card"><div className="section-title"><div><div className="eyebrow">Document packet</div><h2>Your preparation checklist</h2></div><div className="progress-ring" style={{ background: 'conic-gradient(var(--green) ' + percent + '%, #e6ebe3 0)' }}><b>{percent}%</b></div></div>
      <p>Mark the documents you have. The checklist stores document names and carries them across your applications.</p>
      <ul className="checklist">{scheme.documents.map(document => <li key={document}><label className="check"><input type="checkbox" checked={documents.includes(document)} onChange={event => saveDocument(scheme.id, document, event.target.checked)}/><span><strong>{document}</strong><small>{documentHints[document] ?? 'Check the current document instructions from the provider.'}</small></span></label></li>)}</ul>
      {percent === 100 && <p className="notice"><FileCheck2 size={18}/> Packet ready. Review the official instructions before applying.</p>}
      <h2>Application steps</h2><ol className="checklist">{steps.map((step, index) => <li key={step}><label className="check"><input type="checkbox" checked={item.steps.includes(index)} onChange={event => {
        const checked = event.target.checked;
        saveApplication(scheme.id, current => ({ ...current, status: current.status === 'Saved' ? 'In progress' : current.status, steps: checked ? [...new Set([...current.steps, index])] : current.steps.filter(value => value !== index), updated: localDate() }));
      }}/><span>{step}</span></label></li>)}</ol>
    </article><aside className="card form-card"><div className="eyebrow">Application handoff</div><h2>{mode === 'demo' ? 'Practice the handoff' : 'Continue on the official site'}</h2><p>Record submission after you send your application on the provider’s site. Grantly tracks updates you enter.</p>
      {scheme.source && <a className="button secondary" href={scheme.source} target="_blank" rel="noopener noreferrer">Open official site <ExternalLink size={16}/></a>}
      {!scheme.source && <button className="button secondary" onClick={() => setSimulation(true)}>Simulate application</button>}
      {simulation && <p role="status" className="notice">Fictional handoff complete. You can record a simulated submission.</p>}
      <div className="actions">{!item.applied && (item.status === 'Saved' || item.status === 'In progress') && <button className="button primary" onClick={() => status('Submitted')}>I’ve submitted <Send size={16}/></button>}
      {existing && <StatusBadge status={item.status}/>}</div>
      <Link className="button text" to="/dashboard">Open Track <ArrowRight size={16}/></Link>
    </aside></div>
    <article className="card form-card"><h2>Application journey</h2><ol className="journey">{stages.map((stage, index) => <li key={stage} className={completed[index] ? 'done' : ''}><span>{completed[index] ? <Check size={16}/> : index + 1}</span><strong>{stage}</strong><small>{completed[index] ? 'Recorded' : 'Pending'}</small></li>)}</ol></article>
  </section>;
}

function Timeline({ records, profile }: { records: { item: Application; scheme: Scheme }[]; profile: Profile | null }) {

  const events = records.flatMap(({ item, scheme }) => {
    const outcome = match(profile, scheme);
    const events = [
      { date: item.applied, kind: 'Submitted' },
      { date: item.reviewed, kind: 'Under review' },
      { date: item.result, kind: item.status },
      { date: !item.applied && (daysUntil(scheme.deadline) ?? -1) >= 0 ? scheme.deadline : undefined, kind: 'Deadline' },
    ];
    return events.flatMap(event => event.date ? [{ date: event.date, kind: event.kind, id: scheme.id, name: scheme.name, strength: outcome.score }] : []);
  });
  const offsets = events.map(event => daysUntil(event.date) ?? 0);
  const min = Math.min(-7, ...offsets);
  const max = Math.max(7, ...offsets);
  const width = 850;
  const x = (day: number) => 150 + (day - min) / (max - min) * 650;
  const height = Math.max(128, records.length * 43 + 60);
  const undated = records.filter(({ item }) => !events.some(event => event.id === item.id));
  return <><div className="timeline-chart"><svg viewBox={'0 0 ' + width + ' ' + height} aria-hidden="true">
    <line x1={x(0)} x2={x(0)} y1="27" y2={height - 12} className="today-line"/><text x={x(0)} y="17" textAnchor="middle">Today</text>
    {records.map(({ scheme }, index) => {
      const y = 44 + index * 43;
      const row = events.filter(event => event.id === scheme.id);
      return <g key={scheme.id}><text x="4" y={y + 4}>{scheme.name.length > 19 ? scheme.name.slice(0, 18) + '…' : scheme.name}</text>
        <line x1="146" x2="818" y1={y} y2={y} className="track-line"/>
        {row.length > 1 && <line x1={x(daysUntil(row[0].date) ?? 0)} x2={x(daysUntil(row[row.length - 1].date) ?? 0)} y1={y} y2={y} className="track-connection"/>}
        {row.map(event => {
          const size = 9 + 12 * Math.sqrt(event.strength);
          return <rect key={event.kind} x={x(daysUntil(event.date) ?? 0) - size / 2} y={y - size / 2} width={size} height={size} rx="3" className={'event ' + event.kind.toLowerCase().replaceAll(' ', '-')}><title>{event.name} · {event.kind} · {event.date}</title></rect>;
        })}
      </g>;
    })}
  </svg></div>
  <ul className="timeline-events" aria-label="Dated application events">{events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(event => <li key={event.id + event.kind}><time dateTime={event.date}>{event.date}</time><Link to={'/apply/' + event.id}>{event.name}</Link><span>{event.kind}</span></li>)}</ul>
  {undated.length > 0 && <p className="fine">Undated · {undated.map(({ scheme }) => scheme.name).join(', ')}</p>}</>;
}

export function Track({ schemes }: { schemes: Scheme[] }) {
  const { workspace, mode, saveApplication } = useStore();
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(false);
  const records = workspace.applications.flatMap(item => {
    const scheme = schemes.find(scheme => scheme.id === item.id);
    return scheme ? [{ item, scheme }] : [];
  }).sort((a, b) => b.item.updated.localeCompare(a.item.updated));
  const visible = records.filter(({ item }) => !filter || item.status === filter);
  const latest = expanded ? visible : visible.slice(0, 12);
  const awarded = records.filter(({ item }) => item.status === 'Approved');
  const demoAwards = awarded.reduce((sum, { scheme }) => sum + (scheme.amount ?? 0), 0);
  const next = records.find(({ item }) => item.status === 'Saved' || item.status === 'In progress');
  const review = records.find(({ item }) => item.applied && (daysUntil(item.applied) ?? 0) <= -30 && (item.status === 'Submitted' || item.status === 'Under review'));
  return <section className="page"><div className="eyebrow">04 / Track</div><h1>Your application timeline<span className="period">.</span></h1><p className="lede">Follow the applications you’re preparing and the outcomes you’ve recorded.</p>
    <div className="card next-actions"><div><div className="eyebrow">Next action</div><h2>{next ? 'Continue ' + next.scheme.name : review ? 'Check for an update' : 'Explore scholarship matches'}</h2><p>{next ? 'Review your preparation checklist before opening the official site.' : review ? review.scheme.name + ' was submitted at least 30 days ago.' : 'Save a scholarship or start preparing an application to track it here.'}</p></div><Link className="button primary" to={next ? '/apply/' + next.item.id : review ? '/apply/' + review.item.id : '/discover'}>{next ? 'Open checklist' : review ? 'Open application' : 'Discover scholarships'}<ArrowRight size={17}/></Link></div>
    <article className="card form-card"><div className="section-title"><div><div className="eyebrow">Student-reported progress</div><h2>Application history</h2><p>{records.length} tracked · {awarded.length} approved · {records.filter(({ item }) => item.status === 'Rejected').length} rejected{mode === 'demo' && demoAwards > 0 ? ' · ' + rupees(demoAwards) + ' fictional awarded amount' : ''}</p></div>
      <label>Status filter<select value={filter} onChange={event => setFilter(event.target.value)}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></div>
      {latest.length ? <Timeline records={latest} profile={workspace.profile}/> : <Empty title="No applications to show" description="Saved scholarships and preparation progress will appear here."/>}
      {visible.length > 12 && <button className="button secondary" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show recent only' : 'Show earlier applications'}</button>}
    </article>
    {latest.length > 0 && <div className="applications">{latest.map(({ item, scheme }) => <article className="card application-card" key={item.id}><div><span className="eyebrow">{scheme.type}</span><h3><Link to={'/apply/' + item.id}>{scheme.name}</Link></h3><p>{deadlineText(scheme.deadline)}</p></div>
      <StatusBadge status={item.status}/><label>Update status<select value={item.status} onChange={event => { const value = event.target.value as Status; saveApplication(item.id, application => setStatus(application, value, localDate())); }}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
      {item.status === 'Rejected' && <Link className="button text" to={'/discover?provider=' + scheme.type}>Find similar scholarships <ArrowRight size={16}/></Link>}
    </article>)}</div>}
  </section>;
}


