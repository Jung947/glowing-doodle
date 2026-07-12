interface Props {
  filled: number;
  total?: number;
}

/** Renders a small ★/☆ row. */
export default function Stars({ filled, total = 5 }: Props) {
  const f = Math.max(0, Math.min(total, filled));
  return (
    <span className="stars" aria-label={`별 ${f}개`}>
      {'★'.repeat(f)}
      {'☆'.repeat(total - f)}
    </span>
  );
}
