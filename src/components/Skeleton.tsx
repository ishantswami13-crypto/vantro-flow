export function Skeleton({
  className = "",
  width = "100%",
  height = "1rem",
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`shimmer rounded ${className}`}
      style={{
        width,
        height,
        background:
          "linear-gradient(90deg, var(--surface-2) 0%, var(--line) 50%, var(--surface-2) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}
