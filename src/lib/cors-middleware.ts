import { createMiddleware } from "@tanstack/react-start";
import { resolveCorsOrigin, corsHeaders } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";

// SECURITY: Restrict cross-origin requests to the allow-list in src/lib/cors.ts.
// Every response carries CORS headers; preflight OPTIONS is answered without
// touching the app handler. Sensitive endpoints are rate-limited per user.
export const corsMiddleware = createMiddleware({ type: "request" }).server(
  async ({ request, pathname, handlerType, next }) => {
    const origin = resolveCorsOrigin(request.headers.get("origin"));

    // Answer preflight requests without invoking the app.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Rate-limit write-heavy and auth-sensitive endpoints. The user id is
    // read from the context that downstream middleware (auth) attaches.
    const sensitive =
      handlerType === "serverFn" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/reset-password");
    if (sensitive) {
      const result = await next();
      const userId = (result.context as { userId?: string } | undefined)?.userId ?? "anon";
      const limit = rateLimit([pathname, userId], 60, 60_000);
      if (!limit.allowed) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "Retry-After": String(Math.ceil(limit.retryAfter / 1000)),
              ...corsHeaders(origin),
            },
          },
        );
      }
      return withCorsHeaders(result.response, origin);
    }

    const result = await next();
    return withCorsHeaders(result.response, origin);
  },
);

function withCorsHeaders(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}