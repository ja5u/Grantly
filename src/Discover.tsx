import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import { ArrowRight, ExternalLink, List, Orbit, Search, X } from 'lucide-react';
import { daysUntil, match, rank, type Scheme } from './domain';
import { useStore } from './store';
import { EligibilityGraph, Empty, Radar, type Result } from './graphs';

const maxSearchLength = 100;
const allowedAmounts = new Set(['25000', '50000']);

export const rupees = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
export function deadlineText(date?: string) {
  const days = daysUntil(date);
  if (days === null) return 'Deadline unverified';
  if (days < 0) return 'Deadline passed';
  return days === 0 ? 'Due today' : days + ' days left';
}
export function MatchBadge({ result }: { result: Result['match'] }) {
  const tone =
    result.status === 'Eligible'
      ? 'matched'
      : result.status === 'Not eligible'
        ? 'failed'
        : 'missing';
  return <span className={'pill ' + tone}>{result.status}</span>;
}

export function Discover({ schemes }: { schemes: Scheme[] }) {
  const { workspace, mode } = useStore();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'radar' | 'list'>('radar');
  const [limit, setLimit] = useState(18);
  const [intro, setIntro] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!intro) return;
    const timer = setTimeout(() => setIntro(false), 2100);
    return () => clearTimeout(timer);
  }, [intro]);
  const q = (params.get('q') ?? '').slice(0, maxSearchLength);
  const provider = params.get('provider') ?? '';
  const level = params.get('level') ?? '';
  const category = params.get('cat') ?? '';
  const course = params.get('course') ?? '';
  const requestedAmount = params.get('amount') ?? '';
  const amount = allowedAmounts.has(requestedAmount) ? requestedAmount : '';
  const closing = params.has('closing');
  const ready = params.has('ready');
  const includeFailed = params.has('all');
  const selected = params.get('scheme');
  const filterCount = [provider, level, category, course, amount, closing, ready].filter(
    Boolean,
  ).length;
  function change(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, key === 'q' ? value.slice(0, maxSearchLength) : value);
    else next.delete(key);
    setParams(next, { replace });
  }
  const fuse = useMemo(
    () =>
      new Fuse(schemes, {
        keys: ['name', 'provider', 'tags', 'summary'],
        includeScore: true,
        threshold: 0.37,
      }),
    [schemes],
  );
  const relevance = q.trim()
    ? new Map(fuse.search(q.trim()).map((hit) => [hit.item.id, 1 - (hit.score ?? 0)]))
    : undefined;
  const maxAmount = Math.max(0, ...schemes.map((scheme) => scheme.amount ?? 0));
  const filtered = schemes
    .filter((scheme) => {
      const days = daysUntil(scheme.deadline);
      const supports = (field: string, value: string) =>
        !value ||
        scheme.rules.some(
          (rule) => rule.field === field && rule.equals?.toLowerCase() === value.toLowerCase(),
        );
      return (
        (!provider || scheme.type === provider) &&
        supports('level', level) &&
        supports('category', category) &&
        supports('course', course) &&
        (!amount || (scheme.amount ?? 0) >= Number(amount)) &&
        (!closing || (days !== null && days >= 0 && days <= 30)) &&
        (!ready ||
          scheme.documents.every((document) => workspace.profile?.documents.includes(document))) &&
        (!relevance || relevance.has(scheme.id))
      );
    })
    .map((scheme) => ({ scheme, match: match(workspace.profile, scheme) }))
    .sort((a, b) => {
      const score = (item: Result) =>
        rank(
          item.match.score,
          relevance?.get(item.scheme.id),
          daysUntil(item.scheme.deadline),
          item.scheme.amount,
          maxAmount,
        );
      return score(b) - score(a) || a.scheme.name.localeCompare(b.scheme.name);
    });
  const results = filtered.filter((item) => includeFailed || item.match.status !== 'Not eligible');
  const selectedResult = results.find((item) => item.scheme.id === selected);
  const count = results.filter((item) => item.match.status === 'Eligible').length;
  const hidden = filtered.length - results.length;
  const fictionalTotal = results
    .filter((item) => item.match.status === 'Eligible')
    .reduce((sum, item) => sum + (item.scheme.amount ?? 0), 0);
  const fields = ['level', 'course', 'category'] as const;
  const activeFilters = [
    ['provider', provider],
    ['level', level],
    ['course', course],
    ['cat', category],
    ['amount', amount && '₹' + amount + '+'],
    ['closing', closing && 'Closing this month'],
    ['ready', ready && 'Documents ready'],
  ] as const;
  return (
    <section className="page network-page">
      <div className="eyebrow">01 / Discover</div>
      <h1>
        A world of possibilities<span className="period">.</span>
      </h1>
      <p className="lede">
        You’re at the center. Follow the connections to find your next opportunity.
      </p>
      {!workspace.profile && (
        <div className="notice">
          You’re browsing without a profile.{' '}
          <Link to="/onboarding">
            Add your details <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <div className="discovery-grid">
        <aside className="card filters" aria-label="Discovery filters">
          <h2>Refine your search</h2>
          <label>
            Search scholarships
            <div className="search">
              <Search size={18} />
              <input
                value={q}
                maxLength={maxSearchLength}
                placeholder="Name, course, provider…"
                onChange={(event) => change('q', event.target.value, true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') change('q', '', true);
                }}
              />
            </div>
          </label>
          <label>
            Provider type
            <select value={provider} onChange={(event) => change('provider', event.target.value)}>
              <option value="">All providers</option>
              {['Central', 'State', 'Private'].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          {fields.map((field) => {
            const options = [
              ...new Set(
                schemes.flatMap((scheme) =>
                  scheme.rules
                    .filter((rule) => rule.field === field && rule.equals)
                    .map((rule) => rule.equals!),
                ),
              ),
            ].sort();
            if (!options.length) return null;
            const key = field === 'category' ? 'cat' : field;
            return (
              <label key={field}>
                {field === 'level' ? 'Education level' : field === 'course' ? 'Course' : 'Category'}
                <select
                  value={params.get(key) ?? ''}
                  onChange={(event) => change(key, event.target.value)}
                >
                  <option value="">All</option>
                  {options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            );
          })}
          {schemes.some((scheme) => scheme.amount) && (
            <label>
              Minimum award
              <select value={amount} onChange={(event) => change('amount', event.target.value)}>
                <option value="">Any amount</option>
                <option value="25000">₹25,000</option>
                <option value="50000">₹50,000</option>
              </select>
            </label>
          )}
          {schemes.some((scheme) => scheme.deadline) && (
            <label className="check">
              <input
                type="checkbox"
                checked={closing}
                onChange={(event) => change('closing', event.target.checked ? '1' : '')}
              />{' '}
              Closing this month
            </label>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={ready}
              onChange={(event) => change('ready', event.target.checked ? '1' : '')}
            />{' '}
            Documents I already have
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={includeFailed}
              onChange={(event) => change('all', event.target.checked ? '1' : '')}
            />{' '}
            Include not eligible{hidden > 0 ? ' (' + hidden + ')' : ''}
          </label>
          {(filterCount > 0 || q) && (
            <button className="button text" onClick={() => setParams({})}>
              Reset search and filters
            </button>
          )}
        </aside>
        <div className="card discovery-card">
          <div className="discovery-head">
            <div>
              <div className="eyebrow">
                {mode === 'demo' ? 'Illustrative demo catalogue' : 'Source-linked catalogue'}
              </div>
              <h2 aria-live="polite">
                {results.length} {results.length === 1 ? 'opportunity' : 'opportunities'}
                {count > 0 && <span> · {count} eligible</span>}
              </h2>
            </div>
            <div className="segmented" aria-label="Display mode">
              <button aria-pressed={view === 'radar'} onClick={() => setView('radar')}>
                <Orbit size={17} /> Network
              </button>
              <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
                <List size={17} /> List
              </button>
            </div>
          </div>
          {mode === 'demo' && fictionalTotal > 0 && (
            <p className="funding-counter">
              {rupees(fictionalTotal)} in one-time sample awards across {count} eligible demo
              matches
            </p>
          )}
          {filterCount > 0 && (
            <div className="chips">
              {activeFilters.map(
                ([key, value]) =>
                  value && (
                    <button key={key} className="pill" onClick={() => change(key, '')}>
                      {value}
                      <X size={14} />
                    </button>
                  ),
              )}
            </div>
          )}
          {results.length === 0 ? (
            <Empty
              title="No matching opportunities"
              description="Try removing a filter, changing your search, or showing scholarships with failed conditions."
            />
          ) : view === 'radar' ? (
            <>
              <div className={intro ? 'scan-preview' : undefined}>
                <Radar
                  results={results.slice(0, limit)}
                  selected={selected ?? undefined}
                  select={(id) => change('scheme', id)}
                />
                {intro && (
                  <button className="button secondary skip-scan" onClick={() => setIntro(false)}>
                    Skip radar scan
                  </button>
                )}
              </div>
              <div className="legend">
                <span className="pass">Eligible</span>
                <span className="unknown">Almost there / needs information</span>
                <span className="fail">Not eligible</span>
              </div>
            </>
          ) : (
            <div className="results">
              {results.slice(0, limit).map((result) => (
                <button
                  className="result"
                  key={result.scheme.id}
                  onClick={() => change('scheme', result.scheme.id)}
                >
                  <div>
                    <span className="eyebrow">
                      {result.scheme.type} / {result.scheme.provider}
                    </span>
                    <strong>{result.scheme.name}</strong>
                    <small>{deadlineText(result.scheme.deadline)}</small>
                  </div>
                  <MatchBadge result={result.match} />
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          )}
          {results.length > limit && (
            <button className="button secondary more" onClick={() => setLimit(limit + 18)}>
              Show more
            </button>
          )}
        </div>
      </div>
      {selectedResult && (
        <DetailDialog result={selectedResult} close={() => change('scheme', '', true)} />
      )}
    </section>
  );
}

function DetailDialog({ result, close }: { result: Result; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      queueMicrotask(() => {
        if (
          !dialog.open &&
          trigger?.isConnected &&
          (trigger instanceof HTMLElement || trigger instanceof SVGElement)
        )
          trigger.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={result.scheme.name + ' details'}
      className="drawer"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="drawer-inner">
        <button
          className="icon-button close"
          aria-label="Close scholarship details"
          onClick={close}
        >
          <X size={23} />
        </button>
        <Detail result={result} panel />
      </div>
    </dialog>
  );
}

export function Detail({ result, panel = false }: { result: Result; panel?: boolean }) {
  const { scheme, match: outcome } = result;
  const { workspace, mode, saveApplication } = useStore();
  const saved = workspace.applications.some((item) => item.id === scheme.id);
  return (
    <article className={panel ? 'detail' : 'page narrow detail'}>
      <div className="eyebrow">02 / Understand</div>
      <h1>{scheme.name}</h1>
      <p className="lede">
        {scheme.provider} · {scheme.type}
      </p>
      <div className="actions">
        <MatchBadge result={outcome} />
        {mode === 'demo' && <span className="pill demo">Fictional scholarship</span>}
      </div>
      <div className="fact-strip">
        <div>
          <span>Award</span>
          <strong>
            {scheme.amount ? rupees(scheme.amount) : (scheme.benefit ?? 'See provider details')}
          </strong>
          {scheme.amount && <small>{scheme.benefit}</small>}
        </div>
        <div>
          <span>Application window</span>
          <strong>{deadlineText(scheme.deadline)}</strong>
          {scheme.sourceYear && <small>Reference {scheme.sourceYear}</small>}
        </div>
      </div>
      <h2>What is it?</h2>
      <p>{scheme.summary}</p>
      <h2>How your profile matches</h2>
      <p>
        {outcome.matched.length} of {outcome.rules.length} listed conditions matched. The score
        measures rule fit.
      </p>
      {scheme.partial && (
        <p className="notice">
          This reference lists selected criteria. Check the provider’s complete, current
          requirements.
        </p>
      )}
      <EligibilityGraph result={outcome} />
      {outcome.missing.length > 0 && (
        <p className="notice">
          Add details for {outcome.missing.map((rule) => rule.label.toLowerCase()).join(', ')}.{' '}
          <Link to="/profile">Edit profile</Link>
        </p>
      )}
      <h2>Documents to prepare</h2>
      <ul className="plain">
        {scheme.documents.map((document) => (
          <li key={document}>
            {document}
            {workspace.profile?.documents.includes(document) && (
              <span className="pill matched">On hand</span>
            )}
          </li>
        ))}
      </ul>
      <div className="actions">
        <Link className="button primary" to={'/apply/' + scheme.id}>
          Start application <ArrowRight size={17} />
        </Link>
        {panel && (
          <Link className="button secondary" to={'/scholarship/' + scheme.id}>
            Full details
          </Link>
        )}
        <button
          className="button secondary"
          disabled={saved}
          onClick={() => saveApplication(scheme.id)}
        >
          {saved ? 'Saved to Track' : 'Save scholarship'}
        </button>
        {scheme.source && (
          <a className="button text" href={scheme.source} target="_blank" rel="noopener noreferrer">
            Official source <ExternalLink size={16} />
          </a>
        )}
      </div>
      {scheme.guidelines && (
        <p>
          <a href={scheme.guidelines} target="_blank" rel="noopener noreferrer">
            Published guidelines
          </a>
        </p>
      )}
      {scheme.sourceChecked && <p className="fine">Source reviewed {scheme.sourceChecked}.</p>}
      {mode === 'real' && (
        <p className="fine">
          Sample catalogue from public sources. Verify details on the official site before applying.
        </p>
      )}
    </article>
  );
}
