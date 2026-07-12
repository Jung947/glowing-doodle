import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppShell from '../components/AppShell';
import ProgressRing from '../components/ProgressRing';
import { ACTIVITY_MAP, AREAS, AREA_MAP } from '../data/curriculum';
import { streak } from '../lib/dailyPlan';
import { AUTONOMY_STAGES } from '../lib/autonomy';
import type { AreaId } from '../types';

export default function DailyPlanScreen() {
  const { activeChild, ensureTodayPlan, todayPlanIds, isDoneToday, regenerateTodayPlan } = useApp();
  const navigate = useNavigate();
  const [focus, setFocus] = useState<AreaId[]>([]);
  const [target, setTarget] = useState(activeChild?.goal.target ?? 4);

  useEffect(() => {
    ensureTodayPlan();
  }, [ensureTodayPlan]);

  if (!activeChild) return null;

  const doneCount = todayPlanIds.filter((id) => isDoneToday(id)).length;
  const total = todayPlanIds.length;
  const allDone = total > 0 && doneCount === total;
  const currentId = todayPlanIds.find((id) => !isDoneToday(id));
  const s = streak(activeChild.logs);
  const autonomy = activeChild.goal.autonomy;
  const stage = AUTONOMY_STAGES[autonomy];

  function toggleFocus(id: AreaId) {
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  function rebuild() {
    regenerateTodayPlan({
      focusAreas: focus.length ? focus : undefined,
      targetOverride: autonomy === 3 ? target : undefined,
    });
  }

  return (
    <AppShell nav="child">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="page-title">오늘의 학습 계획</h1>
          <p className="page-sub">스스로 하나씩 해봐요</p>
        </div>
        <ProgressRing done={doneCount} total={total || 1} size={60} />
      </div>

      <div className="streak-pill" style={{ marginBottom: 14 }}>
        🔥 {s}일 연속 · {stage.emoji} 자기주도 {stage.short}
        {autonomy >= 2 ? ' — 오늘은 네가 골라요' : ''}
      </div>

      {autonomy >= 2 && !allDone && (
        <div className="card card--flat" style={{ marginBottom: 14 }}>
          <p className="section-label muted" style={{ marginTop: 0 }}>
            오늘 하고 싶은 영역 고르기 {focus.length === 0 ? '(안 고르면 골고루)' : ''}
          </p>
          <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AREAS.map((a) => (
              <button
                key={a.id}
                className="chip"
                style={{
                  background: focus.includes(a.id) ? 'var(--quest)' : 'var(--card)',
                  color: focus.includes(a.id) ? '#fff' : 'var(--ink)',
                  border: '1.5px solid var(--hair)',
                  cursor: 'pointer',
                }}
                onClick={() => toggleFocus(a.id)}
              >
                {a.emoji} {a.name}
              </button>
            ))}
          </div>
          {autonomy === 3 && (
            <div className="stepper" style={{ marginTop: 10 }}>
              <button onClick={() => setTarget((t) => Math.max(2, t - 1))} aria-label="줄이기">
                −
              </button>
              <span className="v">{target}개</span>
              <button onClick={() => setTarget((t) => Math.min(8, t + 1))} aria-label="늘리기">
                ＋
              </button>
            </div>
          )}
          <button className="btn btn--block btn--quest" style={{ marginTop: 10 }} onClick={rebuild}>
            이 계획으로 새로 짜기 🔄
          </button>
        </div>
      )}

      <div className="stack">
        {todayPlanIds.map((id) => {
          const act = ACTIVITY_MAP[id];
          if (!act) return null;
          const area = AREA_MAP[act.areaId];
          const done = isDoneToday(id);
          const isNow = id === currentId;
          return (
            <button
              key={id}
              className={`quest${done ? ' quest--done' : ''}${isNow ? ' quest--now' : ''}`}
              disabled={done}
              onClick={() => navigate(`/activity/${id}?from=plan`)}
            >
              <span
                className="quest__icon"
                style={{
                  background: area.domain === 'cognitive' ? 'var(--cog-soft)' : 'var(--noncog-soft)',
                }}
              >
                {area.emoji}
              </span>
              <span className="quest__text">
                <b>
                  {area.name} · {act.title}
                </b>
                <span>{done ? '완료했어요 ✓' : isNow ? '지금 할 차례' : act.prompt.slice(0, 22)}</span>
              </span>
              <span className={`qbadge ${done ? 'qbadge--ok' : isNow ? 'qbadge--go' : 'qbadge--wait'}`}>
                {done ? '✓' : isNow ? '▶' : '⏳'}
              </span>
            </button>
          );
        })}
      </div>

      <p className="center muted" style={{ fontSize: 12, fontWeight: 800, margin: '12px 0 0' }}>
        인지·비인지를 골고루 담았어요
      </p>

      {allDone ? (
        <div className="stack" style={{ marginTop: 12 }}>
          <div className="feedback feedback--good">오늘 학습 계획을 모두 끝냈어요! 🎉</div>
          <button className="btn btn--block btn--lg btn--ghost" onClick={() => navigate('/home')}>
            홈으로
          </button>
        </div>
      ) : (
        currentId && (
          <button
            className="btn btn--block btn--lg btn--quest"
            style={{ marginTop: 12 }}
            onClick={() => navigate(`/activity/${currentId}?from=plan`)}
          >
            이어서 하기 →
          </button>
        )
      )}
    </AppShell>
  );
}
