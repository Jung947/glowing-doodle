import type { AppData, AreaId, ChildProfile, ChildState, Level } from '../types';
import { AREAS } from '../data/curriculum';
import { defaultLevelForAge, recommendedDaily } from './levels';

const KEY = 'elem-prep-app/v1';

function emptyLevels(level: Level): Record<AreaId, Level> {
  return AREAS.reduce(
    (acc, a) => {
      acc[a.id] = level;
      return acc;
    },
    {} as Record<AreaId, Level>,
  );
}

function emptyStars(): Record<AreaId, number> {
  return AREAS.reduce(
    (acc, a) => {
      acc[a.id] = 0;
      return acc;
    },
    {} as Record<AreaId, number>,
  );
}

let idCounter = 0;
export function makeId(prefix = 'c'): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function makeChild(name: string, age: number, avatarEmoji: string): ChildState {
  const level = defaultLevelForAge(age);
  const profile: ChildProfile = {
    id: makeId('child'),
    name: name.trim() || '친구',
    age,
    avatarEmoji,
    levelByArea: emptyLevels(level),
  };
  return {
    profile,
    progress: { completedActivityIds: [], starsByArea: emptyStars() },
    goal: { mode: 'count', target: recommendedDaily(age).count, autonomy: 1 },
    logs: [],
  };
}

function seed(): AppData {
  const demo = makeChild('유나', 7, '🦊');
  return { children: [demo], activeChildId: null };
}

/** Repair a loaded child so newly-added areas always have level/stars. */
function normalizeChild(c: ChildState): ChildState {
  const levelByArea = { ...emptyLevels(2), ...c.profile.levelByArea };
  const starsByArea = { ...emptyStars(), ...c.progress.starsByArea };
  return {
    ...c,
    profile: { ...c.profile, levelByArea },
    progress: { ...c.progress, starsByArea },
    logs: c.logs ?? [],
    goal: c.goal ?? { mode: 'count', target: 4, autonomy: 1 },
  };
}

export function loadData(): AppData {
  if (typeof localStorage === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.children || !Array.isArray(parsed.children)) return seed();
    return {
      children: parsed.children.map(normalizeChild),
      activeChildId: parsed.activeChildId ?? null,
    };
  } catch {
    return seed();
  }
}

export function saveData(data: AppData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — ignore for MVP */
  }
}
