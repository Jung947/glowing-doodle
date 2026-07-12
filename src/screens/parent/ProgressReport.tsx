import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AppShell from '../../components/AppShell';
import { AREAS, activitiesFor } from '../../data/curriculum';
import { LEVELS } from '../../lib/levels';
import { metRate, streak } from '../../lib/dailyPlan';
import { AUTONOMY_STAGES, autonomyReadyToAdvance } from '../../lib/autonomy';
import type { Area, Autonomy, ChildState } from '../../types';

function areaStat(child: ChildState, area: Area) {
  const level = child.profile.levelByArea[area.id];
  const list = activitiesFor(area.id, level);
  const done = list.filter((a) => child.progress.completedActivityIds.includes(a.id)).length;
  const total = list.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const suggest = pct >= 80 && level < 3;
  return { level, done, total, pct, suggest };
}

export default function ProgressReport() {
  const { activeChild } = useApp();
  if (!activeChild) return <Navigate to="/profiles" replace />;

  const stars = Object.values(activeChild.progress.starsByArea).reduce((a, b) => a + b, 0);
  const completed = activeChild.progress.completedActivityIds.length;
  const s = streak(activeChild.logs);
  const week = metRate(activeChild.logs, 7);
  const autoReady = autonomyReadyToAdvance(activeChild);

  const Rows = ({ areas, noncog }: { areas: Area[]; noncog?: boolean }) => (
    <>
      <p className="section-label" style={{ color: noncog ? 'var(--noncog)' : 'var(--cog)' }}>
        {noncog ? '비인지' : '인지'}
      </p>
      {areas.map((a) => {
        const st = areaStat(activeChild, a);
        return (
          <div className="prow" key={a.id}>
            <div className="prow__top">
              <span>
                {a.emoji} {a.name}
              </span>
              <span>
                {LEVELS[st.level].short} · {st.done}/{st.total}
                {st.suggest ? ` · 도전 권장 ↑` : ''}
              </span>
            </div>
            <div className="bar">
              <div
                className={`bar__fill${noncog ? ' bar__fill--noncog' : ''}`}
                style={{ width: `${st.pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </>
  );

  const cog = AREAS.filter((a) => a.domain === 'cognitive');
  const non = AREAS.filter((a) => a.domain === 'noncognitive');

  return (
    <AppShell nav="parent">
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">진도 리포트</h1>
        <p className="page-sub">
          {activeChild.profile.name} · 최근 7일 {week.met}일 달성
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <b>{completed}</b>
          <span>완료 활동</span>
        </div>
        <div className="stat">
          <b style={{ color: 'var(--sun)' }}>{stars}</b>
          <span>모은 별</span>
        </div>
        <div className="stat">
          <b>
            {s}
            <span style={{ fontSize: 13 }}>일</span>
          </b>
          <span>연속 참여</span>
        </div>
      </div>

      <Rows areas={cog} />
      <Rows areas={non} noncog />

      <p className="section-label muted" style={{ marginTop: 12 }}>
        다음 단계 추천
      </p>
      <div className="stack">
        {AREAS.filter((a) => areaStat(activeChild, a).suggest).map((a) => (
          <div className="suggest" key={a.id}>
            📈 <b>{a.name}</b>을(를) 많이 익혔어요. 수준을 <b>도전</b>으로 올려보세요.
          </div>
        ))}
        {autoReady && (
          <div className="suggest">
            🌟 자기주도 <b>{AUTONOMY_STAGES[(activeChild.goal.autonomy + 1) as Autonomy].name}</b> 단계로
            올려볼 준비가 됐어요. (학습량·자기주도 화면에서 변경)
          </div>
        )}
        {!AREAS.some((a) => areaStat(activeChild, a).suggest) && !autoReady && (
          <div className="card card--flat page-sub" style={{ textAlign: 'center' }}>
            꾸준히 진행 중이에요. 오늘의 학습 계획을 이어가 보세요! 🌱
          </div>
        )}
      </div>
    </AppShell>
  );
}
