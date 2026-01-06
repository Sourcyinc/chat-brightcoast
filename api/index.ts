import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Chat message schema (copied from shared/schema.ts)
const chatMessageSchema = z.object({
  message: z.string().min(1),
  sender: z.enum(["user", "agent"]),
  timestamp: z.string().optional(),
  chatId: z.string().min(1),
});

// N8N webhook URL
const N8N_WEBHOOK_URL = "https://n8n.arkoswearshop.com/webhook/7014a4ca-77e9-4aaf-96c3-d879db448dcf";

// Register routes function (copied from server/routes.ts)
async function registerRoutes(httpServer: any, app: express.Express) {
  // Chat webhook endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      // Validate request body
      const validatedData = chatMessageSchema.parse(req.body);
      
      // Forward to n8n webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: validatedData.message,
          sender: validatedData.sender,
          timestamp: validatedData.timestamp || new Date().toISOString(),
          chatId: validatedData.chatId,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook returned ${response.status}`);
      }

      const data = await response.json();
      
      // Return the response from n8n
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid request data",
          errors: error.errors 
        });
      } else {
        console.error("Error forwarding to n8n:", error);
        res.status(500).json({ 
          message: "Failed to process chat message" 
        });
      }
    }
  });

  return httpServer;
}

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
    try {
      await registerRoutes(httpServer, app);
      
      // Error handler
      app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error("Express error:", err);
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message, error: err.stack });
      });

      // Serve static files and handle SPA routing
      // Try multiple possible paths for dist/public
      const possiblePaths = [
        path.resolve(process.cwd(), "dist", "public"),
        path.resolve(process.cwd(), "..", "dist", "public"),
        path.resolve(__dirname, "..", "dist", "public"),
        path.resolve(__dirname, "..", "..", "dist", "public"),
      ];

      let distPath: string | null = null;
      for (const testPath of possiblePaths) {
        console.log(`Checking for static files at: ${testPath}`);
        if (fs.existsSync(testPath)) {
          distPath = testPath;
          console.log(`Found static files at: ${distPath}`);
          break;
        }
      }

      if (distPath) {
        // Serve static files (JS, CSS, images, etc.)
        app.use(express.static(distPath, {
          maxAge: "1y",
          immutable: true
        }));
        
        // Fallback to index.html for SPA routing (all non-API routes)
        app.use("*", (req, res) => {
          // Skip API routes
          if (req.path.startsWith("/api")) {
            return res.status(404).json({ error: "API route not found" });
          }
          
          const indexPath = path.resolve(distPath!, "index.html");
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            console.error(`index.html not found at: ${indexPath}`);
            res.status(500).json({ 
              error: "index.html not found",
              path: indexPath,
              cwd: process.cwd(),
              __dirname: __dirname
            });
          }
        });
      } else {
        console.error("Static files not found in any of the expected paths:", possiblePaths);
        console.error("Current working directory:", process.cwd());
        console.error("__dirname:", __dirname);
        // Fallback: still try to serve index.html for SPA routing
        app.use("*", (req, res) => {
          if (req.path.startsWith("/api")) {
            res.status(404).json({ error: "API route not found" });
          } else {
            res.status(500).json({ 
              error: "Static files not found. Build may have failed.",
              checkedPaths: possiblePaths,
              cwd: process.cwd()
            });
          }
        });
      }

      // Create serverless handler
      handler = serverless(app, {
        binary: ['image/*', 'application/pdf', 'application/octet-stream']
      });
      appInitialized = true;
    } catch (error) {
      console.error("Error initializing app:", error);
      throw error;
    }
  })();

  await initPromise;
  return handler!;
}

// Vercel serverless function handler
export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const serverlessHandler = await initializeApp();
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

