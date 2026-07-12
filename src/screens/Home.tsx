import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppShell from '../components/AppShell';
import ProgressRing from '../components/ProgressRing';
import { COGNITIVE_AREAS, NONCOGNITIVE_AREAS } from '../data/curriculum';
import { streak } from '../lib/dailyPlan';
import type { Area } from '../types';

export default function Home() {
  const { activeChild, ensureTodayPlan, todayPlanIds, isDoneToday } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    ensureTodayPlan();
  }, [ensureTodayPlan]);

  if (!activeChild) return null;

  const done = todayPlanIds.filter((id) => isDoneToday(id)).length;
  const total = todayPlanIds.length;
  const s = streak(activeChild.logs);

  const DomainCard = ({
    variant,
    emoji,
    title,
    subtitle,
    areas,
  }: {
    variant: 'cog' | 'noncog';
    emoji: string;
    title: string;
    subtitle: string;
    areas: Area[];
  }) => (
    <div className={`domain-card domain-card--${variant}`}>
      <div className="emoji" aria-hidden="true">
        {emoji}
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <div className="chips">
        {areas.map((a) => (
          <button
            key={a.id}
            className="chip"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => navigate(`/area/${a.id}`)}
          >
            {a.emoji} {a.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell nav="child">
      <div className="row" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">{activeChild.profile.name}야 안녕! {activeChild.profile.avatarEmoji}</h1>
          <p className="page-sub">{s > 0 ? `🔥 ${s}일 연속 학습 중` : '오늘도 재미있게 배워요'}</p>
        </div>
        <button className="avatar-badge" onClick={() => navigate('/parent')} aria-label="부모 화면">
          👪
        </button>
      </div>

      <button className="plan-banner" onClick={() => navigate('/plan')}>
        <ProgressRing done={done} total={total || 1} size={50} color="#ffffff" />
        <div className="txt">
          <h4>오늘의 학습 계획 🎯</h4>
          <p>
            {total === 0
              ? '오늘의 계획을 확인해요'
              : done >= total
                ? '오늘 계획 완료! 참 잘했어요'
                : `${total}개 중 ${done}개 완료 · 이어서 해볼까요?`}
          </p>
        </div>
        <span style={{ fontSize: 18 }} aria-hidden="true">
          ▶
        </span>
      </button>

      <p className="section-label muted" style={{ marginTop: 18 }}>
        자유롭게 골라 놀기
      </p>
      <div className="stack">
        <DomainCard
          variant="cog"
          emoji="🧠"
          title="인지 놀이"
          subtitle="읽고·계산하고·생각하기"
          areas={COGNITIVE_AREAS}
        />
        <DomainCard
          variant="noncog"
          emoji="💛"
          title="마음·태도 놀이"
          subtitle="집중·사이좋게·스스로"
          areas={NONCOGNITIVE_AREAS}
        />
      </div>
    </AppShell>
  );
}
