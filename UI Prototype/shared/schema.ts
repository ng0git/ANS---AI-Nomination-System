import { pgTable, text, serial, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  score: text("score").notNull(), // Can be number or "?" for unscored
  status: text("status").notNull(), // 'qualified', 'attention', 'disqualified', 'processing'
  remark: text("remark").notNull(),
  jobTitle: text("job_title").notNull().default("Software Developer"), // Job position
  flags: json("flags").$type<string[]>().default([]),
  scoreBreakdown: json("score_breakdown").$type<{
    skills: number;
    collaboration: number;
    problemSolving: number;
    culturalFit: number;
  }>().notNull(),
  rawText: text("raw_text"), // For PDF extracted text
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
