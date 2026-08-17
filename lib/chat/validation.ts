import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  locale: z.enum(["fr", "en"]),
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ApiChatMessage = z.infer<typeof chatMessageSchema>;
