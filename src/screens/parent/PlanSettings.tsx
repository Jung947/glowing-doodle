import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AppShell from '../../components/AppShell';
import { AUTONOMY_STAGES, autonomyReadyToAdvance } from '../../lib/autonomy';
import type { Autonomy, GoalMode } from '../../types';

const AUTONOMY_KEYS: Autonomy[] = [1, 2, 3];

export default function PlanSettings() {
  const { activeChild, setGoal } = useApp();
  if (!activeChild) return <Navigate to="/profiles" replace />;

  const goal = activeChild.goal;
  const age = activeChild.profile.age;
  const isCount = goal.mode === 'count';
  const stage = AUTONOMY_STAGES[goal.autonomy];
  const canAdvance = autonomyReadyToAdvance(activeChild);

  function setMode(mode: GoalMode) {
    if (mode === goal.mode) return;
    setGoal({ mode, target: mode === 'count' ? (age <= 5 ? 3 : 4) : age <= 5 ? 10 : 15 });
  }

  function bump(delta: number) {
    if (isCount) {
      setGoal({ target: Math.min(8, Math.max(2, goal.target + delta)) });
    } else {
      setGoal({ target: Math.min(40, Math.max(5, goal.target + delta * 5)) });
    }
  }

  const recommend = isCount
    ? `권장: 만 ${age}세 하루 ${age <= 5 ? 3 : 4}개`
    : `권장: 만 ${age}세 하루 ${age <= 5 ? 10 : 15}분`;

  return (
    <AppShell nav="parent">
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">학습량·자기주도</h1>
        <p className="page-sub">
          {activeChild.profile.name} · 만 {age}세
        </p>
      </div>

      <p className="section-label muted">하루 목표 방식</p>
      <div className="seg2" style={{ marginBottom: 12 }}>
        <button className={isCount ? 'on' : ''} onClick={() => setMode('count')}>
          활동 개수
        </button>
        <button className={!isCount ? 'on' : ''} onClick={() => setMode('minutes')}>
          시간(분)
        </button>
      </div>

      <div className="card center" style={{ marginBottom: 6 }}>
        <div className="stepper">
          <button onClick={() => bump(-1)} aria-label="줄이기">
            −
          </button>
          <span className="v">
            {goal.target}
            <span style={{ fontSize: 14, fontWeight: 800 }}>{isCount ? '개' : '분'}</span>
          </span>
          <button onClick={() => bump(1)} aria-label="늘리기">
            ＋
          </button>
        </div>
        <p className="page-sub">{recommend}</p>
      </div>

      <p className="section-label" style={{ color: 'var(--grape)', marginTop: 16 }}>
        자기주도 단계
      </p>
      <div className="auto">
        {AUTONOMY_KEYS.map((k) => (
          <button
            key={k}
            className={`auto__item${goal.autonomy === k ? ' auto__item--on' : ''}`}
            onClick={() => setGoal({ autonomy: k })}
          >
            <b>{AUTONOMY_STAGES[k].short}</b>
            <span>{AUTONOMY_STAGES[k].name}</span>
          </button>
        ))}
      </div>

      <div className="card card--flat" style={{ marginTop: 11, fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', lineHeight: 1.5 }}>
        {stage.emoji} <b style={{ color: 'var(--ink)' }}>{stage.name}</b>: {stage.desc}
      </div>

      {canAdvance && (
        <div className="suggest" style={{ marginTop: 12 }}>
          🌟 {activeChild.profile.name}는 꾸준히 잘하고 있어요! 다음 단계
          <b> ({AUTONOMY_STAGES[(goal.autonomy + 1) as Autonomy].name})</b>로 올려볼 준비가 됐어요.
        </div>
      )}
    </AppShell>
  );
}
