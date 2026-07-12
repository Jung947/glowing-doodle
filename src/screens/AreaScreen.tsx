import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppShell from '../components/AppShell';
import LevelBadge from '../components/LevelBadge';
import Stars from '../components/Stars';
import { AREA_MAP, activitiesFor } from '../data/curriculum';
import { LEVELS } from '../lib/levels';
import type { AreaId } from '../types';

export default function AreaScreen() {
  const { areaId } = useParams<{ areaId: AreaId }>();
  const { activeChild, isCompleted } = useApp();
  const navigate = useNavigate();

  const area = areaId ? AREA_MAP[areaId] : undefined;
  if (!activeChild || !area) {
    return (
      <AppShell nav="child">
        <p className="muted">영역을 찾을 수 없어요.</p>
      </AppShell>
    );
  }

  const level = activeChild.profile.levelByArea[area.id];
  const list = activitiesFor(area.id, level);

  return (
    <AppShell nav="child">
      <button className="back-btn" onClick={() => navigate('/home')}>
        ← 홈으로
      </button>
      <div className="row" style={{ margin: '6px 0 10px' }}>
        <div>
          <h1 className="page-title">
            {area.emoji} {area.name}
          </h1>
          <p className="page-sub">{area.tagline}</p>
        </div>
        <LevelBadge level={level} domain={area.domain} />
      </div>

      <div className="suggest" style={{ marginBottom: 14 }}>
        🎯 {LEVELS[level].name} 목표: {area.goals[level - 1]}
      </div>

      <div className="stack">
        {list.map((act) => {
          const completed = isCompleted(act.id);
          return (
            <button
              key={act.id}
              className="quest"
              onClick={() => navigate(`/activity/${act.id}?from=area`)}
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
                <b>{act.title}</b>
                {completed ? <Stars filled={3} /> : <span>{act.prompt.slice(0, 24)}</span>}
              </span>
              <span className={`qbadge ${completed ? 'qbadge--ok' : 'qbadge--go'}`}>
                {completed ? '✓' : '▶'}
              </span>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
