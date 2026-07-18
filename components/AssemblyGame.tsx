'use client';

import { useEffect, useRef, useState } from 'react';
import { createGame, GameApi, STAGES, SEALS } from '@/lib/engine';

type StampState = { text: string; sub: string; fading: boolean; key: number };
type ToastState = { title: string; key: number };

export default function AssemblyGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GameApi | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [cur, setCur] = useState(-1);
  const [done, setDone] = useState<boolean[]>(Array(8).fill(false));
  const [busy, setBusy] = useState(false);
  const [qcVisible, setQcVisible] = useState(false);
  const [qcChecks, setQcChecks] = useState<boolean[]>(Array(6).fill(false));
  const [released, setReleased] = useState(false);
  const [introGone, setIntroGone] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [stamp, setStamp] = useState<StampState | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

    const api = createGame(mountRef.current, {
      onStage(i) {
        setCur(i);
        setBusy(true);
        if (i === 7) setBusy(false);
      },
      onStageDone(i) {
        setDone(d => { const n = [...d]; n[i] = true; return n; });
        setBusy(false);
        if (i === 7) setReleased(true);
      },
      onToast(title) {
        setToast({ title, key: Date.now() });
        later(() => setToast(t => (t && Date.now() - t.key >= 1500 ? null : t)), 1600);
      },
      onStamp(text, sub, hold) {
        const key = Date.now();
        setStamp({ text, sub, fading: false, key });
        later(() => setStamp(s => (s && s.key === key ? { ...s, fading: true } : s)), hold);
        later(() => setStamp(s => (s && s.key === key ? null : s)), hold + 650);
      },
      onQCSpawn() { setQcVisible(true); },
      onQCCheck(sealIndex) {
        setQcChecks(c => { const n = [...c]; n[sealIndex] = true; return n; });
      },
      onReleased() { /* release state handled via onStageDone(7) */ },
    });
    apiRef.current = api;

    const demo = window.location.search.includes('demo');
    later(() => setIntroGone(true), demo ? 1400 : 2600);
    if (demo) later(() => api.startDemo(), 1400);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  const doneCount = done.filter(Boolean).length;
  const stage = STAGES[Math.max(cur, 0)];
  const advanceLabel = released
    ? 'Commission Nº 001 · Released'
    : cur === 7
      ? qcVisible ? 'Certify All Six Seals' : 'Awaiting Inspection'
      : cur === -1
        ? 'Begin Assembly'
        : cur === 6
          ? 'Advance to Sign-Off'
          : 'Advance the Line';

  return (
    <main>
      <div className="stage3d" ref={mountRef} />
      <div className="grain" />

      <header>
        <div className="marque">
          <div className="monogram">A</div>
          <div className="wordmark">AURELIA<small>Coachworks · Est. 1927</small></div>
        </div>
        <div className="line-status"><i />Line Active · Commission Nº 001</div>
      </header>

      <aside className="rail">
        <div className="eyebrow">Build Sequence</div>
        <div className="hairline" />
        {STAGES.map((s, i) => (
          <div
            key={s.t}
            className={`step${i === cur ? ' active' : ''}${done[i] ? ' done' : ''}${i > cur + (introGone ? 1 : 0) ? ' locked' : ''}`}
            onClick={() => { if (i === cur + 1) apiRef.current?.advance(); }}
          >
            <span className="n">0{i + 1}</span>
            <span className="t">{s.t}</span>
            <span className="tick">✓</span>
          </div>
        ))}
      </aside>

      <aside className="card">
        <div className="stageno">
          <span className="eyebrow">Stage 0{Math.max(cur, 0) + 1} / 08</span>
          <span className="eyebrow" style={{ color: 'var(--ink-soft)' }}>Bay Nº {Math.max(cur, 0) + 1}</span>
        </div>
        <h2>{stage.t}</h2>
        <p>{stage.n}</p>
        <div className="craft"><b>CRAFT NOTE</b>{stage.c}</div>

        {qcVisible && (
          <div className="qc">
            {SEALS.map((s, i) => (
              <div key={s.label} className={`check${qcChecks[i] ? ' ok' : ''}`}>
                <span className="box">✓</span>Check 0{i + 1} — {s.label}
              </div>
            ))}
            {!released && <div className="hint">Click each glowing seal on the motor car to certify it.</div>}
          </div>
        )}

        <button
          className="advance"
          disabled={busy || cur === 7 || released}
          onClick={() => apiRef.current?.advance()}
        >
          {advanceLabel}
        </button>
        {!released && cur < 7 && (
          <button className="runline" onClick={() => apiRef.current?.runLine(1.6)}>
            ▸ Run the Full Line
          </button>
        )}
      </aside>

      <footer>
        <div className="progress-row">
          <span className="assembly-label">Assembly</span>
          <div className="bar">
            <i style={{ transform: `scaleX(${doneCount / 8})` }} />
            {STAGES.map((s, i) => (
              <s key={s.t} className={i < doneCount ? 'hit' : ''} style={{ left: `${((i + 1) / 8) * 100}%` }} />
            ))}
          </div>
          <span className="pct">{Math.round((doneCount / 8) * 100)}%</span>
        </div>
        <div className="orbit-hint">Drag to orbit · Scroll to admire the details</div>
      </footer>

      {toast && (
        <div className="toast" key={toast.key}>
          <div className="eyebrow">Now Fitting</div>
          <div className="what">{toast.title}</div>
        </div>
      )}

      {stamp && (
        <div className={`stamp${stamp.fading ? ' fade' : ''}`} key={stamp.key}>
          {stamp.text}
          {stamp.sub && <small>{stamp.sub}</small>}
        </div>
      )}

      <div className={`intro${introGone ? ' gone' : ''}`}>
        <div>
          <div className="monogram reveal">A</div>
          <h1 className="reveal" style={{ animationDelay: '.15s' }}>AURELIA</h1>
          <div className="sub reveal" style={{ animationDelay: '.3s' }}>The Grand Assembly Line</div>
          <div className="rule reveal" style={{ animationDelay: '.45s' }} />
          <div className="begin reveal" style={{ animationDelay: '.6s' }}>
            Every motor car begins as silence and bare metal.
          </div>
        </div>
      </div>
    </main>
  );
}
