import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

// Chat message schema
const chatMessageSchema = z.object({
  message: z.string().min(1),
  sender: z.enum(["user", "agent"]),
  timestamp: z.string().optional(),
  chatId: z.string().min(1),
});

// N8N webhook URL
const N8N_WEBHOOK_URL = "https://n8n.arkoswearshop.com/webhook/7014a4ca-77e9-4aaf-96c3-d879db448dcf";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    return res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid request data",
        errors: error.errors 
      });
    } else {
      console.error("Error forwarding to n8n:", error);
      return res.status(500).json({ 
        message: "Failed to process chat message" 
      });
    }
  }
}

