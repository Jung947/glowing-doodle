interface Props {
  done: number;
  total: number;
  size?: number;
  color?: string;
  label?: string;
}

/** A conic-gradient progress ring showing done/total. */
export default function ProgressRing({ done, total, size = 56, color = 'var(--quest)', label }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const deg = (pct / 100) * 360;
  return (
    <div
      className="ring"
      role="img"
      aria-label={label ?? `${done} / ${total} 완료`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0 ${deg}deg, var(--sub) ${deg}deg 360deg)`,
      }}
    >
      <b style={{ width: '72%', height: '72%', fontSize: size * 0.24 }}>
        {done}/{total}
      </b>
    </div>
  );
}
