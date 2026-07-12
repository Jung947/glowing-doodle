import type { AreaId, ChildState, DailyLog } from '../types';
import { AREAS, activitiesFor } from '../data/curriculum';

// ---- date helpers ----
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return todayStr(dt);
}

// ---- seeded RNG so a day's plan is stable ----
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

interface AreaQueue {
  areaId: AreaId;
  domain: string;
  list: string[]; // activity ids, uncompleted first
}

/**
 * Build today's learning plan: a mix of activities across areas at the child's
 * level, prioritising uncompleted work, guaranteeing both cognitive and
 * non-cognitive coverage, sized to the daily goal (count or minutes).
 * `override` lets autonomy stage 2/3 request specific focus areas / target.
 */
export function buildTodayPlan(
  child: ChildState,
  opts: { date?: string; focusAreas?: AreaId[]; targetOverride?: number } = {},
): string[] {
  const date = opts.date ?? todayStr();
  const done = new Set(child.progress.completedActivityIds);
  const rand = mulberry32(hashStr(child.profile.id + date));

  let areas = AREAS;
  if (opts.focusAreas && opts.focusAreas.length) {
    areas = AREAS.filter((a) => opts.focusAreas!.includes(a.id));
  }

  const queues: AreaQueue[] = areas
    .map((area) => {
      const level = child.profile.levelByArea[area.id];
      const all = activitiesFor(area.id, level);
      const uncompleted = all.filter((a) => !done.has(a.id));
      const completed = all.filter((a) => done.has(a.id));
      const list = [...shuffle(uncompleted, rand), ...shuffle(completed, rand)].map((a) => a.id);
      return { areaId: area.id, domain: area.domain, list };
    })
    .filter((q) => q.list.length > 0);

  const cog = shuffle(
    queues.filter((q) => q.domain === 'cognitive'),
    rand,
  );
  const non = shuffle(
    queues.filter((q) => q.domain === 'noncognitive'),
    rand,
  );
  const ordered = interleave(cog, non); // alternates domains → both covered

  const totalAvailable = queues.reduce((n, q) => n + q.list.length, 0);
  const byMinutes = child.goal.mode === 'minutes' && opts.targetOverride == null;
  const targetCount =
    opts.targetOverride ?? (child.goal.mode === 'count' ? child.goal.target : Infinity);
  const targetMinutes = byMinutes ? child.goal.target : Infinity;

  const picked: string[] = [];
  let minutes = 0;
  let idx = 0;
  let guard = 0;
  while (
    picked.length < Math.min(targetCount, totalAvailable) &&
    minutes < targetMinutes &&
    ordered.some((q) => q.list.length > 0) &&
    guard++ < 200
  ) {
    const q = ordered[idx % ordered.length];
    idx++;
    if (!q.list.length) continue;
    const id = q.list.shift()!;
    picked.push(id);
    minutes += activityMinutes(id);
  }
  return picked;
}

function activityMinutes(id: string): number {
  const found = activitiesFor(
    id.split('-')[0] as AreaId,
    Number(id.split('-')[1]),
  ).find((a) => a.id === id);
  return found?.minutes ?? 3;
}

// ---- streak ----
/** Consecutive days (ending today or yesterday) with met=true. */
export function streak(logs: DailyLog[]): number {
  const map = new Map(logs.map((l) => [l.date, l.met]));
  let cursor = todayStr();
  // if today isn't met yet, allow the streak to be counted up to yesterday
  if (!map.get(cursor)) cursor = addDays(cursor, -1);
  let count = 0;
  while (map.get(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function getTodayLog(child: ChildState): DailyLog | undefined {
  return child.logs.find((l) => l.date === todayStr());
}

/** How many of the past `n` days met the goal (for weekly達成률). */
export function metRate(logs: DailyLog[], n = 7): { met: number; total: number } {
  let met = 0;
  let cursor = todayStr();
  for (let i = 0; i < n; i++) {
    const log = logs.find((l) => l.date === cursor);
    if (log?.met) met++;
    cursor = addDays(cursor, -1);
  }
  return { met, total: n };
}
