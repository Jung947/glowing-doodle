import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppShell from '../components/AppShell';
import { playCheer } from '../lib/audio';
import { streak } from '../lib/dailyPlan';
import type { Domain } from '../types';

interface RewardState {
  stars: number;
  title: string;
  areaName: string;
  domain: Domain;
  from: string;
}

export default function RewardScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeChild, todayMet, todayPlanIds, isDoneToday } = useApp();
  const state = location.state as RewardState | null;

  useEffect(() => {
    playCheer();
  }, []);

  if (!state || !activeChild) return <Navigate to="/home" replace />;

  const planComplete = state.from === 'plan' && todayMet;
  const s = streak(activeChild.logs);
  const doneCount = todayPlanIds.filter((id) => isDoneToday(id)).length;
  const total = todayPlanIds.length;

  return (
    <AppShell nav="none">
      <div className="reward pop" style={{ marginTop: 24 }}>
        <div className="burst" aria-hidden="true">
          {planComplete ? '🏆' : '🎉'}
        </div>
        <h2>{planComplete ? '오늘 계획 완주!' : '참 잘했어요!'}</h2>
        <p>
          {planComplete
            ? `오늘의 학습 계획을 모두 끝냈어요`
            : `${state.areaName} · ${state.title} 완료`}
        </p>
        <div className="got">
          {planComplete ? `🔥 ${s}일 연속 달성!` : `⭐ 별 ${state.stars}개 획득!`}
        </div>
        <div style={{ marginTop: 14, fontSize: 30 }} aria-hidden="true">
          {activeChild.profile.avatarEmoji}
          {planComplete ? '🏅' : '⭐'}
        </div>
      </div>

      {!planComplete && state.from === 'plan' && total > 0 && (
        <p className="center muted" style={{ fontWeight: 800, fontSize: 13, marginTop: 14 }}>
          오늘 계획 {doneCount}/{total} · 조금만 더!
        </p>
      )}

      <div className="stack" style={{ marginTop: 18 }}>
        {state.from === 'plan' && !planComplete ? (
          <button className="btn btn--block btn--lg btn--quest" onClick={() => navigate('/plan')}>
            이어서 하기 →
          </button>
        ) : (
          <button className="btn btn--block btn--lg" onClick={() => navigate('/plan')}>
            오늘 계획 보기 🎯
          </button>
        )}
        <button className="btn btn--block btn--ghost" onClick={() => navigate('/home')}>
          홈으로
        </button>
      </div>
    </AppShell>
  );
}
