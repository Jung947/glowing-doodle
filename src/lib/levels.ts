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
