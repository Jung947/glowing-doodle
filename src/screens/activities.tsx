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
function Prompt({ text, domain }: { text: string; domain: Domain }) {
  useEffect(() => {
    speak(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const noncog = domain === 'noncognitive';
  return (
    <div className={`prompt${noncog ? ' prompt--noncog' : ''}`}>
      <button
        className={`prompt__spk${noncog ? ' prompt__spk--noncog' : ''}`}
        onClick={() => speak(text)}
        aria-label="문제 읽어주기"
      >
        🔊
      </button>
      <p>{text}</p>
    </div>
  );
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

// ---------- choice / reading / scenario ----------
function ChoiceActivity({ activity, domain, onComplete }: RProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const options = activity.options ?? [];
  const solvedIndex = options.findIndex((o) => o.correct);
  const isNumeric = options.every((o) => /^\d+$/.test(o.label.trim()));
  const scenario = activity.type === 'scenario';

  const correctPicked = picked != null && options[picked]?.correct;

  function choose(i: number) {
    if (correctPicked) return;
    setPicked(i);
    if (options[i].correct) {
      playCorrect();
    } else {
      playWrong();
      setAttempts((a) => a + 1);
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

  const stars = attempts === 0 ? 3 : attempts === 1 ? 2 : 1;

  return (
    <div className="stack">
      <Prompt text={activity.prompt} domain={domain} />
      {activity.passage && <div className="passage">{activity.passage}</div>}
      {activity.visual && <div className="visual">{activity.visual}</div>}

      <div className={`option-grid${isNumeric && options.length === 4 ? ' option-grid--2' : ''}`}>
        {options.map((o, i) => (
          <button key={i} className={optionClass(i, o)} onClick={() => choose(i)}>
            {o.label}
          </button>
        ))}
      </div>

      {picked != null &&
        (correctPicked ? (
          <Feedback good>
            {scenario ? '멋진 생각이에요! 💛' : '잘했어요! 딩동댕 🔔'}
            {scenario && activity.encouragement ? ` ${activity.encouragement}` : ''}
          </Feedback>
        ) : (
          <Feedback good={false}>
            {scenario ? '다시 한 번 생각해 볼까요? 🤔' : '다시 골라볼까요? 🤔'}
          </Feedback>
        ))}

      <button
        className={`btn btn--block btn--lg ${domain === 'noncognitive' ? 'btn--noncog' : ''}`}
        disabled={!correctPicked}
        onClick={() => onComplete(stars)}
      >
        {correctPicked ? '다음으로 →' : `정답을 골라요 (${solvedIndex >= 0 ? '보기 중 하나' : ''})`}
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

export default function ActivityRenderer(props: RProps) {
  switch (props.activity.type) {
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
