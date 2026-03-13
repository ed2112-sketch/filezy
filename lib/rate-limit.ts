const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore) {
    if (value.resetAt < now) rateLimitStore.delete(key)
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  key: string
  limit: number
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  entry.count++
  const allowed = entry.count <= limit
  return { allowed, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    },
  })
}
