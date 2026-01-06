import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat message schema for n8n webhook integration
export const chatMessageSchema = z.object({
  message: z.string().min(1),
  sender: z.enum(["user", "agent"]),
  timestamp: z.string().optional(),
  chatId: z.string().min(1), // Unique chat session ID
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
