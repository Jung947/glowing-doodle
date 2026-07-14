import type { Level } from '../types';

export const LEVELS: Record<Level, { name: string; short: string }> = {
  1: { name: '입학 준비', short: '준비' },
  2: { name: '1학년 기본', short: '기본' },
  3: { name: '도전·심화', short: '도전' },
};

export const ALL_LEVELS: Level[] = [1, 2, 3];

/** Recommended default level for a new child by age. */
export function defaultLevelForAge(age: number): Level {
  if (age <= 5) return 1;
  if (age === 6) return 2;
  return 3;
}

/**
 * Recommended daily learning amount by age.
 * Based on young-children attention span (~age×2–5 min) and the "short but
 * daily" habit principle; ~3 minutes per activity. Tuned for 우수적응.
 *   5세 → 10분·3개, 6세 → 15분·4개, 7세+ → 20분·5개
 */
export function recommendedDaily(age: number): { minutes: number; count: number } {
  if (age <= 5) return { minutes: 10, count: 3 };
  if (age === 6) return { minutes: 15, count: 4 };
  return { minutes: 20, count: 5 };
}
