export function ComingSoon({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <p className="text-xs uppercase tracking-wide text-white/50">{title}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Coming Soon</h2>
      <p className="mt-2 text-sm text-white/60">{message}</p>
    </div>
  );
}
