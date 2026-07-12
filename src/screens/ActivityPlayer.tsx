import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppShell from '../components/AppShell';
import LevelBadge from '../components/LevelBadge';
import ActivityRenderer from './activities';
import { ACTIVITY_MAP, AREA_MAP } from '../data/curriculum';
import { cancelSpeech } from '../lib/speech';

export default function ActivityPlayer() {
  const { activityId } = useParams<{ activityId: string }>();
  const [params] = useSearchParams();
  const from = params.get('from') ?? 'home';
  const { activeChild, completeActivity } = useApp();
  const navigate = useNavigate();

  const activity = activityId ? ACTIVITY_MAP[activityId] : undefined;
  if (!activeChild || !activity) {
    return (
      <AppShell nav="none">
        <button className="back-btn" onClick={() => navigate('/home')}>
          ← 홈으로
        </button>
        <p className="muted">활동을 찾을 수 없어요.</p>
      </AppShell>
    );
  }

  const area = AREA_MAP[activity.areaId];

  function handleComplete(stars: number) {
    cancelSpeech();
    completeActivity(activity!.id, stars);
    navigate('/reward', {
      state: {
        stars,
        title: activity!.title,
        areaName: area.name,
        domain: area.domain,
        from,
      },
      replace: true,
    });
  }

  return (
    <AppShell nav="none" flush>
      <div className="row" style={{ marginBottom: 12 }}>
        <button
          className="back-btn"
          onClick={() => {
            cancelSpeech();
            navigate(from === 'plan' ? '/plan' : from === 'area' ? `/area/${area.id}` : '/home');
          }}
        >
          ← 나가기
        </button>
        <LevelBadge level={activity.level} domain={area.domain} areaName={area.name} />
      </div>

      <ActivityRenderer activity={activity} domain={area.domain} onComplete={handleComplete} />
    </AppShell>
  );
}
