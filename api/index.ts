import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/static";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app (same as server/index.ts)
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      const logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms${
        capturedJsonResponse ? ` :: ${JSON.stringify(capturedJsonResponse)}` : ""
      }`;
      console.log(logLine);
    }
  });

  next();
});

// Initialize app (async setup)
let appInitialized = false;
let initPromise: Promise<void> | null = null;
let handler: ReturnType<typeof serverless> | null = null;

async function initializeApp() {
  if (appInitialized && handler) return handler;
  if (initPromise) {
    await initPromise;
    return handler!;
  }

  initPromise = (async () => {
    await registerRoutes(httpServer, app);
    
    // Error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Serve static files in production
    // In Vercel, static files are in dist/public relative to project root
    const distPath = process.env.VERCEL 
      ? path.resolve(process.cwd(), "dist", "public")
      : path.resolve(__dirname, "..", "..", "dist", "public");
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      // fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // Fallback: use serveStatic function
      serveStatic(app);
    }

    // Create serverless handler
    handler = serverless(app);
    appInitialized = true;
  })();

  await initPromise;
  return handler!;
}

// Vercel serverless function handler
export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  const serverlessHandler = await initializeApp();
  return serverlessHandler(req, res);
}

