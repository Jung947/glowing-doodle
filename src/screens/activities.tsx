import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Activity, Domain, Option } from '../types';
import { speak } from '../lib/speech';
import { playCorrect, playWrong } from '../lib/audio';

interface RProps {
  activity: Activity;
  domain: Domain;
  onComplete: (stars: number) => void;
}

// ---------- shared prompt with TTS ----------
function Prompt({ text, domain, speakText }: { text: string; domain: Domain; speakText?: string }) {
  const say = speakText ?? text;
  useEffect(() => {
    speak(say);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say]);
  const noncog = domain === 'noncognitive';
  return (
    <div className={`prompt${noncog ? ' prompt--noncog' : ''}`}>
      <button
        className={`prompt__spk${noncog ? ' prompt__spk--noncog' : ''}`}
        onClick={() => speak(say)}
        aria-label="문제 읽어주기"
      >
        🔊
      </button>
      <p>{text}</p>
    </div>
  );
}

// progress "문제 i / N"
function QProgress({ i, n }: { i: number; n: number }) {
  return (
    <div className="q-progress" aria-label={`문제 ${i} / ${n}`}>
      <span>
        문제 {i} <b>/ {n}</b>
      </span>
      <div className="q-progress__bar">
        {Array.from({ length: n }, (_, k) => (
          <i key={k} className={k < i ? 'filled' : ''} />
        ))}
      </div>
    </div>
  );
}

function starsFromWrong(wrong: number): number {
  return wrong === 0 ? 3 : wrong <= 2 ? 2 : 1;
}

function Feedback({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <div className={`feedback feedback--${good ? 'good' : 'bad'} pop`} role="status">
      {children}
    </div>
  );
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- choice / reading / scenario (multi-question set) ----------
function ChoiceActivity({ activity, domain, onComplete }: RProps) {
  const questions = activity.questions ?? [];
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongTotal, setWrongTotal] = useState(0);

  const q = questions[qIndex];
  const scenario = activity.type === 'scenario';
  const isNumeric = q.options.every((o) => /^\d+$/.test(o.label.trim()));
  const correctPicked = picked != null && q.options[picked]?.correct;
  const isLast = qIndex === questions.length - 1;

  function choose(i: number) {
    if (correctPicked) return;
    setPicked(i);
    if (q.options[i].correct) {
      playCorrect();
    } else {
      playWrong();
      setWrongTotal((w) => w + 1);
    }
  }

  function advance() {
    if (isLast) {
      onComplete(starsFromWrong(wrongTotal));
    } else {
      setQIndex((n) => n + 1);
      setPicked(null);
    }
  }

  function optionClass(i: number, o: Option): string {
    let c = 'option';
    if (isNumeric) c += ' option--num';
    if (picked === i) {
      c += o.correct ? ' option--correct' : ' option--wrong';
    } else if (correctPicked && o.correct) {
      c += ' option--correct';
    }
    return c;
  }

  return (
    <div className="stack">
      <QProgress i={qIndex + 1} n={questions.length} />
      <Prompt
        text={q.prompt}
        domain={domain}
        speakText={q.passage ? `${q.passage} ${q.prompt}` : q.prompt}
      />
      {q.passage && <div className="passage">{q.passage}</div>}
      {q.visual && <div className="visual">{q.visual}</div>}

      <div className={`option-grid${isNumeric && q.options.length === 4 ? ' option-grid--2' : ''}`}>
        {q.options.map((o, i) => (
          <button key={i} className={optionClass(i, o)} onClick={() => choose(i)}>
            {o.label}
          </button>
        ))}
      </div>

      {picked != null &&
        (correctPicked ? (
          <Feedback good>
            {scenario ? '멋진 생각이에요! 💛' : '잘했어요! 딩동댕 🔔'}
            {scenario && q.encouragement ? ` ${q.encouragement}` : ''}
          </Feedback>
        ) : (
          <Feedback good={false}>
            {scenario ? '다시 한 번 생각해 볼까요? 🤔' : '다시 골라볼까요? 🤔'}
          </Feedback>
        ))}

      <button
        className={`btn btn--block btn--lg ${domain === 'noncognitive' ? 'btn--noncog' : ''}`}
        disabled={!correctPicked}
        onClick={advance}
      >
        {!correctPicked ? '정답을 골라요' : isLast ? '완료하기 🎉' : '다음 문제 →'}
      </button>
    </div>
  );
}

// ---------- matching ----------
function MatchingActivity({ activity, domain, onComplete }: RProps) {
  const pairs = activity.pairs ?? [];
  const [rights] = useState(() => shuffled(pairs.map((p) => p.right)));
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState(false);

  const leftMatched = (l: string) => l in matched;
  const rightMatched = (r: string) => Object.values(matched).includes(r);
  const allDone = Object.keys(matched).length === pairs.length;

  function pickRight(r: string) {
    if (!selLeft || rightMatched(r)) return;
    const pair = pairs.find((p) => p.left === selLeft);
    if (pair && pair.right === r) {
      playCorrect();
      setMatched((m) => ({ ...m, [selLeft]: r }));
      setSelLeft(null);
      setWrong(false);
    } else {
      playWrong();
      setWrong(true);
      setSelLeft(null);
    }
  }

  return (
    <div className="stack">
      <Prompt text={activity.prompt} domain={domain} />
      <div className="match-cols">
        <div className="stack">
          {pairs.map((p) => (
            <button
              key={p.left}
              className={`match-item${selLeft === p.left ? ' match-item--sel' : ''}${
                leftMatched(p.left) ? ' match-item--matched' : ''
              }`}
              disabled={leftMatched(p.left)}
              onClick={() => setSelLeft(p.left)}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="stack">
          {rights.map((r) => (
            <button
              key={r}
              className={`match-item${rightMatched(r) ? ' match-item--matched' : ''}`}
              disabled={rightMatched(r)}
              onClick={() => pickRight(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {wrong && !allDone && <Feedback good={false}>짝이 아니에요. 다시 해봐요 🤔</Feedback>}
      {allDone && <Feedback good>모두 맞혔어요! 🎉</Feedback>}
      <button
        className="btn btn--block btn--lg"
        disabled={!allDone}
        onClick={() => onComplete(3)}
      >
        {allDone ? '다음으로 →' : '짝을 모두 맞혀요'}
      </button>
    </div>
  );
}

// ---------- sequence ----------
function SequenceActivity({ activity, domain, onComplete }: RProps) {
  const seq = activity.sequence ?? [];
  const [tiles] = useState(() => shuffled(seq));
  const [answer, setAnswer] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const done = answer.length === seq.length;

  function tap(t: string) {
    if (answer.includes(t) || done) return;
    if (t === seq[answer.length]) {
      playCorrect();
      setAnswer((a) => [...a, t]);
      setWrong(false);
    } else {
      playWrong();
      setWrong(true);
      setAnswer([]);
    }
  }

  return (
    <div className="stack">
      <Prompt text={`${activity.prompt} ${activity.sequencePrompt ?? ''}`} domain={domain} />
      <div className="seq-answer" aria-label="내 답">
        {answer.length === 0 ? (
          <span style={{ background: 'none', color: 'var(--muted)', fontWeight: 700 }}>
            순서대로 눌러요
          </span>
        ) : (
          answer.map((a, i) => <span key={a}>{i + 1}. {a}</span>)
        )}
      </div>
      <div className="seq-tiles">
        {tiles.map((t) => (
          <button
            key={t}
            className={`seq-tile${answer.includes(t) ? ' seq-tile--picked' : ''}`}
            disabled={answer.includes(t)}
            onClick={() => tap(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {wrong && <Feedback good={false}>순서가 달라요. 처음부터 다시! 🔄</Feedback>}
      {done && <Feedback good>순서를 완성했어요! 🎉</Feedback>}
      <button className="btn btn--block btn--lg" disabled={!done} onClick={() => onComplete(3)}>
        {done ? '다음으로 →' : '순서를 완성해요'}
      </button>
    </div>
  );
}

// ---------- memory ----------
function MemoryActivity({ activity, domain, onComplete }: RProps) {
  const seq = activity.memory ?? [];
  const [phase, setPhase] = useState<'show' | 'input' | 'done'>('show');
  const [lit, setLit] = useState<number | null>(null);
  const [tapped, setTapped] = useState<number[]>([]);
  const [round, setRound] = useState(0); // increments to replay
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setPhase('show');
    setTapped([]);
    setLit(null);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    seq.forEach((cell, i) => {
      timers.current.push(
        window.setTimeout(() => setLit(cell), 700 * i + 400),
      );
      timers.current.push(
        window.setTimeout(() => setLit(null), 700 * i + 900),
      );
    });
    timers.current.push(
      window.setTimeout(() => setPhase('input'), 700 * seq.length + 600),
    );
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function tap(cell: number) {
    if (phase !== 'input') return;
    const idx = tapped.length;
    if (cell === seq[idx]) {
      playCorrect();
      const next = [...tapped, cell];
      setTapped(next);
      if (next.length === seq.length) {
        setPhase('done');
      }
    } else {
      playWrong();
      setTapped([]);
      setRound((r) => r + 1); // replay the sequence
    }
  }

  return (
    <div className="stack">
      <Prompt text={activity.prompt} domain={domain} />
      <div className="center muted" style={{ fontWeight: 800, fontSize: 13 }}>
        {phase === 'show' ? '👀 잘 보세요…' : phase === 'input' ? '이제 순서대로 눌러요!' : '완성!'}
      </div>
      <div className="memory-grid">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((cell) => {
          const isLit = lit === cell;
          const isTapped = tapped.includes(cell);
          return (
            <button
              key={cell}
              className={`mem${isLit ? ' mem--lit' : ''}${isTapped ? ' mem--tapped' : ''}`}
              onClick={() => tap(cell)}
              aria-label={`칸 ${cell}`}
            >
              {isTapped ? tapped.indexOf(cell) + 1 : ''}
            </button>
          );
        })}
      </div>
      <div className="seq-progress" aria-hidden="true">
        {seq.map((_, i) => (
          <i key={i} className={i < tapped.length ? 'filled' : ''}>
            {i + 1}
          </i>
        ))}
      </div>
      {phase === 'done' && <Feedback good>기억력 최고! 🎉</Feedback>}
      <button
        className={`btn btn--block btn--lg ${domain === 'noncognitive' ? 'btn--noncog' : ''}`}
        disabled={phase !== 'done'}
        onClick={() => onComplete(3)}
      >
        {phase === 'done' ? '다음으로 →' : '순서를 기억해요'}
      </button>
    </div>
  );
}

// ---------- checklist ----------
function ChecklistActivity({ activity, domain, onComplete }: RProps) {
  const items = activity.items ?? [];
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === items.length;

  function toggle(i: number) {
    setChecked((c) => {
      const next = [...c];
      next[i] = !next[i];
      if (next[i]) playCorrect();
      return next;
    });
  }

  return (
    <div className="stack">
      <Prompt text={activity.prompt} domain={domain} />
      {items.map((label, i) => (
        <button key={i} className="check-row" onClick={() => toggle(i)}>
          <span className="check-row__icon" aria-hidden="true">
            {label.split(' ')[0]}
          </span>
          <span className="check-row__label">{label.replace(/^\S+\s/, '')}</span>
          <span className={`checkbox${checked[i] ? ' checkbox--done' : ''}`} />
        </button>
      ))}
      <div className="center" style={{ fontWeight: 800, fontSize: 12.5, color: 'var(--noncog)' }}>
        {doneCount}/{items.length} 완료{' '}
        {allDone ? `· ${activity.encouragement ?? '스스로 해냈어요!'}` : '· 스스로 해봐요'}
      </div>
      <button
        className="btn btn--block btn--lg btn--noncog"
        disabled={!allDone}
        onClick={() => onComplete(3)}
      >
        {allDone ? '오늘 도장 받기 🏅' : '모두 체크하면 도장!'}
      </button>
    </div>
  );
}

// ---------- tenframe: 20칸 수배열판 "10 만들기" 덧셈 ----------
function optionsForSum(total: number): Option[] {
  const set = new Set<number>([total]);
  const candidates = [total - 1, total + 1, total - 2, total + 2, total + 3];
  for (const c of candidates) {
    if (set.size >= 4) break;
    if (c > 0) set.add(c);
  }
  const arr = shuffled([...set]).slice(0, 4);
  if (!arr.includes(total)) arr[0] = total;
  return shuffled(arr).map((n) => ({ label: String(n), correct: n === total }));
}

function TenFrameActivity({ activity, onComplete }: RProps) {
  const sums = activity.sums ?? [];
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'place' | 'made' | 'answered'>('place');
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongTotal, setWrongTotal] = useState(0);
  const [options, setOptions] = useState<Option[]>([]);

  const { a, b } = sums[idx];
  const need = Math.max(0, 10 - a); // 윗줄을 채우는 데 필요한 수
  const moved = Math.min(need, b); // 아랫줄에서 윗줄로 옮기는 수
  const topCount = phase === 'place' ? a : a + moved; // 윗줄 채워진 칸 수
  const bottomCount = phase === 'place' ? b : b - moved; // 아랫줄 남은 칸 수
  const total = a + b;
  const isLast = idx === sums.length - 1;

  function makeTen() {
    setPhase('made');
    setOptions(optionsForSum(total));
  }
  function choose(n: number) {
    if (phase !== 'made') return;
    setPicked(n);
    if (n === total) {
      playCorrect();
      setPhase('answered');
    } else {
      playWrong();
      setWrongTotal((w) => w + 1);
    }
  }
  function advance() {
    if (isLast) {
      onComplete(starsFromWrong(wrongTotal));
    } else {
      setIdx((n) => n + 1);
      setPhase('place');
      setPicked(null);
    }
  }

  // top row cell kind: 'a' (원래 윗줄), 'moved' (아랫줄에서 올라온 수), '' (빈칸)
  function topKind(i: number): string {
    if (i < a) return 'tf--a';
    if (i < topCount) return 'tf--moved';
    return '';
  }

  return (
    <div className="stack">
      <QProgress i={idx + 1} n={sums.length} />
      <Prompt
        text={
          phase === 'place'
            ? `${a} 더하기 ${b}. 윗줄을 먼저 10으로 채워요.`
            : `10 하고 ${bottomCount}은 모두 몇일까요?`
        }
        domain="cognitive"
      />

      <div className="tenframe" role="img" aria-label={`${a} 더하기 ${b}`}>
        <div className="tenframe__row">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`tf-cell ${topKind(i)}`} />
          ))}
        </div>
        <div className="tenframe__row">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`tf-cell ${i < bottomCount ? 'tf--b' : ''}`} />
          ))}
        </div>
      </div>

      <div className="tf-eq">
        {phase === 'place' ? (
          <>
            {a} <span className="tf-op">+</span> {b} <span className="tf-op">=</span> ?
          </>
        ) : (
          <>
            <b>10</b> <span className="tf-op">+</span> <b>{bottomCount}</b>{' '}
            <span className="tf-op">=</span> ?
          </>
        )}
      </div>

      {phase === 'place' ? (
        <button className="btn btn--block btn--lg" onClick={makeTen}>
          윗줄 채우기 (10 만들기) ⬆️
        </button>
      ) : (
        <>
          <div className="option-grid option-grid--2">
            {options.map((o, i) => {
              const n = Number(o.label);
              let cls = 'option option--num';
              if (picked === n) cls += o.correct ? ' option--correct' : ' option--wrong';
              else if (phase === 'answered' && o.correct) cls += ' option--correct';
              return (
                <button key={i} className={cls} onClick={() => choose(n)}>
                  {o.label}
                </button>
              );
            })}
          </div>
          {phase === 'answered' && (
            <Feedback good>
              10 + {bottomCount} = {total} 🎉
            </Feedback>
          )}
          {picked != null && phase !== 'answered' && (
            <Feedback good={false}>다시 세어볼까요? 🤔</Feedback>
          )}
          <button
            className="btn btn--block btn--lg"
            disabled={phase !== 'answered'}
            onClick={advance}
          >
            {isLast ? '완료하기 🎉' : '다음 문제 →'}
          </button>
        </>
      )}
    </div>
  );
}

export default function ActivityRenderer(props: RProps) {
  switch (props.activity.type) {
    case 'tenframe':
      return <TenFrameActivity {...props} />;
    case 'matching':
      return <MatchingActivity {...props} />;
    case 'sequence':
      return <SequenceActivity {...props} />;
    case 'memory':
      return <MemoryActivity {...props} />;
    case 'checklist':
      return <ChecklistActivity {...props} />;
    case 'choice':
    case 'reading':
    case 'scenario':
    default:
      return <ChoiceActivity {...props} />;
  }
}
