// ---- Core domain model for the elementary-prep app ----

export type Domain = 'cognitive' | 'noncognitive';

/** Difficulty tiers. 1=입학 준비, 2=1학년 기본, 3=도전·심화(우수) */
export type Level = 1 | 2 | 3;

export type AreaId =
  | 'literacy' // 문해력
  | 'numeracy' // 연산
  | 'reasoning' // 사고력·논리
  | 'focus' // 집중·자기조절
  | 'social' // 사회성·감정
  | 'selfdrive'; // 자기주도·태도

export interface Area {
  id: AreaId;
  domain: Domain;
  name: string;
  emoji: string;
  tagline: string;
  /** can-do 성취 목표: index 0 = level1, 1 = level2, 2 = level3 */
  goals: [string, string, string];
}

export type ActivityType =
  | 'choice' // 보기 중 정답 고르기 (여러 문제 세트)
  | 'reading' // 지문 읽고 이해·추론 (여러 문제 세트)
  | 'tenframe' // 20칸 수배열판 "10 만들기" 덧셈
  | 'matching' // 짝 맞추기
  | 'sequence' // 순서·규칙 맞추기
  | 'memory' // 순서 기억해 누르기
  | 'scenario' // 상황 속 행동 선택 (여러 문제 세트)
  | 'checklist'; // 목표·습관 자기점검 (정답 없음)

export interface Option {
  label: string;
  correct?: boolean;
}

/** One question inside a choice / reading / scenario set. */
export interface Question {
  prompt: string;
  visual?: string; // emoji illustration line
  passage?: string; // reading passage
  options: Option[];
  encouragement?: string; // scenario: shown after a good choice
}

/** One addition problem for the 20-frame make-ten activity. */
export interface Sum {
  a: number;
  b: number;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface Activity {
  id: string;
  areaId: AreaId;
  level: Level;
  type: ActivityType;
  title: string;
  /** spoken/displayed prompt */
  prompt: string;
  /** approximate minutes to complete (used for time-based daily goals) */
  minutes: number;

  // type-specific payloads (only the relevant ones are set)
  questions?: Question[]; // choice / reading / scenario: an ordered set of问题
  sums?: Sum[]; // tenframe: addition problems
  pairs?: MatchPair[]; // matching
  sequence?: string[]; // sequence: the correct order
  sequencePrompt?: string;
  memory?: number[]; // memory: order of lit cells (1-based within a 3x3 grid)
  items?: string[]; // checklist labels
  encouragement?: string; // shown for checklist (no single right answer)
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarEmoji: string;
  levelByArea: Record<AreaId, Level>;
}

export interface Progress {
  completedActivityIds: string[];
  starsByArea: Record<AreaId, number>;
  lastPlayed?: string; // ISO date
}

export type GoalMode = 'count' | 'minutes';
export type Autonomy = 1 | 2 | 3; // 1 부모 주도, 2 함께, 3 자기주도

export interface DailyGoal {
  mode: GoalMode;
  target: number; // activity count OR minutes
  autonomy: Autonomy;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  plannedIds: string[];
  doneIds: string[];
  met: boolean;
}

/** Everything persisted for a single child. */
export interface ChildState {
  profile: ChildProfile;
  progress: Progress;
  goal: DailyGoal;
  logs: DailyLog[]; // most recent last
}

export interface AppData {
  children: ChildState[];
  activeChildId: string | null;
}
