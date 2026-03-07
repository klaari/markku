import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";
import { env } from "../lib/env";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const clerkAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
    });
    c.set("userId", payload.sub);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});
