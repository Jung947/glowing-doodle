import type { Autonomy, ChildState } from '../types';
import { streak } from './dailyPlan';

export const AUTONOMY_STAGES: Record<
  Autonomy,
  { name: string; short: string; desc: string; emoji: string }
> = {
  1: {
    name: '부모 주도',
    short: '1단계',
    emoji: '👪',
    desc: '부모가 양·영역을 정하고, 아이는 순서대로 수행해요.',
  },
  2: {
    name: '함께 선택',
    short: '2단계',
    emoji: '🤝',
    desc: '양은 부모가 정하고, 아이가 오늘 할 영역·순서를 직접 골라요.',
  },
  3: {
    name: '자기주도',
    short: '3단계',
    emoji: '🌟',
    desc: '부모는 범위만 정하고, 아이가 오늘 목표량·영역을 스스로 정하고 점검해요.',
  },
};

/**
 * Suggest advancing to the next autonomy stage once the child has built a
 * streak and is old enough. This progress itself feeds the 자기주도 area.
 */
export function autonomyReadyToAdvance(child: ChildState): boolean {
  if (child.goal.autonomy >= 3) return false;
  const s = streak(child.logs);
  const need = child.goal.autonomy === 1 ? 3 : 7;
  return s >= need;
}

export function nextAutonomy(a: Autonomy): Autonomy {
  return (Math.min(3, a + 1)) as Autonomy;
}
