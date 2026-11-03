import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// SECURITY: Combined auth middleware that validates server-side auth context.
// This ensures protected server functions can't be called without a valid session.
const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next, context }) => {
  const ctx = context as { userId?: string; claims?: Record<string, unknown> } | undefined;
  const userId = ctx?.userId;
  const claims = ctx?.claims;

  if (!userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Proceed to next handler with validated auth context
  return next(context);
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, authMiddleware],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
