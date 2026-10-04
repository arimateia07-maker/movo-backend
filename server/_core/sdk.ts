import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { ForbiddenError } from "../../shared/_core/errors.js";
import * as db from "../db";
import { firebaseAdminAuth } from "./firebase-admin";

export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

function loginMethod(provider: string | undefined): "google" | "email" {
  return provider === "google.com" ? "google" : "email";
}

class SDKServer {
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const token = getBearerToken(req);
    if (!token) throw ForbiddenError("Firebase ID token is required");

    try {
      const decoded = await firebaseAdminAuth.verifyIdToken(token, true);
      const method = loginMethod(decoded.firebase?.sign_in_provider);
      const user = await db.syncFirebaseUser({
        uid: decoded.uid,
        name: decoded.name ?? null,
        email: decoded.email ?? null,
        emailVerified: decoded.email_verified ?? false,
        loginMethod: method,
      });

      if (!user) throw new Error("User could not be persisted");
      return user;
    } catch (error) {
      console.warn("[Auth] Firebase token verification failed:", error);
      throw ForbiddenError("Invalid or expired Firebase token");
    }
  }
}

export const sdk = new SDKServer();
