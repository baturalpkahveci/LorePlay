import { z } from 'zod';
import type { Game } from '../interfaces/models';

const httpUrlSchema = z.string().max(2_000).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Only HTTP or HTTPS image URLs are allowed.');

const noteSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().max(500_000).optional(),
  coverImageUrl: httpUrlSchema.optional(),
  date: z.string().datetime(),
  color: z.string().min(1).max(32),
  tags: z.array(z.string().max(80)).max(100),
});

const playthroughSchema = z.object({
  id: z.string().min(1).max(100),
  gameId: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().max(20_000).optional(),
  date: z.string().datetime(),
  status: z.enum(['Playing', 'Completed', 'Dropped']),
  longestStreak: z.number().int().min(0).max(1_000_000),
  notes: z.array(noteSchema).max(10_000),
});

const gameSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().max(20_000).optional(),
  coverImageUrl: httpUrlSchema.optional(),
  lastNoteDate: z.string().datetime().optional(),
  playthroughs: z.array(playthroughSchema).max(5_000),
});

export const journalSchema = z.array(gameSchema).max(5_000);

export const parseJournalData = (value: unknown): Game[] => journalSchema.parse(value) as Game[];
