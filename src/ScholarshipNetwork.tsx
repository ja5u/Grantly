import { useId, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  GraduationCap,
  Maximize,
  Minus,
  Move,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { Result } from './graphs';

type Point = { x: number; y: number };
const center = { x: 460, y: 330 };
const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function ScholarshipNetwork({
  results,
  select,
  selected,
}: {
  results: Result[];
  select: (id: string) => void;
  selected?: string;
}) {
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const gesture = useRef<{ id?: string; start: Point; origin: Point; moved: boolean } | null>(null);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<string>();
  const active = selected ?? hover;
  const focused = results.find((item) => item.scheme.id === active);
  const nodes = results.map((item, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(results.length, 1);
    const radius = 205 + (1 - item.match.score) * 40;
    const point = positions[item.scheme.id] ?? {
      x: center.x + Math.cos(angle) * radius * 1.35,
      y: center.y + Math.sin(angle) * radius,
    };
    const tone =
      item.match.status === 'Eligible'
        ? 'eligible'
        : item.match.status === 'Not eligible'
          ? 'ineligible'
          : 'incomplete';
    return { ...item, ...point, tone };
  });

  function point(event: PointerEvent): Point {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }
  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    const target = (event.target as Element).closest('[data-node]')?.getAttribute('data-node');
    const node = nodes.find((item) => item.scheme.id === target);
    gesture.current = {
      id: target ?? undefined,
      start: point(event),
      origin: node ?? pan,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current;
    if (!current) return;
    const next = point(event);
    const delta = { x: next.x - current.start.x, y: next.y - current.start.y };
    if (Math.hypot(delta.x, delta.y) < 5 && !current.moved) return;
    current.moved = true;
    const position = { x: current.origin.x + delta.x / zoom, y: current.origin.y + delta.y / zoom };
    if (current.id) setPositions((old) => ({ ...old, [current.id!]: position }));
    else setPan(position);
  }
  function finish(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (current?.id && !current.moved) select(current.id);
  }
  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPositions({});
  }

  return (
    <div className="scholarship-network">
      <div className="network-topline">
        <span>
          <span className="live-dot" /> YOUR OPPORTUNITY MAP
        </span>
        <span>{results.length} connections</span>
      </div>
      <div className="network-viewport">
        <svg
          ref={svg}
          viewBox="0 0 920 660"
          role="group"
          aria-label="Interactive scholarship network. Drag nodes or the canvas. Select a scholarship to explore its rules."
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={() => {
            gesture.current = null;
          }}
        >
          <defs>
            <pattern id={id + '-dots'} width="23" height="23" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r=".8" fill="#b2ccbf" />
            </pattern>
            <radialGradient id={id + '-glow'}>
              <stop stopColor="#c9ebd8" stopOpacity=".75" />
              <stop offset="1" stopColor="#f5f9f5" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={id + '-core'} x2="1" y2="1">
              <stop stopColor="#258169" />
              <stop offset="1" stopColor="#0b4036" />
            </linearGradient>
          </defs>
          <rect width="920" height="660" fill={'url(#' + id + '-dots)'} />
          <g
            transform={
              'translate(460 330) scale(' +
              zoom +
              ') translate(' +
              (pan.x - 460) +
              ' ' +
              (pan.y - 330) +
              ')'
            }
          >
            <circle cx="460" cy="330" r="290" fill={'url(#' + id + '-glow)'} />
            {[125, 205, 275].map((radius) => (
              <ellipse
                key={radius}
                cx="460"
                cy="330"
                rx={radius * 1.35}
                ry={radius}
                className="network-orbit"
              />
            ))}
            {nodes.map((node) => {
              const highlighted = active === node.scheme.id;
              const path =
                'M460 330 Q' +
                ((460 + node.x) / 2 + (node.y - 330) * 0.16) +
                ' ' +
                (330 + node.y) / 2 +
                ' ' +
                node.x +
                ' ' +
                node.y;
              return (
                <g
                  key={node.scheme.id}
                  className={
                    'network-connection ' +
                    node.tone +
                    (highlighted ? ' highlighted' : '') +
                    (active && !highlighted ? ' subdued' : '')
                  }
                >
                  <path d={path} className="connection-shadow" />
                  <path d={path} className="connection-line" />
                  {highlighted && <path d={path} className="connection-flow" />}
                  <circle
                    cx={(460 + node.x) / 2}
                    cy={(330 + node.y) / 2}
                    r="13"
                    className="connection-marker"
                  />
                  <text
                    x={(460 + node.x) / 2}
                    y={(330 + node.y) / 2 + 4}
                    textAnchor="middle"
                    className="connection-count"
                  >
                    {node.match.matched.length}/{node.match.rules.length}
                  </text>
                </g>
              );
            })}
            <g className="network-core">
              <circle cx="460" cy="330" r="66" className="core-halo" />
              <circle cx="460" cy="330" r="53" fill={'url(#' + id + '-core)'} />
              <GraduationCap x="442" y="297" width="36" height="36" color="white" />
              <text x="460" y="354" textAnchor="middle">
                YOU
              </text>
              <rect x="405" y="397" width="110" height="25" rx="12.5" fill="white" />
              <text x="460" y="414" textAnchor="middle" className="core-caption">
                Your profile
              </text>
            </g>
            {nodes.map((node) => {
              const activeNode = active === node.scheme.id;
              const shortName =
                node.scheme.name.length > 30
                  ? node.scheme.name.slice(0, 28) + '…'
                  : node.scheme.name;
              const size = 24 + node.match.score * 8;
              return (
                <g
                  key={node.scheme.id}
                  data-node={node.scheme.id}
                  transform={'translate(' + node.x + ' ' + node.y + ')'}
                  className={
                    'network-node ' +
                    node.tone +
                    (activeNode ? ' highlighted' : '') +
                    (active && !activeNode ? ' subdued' : '')
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={node.scheme.name + ', ' + node.match.status}
                  onMouseEnter={() => setHover(node.scheme.id)}
                  onMouseLeave={() => setHover(undefined)}
                  onFocus={() => setHover(node.scheme.id)}
                  onBlur={() => setHover(undefined)}
                  onClick={(event) => {
                    if (event.detail === 0) select(node.scheme.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      select(node.scheme.id);
                    }
                  }}
                >
                  <title>
                    {node.scheme.name} · {node.match.status} · {node.match.matched.length} of{' '}
                    {node.match.rules.length} conditions matched
                  </title>
                  <circle r={size + 8} className="node-aura" />
                  <circle r={size} className="node-body" />
                  {node.match.status === 'Eligible' ? (
                    <Check x="-13" y="-13" width="26" height="26" />
                  ) : (
                    <GraduationCap x="-13" y="-13" width="26" height="26" />
                  )}
                  <rect x="-114" y="45" width="228" height="58" rx="12" className="node-label" />
                  <text y="68" textAnchor="middle" className="node-name">
                    {shortName}
                  </text>
                  <text y="87" textAnchor="middle" className="node-meta">
                    {node.scheme.amount ? '₹' + money.format(node.scheme.amount) + ' · ' : ''}
                    {node.match.status}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="network-controls" aria-label="Network controls">
          <button
            aria-label="Zoom in"
            disabled={zoom >= 1.8}
            onClick={() => setZoom((value) => Math.min(1.8, value + 0.2))}
          >
            <Plus size={18} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom out"
            disabled={zoom <= 0.6}
            onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}
          >
            <Minus size={18} />
          </button>
          <button aria-label="Reset network view" onClick={reset}>
            <Maximize size={17} />
          </button>
        </div>
      </div>
      <div className="network-insight" aria-live="polite">
        <div className="insight-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <strong>{focused ? focused.scheme.name : 'Every connection tells you why.'}</strong>
          <p>
            {focused
              ? focused.match.matched.length +
                ' matched · ' +
                focused.match.missing.length +
                ' missing · ' +
                focused.match.failed.length +
                ' failed conditions'
              : 'Hover or focus a node to trace its connection. Select it to explore the eligibility rules.'}
          </p>
        </div>
        {focused && (
          <button
            className="icon-button"
            aria-label="Explore highlighted scholarship"
            onClick={() => select(focused.scheme.id)}
          >
            <ArrowUpRight size={18} />
          </button>
        )}
      </div>
      <div className="network-hint">
        <Move size={14} /> Drag to rearrange · Edge labels show matched / total conditions · Larger
        nodes show stronger rule fit
      </div>
    </div>
  );
}
