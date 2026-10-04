import type { Express, Request, Response } from "express";
import { sdk } from "./sdk";

function buildUserResponse(user: Awaited<ReturnType<typeof sdk.authenticateRequest>>) {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    lastSignedIn: user.lastSignedIn.toISOString(),
  };
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch {
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ success: true });
  });
}
