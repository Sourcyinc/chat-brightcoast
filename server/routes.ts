import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatMessageSchema } from "@shared/schema";
import { z } from "zod";

const N8N_WEBHOOK_URL = "https://n8n.arkoswearshop.com/webhook/7014a4ca-77e9-4aaf-96c3-d879db448dcf";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  
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
          chatId: validatedData.chatId, // Include chat session ID for context tracking
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
