const counters = new Map<string, { count: number; resetAt: number }>();

export function withinDemoLimit(request: Request, scope: string, max: number, windowMs = 60_000) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  if (counters.size > 5000) for (const [name, state] of counters) if (state.resetAt <= now) counters.delete(name);
  const current = counters.get(key);
  if (!current || current.resetAt <= now) { counters.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  current.count += 1;
  return current.count <= max;
}
