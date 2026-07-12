import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppData,
  AreaId,
  Autonomy,
  ChildState,
  DailyGoal,
  DailyLog,
  Level,
} from '../types';
import { loadData, makeChild, saveData } from '../lib/storage';
import { buildTodayPlan, getTodayLog, todayStr } from '../lib/dailyPlan';

interface AppContextValue {
  children: ChildState[];
  activeChild: ChildState | null;
  // profile management
  selectChild: (id: string | null) => void;
  addChild: (name: string, age: number, avatar: string) => void;
  removeChild: (id: string) => void;
  // settings
  setLevel: (areaId: AreaId, level: Level) => void;
  setGoal: (patch: Partial<DailyGoal>) => void;
  // daily plan
  todayPlanIds: string[];
  ensureTodayPlan: () => void;
  regenerateTodayPlan: (opts: { focusAreas?: AreaId[]; targetOverride?: number }) => void;
  isDoneToday: (activityId: string) => boolean;
  isCompleted: (activityId: string) => boolean;
  todayMet: boolean;
  // activity completion
  completeActivity: (activityId: string, stars: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children: node }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const activeChild = useMemo(
    () => data.children.find((c) => c.profile.id === data.activeChildId) ?? null,
    [data],
  );

  // --- helpers to update the active child immutably ---
  const patchActive = useCallback(
    (fn: (c: ChildState) => ChildState) => {
      setData((d) => {
        if (!d.activeChildId) return d;
        return {
          ...d,
          children: d.children.map((c) => (c.profile.id === d.activeChildId ? fn(c) : c)),
        };
      });
    },
    [],
  );

  const upsertTodayLog = useCallback(
    (c: ChildState, fn: (log: DailyLog) => DailyLog): ChildState => {
      const date = todayStr();
      const existing = c.logs.find((l) => l.date === date);
      const base: DailyLog = existing ?? { date, plannedIds: [], doneIds: [], met: false };
      const next = fn(base);
      const logs = existing
        ? c.logs.map((l) => (l.date === date ? next : l))
        : [...c.logs, next];
      return { ...c, logs };
    },
    [],
  );

  const selectChild = useCallback((id: string | null) => {
    setData((d) => ({ ...d, activeChildId: id }));
  }, []);

  const addChild = useCallback((name: string, age: number, avatar: string) => {
    const child = makeChild(name, age, avatar);
    setData((d) => ({ ...d, children: [...d.children, child], activeChildId: child.profile.id }));
  }, []);

  const removeChild = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      children: d.children.filter((c) => c.profile.id !== id),
      activeChildId: d.activeChildId === id ? null : d.activeChildId,
    }));
  }, []);

  const setLevel = useCallback(
    (areaId: AreaId, level: Level) => {
      patchActive((c) => ({
        ...c,
        profile: {
          ...c.profile,
          levelByArea: { ...c.profile.levelByArea, [areaId]: level },
        },
        // level change invalidates today's auto plan → drop it so it rebuilds
        logs: c.logs.filter((l) => l.date !== todayStr() || l.doneIds.length > 0),
      }));
    },
    [patchActive],
  );

  const setGoal = useCallback(
    (patch: Partial<DailyGoal>) => {
      patchActive((c) => ({
        ...c,
        goal: { ...c.goal, ...patch },
        logs: c.logs.filter((l) => l.date !== todayStr() || l.doneIds.length > 0),
      }));
    },
    [patchActive],
  );

  const ensureTodayPlan = useCallback(() => {
    setData((d) => {
      if (!d.activeChildId) return d;
      return {
        ...d,
        children: d.children.map((c) => {
          if (c.profile.id !== d.activeChildId) return c;
          if (getTodayLog(c)) return c; // already planned today
          const plannedIds = buildTodayPlan(c);
          return upsertTodayLog(c, (log) => ({ ...log, plannedIds }));
        }),
      };
    });
  }, [upsertTodayLog]);

  const regenerateTodayPlan = useCallback(
    (opts: { focusAreas?: AreaId[]; targetOverride?: number }) => {
      patchActive((c) => {
        const plannedIds = buildTodayPlan(c, opts);
        return upsertTodayLog(c, (log) => {
          const doneIds = log.doneIds.filter((id) => plannedIds.includes(id));
          const met = plannedIds.length > 0 && plannedIds.every((id) => doneIds.includes(id));
          return { ...log, plannedIds, doneIds, met };
        });
      });
    },
    [patchActive, upsertTodayLog],
  );

  const completeActivity = useCallback(
    (activityId: string, stars: number) => {
      const areaId = activityId.split('-')[0] as AreaId;
      patchActive((c) => {
        const completed = c.progress.completedActivityIds.includes(activityId)
          ? c.progress.completedActivityIds
          : [...c.progress.completedActivityIds, activityId];
        const withProgress: ChildState = {
          ...c,
          progress: {
            ...c.progress,
            completedActivityIds: completed,
            starsByArea: {
              ...c.progress.starsByArea,
              [areaId]: (c.progress.starsByArea[areaId] ?? 0) + stars,
            },
            lastPlayed: todayStr(),
          },
        };
        return upsertTodayLog(withProgress, (log) => {
          const doneIds = log.plannedIds.includes(activityId) && !log.doneIds.includes(activityId)
            ? [...log.doneIds, activityId]
            : log.doneIds;
          const met = log.plannedIds.length > 0 && log.plannedIds.every((id) => doneIds.includes(id));
          return { ...log, doneIds, met };
        });
      });
    },
    [patchActive, upsertTodayLog],
  );

  const todayLog = activeChild ? getTodayLog(activeChild) : undefined;
  const todayPlanIds = todayLog?.plannedIds ?? [];
  const todayMet = todayLog?.met ?? false;

  const isDoneToday = useCallback(
    (activityId: string) => !!todayLog?.doneIds.includes(activityId),
    [todayLog],
  );
  const isCompleted = useCallback(
    (activityId: string) => !!activeChild?.progress.completedActivityIds.includes(activityId),
    [activeChild],
  );

  const value: AppContextValue = {
    children: data.children,
    activeChild,
    selectChild,
    addChild,
    removeChild,
    setLevel,
    setGoal,
    todayPlanIds,
    ensureTodayPlan,
    regenerateTodayPlan,
    isDoneToday,
    isCompleted,
    todayMet,
    completeActivity,
  };

  return <AppContext.Provider value={value}>{node}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { Autonomy };
