import type { Domain, Level } from '../types';
import { LEVELS } from '../lib/levels';

interface Props {
  level: Level;
  domain?: Domain;
  areaName?: string;
}

export default function LevelBadge({ level, domain = 'cognitive', areaName }: Props) {
  const dot = domain === 'cognitive' ? '🔵' : '🟠';
  return (
    <span className={`level-badge${domain === 'noncognitive' ? ' level-badge--noncog' : ''}`}>
      {dot} {areaName ? `${areaName} · ` : ''}
      {LEVELS[level].short} · Lv.{level}
    </span>
  );
}
