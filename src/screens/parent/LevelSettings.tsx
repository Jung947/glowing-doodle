import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AppShell from '../../components/AppShell';
import { COGNITIVE_AREAS, NONCOGNITIVE_AREAS } from '../../data/curriculum';
import { ALL_LEVELS, LEVELS } from '../../lib/levels';
import type { Area, Level } from '../../types';

export default function LevelSettings() {
  const { activeChild, setLevel } = useApp();
  if (!activeChild) return <Navigate to="/profiles" replace />;

  const Group = ({ title, areas, noncog }: { title: string; areas: Area[]; noncog?: boolean }) => (
    <>
      <p className="section-label" style={{ color: noncog ? 'var(--noncog)' : 'var(--cog)' }}>
        {title}
      </p>
      <div className="card" style={{ padding: '2px 16px', marginBottom: 14 }}>
        {areas.map((a) => {
          const cur = activeChild.profile.levelByArea[a.id];
          return (
            <div className="setting-row" key={a.id}>
              <span className="setting-row__name">
                {a.emoji} {a.name}
              </span>
              <div className="steps">
                {ALL_LEVELS.map((lv) => (
                  <button
                    key={lv}
                    className={`step${cur === lv ? (noncog ? ' step--on-noncog' : ' step--on') : ''}`}
                    onClick={() => setLevel(a.id, lv as Level)}
                  >
                    {LEVELS[lv].short}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <AppShell nav="parent">
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">수준 설정</h1>
        <p className="page-sub">
          {activeChild.profile.name} · 영역별로 조절해요. 잘하는 영역은 도전으로!
        </p>
      </div>

      <Group title="인지 영역" areas={COGNITIVE_AREAS} />
      <Group title="비인지 영역" areas={NONCOGNITIVE_AREAS} noncog />

      <p className="page-sub center">
        수준을 바꾸면 아이의 오늘 학습 계획과 활동에 바로 반영돼요.
      </p>
    </AppShell>
  );
}
