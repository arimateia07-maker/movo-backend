import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { registerLegalRoutes } from "./legalRoutes";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  const allowedOrigins = new Set(
    (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081,http://localhost:19006")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const normalizedOrigin = origin?.replace(/\/$/, "");
    if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      if (origin && !allowedOrigins.has(normalizedOrigin ?? "")) {
        res.status(403).json({ error: "Origin not allowed" });
        return;
      }
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const rateLimitWindowMs = positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
  const apiLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    limit: positiveInteger(process.env.RATE_LIMIT_MAX, 120),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente em instantes." },
  });
  const authLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    limit: positiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 20),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas tentativas de autenticação. Tente novamente em instantes." },
  });

  app.use("/api/auth", authLimiter);
  app.use("/api", apiLimiter);

  registerStorageProxy(app);
  registerAuthRoutes(app);
  registerLegalRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = process.env.NODE_ENV === "production"
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
